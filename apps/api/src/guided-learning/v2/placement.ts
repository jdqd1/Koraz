import type { RoutePackage } from "@cediah/contracts";
import type { GuidedV2EvidenceState, GuidedV2EvidenceEvent } from "./evidence.js";
import type { GuidedV2AttemptSnapshot } from "./service.js";

type PlacementAnswer = { activityKey: string; score01: number | null; gradingSource: string; assisted: boolean };

/** Admission is separate from mastery, completion and long-term retention. */
export function placementResult(snapshot: GuidedV2AttemptSnapshot, answers: readonly PlacementAnswer[]) {
  const plan = snapshot.placement;
  if (!plan) return null;
  const complete = snapshot.orderedKeys.every(key => answers.some(answer => answer.activityKey === key));
  const failedObjectiveKeys = plan.prerequisiteKeys.filter(key => {
    const items = snapshot.activities.filter(item => item.objectiveKey === key && snapshot.orderedKeys.includes(item.key));
    return !items.length || items.some(item => {
      const answer = answers.find(answer => answer.activityKey === item.key);
      return !answer || answer.gradingSource !== "server" || answer.assisted || answer.score01 !== 1;
    });
  });
  return { objectiveKey: plan.objectiveKey, status: !complete ? "pending" as const
    : failedObjectiveKeys.length ? "reinforce" as const : "passed" as const, failedObjectiveKeys };
}

export function placementOffers(definition: RoutePackage, evidence: GuidedV2EvidenceState,
  events: readonly GuidedV2EvidenceEvent[], completed: readonly { snapshot: GuidedV2AttemptSnapshot; answers: readonly PlacementAnswer[] }[], nowUtc: string, pathVersionId: string) {
  const assessment = definition.assessments.find(item => item.kind === "diagnostic");
  const objectives = new Map(definition.objectives.map(item => [item.key, item]));
  const states = new Map(evidence.objectives.map(item => [item.objectiveKey, item]));
  const gates = new Map(evidence.gates.map(item => [item.unitKey, item]));
  const activities = new Map(definition.activities.map(item => [item.key, item]));
  const children = new Set(definition.activities.flatMap(item => item.kind === "case" ? item.payload.stages.map(stage => stage.childActivityKey) : []));
  // Admission checks current prerequisite knowledge using the existing practice bank.
  // Initial diagnostics and reserved final/retention items keep their original use.
  const pool = definition.activities.filter(item => ["learning", "gate"].includes(item.use)
    && ["retrieve", "apply"].includes(item.phase) && !children.has(item.key)
    && !["study", "case", "constructed_response"].includes(item.kind));
  const exposure = new Map<string, number>();
  for (const event of events) {
    if (Date.parse(event.at) > Date.parse(nowUtc) || event.kind === "response" && (!event.valid || event.purpose === "preview")) continue;
    if (event.kind !== "response" && event.kind !== "reveal") continue;
    const item = activities.get(event.activityKey);
    if (item) exposure.set(item.equivalenceKey, Math.max(exposure.get(item.equivalenceKey) ?? -Infinity, Date.parse(event.at)));
  }
  return definition.objectives.flatMap(objective => {
    const prerequisites = new Set<string>();
    function visit(key: string) {
      if (prerequisites.has(key)) return;
      const item = objectives.get(key);
      if (!item) return;
      prerequisites.add(key);
      item.prerequisiteKeys.forEach(visit);
    }
    objective.prerequisiteKeys.forEach(visit);
    for (const key of [...prerequisites]) {
      const item = objectives.get(key)!;
      if (item.criticality === "core" && item.unitKey !== objective.unitKey && !gates.get(item.unitKey)?.passed) {
        definition.objectives.filter(other => other.unitKey === item.unitKey && other.required).forEach(other => visit(other.key));
      }
    }
    const prerequisiteKeys = [...prerequisites].filter(key => !states.get(key)?.mastered
      || objectives.get(key)?.criticality === "core" && objectives.get(key)!.unitKey !== objective.unitKey
        && !gates.get(objectives.get(key)!.unitKey)?.passed);
    if (!prerequisiteKeys.length) return [];
    const passed = completed.some(attempt => attempt.snapshot.pathVersionId === pathVersionId
      && attempt.snapshot.target.kind === "assessment" && attempt.snapshot.target.key === assessment?.key
      && attempt.snapshot.placement?.objectiveKey === objective.key
      && prerequisiteKeys.every(key => attempt.snapshot.placement?.prerequisiteKeys.includes(key))
      && placementResult(attempt.snapshot, attempt.answers)?.status === "passed")
      && prerequisiteKeys.every(key => !states.get(key)?.criticalErrorOpen);
    const families = new Set<string>(), activityKeys: string[] = [], missingObjectiveKeys: string[] = [];
    const eligibleAt = (key: string) => (exposure.get(key) ?? -Infinity) + 600000;
    let availableAfter = -Infinity;
    for (const key of prerequisiteKeys) {
      const candidates = pool.filter(item => item.objectiveKey === key && !families.has(item.equivalenceKey))
        .sort((a, b) => (exposure.get(a.equivalenceKey) ?? -Infinity) - (exposure.get(b.equivalenceKey) ?? -Infinity)
          || a.key.localeCompare(b.key));
      const recalls = candidates.filter(item => item.phase === "retrieve"), applications = candidates.filter(item => item.phase === "apply");
      let selected: typeof candidates = [];
      for (const first of recalls) {
        for (const second of recalls) {
          if (first.equivalenceKey === second.equivalenceKey) continue;
          const application = applications.find(item => item.equivalenceKey !== first.equivalenceKey && item.equivalenceKey !== second.equivalenceKey);
          if (application) { selected = [first, second, application]; break; }
        }
        if (selected.length) break;
      }
      if (!selected.length) { missingObjectiveKeys.push(key); continue; }
      for (const item of selected) {
        activityKeys.push(item.key); families.add(item.equivalenceKey);
        availableAfter = Math.max(availableAfter, eligibleAt(item.equivalenceKey));
      }
    }
    const available = !!assessment && !missingObjectiveKeys.length && prerequisiteKeys.every(key => !states.get(key)?.criticalErrorOpen)
      && availableAfter <= Date.parse(nowUtc);
    return [{ objectiveKey: objective.key, assessmentKey: assessment?.key ?? null,
      status: passed ? "passed" as const : available ? "available" as const : "unavailable" as const,
      prerequisiteKeys, missingObjectiveKeys,
      availableAfter: !missingObjectiveKeys.length && availableAfter > Date.parse(nowUtc) ? new Date(availableAfter).toISOString() : null,
      activityKeys }];
  });
}
