import { sql, type Selectable, type Transaction } from "kysely";
import {
  LEARNING_VIDEO_OBSERVED_XP,
  LEARNING_VIDEO_SKIPPED_XP,
  LearningMilestoneSchema,
  LearningRewardSchema,
  V2ObjectiveRewardSchema,
  V2RewardSchema,
  type V2ObjectiveRewardKind,
  type LearningMilestone,
  type LearningProjection,
  type LearningReward,
  type LearningRewardKind,
  type LearningStepPurpose,
} from "@cediah/contracts";
import type {
  CediahDatabase,
  DatabaseClient,
  LearningRewardTable,
} from "../db/database.js";

type RewardRow = Selectable<LearningRewardTable>;
type RewardDatabase = DatabaseClient | Transaction<CediahDatabase>;

const v2Awards = {
  v2_objective_recalled: { xp: 5, title: "Primera recuperación objetiva" },
  v2_objective_mastered: { xp: 10, title: "Primer dominio del objetivo" },
  v2_objective_consolidated: { xp: 15, title: "Primera consolidación del objetivo" },
} as const;

/** Called only with evidence reconstructed from accepted server facts. No v1 attempt FK. */
export async function awardObjectiveV2(transaction: Transaction<CediahDatabase>, input: {
  userId: string; enrollmentId: string; pathVersionId: string; objectiveKey: string;
  kind: V2ObjectiveRewardKind; acceptedAt: Date;
}) {
  const awardKey = `v2:${input.pathVersionId}:${input.objectiveKey}:${input.kind}`;
  const timezone = await rewardTimezone(transaction, input.userId);
  const date = localDate(input.acceptedAt, timezone);
  const payload = { pathVersionId: input.pathVersionId, objectiveKey: input.objectiveKey };
  const event = await transaction.insertInto("learning_events").values({
    user_id: input.userId, enrollment_id: input.enrollmentId, attempt_id: null,
    event_type: input.kind, semantic_key: awardKey, payload_json: payload,
    policy_version: "guided-v2.0", occurred_at: input.acceptedAt, local_date: date, timezone,
  }).onConflict((conflict) => conflict.columns(["user_id", "semantic_key"]).doNothing()).returning("id").executeTakeFirst();
  const eventId = event?.id ?? (await transaction.selectFrom("learning_events").select("id")
    .where("user_id", "=", input.userId).where("semantic_key", "=", awardKey).executeTakeFirstOrThrow()).id;
  // SQL retains the existing narrow v1 Kysely kind; the new DTO has an explicit v1/v2 union.
  const inserted = await sql<{ award_key: string; reward_kind: V2ObjectiveRewardKind; created_at: Date; xp: number }>`
    insert into learning_rewards(user_id,award_key,reward_kind,xp,event_id,local_date,created_at)
    values (${input.userId},${awardKey},${input.kind},${v2Awards[input.kind].xp},${eventId},${date}::date,${input.acceptedAt})
    on conflict (user_id,award_key) do nothing returning award_key,reward_kind,created_at,xp`.execute(transaction);
  const row = inserted.rows[0];
  return row ? V2ObjectiveRewardSchema.parse({ awardKey: row.award_key, awardedAt: toIso(row.created_at),
    kind: row.reward_kind, title: v2Awards[row.reward_kind].title, xp: row.xp }) : null;
}

export async function readLearningRewardsV2(database: RewardDatabase, userId: string) {
  const rows = await database.selectFrom("learning_rewards").selectAll().where("user_id", "=", userId)
    .orderBy("created_at").orderBy("id").execute();
  return rows.map((row) => {
    const kind = row.reward_kind as LearningRewardKind | V2ObjectiveRewardKind;
    return V2RewardSchema.parse({ awardKey: row.award_key, awardedAt: toIso(row.created_at), kind,
      title: kind in v2Awards ? v2Awards[kind as V2ObjectiveRewardKind].title : rewardTitles[kind as LearningRewardKind], xp: row.xp });
  });
}

const rewardTitles: Record<LearningRewardKind, string> = {
  activity_check: "Comprobación completada",
  activity_recall: "Actividad de recuperación",
  activity_understand: "Actividad de comprensión",
  milestone_first_activity: "Primera actividad",
  milestone_first_review: "Volví a repasar",
  milestone_first_unit: "Primera unidad",
  review_applied: "Repaso aplicado",
  route_completed: "Ruta completada",
  unit_completed: "Unidad completada",
};

const milestoneKinds = [
  "route_completed",
  "milestone_first_activity",
  "milestone_first_review",
  "milestone_first_unit",
] as const;

function toIso(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function localDate(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function toLearningReward(row: RewardRow): LearningReward {
  return LearningRewardSchema.parse({
    awardKey: row.award_key,
    awardedAt: toIso(row.created_at),
    kind: row.reward_kind,
    title: rewardTitles[row.reward_kind],
    xp: row.xp,
  });
}

async function rewardTimezone(
  database: RewardDatabase,
  userId: string,
) {
  const preference = await database.selectFrom("learning_preferences")
    .select("timezone")
    .where("user_id", "=", userId)
    .executeTakeFirst();
  return preference?.timezone ?? "UTC";
}

async function insertReward(
  transaction: Transaction<CediahDatabase>,
  input: {
    acceptedAt: Date;
    awardKey: string;
    eventId: string;
    kind: LearningRewardKind;
    timezone?: string;
    userId: string;
    xp: number;
  },
) {
  const timezone = input.timezone ?? await rewardTimezone(transaction, input.userId);
  const inserted = await transaction.insertInto("learning_rewards").values({
    award_key: input.awardKey,
    event_id: input.eventId,
    local_date: localDate(input.acceptedAt, timezone),
    reward_kind: input.kind,
    user_id: input.userId,
    xp: input.xp,
  }).onConflict((conflict) => conflict.columns(["user_id", "award_key"]).doNothing())
    .returningAll()
    .executeTakeFirst();
  return inserted ? toLearningReward(inserted) : null;
}

function activityReward(
  purpose: LearningStepPurpose,
  projection: LearningProjection,
  completionMethod: "graded" | "observed" | "rated" | "self_reported",
) {
  if (purpose === "diagnostic") return null;
  if (projection === "quiz") {
    return { kind: "activity_check" as const, xp: 15 };
  }
  if (projection === "video") {
    return {
      kind: "activity_understand" as const,
      xp: completionMethod === "observed" ? LEARNING_VIDEO_OBSERVED_XP : LEARNING_VIDEO_SKIPPED_XP,
    };
  }
  return projection === "flashcards"
    ? { kind: "activity_recall" as const, xp: 10 }
    : { kind: "activity_understand" as const, xp: 10 };
}

export async function awardCompletedStep(
  transaction: Transaction<CediahDatabase>,
  input: {
    acceptedAt: Date;
    completionMethod: "graded" | "observed" | "rated" | "self_reported";
    eventId: string;
    isEssential: boolean;
    projection: LearningProjection;
    purpose: LearningStepPurpose;
    rewardIdentity: string;
    rewardVersion: number;
    userId: string;
  },
) {
  if (!input.isEssential) return [];
  const definition = activityReward(input.purpose, input.projection, input.completionMethod);
  if (!definition) return [];
  const awards: LearningReward[] = [];
  const activity = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: `activity:${input.rewardIdentity}:v${input.rewardVersion}`,
    eventId: input.eventId,
    kind: definition.kind,
    userId: input.userId,
    xp: definition.xp,
  });
  if (activity) awards.push(activity);
  const milestone = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: "milestone:first-activity",
    eventId: input.eventId,
    kind: "milestone_first_activity",
    userId: input.userId,
    xp: 0,
  });
  if (milestone) awards.push(milestone);
  return awards;
}

export async function awardCompletedUnit(
  transaction: Transaction<CediahDatabase>,
  input: {
    acceptedAt: Date;
    eventId: string;
    pathId: string;
    pedagogyVersion: number;
    stableKey: string;
    userId: string;
  },
) {
  const awards: LearningReward[] = [];
  const unit = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: `unit:${input.pathId}:${input.stableKey}:v${input.pedagogyVersion}`,
    eventId: input.eventId,
    kind: "unit_completed",
    userId: input.userId,
    xp: 20,
  });
  if (unit) awards.push(unit);
  const milestone = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: "milestone:first-unit",
    eventId: input.eventId,
    kind: "milestone_first_unit",
    userId: input.userId,
    xp: 0,
  });
  if (milestone) awards.push(milestone);
  return awards;
}

export async function awardCompletedRoute(
  transaction: Transaction<CediahDatabase>,
  input: {
    acceptedAt: Date;
    eventId: string;
    pathId: string;
    pathVersionId: string;
    userId: string;
  },
) {
  const reward = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: `route:${input.pathId}:version:${input.pathVersionId}:completed`,
    eventId: input.eventId,
    kind: "route_completed",
    userId: input.userId,
    xp: 50,
  });
  return reward ? [reward] : [];
}

async function lockedRewardTimezone(
  transaction: Transaction<CediahDatabase>,
  userId: string,
) {
  await transaction.insertInto("learning_preferences").values({
    exam_date: null,
    pending_preferences_json: {},
    pinned_enrollment_id: null,
    session_minutes: 10,
    timezone: "UTC",
    user_id: userId,
    weekly_goal_days: null,
  }).onConflict((conflict) => conflict.column("user_id").doNothing()).execute();
  const preference = await transaction.selectFrom("learning_preferences")
    .select("timezone")
    .where("user_id", "=", userId)
    .forUpdate()
    .executeTakeFirstOrThrow();
  return preference.timezone;
}

export async function awardAppliedReview(
  transaction: Transaction<CediahDatabase>,
  input: {
    acceptedAt: Date;
    eventId: string;
    itemId: string;
    memoryVersion: number;
    previousStateVersion: number;
    userId: string;
  },
) {
  const timezone = await lockedRewardTimezone(transaction, input.userId);
  const date = localDate(input.acceptedAt, timezone);
  const total = await transaction.selectFrom("learning_rewards")
    .select(sql<string>`coalesce(sum(xp), 0)::text`.as("xp"))
    .where("user_id", "=", input.userId)
    .where("reward_kind", "=", "review_applied")
    .where("local_date", "=", date)
    .executeTakeFirstOrThrow();
  const xp = Number(total.xp) >= 20 ? 0 : 2;
  const awards: LearningReward[] = [];
  const review = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: `review:${input.itemId}:v${input.memoryVersion}:state:${input.previousStateVersion}`,
    eventId: input.eventId,
    kind: "review_applied",
    timezone,
    userId: input.userId,
    xp,
  });
  if (review) awards.push(review);
  const milestone = await insertReward(transaction, {
    acceptedAt: input.acceptedAt,
    awardKey: "milestone:first-review",
    eventId: input.eventId,
    kind: "milestone_first_review",
    timezone,
    userId: input.userId,
    xp: 0,
  });
  if (milestone) awards.push(milestone);
  return awards;
}

export async function readLearningRewardSummary(
  database: RewardDatabase,
  userId: string,
): Promise<{ milestones: LearningMilestone[]; points: number }> {
  const [total, rows] = await Promise.all([
    database.selectFrom("learning_rewards")
      .select(sql<string>`coalesce(sum(xp), 0)::text`.as("xp"))
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow(),
    database.selectFrom("learning_rewards")
      .selectAll()
      .where("user_id", "=", userId)
      .where("reward_kind", "in", [...milestoneKinds])
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .limit(12)
      .execute(),
  ]);
  return {
    milestones: rows.map((row) => LearningMilestoneSchema.parse(toLearningReward(row))),
    points: Number(total.xp),
  };
}
