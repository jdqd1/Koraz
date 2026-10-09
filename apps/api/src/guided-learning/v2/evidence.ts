import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import { evaluateGuidedV2Gate, guidedV2EvidencePolicy as policy, guidedV2InitialActivityKeys,
  guidedV2ObjectiveThreshold } from "./policy.js";

type Purpose = "learning" | "diagnostic" | "gate" | "final" | "retention7" | "retention30" | "review" | "preview";
type BaseEvent = { id: string; semanticKey: string; at: string };
export type GuidedV2EvidenceResponse = BaseEvent & {
  kind: "response"; attemptId: string; activityKey: string; objectiveKey: string; equivalenceKey: string;
  phase: RouteActivity["phase"]; modality: RouteActivity["representation"];
  purpose: Purpose; gradingSource: "server" | "self" | "none"; score01: number | null;
  responseKey: string | null; assisted: boolean; valid: boolean;
};
export type GuidedV2EvidenceEvent = GuidedV2EvidenceResponse
  | (BaseEvent & { kind: "interaction"; activityKey: string; assisted: boolean })
  | (BaseEvent & { kind: "reveal"; activityKey: string })
  | (BaseEvent & { kind: "dispense"; activityKey: string; reason: string })
  | (BaseEvent & { kind: "final"; assessmentKey: string; attemptId: string;
      valid: boolean; answers: { objectiveKey: string; score01: number | null; gradingSource: "server" | "self" | "none"; assisted: boolean }[] });

export type GuidedV2CriticalError = {
  misconceptionKey: string; openedAt: string; openedEventId: string; equivalenceKey: string;
  remediationCompletedAt: string | null;
};
export type GuidedV2ObjectiveEvidence = {
  objectiveKey: string; label: "new" | "learning" | "mastered" | "reinforce";
  objectiveScore: number | null; mastered: boolean; consolidated: boolean;
  criticalErrorOpen: boolean; assisted: boolean; applicationDemonstrated: boolean; reviewDue: boolean;
  firstMasteredAt: string | null; lastMasteredAt: string | null; firstConsolidatedAt: string | null;
  evidenceWindow: GuidedV2EvidenceResponse[]; openCriticalErrors: GuidedV2CriticalError[];
};
export type GuidedV2EvidenceState = ReturnType<typeof rebuildGuidedV2Evidence>;

type ObjectiveRuntime = {
  latestByFamily: Map<string, GuidedV2EvidenceResponse>; eligible: GuidedV2EvidenceResponse[];
  lastExposure: Map<string, number>; errors: Map<string, GuidedV2CriticalError>;
  interacted: boolean; assisted: boolean; lastFailureAt: string | null;
  firstMasteredAt: string | null; lastMasteredAt: string | null; firstConsolidatedAt: string | null;
};
const compare = (a: BaseEvent, b: BaseEvent) => Date.parse(a.at) - Date.parse(b.at)
  || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const iso = (at: string) => new Date(at).toISOString();

function retained(runtime: ObjectiveRuntime): boolean {
  if (!runtime.firstMasteredAt) return false;
  const start = Date.parse(runtime.firstMasteredAt);
  const correct = runtime.eligible.filter((event) => event.score01 === 1 && event.phase === "retrieve");
  return correct.some((first) => Date.parse(first.at) >= start + policy.firstRetentionMs
    && correct.some((second) => second.equivalenceKey !== first.equivalenceKey
      && Date.parse(second.at) >= start + policy.secondRetentionMs
      && Date.parse(second.at) - Date.parse(first.at) >= policy.retentionSeparationMs));
}

function objectiveState(objectiveKey: string, runtime: ObjectiveRuntime,
  explanations: ReadonlySet<RouteActivity["representation"]>, threshold: number): GuidedV2ObjectiveEvidence {
  const window = [...runtime.latestByFamily.values()].sort(compare).slice(-policy.window);
  const score = window.length ? 100 * window.filter((event) => event.score01 === 1).length / window.length : null;
  const recall = window.filter((event) => event.score01 === 1 && event.phase === "retrieve").length;
  const application = window.some((event) => event.score01 === 1 && event.phase === "apply"
    && explanations.size > 0 && !explanations.has(event.modality));
  const mastered = window.length >= policy.minFamilies && score !== null
    && score >= threshold && recall >= policy.minRecallFamilies
    && application && runtime.errors.size === 0 && window.at(-1)?.score01 === 1;
  const reinforce = runtime.errors.size > 0 || (runtime.lastFailureAt !== null && runtime.lastMasteredAt !== null
    && Date.parse(runtime.lastFailureAt) >= Date.parse(runtime.lastMasteredAt) && !mastered);
  return { objectiveKey, label: reinforce ? "reinforce" : mastered ? "mastered" : runtime.interacted ? "learning" : "new",
    objectiveScore: score, mastered, consolidated: mastered && retained(runtime),
    criticalErrorOpen: runtime.errors.size > 0, assisted: runtime.assisted,
    applicationDemonstrated: application, reviewDue: false,
    firstMasteredAt: runtime.firstMasteredAt, lastMasteredAt: runtime.lastMasteredAt,
    firstConsolidatedAt: runtime.firstConsolidatedAt, evidenceWindow: window,
    openCriticalErrors: [...runtime.errors.values()].sort((a, b) => a.misconceptionKey.localeCompare(b.misconceptionKey)) };
}

function buildEvidenceStructure(definition: RoutePackage) {
  const activities = new Map(definition.activities.map((activity) => [activity.key, activity]));
  const objectives = new Map(definition.objectives.map((objective) => [objective.key, objective]));
  const requiredKeys = new Set(definition.objectives.filter((objective) => objective.required).map((objective) => objective.key));
  const explanations = new Map<string, Set<RouteActivity["representation"]>>();
  for (const activity of definition.activities) {
    if (activity.kind !== "study" || activity.phase !== "learn" || activity.payload.scaffold !== "explanation") continue;
    const modalities = explanations.get(activity.objectiveKey) ?? new Set<RouteActivity["representation"]>();
    modalities.add(activity.representation);
    explanations.set(activity.objectiveKey, modalities);
  }
  const thresholds = new Map(definition.objectives.map((objective) => [objective.key, guidedV2ObjectiveThreshold(definition, objective.key)]));
  const caseParents = definition.activities.filter((item) => item.kind === "case");
  const initial = guidedV2InitialActivityKeys(definition);
  const units = definition.units.map(unit => ({ key: unit.key, definition: { ...definition,
    objectives: definition.objectives.filter(objective => objective.unitKey === unit.key),
    assessments: definition.assessments.filter(assessment => assessment.kind === "unit_gate" && assessment.afterUnitKey === unit.key),
  } }));
  return { activities, objectives, requiredKeys, explanations, thresholds, caseParents, initial, initialKeys: new Set(initial), units };
}
const evidenceStructures = new WeakMap<RoutePackage, ReturnType<typeof buildEvidenceStructure>>();
function evidenceStructure(definition: RoutePackage) {
  const cached = evidenceStructures.get(definition); if (cached) return cached;
  const value = buildEvidenceStructure(definition);
  const deeplyFrozen = (item: unknown): boolean => !item || typeof item !== "object"
    || (Object.isFrozen(item) && Object.values(item).every(deeplyFrozen));
  if (deeplyFrozen(definition)) evidenceStructures.set(definition, value);
  return value;
}

/** Pure replay from server facts. Only immutable content structure is shared;
 * runtimes, events, decisions and timestamps are rebuilt for every invocation. */
export function rebuildGuidedV2Evidence(
  definition: RoutePackage, input: readonly GuidedV2EvidenceEvent[],
  options: { dueObjectiveKeys?: readonly string[] } = {},
) {
  const { activities, objectives, requiredKeys, explanations, thresholds, caseParents, initial, initialKeys, units } = evidenceStructure(definition);
  const runtimes = new Map<string, ObjectiveRuntime>(definition.objectives.map((objective) => [objective.key, {
    latestByFamily: new Map(), eligible: [], lastExposure: new Map(), errors: new Map(),
    interacted: false, assisted: false, lastFailureAt: null, firstMasteredAt: null,
    lastMasteredAt: null, firstConsolidatedAt: null,
  }]));
  const completed = new Set<string>();
  const dispensed = new Map<string, string>();
  const completedChildren = new Map<string, Set<string>>();
  const seen = new Set<string>();
  let final: { score: number; thresholdPercent: number; at: string } | null = null;
  let completedAt: string | null = null;
  let masteredAt: string | null = null;
  let consolidatedAt: string | null = null;
  const stateFor = (key: string) => objectiveState(key, runtimes.get(key)!, explanations.get(key) ?? new Set(), thresholds.get(key)!);
  const states = definition.objectives.map((objective) => stateFor(objective.key));
  const stateIndex = new Map(states.map((state, index) => [state.objectiveKey, index]));

  for (const raw of [...input].sort(compare)) {
    if (!Number.isFinite(Date.parse(raw.at)) || seen.has(raw.semanticKey)) continue;
    seen.add(raw.semanticKey);
    const event = { ...raw, at: iso(raw.at) };
    let changedObjectiveKey: string | null = null;
    if (event.kind === "final") {
      const assessment = definition.assessments.find((item) => item.kind === "final" && item.key === event.assessmentKey);
      if (!assessment || !event.valid) continue;
      const required = definition.objectives.filter((objective) => objective.required);
      const scores = required.map((objective) => {
        const answers = event.answers.filter((answer) => answer.objectiveKey === objective.key);
        return answers.length ? answers.reduce((sum, answer) => sum
          + (answer.gradingSource === "server" && !answer.assisted && answer.score01 === 1 ? 100 : 0), 0) / answers.length : 0;
      });
      final = { score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
        thresholdPercent: assessment.thresholdPercent, at: event.at };
    } else {
      const activity = activities.get(event.activityKey);
      const runtime = activity && runtimes.get(activity.objectiveKey);
      if (!activity || !runtime) continue;
      changedObjectiveKey = activity.objectiveKey;
      if (event.kind === "dispense") {
        if (initialKeys.has(activity.key) && event.reason.trim()) dispensed.set(activity.key, event.reason);
      } else if (event.kind === "interaction" || event.kind === "reveal") {
        runtime.interacted = true;
        runtime.assisted = event.kind === "reveal" || event.assisted;
        if (event.kind === "reveal") runtime.lastExposure.set(activity.equivalenceKey, Date.parse(event.at));
      } else {
        // Metadata must agree with the pinned definition and the server grading.
        if (!event.valid || event.purpose === "preview" || event.objectiveKey !== activity.objectiveKey || event.equivalenceKey !== activity.equivalenceKey
          || event.phase !== activity.phase || event.modality !== activity.representation || activity.kind === "case") continue;
        runtime.interacted = true;
        runtime.assisted = event.assisted;
        const assessmentOnly = ["diagnostic", "final", "retention7", "retention30"].includes(event.purpose);
        const initialResponse = !assessmentOnly && event.purpose !== "review";
        if (initialResponse) completed.add(activity.key);
        const children = completedChildren.get(event.attemptId) ?? new Set<string>();
        if (initialResponse) children.add(activity.key);
        completedChildren.set(event.attemptId, children);
        for (const parent of caseParents) {
          if (parent.kind === "case" && parent.payload.stages.every((stage) => children.has(stage.childActivityKey))) completed.add(parent.key);
        }
        const previous = runtime.lastExposure.get(event.equivalenceKey);
        const eligible = event.gradingSource === "server" && (event.score01 === 0 || event.score01 === 1)
          && !event.assisted && !["diagnostic", "preview"].includes(event.purpose)
          && (previous === undefined || Date.parse(event.at) - previous >= policy.reuseMs);
        // Any accepted response/reveal resets reuse, not just previously eligible ones.
        runtime.lastExposure.set(event.equivalenceKey, Date.parse(event.at));
        const objective = objectives.get(activity.objectiveKey)!;
        if (eligible) {
          runtime.latestByFamily.set(event.equivalenceKey, event);
          runtime.eligible.push(event);
          if (event.score01 === 0) runtime.lastFailureAt = event.at;
        }
        if (event.gradingSource === "server" && event.score01 === 0 && !["diagnostic", "preview"].includes(event.purpose)) {
          for (const mapping of activity.misconceptionMappings.filter((item) => item.responseKey === event.responseKey)) {
            const misconception = objective.misconceptions.find((item) => item.key === mapping.misconceptionKey && item.critical);
            if (misconception) runtime.errors.set(misconception.key, { misconceptionKey: misconception.key,
              openedAt: event.at, openedEventId: event.id, equivalenceKey: event.equivalenceKey, remediationCompletedAt: null });
          }
        }
        // Verification must follow completed remediation; it cannot remediate itself.
        for (const [key, error] of runtime.errors) {
          const misconception = objective.misconceptions.find((item) => item.key === key)!;
          if (eligible && event.score01 === 1 && error.remediationCompletedAt
            && misconception.verificationActivityKeys.includes(activity.key)
            && (event.equivalenceKey !== error.equivalenceKey
              || Date.parse(event.at) - Date.parse(error.openedAt) >= policy.reuseMs)) runtime.errors.delete(key);
          else if (initialResponse && misconception.remediationActivityKey === activity.key) error.remediationCompletedAt = event.at;
        }
      }
    }
    // Each non-final fact changes one objective runtime. Unrelated objectives
    // retain exactly the same state and historical timestamps at this event.
    if (changedObjectiveKey !== null) {
      const runtime = runtimes.get(changedObjectiveKey)!;
      const next = stateFor(changedObjectiveKey);
      const index = stateIndex.get(changedObjectiveKey)!;
      const before = states[index]!;
      if (next.mastered && !before.mastered) {
        runtime.firstMasteredAt ??= event.at;
        runtime.lastMasteredAt = event.at;
      }
      if (next.mastered && retained(runtime)) runtime.firstConsolidatedAt ??= event.at;
      states[index] = stateFor(changedObjectiveKey);
    }
    // None of the route-level achievements can occur before an accepted final.
    // Keep objective history current, without scanning all objectives per fact
    // while this necessary condition is absent.
    if (final !== null) {
      const requiredStates = states.filter((state) => requiredKeys.has(state.objectiveKey));
      const routeCompleted = initial.length > 0 && initial.every((key) => completed.has(key) || dispensed.has(key));
      const routeMastered = requiredStates.length > 0 && requiredStates.every((state) => state.mastered)
        && final.score >= final.thresholdPercent;
      if (routeCompleted) completedAt ??= event.at;
      if (routeMastered) masteredAt ??= event.at;
      if (routeMastered && requiredStates.every((state) => state.consolidated)) consolidatedAt ??= event.at;
    }
  }
  const requiredStates = states.filter((state) => requiredKeys.has(state.objectiveKey));
  const routeMastered = requiredStates.length > 0 && requiredStates.every((state) => state.mastered)
    && final !== null && final.score >= final.thresholdPercent;
  const byKey = new Map(states.map(state => [state.objectiveKey, state]));
  const gates = units.map(unit => evaluateGuidedV2Gate(unit.definition, unit.key,
    unit.definition.objectives.map(objective => byKey.get(objective.key)!)));
  const gatesByUnit = new Map(gates.map(gate => [gate.unitKey, gate]));
  return {
    policyVersion: policy.version,
    objectives: states.map((state) => ({ ...state, reviewDue: options.dueObjectiveKeys?.includes(state.objectiveKey) ?? false })),
    gates,
    availability: definition.objectives.map(objective => ({ objectiveKey: objective.key,
      blockedBy: objective.prerequisiteKeys.filter(key => {
        const prerequisite = objectives.get(key);
        return !byKey.get(key)?.mastered || (prerequisite?.criticality === "core" && !gatesByUnit.get(prerequisite.unitKey)?.passed);
      }),
    })).map(item => ({ objectiveKey: item.objectiveKey, available: item.blockedBy.length === 0, blockedBy: item.blockedBy })),
    route: {
      completed: completedAt !== null, mastered: routeMastered,
      consolidated: routeMastered && requiredStates.every((state) => state.consolidated),
      completedAt, masteredAt, consolidatedAt,
      completedActivities: initial.filter((key) => completed.has(key)).length,
      dispensedActivities: initial.filter((key) => !completed.has(key) && dispensed.has(key)).length,
      plannedRequiredActivities: initial.length,
      progressPercent: initial.length ? 100 * initial.filter((key) => completed.has(key)).length / initial.length : 0,
      dispensedReasons: Object.fromEntries([...dispensed].filter(([key]) => !completed.has(key))),
      finalScore: final?.score ?? null,
    },
  };
}
