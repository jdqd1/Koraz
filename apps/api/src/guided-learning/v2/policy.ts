import type { RoutePackage } from "@cediah/contracts";
import { guidedV2PolicySnapshot } from "./service.js";

export const guidedV2EvidencePolicy = Object.freeze({
  version: guidedV2PolicySnapshot.policyVersion,
  window: guidedV2PolicySnapshot.mastery.window,
  minFamilies: guidedV2PolicySnapshot.mastery.minFamilies,
  minRecallFamilies: guidedV2PolicySnapshot.mastery.minRecallFamilies,
  reuseMs: guidedV2PolicySnapshot.mastery.familyReuseHours * 60 * 60 * 1000,
  firstRetentionMs: guidedV2PolicySnapshot.retention.firstDays * 86400000,
  secondRetentionMs: guidedV2PolicySnapshot.retention.secondDays * 86400000,
  retentionSeparationMs: guidedV2PolicySnapshot.retention.minSeparationDays * 86400000,
});

export function guidedV2ObjectiveThreshold(definition: RoutePackage, objectiveKey: string): number {
  const objective = definition.objectives.find((item) => item.key === objectiveKey);
  return definition.assessments.find((item) => item.kind === "unit_gate"
    && item.afterUnitKey === objective?.unitKey)?.thresholdPercent
    ?? guidedV2PolicySnapshot.defaultGateThresholdPercent;
}

export type GuidedV2GateObjective = {
  objectiveKey: string; objectiveScore: number | null; mastered: boolean; criticalErrorOpen: boolean;
};

/** Missing evidence is zero; criticity weights never enter the gate average. */
export function evaluateGuidedV2Gate(
  definition: RoutePackage, unitKey: string, states: readonly GuidedV2GateObjective[],
) {
  const required = definition.objectives.filter((item) => item.unitKey === unitKey && item.required);
  const byKey = new Map(states.map((state) => [state.objectiveKey, state]));
  const thresholdPercent = definition.assessments.find((item) => item.kind === "unit_gate"
    && item.afterUnitKey === unitKey)?.thresholdPercent ?? guidedV2PolicySnapshot.defaultGateThresholdPercent;
  const score = required.length === 0 ? null : required.reduce((sum, item) =>
    sum + (byKey.get(item.key)?.objectiveScore ?? 0), 0) / required.length;
  const missingCoreKeys = required.filter((item) => item.criticality === "core"
    && !byKey.get(item.key)?.mastered).map((item) => item.key);
  const criticalErrorKeys = required.filter((item) => byKey.get(item.key)?.criticalErrorOpen).map((item) => item.key);
  return { unitKey, score, thresholdPercent, missingCoreKeys, criticalErrorKeys,
    passed: score !== null && score >= thresholdPercent && missingCoreKeys.length === 0 && criticalErrorKeys.length === 0 };
}

export function guidedV2InitialActivityKeys(definition: RoutePackage): string[] {
  const initialKeys = new Set(definition.units.flatMap((unit) => unit.activityKeys));
  const children = new Set(definition.activities.flatMap((activity) => activity.kind === "case"
    ? activity.payload.stages.map((stage) => stage.childActivityKey) : []));
  return definition.activities.filter((activity) => initialKeys.has(activity.key) && !children.has(activity.key)
    && activity.required && ["learning", "gate"].includes(activity.use) && activity.phase !== "remediate")
    .map((activity) => activity.key);
}

/** A failed CORE gates its descendants; independent branches keep their availability. */
export function guidedV2ObjectiveAvailability(
  definition: RoutePackage, states: readonly GuidedV2GateObjective[],
) {
  const byKey = new Map(states.map((state) => [state.objectiveKey, state]));
  const gates = new Map(definition.units.map((unit) => [unit.key, evaluateGuidedV2Gate(definition, unit.key, states)]));
  return definition.objectives.map((objective) => {
    const blockedBy = objective.prerequisiteKeys.filter((key) => {
      const prerequisite = definition.objectives.find((item) => item.key === key);
      return !byKey.get(key)?.mastered || (prerequisite?.criticality === "core" && !gates.get(prerequisite.unitKey)?.passed);
    });
    return { objectiveKey: objective.key, available: blockedBy.length === 0, blockedBy };
  });
}
