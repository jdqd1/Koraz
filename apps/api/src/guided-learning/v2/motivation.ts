import { sql, type Transaction } from "kysely";
import { localDateInTimeZone, type RoutePackage } from "@cediah/contracts";
import type { CediahDatabase } from "../../db/database.js";
import { learningTimeZone } from "../time-zone.js";
import type { GuidedV2EvidenceEvent, GuidedV2EvidenceState } from "./evidence.js";

export async function readMotivationV2(transaction: Transaction<CediahDatabase>, input: {
  userId: string; pathVersionId: string; definition: RoutePackage; evidence: GuidedV2EvidenceState;
  events: readonly GuidedV2EvidenceEvent[]; at: Date; pausedObjectiveKeys: readonly string[]; hiddenAssessmentAttemptIds: readonly string[];
}) {
  const { userId, pathVersionId, definition, evidence, events, at } = input;
  const date = localDateInTimeZone(at, await learningTimeZone(transaction, userId));
  const prefix = `v2-practice:${pathVersionId}:`;
  const totals = await transaction.selectFrom("learning_rewards").where("user_id", "=", userId).select([
    sql<string>`coalesce(sum(xp),0)::text`.as("total"),
    sql<string>`coalesce(sum(xp) filter (where award_key like ${`v2:${pathVersionId}:%`} or award_key like ${`${prefix}%`}),0)::text`.as("route"),
    sql<string>`coalesce(sum(xp) filter (where reward_kind='review_applied' and local_date=${date}::date),0)::text`.as("extra"),
  ]).executeTakeFirstOrThrow();
  const rows = await transaction.selectFrom("learning_rewards").select("award_key").where("user_id", "=", userId)
    .where("award_key", "like", `${prefix}%`).where("local_date", "=", date).execute();
  const rewarded = new Set(rows.map(row => row.award_key)), extraToday = Number(totals.extra);
  const hidden = new Set(input.hiddenAssessmentAttemptIds), exposure = new Map<string, number>();
  const activities = new Map(definition.activities.map(item => [item.key, item]));
  const latest = new Map<string, Extract<GuidedV2EvidenceEvent, { kind: "response" }>>();
  for (const event of events) {
    if (Date.parse(event.at) > at.getTime()) continue;
    if (event.kind === "reveal" || event.kind === "response" && event.valid && event.purpose !== "preview") {
      const item = activities.get(event.activityKey);
      if (item) exposure.set(item.equivalenceKey, Math.max(exposure.get(item.equivalenceKey) ?? -Infinity, Date.parse(event.at)));
    }
    if (event.kind !== "response" || !event.valid || event.gradingSource !== "server"
      || hidden.has(event.attemptId) || !["learning", "review", "gate", "diagnostic"].includes(event.purpose)) continue;
    const key = `${event.objectiveKey}:${event.equivalenceKey}`;
    if (!latest.has(key) || Date.parse(latest.get(key)!.at) <= Date.parse(event.at)) latest.set(key, event);
  }
  const completed = new Set(evidence.activityProgress.filter(item => item.status === "completed").map(item => item.key));
  const accessible = new Set(evidence.availability.filter(item => item.available).map(item => item.objectiveKey));
  const children = new Set(definition.activities.flatMap(item => item.kind === "case" ? item.payload.stages.map(stage => stage.childActivityKey) : []));
  const offers = definition.activities.flatMap(item => {
    if (!completed.has(item.key) || !["learning", "gate"].includes(item.use) || children.has(item.key)
      || ["study", "constructed_response", "case"].includes(item.kind) || item.phase === "remediate") return [];
    const previous = latest.get(`${item.objectiveKey}:${item.equivalenceKey}`);
    if (!previous) return [];
    const readyAt = Math.max(Date.parse(previous.at), exposure.get(item.equivalenceKey) ?? -Infinity) + 600000;
    const xp = rewarded.has(`${prefix}${item.objectiveKey}:${item.equivalenceKey}:${date}`) ? 0
      : Math.min(previous.score01 === 0 ? 5 : 2, Math.max(0, 20 - extraToday));
    const available = readyAt <= at.getTime() && accessible.has(item.objectiveKey)
      && !input.pausedObjectiveKeys.includes(item.objectiveKey)
      && !evidence.objectives.some(objective => objective.objectiveKey === item.objectiveKey && objective.criticalErrorOpen);
    return [{ key: item.key, objectiveKey: item.objectiveKey, xp, available,
      availableAfter: readyAt > at.getTime() ? new Date(readyAt).toISOString() : null,
      reason: previous.score01 === 0 ? "correct_error" as const : "maintain" as const }];
  }).sort((a, b) => Number(b.available) - Number(a.available) || b.xp - a.xp);
  return { totalXp: Number(totals.total), routeXp: Number(totals.route), extraToday,
    rules: { firstRecall: 5 as const, mastery: 10 as const, consolidation: 15 as const, practice: 2 as const, recovery: 5 as const, dailyLimit: 20 as const },
    // One useful repeat per objective keeps the state small on large routes.
    practiceOffers: offers.filter((item, index) => offers.findIndex(other => other.objectiveKey === item.objectiveKey) === index) };
}
