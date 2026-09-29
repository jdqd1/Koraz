import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import { evaluateGuidedV2Gate, guidedV2EvidencePolicy as policy, guidedV2InitialActivityKeys,
  guidedV2ObjectiveAvailability, guidedV2ObjectiveThreshold } from "./policy.js";

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

function objectiveState(definition: RoutePackage, objectiveKey: string, runtime: ObjectiveRuntime): GuidedV2ObjectiveEvidence {
  const window = [...runtime.latestByFamily.values()].sort(compare).slice(-policy.window);
  const score = window.length ? 100 * window.filter((event) => event.score01 === 1).length / window.length : null;
  const explanations = new Set(definition.activities.filter((activity) => activity.objectiveKey === objectiveKey
    && activity.kind === "study" && activity.phase === "learn" && activity.payload.scaffold === "explanation")
    .map((activity) => activity.representation));
  const recall = window.filter((event) => event.score01 === 1 && event.phase === "retrieve").length;
  const application = window.some((event) => event.score01 === 1 && event.phase === "apply"
    && explanations.size > 0 && !explanations.has(event.modality));
  const mastered = window.length >= policy.minFamilies && score !== null
    && score >= guidedV2ObjectiveThreshold(definition, objectiveKey) && recall >= policy.minRecallFamilies
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

/** Pure replay from server facts. Neither caches, confidence nor client clocks can grant mastery. */
export function rebuildGuidedV2Evidence(
  definition: RoutePackage, input: readonly GuidedV2EvidenceEvent[],
  options: { dueObjectiveKeys?: readonly string[] } = {},
) {
  const activities = new Map(definition.activities.map((activity) => [activity.key, activity]));
  const runtimes = new Map<string, ObjectiveRuntime>(definition.objectives.map((objective) => [objective.key, {
    latestByFamily: new Map(), eligible: [], lastExposure: new Map(), errors: new Map(),
    interacted: false, assisted: false, lastFailureAt: null, firstMasteredAt: null,
    lastMasteredAt: null, firstConsolidatedAt: null,
  }]));
  const completed = new Set<string>();
  const dispensed = new Map<string, string>();
  const completedChildren = new Map<string, Set<string>>();
  const seen = new Set<string>();
  const initial = guidedV2InitialActivityKeys(definition);
  let final: { score: number; thresholdPercent: number; at: string } | null = null;
  let completedAt: string | null = null;
  let masteredAt: string | null = null;
  let consolidatedAt: string | null = null;
  let states = definition.objectives.map((objective) => objectiveState(definition, objective.key, runtimes.get(objective.key)!));

  for (const raw of [...input].sort(compare)) {
    if (!Number.isFinite(Date.parse(raw.at)) || seen.has(raw.semanticKey)) continue;
    seen.add(raw.semanticKey);
    const event = { ...raw, at: iso(raw.at) };
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
      if (event.kind === "dispense") {
        if (initial.includes(activity.key) && event.reason.trim()) dispensed.set(activity.key, event.reason);
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
        for (const parent of definition.activities.filter((item) => item.kind === "case")) {
          if (parent.kind === "case" && parent.payload.stages.every((stage) => children.has(stage.childActivityKey))) completed.add(parent.key);
        }
        const previous = runtime.lastExposure.get(event.equivalenceKey);
        const eligible = event.gradingSource === "server" && (event.score01 === 0 || event.score01 === 1)
          && !event.assisted && !["diagnostic", "preview"].includes(event.purpose)
          && (previous === undefined || Date.parse(event.at) - previous >= policy.reuseMs);
        // Any accepted response/reveal resets reuse, not just previously eligible ones.
        runtime.lastExposure.set(event.equivalenceKey, Date.parse(event.at));
        const objective = definition.objectives.find((item) => item.key === activity.objectiveKey)!;
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
    states = definition.objectives.map((objective) => {
      const runtime = runtimes.get(objective.key)!;
      const next = objectiveState(definition, objective.key, runtime);
      const before = states.find((item) => item.objectiveKey === objective.key)!;
      if (next.mastered && !before.mastered) {
        runtime.firstMasteredAt ??= event.at;
        runtime.lastMasteredAt = event.at;
      }
      if (next.mastered && retained(runtime)) runtime.firstConsolidatedAt ??= event.at;
      return objectiveState(definition, objective.key, runtime);
    });
    const requiredStates = states.filter((state) => definition.objectives.some((objective) => objective.required && objective.key === state.objectiveKey));
    const routeCompleted = initial.length > 0 && initial.every((key) => completed.has(key) || dispensed.has(key)) && final !== null;
    const routeMastered = requiredStates.length > 0 && requiredStates.every((state) => state.mastered)
      && final !== null && final.score >= final.thresholdPercent;
    if (routeCompleted) completedAt ??= event.at;
    if (routeMastered) masteredAt ??= event.at;
    if (routeMastered && requiredStates.every((state) => state.consolidated)) consolidatedAt ??= event.at;
  }
  const requiredStates = states.filter((state) => definition.objectives.some((objective) => objective.required && objective.key === state.objectiveKey));
  const routeMastered = requiredStates.length > 0 && requiredStates.every((state) => state.mastered)
    && final !== null && final.score >= final.thresholdPercent;
  return {
    policyVersion: policy.version,
    objectives: states.map((state) => ({ ...state, reviewDue: options.dueObjectiveKeys?.includes(state.objectiveKey) ?? false })),
    gates: definition.units.map((unit) => evaluateGuidedV2Gate(definition, unit.key, states)),
    availability: guidedV2ObjectiveAvailability(definition, states),
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
