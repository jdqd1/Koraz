import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { V2HttpContracts, type ContentProvider, type IdentityProvider } from "@cediah/contracts";
import { getContentCapabilities } from "../../content-authorization.js";
import { resolveGuidedUser, sendGuidedUserError } from "../http.js";
import type { createPostgresGuidedLearningV2Provider } from "../../providers/postgres-guided-learning-v2.js";
import { MAX_ROUTE_IMPORT_BYTES } from "./import.js";

type ImportProvider = Pick<ReturnType<typeof createPostgresGuidedLearningV2Provider>,
  "validateImport" | "commitImport" | "exportPath" | "validatePath" | "transitionPath" | "createVersion">;

/** Exported separately so the v2 registration can be connected without changing v1 routes. */
export async function registerGuidedV2EditorImportRoutes(app: FastifyInstance, dependencies: {
  contentProvider?: ContentProvider;
  identityProvider?: IdentityProvider;
  provider?: ImportProvider;
}) {
  app.post<{ Body: unknown }>(V2HttpContracts.importValidate.path, { bodyLimit: 10 * 1024 * 1024 + 64 * 1024 }, async (request, reply) => {
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    if (!key.success) return reply.status(400).send({ error: "invalid_idempotency_key" });
    try {
      const packageBytes = Buffer.byteLength(JSON.stringify((request.body as { package?: unknown })?.package), "utf8");
      if (packageBytes > MAX_ROUTE_IMPORT_BYTES) return reply.status(413).send({ error: "import_too_large" });
    } catch { return reply.status(400).send({ error: "invalid_request" }); }
    const body = V2HttpContracts.importValidate.body.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: "invalid_request", fieldErrors: body.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })) });
    let result: Awaited<ReturnType<ImportProvider["validateImport"]>>;
    try {
      result = await dependencies.provider.validateImport({
        actorUserId: user.user.id, canCreate: capabilities.canCreate, canEditAll: capabilities.canEditAll,
        idempotencyKey: key.data, package: body.data.package, bindings: body.data.bindings,
        targetPathId: body.data.targetPathId, expectedVersion: body.data.expectedVersion,
      });
    } catch {
      request.log.error("Guided v2 import validation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "too_large") return reply.status(413).send({ error: "import_too_large" });
    if (result.status === "rate_limited") return reply.status(429).send({ error: "rate_limited" });
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status === "version_conflict" || result.status === "conflict") return reply.status(409).send({ error: result.status });
    if (result.status === "invalid") return reply.status(400).send({ error: "invalid_request", issues: result.issues });
    if (result.status !== "success") return reply.status(503).send({ error: "learning_unavailable" });
    return reply.header("Cache-Control", "private, no-store")
      .send(V2HttpContracts.importValidate.response.parse(result.value));
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.importCommit.path, async (request, reply) => {
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.importCommit.params.safeParse(request.params);
    const body = V2HttpContracts.importCommit.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    let result: Awaited<ReturnType<ImportProvider["commitImport"]>>;
    try {
      result = await dependencies.provider.commitImport({
        actorUserId: user.user.id, canCreate: capabilities.canCreate, canEditAll: capabilities.canEditAll,
        importId: params.data.id, idempotencyKey: key.data, hash: body.data.hash,
        expectedVersion: body.data.expectedVersion,
      });
    } catch {
      request.log.error("Guided v2 import commit failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status === "version_conflict" || result.status === "conflict") return reply.status(409).send({ error: result.status });
    if (result.status === "invalid") return reply.status(422).send({ error: "route_not_ready", issues: result.issues });
    if (result.status !== "success") return reply.status(503).send({ error: "learning_unavailable" });
    return reply.header("Cache-Control", "private, no-store")
      .send(V2HttpContracts.importCommit.response.parse(result.value));
  });

  app.get<{ Params: { id: string } }>(V2HttpContracts.editorExport.path, async (request, reply) => {
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const params = V2HttpContracts.editorExport.params.safeParse(request.params);
    if (!params.success) return reply.status(404).send({ error: "not_found" });
    let result: Awaited<ReturnType<ImportProvider["exportPath"]>>;
    try {
      result = await dependencies.provider.exportPath({ actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll, pathId: params.data.id });
    } catch {
      request.log.error("Guided v2 route export failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status !== "success") return reply.status(409).send({ error: result.status });
    return reply.header("Cache-Control", "private, no-store")
      .send(V2HttpContracts.editorExport.response.parse(result.value));
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorValidate.path, async (request, reply) => {
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorValidate.params.safeParse(request.params);
    const body = V2HttpContracts.editorValidate.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    try {
      const result = await dependencies.provider.validatePath({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        canPublish: capabilities.canPublish, pathId: params.data.id, expectedVersion: body.data.expectedVersion,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorValidate.response.parse(result.value));
    } catch {
      request.log.error("Guided v2 validation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorTransition.path, async (request, reply) => {
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorTransition.params.safeParse(request.params);
    const body = V2HttpContracts.editorTransition.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    if (body.data.status === "draft") return reply.status(409).send({ error: "conflict" });
    try {
      const result = await dependencies.provider.transitionPath({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        canReview: capabilities.canReview, canPublish: capabilities.canPublish,
        pathId: params.data.id, expectedVersion: body.data.expectedVersion,
        status: body.data.status, reviewNote: body.data.reviewNote,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status === "invalid") return reply.status(422).send({ error: "route_not_ready", issues: result.issues });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorTransition.response.parse({ route: result.value }));
    } catch {
      request.log.error("Guided v2 transition failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorVersion.path, async (request, reply) => {
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorVersion.params.safeParse(request.params);
    const body = V2HttpContracts.editorVersion.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    try {
      const result = await dependencies.provider.createVersion({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        pathId: params.data.id, expectedVersion: body.data.expectedVersion, releaseNotes: body.data.releaseNotes,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.status(201).header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorVersion.response.parse(result.value));
    } catch {
      request.log.error("Guided v2 version creation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });
}
