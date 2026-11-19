import type { LearningHome } from "@cediah/contracts";
import type { V2State } from "./v2/model";

/** Presentation only: engines retain their own rules, identities and evidence. */
export type RouteSummary = {
  completed: number;
  covered: number | null;
  required: number;
  mastery: boolean | null;
  consolidation: boolean | null;
  steps: Array<{ id: string; title: string; state: string }> | null;
};

export function v1RouteSummary(path: NonNullable<LearningHome["activePath"]>): RouteSummary {
  return { completed: path.completedSteps, required: path.totalSteps, covered: null,
    mastery: null, consolidation: null, steps: path.steps ?? null };
}

export function v2RouteSummary(state: V2State): RouteSummary {
  return { completed: state.completedActivities, required: state.plannedRequiredActivities,
    covered: state.dispensedActivities, mastery: !!state.masteredAt, consolidation: !!state.consolidatedAt,
    // The state may include optional/remedial work; it is not the denominator.
    steps: null };
}

export function requiredActivityLabel(summary: RouteSummary) {
  return `${summary.completed} de ${summary.required} actividades obligatorias completadas`;
}
