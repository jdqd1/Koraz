import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import type { GuidedV2EvidenceEvent, GuidedV2EvidenceState } from "./evidence.js";
import { analyzeRouteGraph } from "./graph.js";
import { guidedV2PolicySnapshot } from "./service.js";

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
function buildStructure(definition: RoutePackage) {
  const order = ordered(definition), activities = editorialActivities(definition);
  const activityByKey = new Map(activities.map((item) => [item.key, item]));
  const objectiveByKey = new Map(definition.objectives.map((item) => [item.key, item]));
  const rankByKey = new Map(order.map((key, index) => [key, index]));
  const activitiesByObjective = new Map<string, RouteActivity[]>();
  for (const item of activities) {
    const pool = activitiesByObjective.get(item.objectiveKey) ?? [];
    pool.push(item); activitiesByObjective.set(item.objectiveKey, pool);
  }
  const unitByObjective = new Map<string, RoutePackage["units"][number]>();
  const unitByKey = new Map(definition.units.map((unit) => [unit.key, unit]));
  const unitActivityKeys = new Map(definition.units.map((unit) => [unit.key, new Set(unit.activityKeys)]));
  for (const unit of definition.units) for (const key of unit.objectiveKeys) {
    if (!unitByObjective.has(key)) unitByObjective.set(key, unit);
  }
  const children = new Set(activities.flatMap((item) => item.kind === "case"
    ? item.payload.stages.map((stage) => stage.childActivityKey) : []));
  return { order, activities, activityByKey, objectiveByKey, rankByKey, activitiesByObjective, unitByObjective, unitByKey, unitActivityKeys, children,
    diagnosis: diagnostic(definition, order, activities) };
}
const structures = new WeakMap<RoutePackage, ReturnType<typeof buildStructure>>();
function structure(definition: RoutePackage) {
  const cached = structures.get(definition);
  if (cached) return cached;
  const result = buildStructure(definition);
  const deeplyFrozen = (value: unknown): boolean => !value || typeof value !== "object"
    || (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen));
  // Mutable editorial/preview inputs are always rebuilt; only immutable content
  // can retain structural indexes. No learner-dependent input is stored here.
  if (deeplyFrozen(definition)) structures.set(definition, result);
  return result;
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
  return copyDiagnostic(structure(definition).diagnosis);
}

function copyDiagnostic(value: ReturnType<typeof diagnostic>) {
  return { ...value, activityKeys: [...value.activityKeys], objectiveKeys: [...value.objectiveKeys],
    uncoveredObjectiveKeys: [...value.uncoveredObjectiveKeys] };
}

function diagnostic(definition: RoutePackage, order: string[], activities: RouteActivity[]) {
  const objectivesByKey = new Map(definition.objectives.map((item) => [item.key, item]));
  const assessment = definition.assessments.find((item) => item.kind === "diagnostic");
  const candidates = new Set(assessment?.candidateActivityKeys ?? []);
  const pool = activities.filter((item) => candidates.has(item.key)
    && item.use === "diagnostic" && independent(item));
  const objectives = order.filter((key) => {
    const objective = objectivesByKey.get(key)!;
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
  const { order, activityByKey, objectiveByKey, rankByKey, activitiesByObjective,
    unitByObjective, unitByKey, unitActivityKeys, children, diagnosis } = structure(definition);
  if (snapshot.selectedObjectiveKey && !order.includes(snapshot.selectedObjectiveKey)) {
    throw new TypeError("La rama seleccionada no pertenece a la versión matriculada");
  }
  const events = facts(snapshot, now);
  // Evidence and event indexes are fresh for every authorized operation.
  const evidenceByKey = new Map(evidence.objectives.map((item) => [item.objectiveKey, item]));
  const responsesByObjective = new Map<string, Extract<GuidedV2EvidenceEvent, { kind: "response" }>[]>();
  const latestInteraction = new Map<string, number>();
  for (const event of events) {
    if (event.kind === "interaction" || event.kind === "response") latestInteraction.set(event.activityKey, utc(event.at));
    if (event.kind !== "response") continue;
    const responses = responsesByObjective.get(event.objectiveKey) ?? [];
    responses.push(event); responsesByObjective.set(event.objectiveKey, responses);
  }
  const completed = new Set([...snapshot.completedActivityKeys, ...snapshot.dispensedActivityKeys]);
  const available = new Set(evidence.availability.filter((item) => item.available).map((item) => item.objectiveKey));
  const sessions = new Set(snapshot.sessionAttemptIds);
  const reuseMs = guidedV2PolicySnapshot.mastery.familyReuseHours * 3600000;
  const exposure = new Map<string, number>();
  for (const event of events) {
    if (event.kind !== "response" && event.kind !== "reveal") continue;
    const activity = activityByKey.get(event.activityKey);
    if (activity) exposure.set(activity.equivalenceKey, utc(event.at));
  }
  const eligibleAt = (activity: RouteActivity) => (exposure.get(activity.equivalenceKey) ?? -Infinity) + reuseMs;
  const support = order.map((objectiveKey) => {
    const pool = (activitiesByObjective.get(objectiveKey) ?? []).filter(practice);
    const responses = responsesByObjective.get(objectiveKey) ?? [];
    const diagnostic = snapshot.diagnosticStatus === "completed" ? responses.filter((event) => event.purpose === "diagnostic" && event.gradingSource === "server"
      && !event.assisted).at(-1) : undefined;
    let failures = 0;
    let lastFailureAt = -Infinity;
    for (const event of responses) {
      if (!sessions.has(event.attemptId)
        || !["learning", "gate", "review"].includes(event.purpose) || event.gradingSource !== "server"
        || event.score01 === null || !independent(activityByKey.get(event.activityKey))) continue;
      failures = event.score01 === 1 ? 0 : failures + 1;
      if (event.score01 !== 1) lastFailureAt = utc(event.at);
    }
    const checkActivityKey = diagnostic?.kind === "response" && diagnostic.score01 === 1
      ? pool.find((item) => independent(item) && eligibleAt(item) <= now)?.key ?? null : null;
    const explanation = pool.find((item) => item.kind === "study" && item.payload.scaffold === "explanation");
    const reinforcedExplanationKey = failures >= guidedV2PolicySnapshot.consecutiveFailuresBeforeSupport
      && explanation && !((latestInteraction.get(explanation.key) ?? -Infinity) > lastFailureAt) ? explanation.key : null;
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
  const initial = order.flatMap((objectiveKey) => {
    if (!available.has(objectiveKey) || supportByKey.get(objectiveKey)!.retryLimitReached) return [];
    const adaptation = supportByKey.get(objectiveKey)!;
    const unit = unitByObjective.get(objectiveKey)!;
    const pool = (activitiesByObjective.get(objectiveKey) ?? []).filter((item) => unitActivityKeys.get(unit.key)!.has(item.key)
      && practice(item) && item.required && item.phase !== "remediate" && !children.has(item.key)
      && !completed.has(item.key));
    const check = pool.find((item) => item.key === adaptation.checkActivityKey);
    const scaffold = adaptation.scaffoldActivityKeys.map((key) => pool.find((item) => item.key === key)).find(Boolean);
    const reinforced = activityByKey.get(adaptation.reinforcedExplanationKey ?? "");
    const activity = reinforced ?? check ?? scaffold ?? pool.find((item) => item.kind === "study" || eligibleAt(item) <= now);
    return activity ? [{ kind: "activity" as const, key: activity.key, objectiveKey,
      reason: check ? "Ir a comprobar este objetivo; el diagnóstico no otorga dominio" : "Siguiente actividad de la rama disponible" }] : [];
  });
  const branch = new Set<string>();
  const visit = (key: string) => {
    if (branch.has(key)) return;
    branch.add(key);
    objectiveByKey.get(key)!.prerequisiteKeys.forEach(visit);
  };
  if (snapshot.selectedObjectiveKey) visit(snapshot.selectedObjectiveKey);
  else if (initial[0]) visit(initial[0].objectiveKey);
  const blocking = order.find((key) => branch.has(key) && objectiveByKey.get(key)!.criticality === "core"
    && evidenceByKey.get(key)?.criticalErrorOpen);
  const remediationOffers = order.flatMap((objectiveKey) => {
    const objective = objectiveByKey.get(objectiveKey)!;
    const error = evidenceByKey.get(objectiveKey)?.openCriticalErrors[0];
    if (!error) return [];
    const misconception = objective?.misconceptions.find((item) => item.key === error?.misconceptionKey);
    const verification = (activitiesByObjective.get(objectiveKey) ?? []).filter((item) => misconception?.verificationActivityKeys.includes(item.key)
      && practice(item) && independent(item));
    const candidate = misconception ? activityByKey.get(misconception.remediationActivityKey) : undefined;
    const remediation = candidate?.objectiveKey === objectiveKey && practice(candidate) ? candidate : undefined;
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
  const rank = (key: string) => rankByKey.get(key) ?? -1;
  const weights = { core: 4, high_yield: 3, supporting: 2, detail: 1 };
  const dueReviews = snapshot.reviewDue.filter((item) => utc(item.dueAt) <= now
    && evidenceByKey.has(item.objectiveKey) && evidenceByKey.get(item.objectiveKey)!.label !== "new")
    .sort((a, b) => Number(!!evidenceByKey.get(b.objectiveKey)?.criticalErrorOpen)
      - Number(!!evidenceByKey.get(a.objectiveKey)?.criticalErrorOpen)
      || utc(a.dueAt) - utc(b.dueAt)
      || weights[objectiveByKey.get(b.objectiveKey)!.criticality]
      - weights[objectiveByKey.get(a.objectiveKey)!.criticality]
      || rank(a.objectiveKey) - rank(b.objectiveKey) || compare(a.key, b.key));
  const reviewBatch = dueReviews.filter((item, i, all) => all.findIndex((other) => other.objectiveKey === item.objectiveKey) === i)
    .slice(0, guidedV2PolicySnapshot.review.batchLimit);
  const retained = [...snapshot.retentionDue].filter((item) => utc(item.dueAt) <= now
    && definition.assessments.some((assessment) => assessment.key === item.key && ["retention7", "retention30"].includes(assessment.kind))
    && !snapshot.completedAssessmentKeys.includes(item.key)).sort((a, b) => utc(a.dueAt) - utc(b.dueAt) || compare(a.key, b.key));
  const gate = definition.assessments.find((item) => ["unit_gate", "checkpoint"].includes(item.kind)
    && !snapshot.completedAssessmentKeys.includes(item.key) && item.objectiveKeys.every((key) => available.has(key))
    && !!item.afterUnitKey && unitByKey.get(item.afterUnitKey)!.activityKeys
      .filter((key) => { const activity = activityByKey.get(key); return activity?.required && !children.has(key)
        && practice(activity) && activity.phase !== "remediate"; })
      .every((key) => completed.has(key))
    && (item.kind === "unit_gate" ? !evidence.gates.find((state) => state.unitKey === item.afterUnitKey)?.passed
      : !!evidence.gates.find((state) => state.unitKey === item.afterUnitKey)?.passed));
  const open = [...snapshot.openAttempts].filter((item) => utc(item.openedAt) <= now)
    .sort((a, b) => utc(a.openedAt) - utc(b.openedAt) || compare(a.key, b.key))[0];
  const selected = initial.find((item) => item.objectiveKey === snapshot.selectedObjectiveKey) ?? initial[0];
  const selectedRemediation = remediationOffers.find((item) => item.objectiveKey === (snapshot.selectedObjectiveKey ?? selected?.objectiveKey));
  const exhaustedBanks = order.flatMap((objectiveKey) => {
    if (!available.has(objectiveKey)) return [];
    const candidates = (activitiesByObjective.get(objectiveKey) ?? []).filter((item) => practice(item)
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
  return { nextAction, diagnostic: copyDiagnostic(diagnosis), support, remediation: remediationInfo,
    exhaustedBanks, remediationOffers,
    reviewBatch, availableActivities: initial.filter((item) => item.objectiveKey !== blocking),
    pauseOffers: support.filter((item) => item.retryLimitReached).map((item) => ({ objectiveKey: item.objectiveKey,
      alternatives: ["pause", "other_branch", "review_later"] as const })),
    pausedObjectiveKeys: support.filter((item) => item.retryLimitReached).map((item) => item.objectiveKey) };
}
