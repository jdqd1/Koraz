import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LearningResourceReaderSchema } from "@cediah/contracts";
import { createGuidedV2Postgres } from "./helpers/guided-v2-postgres.js";
import { seedLearningNavigation } from "./helpers/learning-navigation-fixture.js";
import { registerLearningResourceRoutes } from "../src/guided-learning/resource-reader.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";
import { createGuidedV2HttpProvider } from "../src/guided-learning/v2/routes.js";
import { guidedV2Fixture } from "./helpers/guided-v2-fixtures.js";
import { createPostgresGuidedLearningProvider } from "../src/providers/postgres-guided-learning.js";

describe.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("pinned study-resource reader with PostgreSQL", () => {
  let db: Awaited<ReturnType<typeof createGuidedV2Postgres>>, seeded: Awaited<ReturnType<typeof seedLearningNavigation>>;
  const owner = randomUUID(), learner = randomUUID(), stranger = randomUUID(), app = Fastify();
  const read = (slug: string, key: string, user = learner) => app.inject({ method: "GET", url: `/v1/guided-learning/paths/${slug}/resources/${key}`, headers: { cookie: `actor=${user}` } });
  beforeAll(async () => {
    db = await createGuidedV2Postgres();
    for (const id of [owner, learner, stranger]) await db.pool.query("insert into auth_users(id,email,name) values($1,$2,'Lector')", [id, `${id}@example.test`]);
    seeded = await seedLearningNavigation(db, owner, [learner], () => new Date());
    await registerLearningResourceRoutes(app, { database: db.database, identityProvider: { getUser: async request => {
      const id = request.cookie?.split("=")[1]; return id && new Set<string>([owner, learner, stranger]).has(id) ? { id, email: "reader@example.test" } : null;
    }, revokeSessions: async () => {} } });
  }, 120000);
  afterAll(async () => { await app.close(); await db?.close(); });
  const counts = async () => (await db.pool.query("select (select count(*)::int from learning_attempts) as attempts, (select count(*)::int from learning_responses) as responses, (select count(*)::int from learning_rewards) as rewards")).rows[0];
  it("returns the authorized frozen document without attempts, responses or rewards", async () => {
    const before = await counts(), option = seeded.path.version.units[0]!.steps[0]!.options[0]!;
    await db.pool.query("update content_items set content=$2 where id=$1", [seeded.guideId, { sections: [{ heading: "Nueva", body: "CURRENT_REVISION_ONLY" }] }]);
    const response = await read(seeded.path.slug, option.id);
    expect(response.statusCode).toBe(200);
    const value = LearningResourceReaderSchema.parse(response.json());
    expect(value.resourceRevisionId).toBe(option.resourceRevisionId); expect(value.document).toEqual(seeded.document);
    expect(response.body).not.toMatch(/correctOptionIndex|CURRENT_REVISION_ONLY|rewardIdentity|storage_path/);
    expect(await counts()).toEqual(before);
  });
  it("retains the completed evidence attempt for read-only result consultation", async () => {
    const provider = createPostgresGuidedLearningProvider(db.database), option = seeded.path.version.units[0]!.steps[0]!.options[0]!;
    const opened = await provider.createAttempt({ userId: learner, idempotencyKey: randomUUID(), request: { clientAttemptId: randomUUID(), stepOptionId: option.id } });
    expect(opened.status).toBe("success"); if (opened.status !== "success") return;
    const done = await provider.completeAttempt({ userId: learner, attemptId: opened.value.attempt.id, idempotencyKey: randomUUID(), request: { expectedVersion: opened.value.attempt.rowVersion, confirmation: true } });
    expect(done.status).toBe("success"); if (done.status !== "success") return;
    const progress = await provider.getEnrollmentProgress({ userId: learner, enrollmentId: done.value.attempt.enrollmentId! });
    expect(progress.status).toBe("success"); if (progress.status !== "success") return;
    expect(progress.value.units[0]!.steps[0]).toMatchObject({ state: "completed", attemptId: opened.value.attempt.id });
    const before = await counts(); expect((await provider.getAttempt({ userId: learner, attemptId: opened.value.attempt.id })).status).toBe("success"); expect(await counts()).toEqual(before);
  });
  it("rejects anonymous users, foreign resources, quizzes, absent keys and withdrawn access", async () => {
    const [guide, quiz] = seeded.path.version.units[0]!.steps;
    expect((await read(seeded.path.slug, guide!.options[0]!.id, stranger)).statusCode).toBe(404);
    expect((await read(seeded.path.slug, quiz!.options[0]!.id)).statusCode).toBe(404);
    expect((await read(seeded.path.slug, "unknown")).statusCode).toBe(404);
    expect((await app.inject({ url: `/v1/guided-learning/paths/${seeded.path.slug}/resources/${guide!.options[0]!.id}` })).statusCode).toBe(401);
    await db.pool.query("update content_items set status='archived' where id=$1", [seeded.guideId]);
    expect((await read(seeded.path.slug, guide!.options[0]!.id)).statusCode).toBe(404);
    await db.pool.query("update content_items set status='published' where id=$1", [seeded.guideId]);
  });
  it("reads only the V2 bound guide and preserves its locator and revision", async () => {
    const option = seeded.path.version.units[0]!.steps[0]!.options[0]!;
    const hash = (await db.pool.query("select payload_hash from learning_resource_revisions where id=$1", [option.resourceRevisionId])).rows[0].payload_hash;
    const definition = guidedV2Fixture(); definition.packageKey = definition.route.slug = "resource-f06"; definition.assets = [];
    definition.activities = definition.activities.filter(item => item.kind !== "image_target");
    definition.units.forEach(unit => { unit.activityKeys = unit.activityKeys.filter(key => definition.activities.some(item => item.key === key)); });
    definition.sources[0]!.documentSha256 = hash.toUpperCase(); definition.sources[0]!.locator = { heading: "Segunda lectura", sectionPath: ["Segunda lectura"], page: 2 };
    const provider = createPostgresGuidedLearningV2Provider(db.database);
    const draft = await provider.createDraft({ actorUserId: owner, canCreate: true, canEditAll: true, package: definition, bindings: { topicContentId: seeded.topicId, sources: [{ key: "guide", sourceContentId: seeded.guideId, resourceRevisionId: option.resourceRevisionId }], assets: [] } });
    expect(draft.status).toBe("success"); if (draft.status !== "success") return;
    await db.pool.query("update learning_path_versions set status='published',published_by=$1,published_at=now() where id=$2", [owner, draft.value.pathVersionId]);
    await db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [draft.value.pathVersionId, draft.value.pathId]);
    const enrolled = await createGuidedV2HttpProvider(db.database).invoke("enrollmentCreate", learner, {}, { pathId: draft.value.pathId }, randomUUID());
    expect(enrolled.status).toBe("success");
    const before = await counts(), response = await read(definition.route.slug, "guide");
    expect(response.statusCode).toBe(200); expect(response.json()).toMatchObject({ resourceRevisionId: option.resourceRevisionId, locator: definition.sources[0]!.locator });
    expect((await read(definition.route.slug, "diagnostic-1")).statusCode).toBe(404);
    expect((await read(definition.route.slug, "guide", stranger)).statusCode).toBe(404);
    expect(await counts()).toEqual(before);
    await expect(db.pool.query("update learning_resource_revisions set payload_hash=repeat('a',64) where id=$1", [option.resourceRevisionId])).rejects.toThrow("immutable");
    await db.pool.query("update learning_resources set retired_at=now() where id=(select resource_id from learning_resource_revisions where id=$1)", [option.resourceRevisionId]);
    expect((await read(definition.route.slug, "guide")).statusCode).toBe(404);
  });
});
