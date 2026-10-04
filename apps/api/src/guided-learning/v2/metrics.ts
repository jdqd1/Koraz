import type { FastifyInstance } from "fastify";
import { V2HttpContracts, V2MetricsSchema, type ContentProvider, type IdentityProvider, type RouteActivity } from "@cediah/contracts";
import { getContentCapabilities } from "../../content-authorization.js";
import { resolveGuidedUser, sendGuidedUserError } from "../http.js";

export type MetricAnswerV2 = {
  objectiveKey: string; equivalenceKey: string; modality: RouteActivity["representation"];
  score01: number | null; gradingSource: "server" | "self" | "none"; assisted: boolean;
  novelAtPresentation: boolean; newModality: boolean;
};
export type MetricAssessmentV2 = {
  enrollmentId: string; attemptId: string; kind: "diagnostic" | "final" | "retention7" | "retention30";
  acceptedAt: string; objectiveKeys: readonly string[]; answers: readonly MetricAnswerV2[];
};
export type MetricLearnerV2 = {
  enrollmentId: string; activatedAt: string; requiredObjectiveKeys: readonly string[];
  firstMasteredAt: Record<string, string>; completedAt: string | null; masteredAt: string | null; consolidatedAt: string | null;
};
export type MetricHeartbeatV2 = { enrollmentId: string; semanticKey: string; start: string; end: string };
const time = (value: string) => {
  const t = Date.parse(value);
  if (!value.endsWith("Z") || !Number.isFinite(t)) throw new TypeError("Fecha UTC de métrica inválida");
  return t;
};
const mean = (values: readonly number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const objectiveScore = (assessment: MetricAssessmentV2, key: string) => {
  const answers = assessment.answers.filter((item) => item.objectiveKey === key);
  return answers.length ? answers.reduce((sum, item) => sum + (item.gradingSource === "server" && !item.assisted ? item.score01 ?? 0 : 0), 0) / answers.length : 0;
};

/** Union across devices; a semantic replay cannot create another minute. */
export function activeMillisecondsV2(heartbeats: readonly MetricHeartbeatV2[], nowUtc: string) {
  const now = time(nowUtc);
  const seen = new Set<string>();
  const intervals = heartbeats.filter((item) => {
    if (seen.has(item.semanticKey)) return false;
    seen.add(item.semanticKey); return true;
  }).map((item) => [time(item.start), Math.min(time(item.end), now)] as const)
    .filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let total = 0, start = 0, end = 0;
  for (const interval of intervals) {
    if (interval[0] > end) { total += end - start; [start, end] = interval; }
    else end = Math.max(end, interval[1]);
  }
  return total + end - start;
}

export function heartbeatIntervalV2(now: Date, lastInteractionAt: Date | null, visible: boolean) {
  if (!visible || !lastInteractionAt || lastInteractionAt.getTime() > now.getTime()) return null;
  const start = now.getTime() - 30000;
  const end = Math.min(now.getTime(), lastInteractionAt.getTime() + 60000);
  return end > start ? { start: new Date(Math.max(start, lastInteractionAt.getTime())).toISOString(), end: new Date(end).toISOString() } : null;
}

/** Descriptive cohort metrics only. No raw answer, source text or user identity is exported. */
export function calculateMetricsV2(input: {
  pathVersionId: string; cohortStart: string; cohortEnd: string; nowUtc: string;
  learners: readonly MetricLearnerV2[]; assessments: readonly MetricAssessmentV2[]; heartbeats: readonly MetricHeartbeatV2[];
}) {
  const start = time(input.cohortStart), end = time(input.cohortEnd), now = time(input.nowUtc);
  if (start >= end) throw new TypeError("La cohorte debe tener inicio anterior al fin");
  const learners = input.learners.filter((item) => time(item.activatedAt) >= start && time(item.activatedAt) < end && time(item.activatedAt) <= now);
  const known = new Set<string>();
  if (learners.some((item) => { if (known.has(item.enrollmentId)) return true; known.add(item.enrollmentId); return false; })) throw new TypeError("Matrícula duplicada en cohorte");
  const attempts = new Set<string>();
  const assessments = [...input.assessments].filter((item) => known.has(item.enrollmentId) && time(item.acceptedAt) <= now)
    .sort((a, b) => time(a.acceptedAt) - time(b.acceptedAt) || a.attemptId.localeCompare(b.attemptId))
    .filter((item) => { if (attempts.has(item.attemptId)) return false; attempts.add(item.attemptId); return true; });
  const immediate: number[] = [], efficiency: number[] = [];
  let diagnosticOmitted = 0, zeroActiveMinutes = 0, activeMinutes = 0;
  for (const learner of learners) {
    const own = assessments.filter((item) => item.enrollmentId === learner.enrollmentId);
    const final = own.find((item) => item.kind === "final");
    const diagnostic = own.find((item) => item.kind === "diagnostic" && (!final || time(item.acceptedAt) <= time(final.acceptedAt)));
    const ownHeartbeats = input.heartbeats.filter((item) => item.enrollmentId === learner.enrollmentId)
      .map((item) => ({ ...item, start: new Date(Math.max(time(item.start), time(learner.activatedAt))).toISOString() }));
    const minutes = activeMillisecondsV2(ownHeartbeats, final?.acceptedAt ?? input.nowUtc) / 60000;
    activeMinutes += activeMillisecondsV2(ownHeartbeats, input.nowUtc) / 60000;
    if (!diagnostic) diagnosticOmitted++;
    if (minutes === 0) zeroActiveMinutes++;
    if (final) {
      const finalScore = mean(learner.requiredObjectiveKeys.map((key) => objectiveScore(final, key)));
      if (finalScore !== null) immediate.push(finalScore * 100);
      const comparable = diagnostic ? learner.requiredObjectiveKeys.filter((key) => diagnostic.objectiveKeys.includes(key) && final.objectiveKeys.includes(key)) : [];
      if (diagnostic && minutes > 0 && comparable.length) efficiency.push(100 * (mean(comparable.map((key) => objectiveScore(final, key)))!
        - mean(comparable.map((key) => objectiveScore(diagnostic, key)))!) / minutes);
    }
  }
  const retention = (kind: "retention7" | "retention30") => {
    const days = kind === "retention7" ? 7 : 30, upper = kind === "retention7" ? 14 : 45;
    const eligible = new Set<string>(), responded = new Set<string>();
    const daysElapsed: number[] = [], scoresByLearner = new Map<string, number[]>();
    let eligibleObjectives = 0, respondedObjectives = 0, inWindowObjectives = 0, lateObjectives = 0;
    for (const learner of learners) for (const key of learner.requiredObjectiveKeys) {
      const mastered = learner.firstMasteredAt[key];
      if (!mastered || now - time(mastered) < days * 86400000) continue;
      eligible.add(learner.enrollmentId); eligibleObjectives++;
      const assessment = assessments.find((item) => item.enrollmentId === learner.enrollmentId && item.kind === kind
        && item.objectiveKeys.includes(key) && time(item.acceptedAt) - time(mastered) >= days * 86400000);
      if (!assessment) continue;
      responded.add(learner.enrollmentId); respondedObjectives++;
      const elapsed = (time(assessment.acceptedAt) - time(mastered)) / 86400000;
      daysElapsed.push(elapsed);
      if (elapsed > upper) { lateObjectives++; continue; }
      inWindowObjectives++;
      scoresByLearner.set(learner.enrollmentId, [...(scoresByLearner.get(learner.enrollmentId) ?? []), objectiveScore(assessment, key) * 100]);
    }
    return { eligible: eligible.size, responded: responded.size, eligibleObjectives, respondedObjectives,
      inWindowObjectives, lateObjectives, daysElapsed, mean: mean([...scoresByLearner.values()].map((scores) => mean(scores)!)) };
  };
  const families = new Set<string>();
  const modalities = new Map<string, { modality: RouteActivity["representation"]; eligibleItems: number; correctItems: number }>();
  for (const assessment of assessments) for (const answer of assessment.answers) {
    const familyKey = `${assessment.enrollmentId}:${answer.equivalenceKey}`;
    if (families.has(familyKey)) continue;
    families.add(familyKey);
    if (assessment.kind === "diagnostic") continue;
    if (!answer.novelAtPresentation || !answer.newModality || answer.assisted || answer.gradingSource !== "server" || answer.score01 === null) continue;
    const modality = modalities.get(answer.modality) ?? { modality: answer.modality, eligibleItems: 0, correctItems: 0 };
    modality.eligibleItems++; if (answer.score01 === 1) modality.correctItems++;
    modalities.set(answer.modality, modality);
  }
  const seven = retention("retention7"), thirty = retention("retention30");
  const hasDate = (date: string | null) => date !== null && time(date) <= now;
  return V2MetricsSchema.parse({ pathVersionId: input.pathVersionId, cohortStart: input.cohortStart, cohortEnd: input.cohortEnd,
    enrolled: learners.length, evaluated: immediate.length, immediate: mean(immediate), retention7: seven, retention30: thirty,
    transfer: { eligibleItems: [...modalities.values()].reduce((sum, item) => sum + item.eligibleItems, 0),
      correctItems: [...modalities.values()].reduce((sum, item) => sum + item.correctItems, 0), modalities: [...modalities.values()].sort((a, b) => a.modality.localeCompare(b.modality)) },
    efficiency: mean(efficiency), efficiencyEvaluated: efficiency.length, activeMinutes,
    completed: learners.filter((item) => hasDate(item.completedAt)).length, mastered: learners.filter((item) => hasDate(item.masteredAt)).length,
    consolidated: learners.filter((item) => hasDate(item.consolidatedAt)).length,
    missingness: { diagnosticOmitted, zeroActiveMinutes, retention7Missing: seven.eligible - seven.responded, retention30Missing: thirty.eligible - thirty.responded } });
}

/** Registered by the application dispatch in T021, like the existing v2 editor module. */
export async function registerGuidedV2MetricsRoutes(app: FastifyInstance, dependencies: {
  identityProvider?: IdentityProvider; contentProvider?: ContentProvider;
  provider?: { metrics(input: { pathId: string; pathVersionId: string; cohortStart: string; cohortEnd: string }): Promise<{ status: "success"; value: ReturnType<typeof calculateMetricsV2> } | { status: "not_found" }> };
}) {
  app.get<{ Params: unknown; Querystring: unknown }>(V2HttpContracts.editorMetrics.path, async (request, reply) => {
    const actor = await resolveGuidedUser(request, dependencies.identityProvider);
    if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    try {
      const roles = await dependencies.contentProvider.getRoles(actor.user.id);
      if (!getContentCapabilities(roles).canReview) return reply.status(403).send({ error: "forbidden" });
      const params = V2HttpContracts.editorMetrics.params.safeParse(request.params);
      const query = V2HttpContracts.editorMetrics.query.safeParse(request.query);
      if (!params.success || !query.success || time(query.data.cohortStart) >= time(query.data.cohortEnd)) return reply.status(400).send({ error: "invalid_request" });
      const result = await dependencies.provider.metrics({ pathId: params.data.id, ...query.data });
      if (result.status !== "success") return reply.status(404).send({ error: "not_found" });
      return reply.header("Cache-Control", "private, no-store").send(V2HttpContracts.editorMetrics.response.parse({ metrics: result.value }));
    } catch { return reply.status(503).send({ error: "learning_unavailable" }); }
  });
}
