import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { LearningResourceReaderSchema, RoutePackageSchema, toV2PublicUnits, learningOptionUnderReview, type IdentityProvider } from "@cediah/contracts";
import type { DatabaseClient } from "../db/database.js";
import { resolveGuidedUser, sendGuidedUserError } from "./http.js";
import { hashLearningSnapshot } from "./snapshot-hash.js";
import { guideAdapter } from "./adapters/guide.js";
import { guideSnapshotSectionsV2 } from "./v2/source-sections.js";
import { v2ContentAvailable } from "../providers/postgres-guided-learning-v2.js";

/** Read a pinned study resource through the learner's adopted route. No attempt is created. */
export async function readLearningResource(database: DatabaseClient, input: { userId: string; slug: string; key: string; v2Allowed?: boolean }) {
  return database.transaction().execute(async transaction => {
    const enrollment = await transaction.selectFrom("learning_enrollments as enrollment")
      .innerJoin("learning_paths as path", "path.id", "enrollment.path_id")
      .innerJoin("learning_path_versions as version", "version.id", "enrollment.path_version_id")
      .select(["version.id", "version.definition_v2_json", "version.policy_version"])
      .where("enrollment.user_id", "=", input.userId).where("path.slug", "=", input.slug)
      .where("path.archived_at", "is", null).where("enrollment.status", "in", ["active", "paused"])
      .where("version.status", "=", "published").executeTakeFirst();
    if (!enrollment) return null;
    let revisionId: string | null = null;
    let locator = { heading: "", sectionPath: [] as string[], page: null as number | null };
    let expectedHash: string | undefined;
    let sourceTitle: string | undefined;
    if (enrollment.policy_version === "guided-v2.0") {
      if (input.v2Allowed === false || !await v2ContentAvailable(transaction, enrollment.id)) return null;
      const definition = RoutePackageSchema.parse(enrollment.definition_v2_json);
      const source = definition.sources.find(source => source.key === input.key && source.kind === "guide");
      if (!source || !toV2PublicUnits(definition).some(unit => unit.resources?.some(resource => resource.key === source.key))) return null;
      const binding = await transaction.selectFrom("learning_v2_bindings").select("resource_revision_id")
        .where("path_version_id", "=", enrollment.id).where("kind", "=", "source").where("local_key", "=", source.key).executeTakeFirst();
      revisionId = binding?.resource_revision_id ?? null;
      locator = source.locator;
      expectedHash = source.documentSha256;
      sourceTitle = source.title;
    } else {
      if (!z.uuid().safeParse(input.key).success || learningOptionUnderReview(input.key)) return null;
      const option = await transaction.selectFrom("learning_step_options").select("resource_revision_id")
        .where("path_version_id", "=", enrollment.id).where("id", "=", input.key).where("projection", "=", "guide").executeTakeFirst();
      revisionId = option?.resource_revision_id ?? null;
    }
    if (!revisionId) return null;
    const resource = await transaction.selectFrom("learning_resource_revisions as revision")
      .innerJoin("learning_resources as resource", "resource.id", "revision.resource_id")
      .innerJoin("content_items as content", "content.id", "resource.source_content_id")
      .select(["revision.id", "revision.payload_json", "revision.payload_hash", "resource.source_content_id", "content.title"])
      .where("revision.id", "=", revisionId).where("resource.projection", "=", "guide")
      .where("resource.retired_at", "is", null).where("content.status", "=", "published").executeTakeFirst();
    if (!resource || hashLearningSnapshot(resource.payload_json) !== resource.payload_hash || expectedHash && expectedHash.toLowerCase() !== resource.payload_hash) return null;
    const canonical = z.object({ projection: z.literal("guide"), sourceContentId: z.literal(resource.source_content_id).optional(), title: z.string().optional(), content: z.unknown() }).safeParse(resource.payload_json);
    const legacy = canonical.success ? null : guideSnapshotSectionsV2(resource.payload_json, resource.source_content_id);
    if (!canonical.success && !legacy) return null;
    const content = canonical.success ? guideAdapter.parse(canonical.data.content) : { document: null, sections: legacy!.sections };
    return LearningResourceReaderSchema.parse({ title: canonical.success ? canonical.data.title ?? sourceTitle ?? resource.title : legacy!.title, resourceRevisionId: resource.id, document: content.document, sections: content.sections, locator });
  });
}

export async function registerLearningResourceRoutes(app: FastifyInstance, dependencies: { database?: DatabaseClient; identityProvider?: IdentityProvider; v2Allowlist?: ReadonlySet<string> }) {
  app.get("/v1/guided-learning/paths/:slug/resources/:key", async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const actor = await resolveGuidedUser(request, dependencies.identityProvider);
    if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
    const params = z.strictObject({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), key: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/) }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "invalid_request" });
    if (!dependencies.database) return reply.code(503).send({ error: "learning_unavailable" });
    try {
      const resource = await readLearningResource(dependencies.database, { ...params.data, userId: actor.user.id, v2Allowed: !dependencies.v2Allowlist?.size || dependencies.v2Allowlist.has(actor.user.id) });
      return resource ? reply.send(resource) : reply.code(404).send({ error: "not_found" });
    } catch { request.log.error("Learning resource read failed"); return reply.code(503).send({ error: "learning_unavailable" }); }
  });
}
