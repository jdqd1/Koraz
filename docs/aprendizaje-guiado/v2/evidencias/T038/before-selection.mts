import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import type { GuidedV2EvidenceEvent, GuidedV2EvidenceState } from "../../../../../apps/api/src/guided-learning/v2/evidence.js";
import { analyzeRouteGraph } from "../../../../../apps/api/src/guided-learning/v2/graph.js";
import { guidedV2PolicySnapshot } from "../../../../../apps/api/src/guided-learning/v2/service.js";

/** All facts must come from the authorized enrolled version, never from client counters. */
export type GuidedV2SelectionSnapshot = {
  definition: RoutePackage;
  evidence: GuidedV2EvidenceState;
  events: readonly GuidedV2EvidenceEvent[];
  sessionAttemptIds: readonly string[];
  selectedObjectiveKey?: string;
  diagnosticStatus: "pending" | "completed" | "omitted";
  completedActivityKeys: readonly string[];
  dispensedActivityKeys: readonly string[];
  completedAssessmentKeys: readonly string[];
  openAttempts: readonly { key: string; openedAt: string }[];
  retentionDue: readonly { key: string; dueAt: string }[];
  reviewDue: readonly { key: string; objectiveKey: string; dueAt: string }[];
};
type Action = { kind: "resume" | "remediate" | "retention" | "review" | "gate" | "activity" | "none";
  key: string | null; reason: string };
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function utc(value: string): number {
  const time = Date.parse(value);
  if (!value.endsWith("Z") || !Number.isFinite(time)) throw new TypeError("Se requiere una fecha UTC válida");
  return time;
}
function ordered(definition: RoutePackage) {
  const graph = analyzeRouteGraph(definition);
  if (graph.issues.some((issue) => issue.severity === "error") || graph.cycle) throw new TypeError("El grafo de la ruta no es válido");
  return graph.orderedObjectiveKeys;
}
function editorialActivities(definition: RoutePackage): RouteActivity[] {
  const keys = definition.units.flatMap((unit) => unit.activityKeys);
  const rank = new Map(keys.map((key, i) => [key, i]));
  return [...definition.activities].sort((a, b) => (rank.get(a.key) ?? keys.length)
    - (rank.get(b.key) ?? keys.length) || compare(a.key, b.key));
}
function independent(activity: RouteActivity | undefined) {
  return !!activity && activity.kind !== "study" && activity.kind !== "case"
    && activity.kind !== "constructed_response" && activity.phase !== "remediate";
}
function practice(activity: RouteActivity) { return activity.use === "learning" || activity.use === "gate"; }
function facts(snapshot: GuidedV2SelectionSnapshot, now: number) {
  const seen = new Set<string>();
  return [...snapshot.events].filter((event) => utc(event.at) <= now)
    .sort((a, b) => utc(a.at) - utc(b.at) || compare(a.id, b.id))
    .filter((event) => {
      if (seen.has(event.semanticKey)) return false;
      seen.add(event.semanticKey);
      return !(event.kind === "response" && (!event.valid || event.purpose === "preview"));
    });
}

/** A diagnostic samples roots and representative CORE only; missing coverage is explicit. */
export function selectGuidedV2Diagnostic(definition: RoutePackage) {
  const order = ordered(definition);
  const assessment = definition.assessments.find((item) => item.kind === "diagnostic");
  const candidates = new Set(assessment?.candidateActivityKeys ?? []);
  const pool = editorialActivities(definition).filter((item) => candidates.has(item.key)
    && item.use === "diagnostic" && independent(item));
  const objectives = order.filter((key) => {
    const objective = definition.objectives.find((item) => item.key === key)!;
    return objective.prerequisiteKeys.length === 0 || objective.criticality === "core";
  });
  const selected: RouteActivity[] = [];
  const families = new Set<string>();
  for (const key of objectives) {
    const item = pool.find((activity) => activity.objectiveKey === key && !families.has(activity.equivalenceKey));
    if (item && selected.length < guidedV2PolicySnapshot.diagnostic.maxItems) {
      selected.push(item); families.add(item.equivalenceKey);
    }
  }
  return { assessmentKey: assessment?.key ?? null, omittable: true as const,
    message: "Esto orienta tu recorrido y no reduce tu progreso",
    activityKeys: selected.map((item) => item.key), objectiveKeys: selected.map((item) => item.objectiveKey),
    coverageWarning: selected.length < guidedV2PolicySnapshot.diagnostic.minItems,
    uncoveredObjectiveKeys: objectives.filter((key) => !selected.some((item) => item.objectiveKey === key)) };
}

export function selectGuidedV2NextAction(snapshot: GuidedV2SelectionSnapshot, nowUtc: string) {
  const now = utc(nowUtc);
  const { definition, evidence } = snapshot;
  const order = ordered(definition);
  if (snapshot.selectedObjectiveKey && !order.includes(snapshot.selectedObjectiveKey)) {
    throw new TypeError("La rama seleccionada no pertenece a la versión matriculada");
  }
  const activities = editorialActivities(definition);
  const events = facts(snapshot, now);
  const completed = new Set([...snapshot.completedActivityKeys, ...snapshot.dispensedActivityKeys]);
  const available = new Set(evidence.availability.filter((item) => item.available).map((item) => item.objectiveKey));
  const sessions = new Set(snapshot.sessionAttemptIds);
  const reuseMs = guidedV2PolicySnapshot.mastery.familyReuseHours * 3600000;
  const exposure = new Map<string, number>();
  for (const event of events) {
    if (event.kind !== "response" && event.kind !== "reveal") continue;
    const activity = activities.find((item) => item.key === event.activityKey);
    if (activity) exposure.set(activity.equivalenceKey, utc(event.at));
  }
  const eligibleAt = (activity: RouteActivity) => (exposure.get(activity.equivalenceKey) ?? -Infinity) + reuseMs;
  const support = order.map((objectiveKey) => {
    const pool = activities.filter((item) => item.objectiveKey === objectiveKey && practice(item));
    const diagnostic = snapshot.diagnosticStatus === "completed" ? events.filter((event) => event.kind === "response"
      && event.objectiveKey === objectiveKey && event.purpose === "diagnostic" && event.gradingSource === "server"
      && !event.assisted).at(-1) : undefined;
    let failures = 0;
    let lastFailureAt = -Infinity;
    for (const event of events) {
      if (event.kind !== "response" || event.objectiveKey !== objectiveKey || !sessions.has(event.attemptId)
        || !["learning", "gate", "review"].includes(event.purpose) || event.gradingSource !== "server"
        || event.score01 === null || !independent(activities.find((item) => item.key === event.activityKey)!)) continue;
      failures = event.score01 === 1 ? 0 : failures + 1;
      if (event.score01 !== 1) lastFailureAt = utc(event.at);
    }
    const checkActivityKey = diagnostic?.kind === "response" && diagnostic.score01 === 1
      ? pool.find((item) => independent(item) && eligibleAt(item) <= now)?.key ?? null : null;
    const explanation = pool.find((item) => item.kind === "study" && item.payload.scaffold === "explanation");
    const reinforcedExplanationKey = failures >= guidedV2PolicySnapshot.consecutiveFailuresBeforeSupport
      && explanation && !events.some((event) => (event.kind === "interaction" || event.kind === "response")
        && event.activityKey === explanation.key && utc(event.at) > lastFailureAt) ? explanation.key : null;
    return { objectiveKey, mode: checkActivityKey ? "offer_check" as const : "full" as const,
      checkActivityKey, consecutiveFailures: failures,
      reinforcedExplanationKey,
      reinforced: failures >= guidedV2PolicySnapshot.consecutiveFailuresBeforeSupport,
      retryLimitReached: failures > guidedV2PolicySnapshot.review.immediateRetryLimit,
      scaffoldActivityKeys: (["explanation", "worked_example", "partial_example"] as const)
        .flatMap((scaffold) => pool.filter((item) => item.kind === "study" && item.phase !== "remediate" && item.payload.scaffold === scaffold)
          .map((item) => item.key)),
      independentActivityKeys: pool.filter(independent).map((item) => item.key) };
  });
  const supportByKey = new Map(support.map((item) => [item.objectiveKey, item]));
  const children = new Set(activities.flatMap((item) => item.kind === "case"
    ? item.payload.stages.map((stage) => stage.childActivityKey) : []));
  const initial = order.flatMap((objectiveKey) => {
    if (!available.has(objectiveKey) || supportByKey.get(objectiveKey)!.retryLimitReached) return [];
    const adaptation = supportByKey.get(objectiveKey)!;
    const unit = definition.units.find((item) => item.objectiveKeys.includes(objectiveKey))!;
    const pool = activities.filter((item) => item.objectiveKey === objectiveKey && unit.activityKeys.includes(item.key)
      && practice(item) && item.required && item.phase !== "remediate" && !children.has(item.key)
      && !completed.has(item.key));
    const check = pool.find((item) => item.key === adaptation.checkActivityKey);
    const scaffold = adaptation.scaffoldActivityKeys.map((key) => pool.find((item) => item.key === key)).find(Boolean);
    const reinforced = activities.find((item) => item.key === adaptation.reinforcedExplanationKey);
    const activity = reinforced ?? check ?? scaffold ?? pool.find((item) => item.kind === "study" || eligibleAt(item) <= now);
    return activity ? [{ kind: "activity" as const, key: activity.key, objectiveKey,
      reason: check ? "Ir a comprobar este objetivo; el diagnóstico no otorga dominio" : "Siguiente actividad de la rama disponible" }] : [];
  });
  const branch = new Set<string>();
  const visit = (key: string) => {
    if (branch.has(key)) return;
    branch.add(key);
    definition.objectives.find((item) => item.key === key)!.prerequisiteKeys.forEach(visit);
  };
  if (snapshot.selectedObjectiveKey) visit(snapshot.selectedObjectiveKey);
  else if (initial[0]) visit(initial[0].objectiveKey);
  const blocking = order.find((key) => branch.has(key) && definition.objectives.find((item) => item.key === key)!.criticality === "core"
    && evidence.objectives.find((item) => item.objectiveKey === key)?.criticalErrorOpen);
  const remediationOffers = order.flatMap((objectiveKey) => {
    const objective = definition.objectives.find((item) => item.key === objectiveKey)!;
    const error = evidence.objectives.find((item) => item.objectiveKey === objectiveKey)?.openCriticalErrors[0];
    if (!error) return [];
    const misconception = objective?.misconceptions.find((item) => item.key === error?.misconceptionKey);
    const verification = activities.filter((item) => misconception?.verificationActivityKeys.includes(item.key)
      && item.objectiveKey === objectiveKey && practice(item) && independent(item));
    const remediation = misconception ? activities.find((item) => item.key === misconception.remediationActivityKey
      && item.objectiveKey === objectiveKey && practice(item)) : undefined;
    const verificationAt = (item: RouteActivity) => Math.max(eligibleAt(item),
      item.equivalenceKey === error?.equivalenceKey ? utc(error.openedAt) + reuseMs : -Infinity);
    const verificationItem = verification.find((item) => verificationAt(item) <= now);
    const bankExhausted = !!error.remediationCompletedAt && !verificationItem;
    const earliest = Math.min(...verification.map(verificationAt).filter((time) => time > now));
    const availableAfter = bankExhausted && Number.isFinite(earliest) ? new Date(earliest).toISOString() : null;
    const paused = supportByKey.get(objectiveKey)!.retryLimitReached;
    return [{ objectiveKey, misconceptionKey: misconception?.key ?? null,
      confusion: misconception?.description ?? "Revisar el error crítico", sourceKeys: objective?.sourceKeys ?? [],
      activityKey: supportByKey.get(objectiveKey)!.reinforcedExplanationKey
        ?? (error?.remediationCompletedAt ? verificationItem?.key ?? null : remediation?.key ?? null),
      bankExhausted, availableAfter, editorIncident: bankExhausted || !misconception || !remediation,
      pauseOffered: paused, alternatives: ["pause", "other_branch", "review_later"] as const,
      message: bankExhausted ? `La práctica sigue disponible; la próxima comprobación será después de ${availableAfter ?? "una revisión editorial del banco"}`
        : paused ? "Puedes pausar, elegir otra rama o repasar después" : "Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar" }];
  });
  const remediationInfo = remediationOffers.find((item) => item.objectiveKey === blocking) ?? null;
  const rank = (key: string) => order.indexOf(key);
  const weights = { core: 4, high_yield: 3, supporting: 2, detail: 1 };
  const dueReviews = snapshot.reviewDue.filter((item) => utc(item.dueAt) <= now
    && evidence.objectives.some((state) => state.objectiveKey === item.objectiveKey && state.label !== "new"))
    .sort((a, b) => Number(!!evidence.objectives.find((item) => item.objectiveKey === b.objectiveKey)?.criticalErrorOpen)
      - Number(!!evidence.objectives.find((item) => item.objectiveKey === a.objectiveKey)?.criticalErrorOpen)
      || utc(a.dueAt) - utc(b.dueAt)
      || weights[definition.objectives.find((item) => item.key === b.objectiveKey)!.criticality]
      - weights[definition.objectives.find((item) => item.key === a.objectiveKey)!.criticality]
      || rank(a.objectiveKey) - rank(b.objectiveKey) || compare(a.key, b.key));
  const reviewBatch = dueReviews.filter((item, i, all) => all.findIndex((other) => other.objectiveKey === item.objectiveKey) === i)
    .slice(0, guidedV2PolicySnapshot.review.batchLimit);
  const retained = [...snapshot.retentionDue].filter((item) => utc(item.dueAt) <= now
    && definition.assessments.some((assessment) => assessment.key === item.key && ["retention7", "retention30"].includes(assessment.kind))
    && !snapshot.completedAssessmentKeys.includes(item.key)).sort((a, b) => utc(a.dueAt) - utc(b.dueAt) || compare(a.key, b.key));
  const gate = definition.assessments.find((item) => ["unit_gate", "checkpoint"].includes(item.kind)
    && !snapshot.completedAssessmentKeys.includes(item.key) && item.objectiveKeys.every((key) => available.has(key))
    && !!item.afterUnitKey && definition.units.find((unit) => unit.key === item.afterUnitKey)!.activityKeys
      .filter((key) => activities.find((activity) => activity.key === key)?.required && !children.has(key)
        && activities.some((activity) => activity.key === key && practice(activity) && activity.phase !== "remediate"))
      .every((key) => completed.has(key))
    && (item.kind === "unit_gate" ? !evidence.gates.find((state) => state.unitKey === item.afterUnitKey)?.passed
      : !!evidence.gates.find((state) => state.unitKey === item.afterUnitKey)?.passed));
  const open = [...snapshot.openAttempts].filter((item) => utc(item.openedAt) <= now)
    .sort((a, b) => utc(a.openedAt) - utc(b.openedAt) || compare(a.key, b.key))[0];
  const selected = initial.find((item) => item.objectiveKey === snapshot.selectedObjectiveKey) ?? initial[0];
  const selectedRemediation = remediationOffers.find((item) => item.objectiveKey === (snapshot.selectedObjectiveKey ?? selected?.objectiveKey));
  const exhaustedBanks = order.flatMap((objectiveKey) => {
    if (!available.has(objectiveKey)) return [];
    const candidates = activities.filter((item) => item.objectiveKey === objectiveKey && practice(item)
      && item.required && independent(item) && !children.has(item.key) && !completed.has(item.key));
    if (!candidates.length || candidates.some((item) => eligibleAt(item) <= now)) return [];
    return [{ objectiveKey, bankExhausted: true as const, availableAfter: new Date(Math.min(...candidates.map(eligibleAt))).toISOString(),
      editorIncident: true as const }];
  });
  let nextAction: Action = { kind: "none", key: null, reason: "No hay una actividad elegible; puedes pausar o elegir otra rama" };
  if (open) nextAction = { kind: "resume", key: open.key, reason: "Reanudar el intento abierto" };
  else if (remediationInfo) nextAction = remediationInfo.activityKey && !remediationInfo.pauseOffered && !remediationInfo.bankExhausted
    ? { kind: "remediate", key: remediationInfo.activityKey, reason: remediationInfo.message }
    : { kind: "none", key: null, reason: remediationInfo.message };
  else if (snapshot.selectedObjectiveKey && supportByKey.get(snapshot.selectedObjectiveKey)!.retryLimitReached) {
    nextAction = { kind: "none", key: null, reason: "Tras dos reintentos puedes pausar, elegir otra rama o repasar después" };
  }
  else if (retained[0]) nextAction = { kind: "retention", key: retained[0].key, reason: "Evaluación diferida vencida" };
  else if (reviewBatch[0]) nextAction = { kind: "review", key: reviewBatch[0].key, reason: "Ofrecer hasta diez repasos; puedes continuar en otra rama" };
  else if (gate) nextAction = { kind: "gate", key: gate.key, reason: "Comprobación disponible; no implica dominio automático" };
  else if (selectedRemediation) nextAction = selectedRemediation.activityKey && !selectedRemediation.pauseOffered && !selectedRemediation.bankExhausted
    ? { kind: "remediate", key: selectedRemediation.activityKey, reason: selectedRemediation.message }
    : { kind: "none", key: null, reason: selectedRemediation.message };
  else if (selected) nextAction = { kind: "activity", key: selected.key, reason: selected.reason };
  else if (exhaustedBanks[0]) nextAction.reason = `La práctica sigue disponible; la próxima comprobación será después de ${exhaustedBanks[0].availableAfter}`;
  return { nextAction, diagnostic: selectGuidedV2Diagnostic(definition), support, remediation: remediationInfo,
    exhaustedBanks, remediationOffers,
    reviewBatch, availableActivities: initial.filter((item) => item.objectiveKey !== blocking),
    pauseOffers: support.filter((item) => item.retryLimitReached).map((item) => ({ objectiveKey: item.objectiveKey,
      alternatives: ["pause", "other_branch", "review_later"] as const })),
    pausedObjectiveKeys: support.filter((item) => item.retryLimitReached).map((item) => item.objectiveKey) };
}
