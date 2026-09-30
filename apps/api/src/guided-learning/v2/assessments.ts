import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import { analyzeRouteGraph } from "./graph.js";
import { guidedV2PolicySnapshot } from "./service.js";
import { hashLearningSnapshot } from "../snapshot-hash.js";
import { reviewDueV2, type ReviewStateV2 } from "./scheduler.js";

export type AssessmentKindV2 = "checkpoint" | "final" | "retention7" | "retention30";
export type AssessmentExposureV2 = {
  semanticKey: string; at: string; objectiveKey: string; equivalenceKey: string;
  modality: RouteActivity["representation"]; audience: "student" | "editor";
  kind: "presentation" | "response" | "reveal" | "preview";
};
export type AssessmentContextV2 = {
  definition: RoutePackage; pathVersionId: string; assessmentKey: string; nowUtc: string;
  introducedObjectiveKeys: readonly string[];
  objectiveStates: readonly { objectiveKey: string; mastered: boolean; criticalErrorOpen: boolean }[];
  exposures: readonly AssessmentExposureV2[];
  retentionStates?: readonly { objectiveKey: string; firstMasteredAt: string; state: ReviewStateV2 }[];
};
export type AssessmentItemV2 = {
  activity: RouteActivity; objectiveKey: string; equivalenceKey: string;
  novelAtPresentation: boolean; newModality: boolean; transferCandidate: boolean;
  previousExposureAt: string | null; previousModalities: RouteActivity["representation"][];
  comparisonGroup: string | null; recent: boolean;
  daysSinceMastery: number | null; outsideRetentionWindow: boolean;
};
export type AssessmentPlanV2 = {
  assessmentKey: string; kind: AssessmentKindV2; pathVersionId: string; contentHash: string;
  frozenAt: string; selectionHash: string; requiredObjectiveKeys: string[];
  segments: { key: string; index: number; items: AssessmentItemV2[] }[];
};
const reserve = (use: string) => ["final", "retention7", "retention30"].includes(use);
const objectiveItem = (item: RouteActivity) => ["single_choice", "short_answer", "match", "sequence"].includes(item.kind)
  || item.kind === "image_target" && item.payload.masking === "no_labels";
function utc(value: string) {
  const t = Date.parse(value);
  if (!value.endsWith("Z") || !Number.isFinite(t)) throw new TypeError("Se requiere una fecha UTC válida");
  return t;
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Reject shared reserved families even when the requested assessment would not use them. */
export function buildAssessmentPoolsV2(definition: RoutePackage) {
  const families = new Map<string, RouteActivity[]>();
  for (const item of definition.activities) families.set(item.equivalenceKey, [...(families.get(item.equivalenceKey) ?? []), item]);
  const leakedFamilies = [...families].filter(([, items]) => items.some((item) => reserve(item.use))
    && (new Set(items.map((item) => item.use)).size !== 1 || new Set(items.map((item) => item.objectiveKey)).size !== 1))
    .map(([key]) => key).sort();
  if (leakedFamilies.length) return { status: "invalid" as const, code: "RESERVE_LEAK" as const, leakedFamilies };
  return { status: "success" as const,
    practice: definition.activities.filter((item) => ["learning", "gate"].includes(item.use)),
    diagnostic: definition.activities.filter((item) => item.use === "diagnostic"),
    final: definition.activities.filter((item) => item.use === "final"),
    retention7: definition.activities.filter((item) => item.use === "retention7"),
    retention30: definition.activities.filter((item) => item.use === "retention30") };
}

/** Server preparation only. Persist this immutable plan before presenting any item. */
export function selectAssessmentV2(input: AssessmentContextV2) {
  const now = utc(input.nowUtc);
  const { definition } = input;
  const graph = analyzeRouteGraph(definition);
  if (graph.cycle || graph.issues.some((issue) => issue.severity === "error")) throw new TypeError("Grafo de evaluación inválido");
  const assessment = definition.assessments.find((item) => item.key === input.assessmentKey);
  if (!assessment || !["checkpoint", "final", "retention7", "retention30"].includes(assessment.kind)) {
    return { status: "invalid" as const, code: "ASSESSMENT_NOT_FOUND" as const };
  }
  const kind = assessment.kind as AssessmentKindV2;
  const pools = buildAssessmentPoolsV2(definition);
  if (pools.status === "invalid") return pools;
  const introduced = new Set(input.introducedObjectiveKeys);
  if ([...introduced].some((key) => !graph.orderedObjectiveKeys.includes(key))) throw new TypeError("Objetivo introducido ajeno a la ruta");
  const scoped = new Set(assessment.objectiveKeys);
  const retention = new Map((input.retentionStates ?? []).map((item) => [item.objectiveKey, item]));
  const deferred = kind === "retention7" || kind === "retention30";
  const required = graph.orderedObjectiveKeys.filter((key) => definition.objectives.find((item) => item.key === key)!.required
    && (kind !== "checkpoint" || scoped.has(key) && introduced.has(key))
    && (!deferred || retention.has(key) && reviewDueV2(retention.get(key)!.state, new Date(now)).kind === kind));
  const notReady = required.filter((key) => !introduced.has(key));
  if (notReady.length) return { status: "blocked" as const, code: "OBJECTIVES_NOT_INTRODUCED" as const, objectiveKeys: notReady };
  if (!required.length) return { status: "blocked" as const, code: deferred ? "RETENTION_NOT_DUE" as const : "OBJECTIVE_COVERAGE" as const, objectiveKeys: [] };
  const seen = new Set<string>();
  const exposures = [...input.exposures].filter((item) => utc(item.at) <= now && item.audience === "student")
    .sort((a, b) => utc(a.at) - utc(b.at) || a.semanticKey.localeCompare(b.semanticKey))
    .filter((item) => { if (seen.has(item.semanticKey)) return false; seen.add(item.semanticKey); return true; });
  const candidates = new Set(assessment.candidateActivityKeys);
  const pool = (kind === "checkpoint" ? pools.practice : pools[kind])
    .filter((item) => candidates.has(item.key) && scoped.has(item.objectiveKey) && objectiveItem(item)
      && introduced.has(item.objectiveKey) && ["retrieve", "apply"].includes(item.phase));
  const missing = required.filter((key) => !pool.some((item) => item.objectiveKey === key));
  if (missing.length) return { status: "blocked" as const, code: "BANK_EXHAUSTED" as const, objectiveKeys: missing };
  const latestUnitKey = assessment.afterUnitKey ?? [...definition.units].reverse()
    .find((unit) => unit.objectiveKeys.some((key) => introduced.has(key)))?.key;
  const states = new Map(input.objectiveStates.map((state) => [state.objectiveKey, state]));
  const rank = new Map(graph.orderedObjectiveKeys.map((key, index) => [key, index]));
  const priority = (key: string) => {
    const objective = definition.objectives.find((item) => item.key === key)!;
    return objective.criticality === "core" && states.get(key)?.criticalErrorOpen ? 0
      : objective.criticality === "core" && !states.get(key)?.mastered ? 1 : 2;
  };
  const exposureCount = (key: string) => exposures.filter((item) => item.objectiveKey === key && item.kind === "presentation").length;
  const pending = [...required].sort((a, b) => kind === "checkpoint"
    ? priority(a) - priority(b) || exposureCount(a) - exposureCount(b) || rank.get(a)! - rank.get(b)!
    : rank.get(a)! - rank.get(b)!);
  const groups = new Map<string, number>();
  for (const objective of definition.objectives.filter((item) => introduced.has(item.key) && item.comparisonGroup)) {
    groups.set(objective.comparisonGroup!, (groups.get(objective.comparisonGroup!) ?? 0) + 1);
  }
  const items: AssessmentItemV2[] = [];
  const selectedFamilies = new Set<string>();
  while (pending.length) {
    let index = 0;
    if (kind === "checkpoint") {
      const top = priority(pending[0]!);
      const segment = items.slice(Math.floor(items.length / 10) * 10);
      const recentCount = segment.filter((item) => item.recent).length;
      const wantRecent = recentCount <= segment.length - recentCount;
      const eligible = pending.map((key, i) => ({ key, i })).filter(({ key }) => priority(key) === top);
      const mixed = eligible.filter(({ key }) => (definition.objectives.find((item) => item.key === key)!.unitKey === latestUnitKey) === wantRecent);
      const choices = mixed.length ? mixed : eligible;
      const previousGroup = items.at(-1)?.comparisonGroup;
      index = (choices.find(({ key }) => previousGroup && definition.objectives.find((item) => item.key === key)!.comparisonGroup === previousGroup)
        ?? choices[0])!.i;
    }
    const key = pending.splice(index, 1)[0]!;
    const own = pool.filter((item) => item.objectiveKey === key).sort((a, b) => {
      const aSeen = exposures.filter((item) => item.equivalenceKey === a.equivalenceKey);
      const bSeen = exposures.filter((item) => item.equivalenceKey === b.equivalenceKey);
      return Number(selectedFamilies.has(a.equivalenceKey)) - Number(selectedFamilies.has(b.equivalenceKey))
        || Number(aSeen.length > 0) - Number(bSeen.length > 0)
        || aSeen.length - bSeen.length || a.key.localeCompare(b.key);
    });
    const activity = own[0]!;
    const repeatedInPlan = selectedFamilies.has(activity.equivalenceKey);
    selectedFamilies.add(activity.equivalenceKey);
    const prior = exposures.filter((item) => item.equivalenceKey === activity.equivalenceKey);
    const previousModalities = [...new Set(exposures.filter((item) => item.objectiveKey === key).map((item) => item.modality))].sort();
    const objective = definition.objectives.find((item) => item.key === key)!;
    const novelAtPresentation = prior.length === 0 && !repeatedInPlan;
    const newModality = previousModalities.length > 0 && !previousModalities.includes(activity.representation);
    const daysSinceMastery = deferred ? (now - utc(retention.get(key)!.firstMasteredAt)) / 86400000 : null;
    if (daysSinceMastery !== null && daysSinceMastery < 0) throw new TypeError("Dominio posterior al reloj de evaluación");
    items.push({ activity, objectiveKey: key, equivalenceKey: activity.equivalenceKey,
      novelAtPresentation, newModality, transferCandidate: kind !== "checkpoint" && novelAtPresentation && newModality,
      previousExposureAt: prior.at(-1)?.at ?? null, previousModalities,
      comparisonGroup: objective.comparisonGroup && (groups.get(objective.comparisonGroup) ?? 0) > 1 ? objective.comparisonGroup : null,
      recent: objective.unitKey === latestUnitKey, daysSinceMastery,
      outsideRetentionWindow: daysSinceMastery !== null && (kind === "retention7"
        ? daysSinceMastery < 7 || daysSinceMastery > 14 : daysSinceMastery < 30 || daysSinceMastery > 45) });
  }
  const segments: AssessmentPlanV2["segments"] = [];
  for (let i = 0; i < items.length; i += guidedV2PolicySnapshot.checkpointItemLimit) {
    const index = segments.length;
    segments.push({ key: `${assessment.key}-segment-${index + 1}`, index, items: items.slice(i, i + guidedV2PolicySnapshot.checkpointItemLimit) });
  }
  const data = { assessmentKey: assessment.key, kind, pathVersionId: input.pathVersionId,
    contentHash: hashLearningSnapshot(definition), frozenAt: new Date(now).toISOString(), requiredObjectiveKeys: required, segments };
  const plan: AssessmentPlanV2 = freeze(structuredClone({ ...data, selectionHash: hashLearningSnapshot(data) }));
  return { status: "success" as const, plan };
}

/** Omitted objectives are zero, and coverage is independent of the overall score. */
export function assessmentCoverageV2(plan: AssessmentPlanV2, submittedSegmentKeys: readonly string[], answers: readonly {
  activityKey: string; score01: number | null; assisted: boolean; gradingSource: "server" | "self" | "none";
}[]) {
  const submitted = new Set(submittedSegmentKeys);
  const unknown = [...submitted].filter((key) => !plan.segments.some((segment) => segment.key === key));
  if (unknown.length) throw new TypeError("Segmento ajeno a la selección congelada");
  const duplicates = new Set<string>();
  for (const answer of answers) {
    if (answer.score01 !== null && (!Number.isFinite(answer.score01) || answer.score01 < 0 || answer.score01 > 1)) {
      throw new TypeError("Puntuación objetiva fuera de rango");
    }
    if (duplicates.has(answer.activityKey)) throw new TypeError("Respuesta duplicada en evaluación");
    duplicates.add(answer.activityKey);
    if (!plan.segments.some((segment) => segment.items.some((item) => item.activity.key === answer.activityKey))) throw new TypeError("Respuesta ajena a la selección congelada");
  }
  const scores = plan.requiredObjectiveKeys.map((objectiveKey) => {
    const segment = plan.segments.find((part) => part.items.some((item) => item.objectiveKey === objectiveKey))!;
    const item = segment.items.find((part) => part.objectiveKey === objectiveKey)!;
    const answer = submitted.has(segment.key) ? answers.find((part) => part.activityKey === item.activity.key) : null;
    return { objectiveKey, visited: submitted.has(segment.key), omitted: !answer,
      score01: answer?.gradingSource === "server" && !answer.assisted ? answer.score01 ?? 0 : 0 };
  });
  return { covered: scores.every((item) => item.visited), pendingSegmentKeys: plan.segments.filter((part) => !submitted.has(part.key)).map((part) => part.key),
    omittedObjectiveKeys: scores.filter((item) => item.omitted).map((item) => item.objectiveKey),
    objectiveScores: scores, macroPercent: scores.length ? 100 * scores.reduce((sum, item) => sum + item.score01, 0) / scores.length : null };
}
