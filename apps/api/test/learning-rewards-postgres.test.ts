import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { awardAppliedReview, awardPracticeV2, lockLearningRewards } from "../src/guided-learning/rewards.js";
import { createGuidedV2Postgres } from "./helpers/guided-v2-postgres.js";

describe.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("shared V1/V2 review rewards in isolated PostgreSQL (H06)", () => {
  let db: Awaited<ReturnType<typeof createGuidedV2Postgres>>;
  const acceptedAt = new Date("2026-11-04T16:00:00Z");
  beforeAll(async () => { db = await createGuidedV2Postgres(); }, 120_000);
  afterAll(async () => { await db?.close(); });

  async function fixture(total: number) {
    const [userId, topicId, pathId, pathVersionId, enrollmentId, attemptId, eventId, itemId] = Array.from({ length: 8 }, () => randomUUID());
    const seed = await db.pool.connect();
    try {
      await seed.query("begin");
      await seed.query("insert into auth_users(id,name,email) values($1,'Test learner',$2)", [userId, `${userId}@example.test`]);
      await seed.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,'topic',$3,'Fixture','Fixture','Fixture',$2)", [topicId, userId, topicId]);
      await seed.query("insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values($1,$2,$4,'Fixture','Fixture','heart',$3)", [pathId, topicId, userId, pathId]);
      await seed.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json,definition_v2_json) values($1,$2,1,'guided-v2.0','{}','{\"schemaVersion\":\"2.0\"}')", [pathVersionId, pathId]);
      await seed.query("insert into learning_enrollments(id,user_id,path_id,path_version_id) values($1,$2,$3,$4)", [enrollmentId, userId, pathId, pathVersionId]);
      await seed.query("insert into learning_enrollment_versions(enrollment_id,path_id,path_version_id) values($1,$2,$3)", [enrollmentId, pathId, pathVersionId]);
      await seed.query("insert into learning_v2_attempts(id,user_id,enrollment_id,path_version_id,client_attempt_id,purpose,snapshot_json,status,submitted_at) values($1,$2,$3,$4,$1,'activity','{}','completed',$5)", [attemptId, userId, enrollmentId, pathVersionId, acceptedAt]);
      await seed.query(`insert into learning_v2_responses(attempt_id,user_id,enrollment_id,path_version_id,activity_key,objective_key,equivalence_key,item_revision_hash,modality,purpose,answer_json,grading_json,grading_source,score01,accepted_at)
        values($1,$2,$3,$4,'choice','objective','family',$5,'text','learning','{}','{}','server',0,$6)`,
      [attemptId, userId, enrollmentId, pathVersionId, "a".repeat(64), new Date(acceptedAt.getTime() - 600_000)]);
      await seed.query("insert into learning_events(id,user_id,event_type,semantic_key,payload_json,local_date,timezone) values($1,$2,'review_applied','baseline','{}','2026-11-04','America/Caracas')", [eventId, userId]);
      await seed.query("insert into learning_rewards(user_id,award_key,reward_kind,xp,event_id,local_date) values($1,'baseline','review_applied',$2,$3,'2026-11-04')", [userId, total, eventId]);
      await seed.query("commit");
    } catch (error) {
      await seed.query("rollback");
      throw error;
    } finally { seed.release(); }
    return { userId: userId!, pathVersionId: pathVersionId!, itemId: itemId! };
  }

  async function award(actor: Awaited<ReturnType<typeof fixture>>, engine: "v1" | "v2", hold = false) {
    return db.database.transaction().execute(async transaction => {
      await lockLearningRewards(transaction, actor.userId);
      if (engine === "v2") await sql`select private.lock_guided_v2_actor(${actor.userId}::uuid)`.execute(transaction);
      const pid = (await sql<{ pid: number }>`select pg_backend_pid() as pid`.execute(transaction)).rows[0]!.pid;
      if (hold) await sql`select pg_sleep(0.05)`.execute(transaction);
      const event = await transaction.insertInto("learning_events").values({
        user_id: actor.userId, event_type: "review_applied", semantic_key: randomUUID(), payload_json: {},
        local_date: "2026-11-04", timezone: "America/Caracas", occurred_at: acceptedAt,
      }).returning("id").executeTakeFirstOrThrow();
      const rewards = engine === "v1"
        ? await awardAppliedReview(transaction, { userId: actor.userId, itemId: actor.itemId, memoryVersion: 1, previousStateVersion: 1, eventId: event.id, acceptedAt })
        : [await awardPracticeV2(transaction, { userId: actor.userId, pathVersionId: actor.pathVersionId, objectiveKey: "objective", equivalenceKey: "family", responseId: randomUUID(), eventId: event.id, acceptedAt })];
      return { pid, xp: rewards.reduce((sum, reward) => sum + (reward?.xp ?? 0), 0) };
    });
  }

  async function balance(userId: string) {
    return (await db.pool.query<{ xp: number }>("select sum(xp)::int xp from learning_rewards where user_id=$1 and reward_kind='review_applied'", [userId])).rows[0]!.xp;
  }

  it.each([0, 18, 19, 20])("V1 uses only the residual daily budget from %i XP", async total => {
    const actor = await fixture(total);
    expect((await award(actor, "v1")).xp).toBe(Math.min(2, 20 - total));
    expect((await award(actor, "v1")).xp).toBe(0);
    expect(await balance(actor.userId)).toBe(Math.min(20, total + 2));
  });

  it.each(["v1", "v2"] as const)("serializes simultaneous engines with %s starting first", async first => {
    const actor = await fixture(19);
    const results = await Promise.all([award(actor, first, true), award(actor, first === "v1" ? "v2" : "v1", true)]);
    expect(new Set(results.map(result => result.pid)).size).toBe(2);
    expect(results.reduce((sum, result) => sum + result.xp, 0)).toBe(1);
    expect(await balance(actor.userId)).toBe(20);
  }, 20_000);
});
