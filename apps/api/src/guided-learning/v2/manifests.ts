import { toV2PublicActivity, type RouteActivity, type V2PublicActivity } from "@cediah/contracts";
import { validateCaseStage, type CaseStageState } from "./grading.js";

type CaseActivity = Extract<RouteActivity, { kind: "case" }>;

/** Only the active narrative and child are projected; future case stages remain private. */
export function caseStageManifest(
  activity: CaseActivity, activities: readonly RouteActivity[], state: CaseStageState,
): { status: "success"; wrapper: V2PublicActivity; child: V2PublicActivity }
  | { status: "complete" }
  | { status: "invalid"; code: "INVALID_CASE" | "INVALID_CASE_STATE" } {
  const valid = validateCaseStage(activity, activities, state);
  if (valid.status === "invalid") return valid;
  if (!valid.child) return { status: "complete" };
  return {
    status: "success",
    wrapper: toV2PublicActivity(activity, state.activeStageIndex),
    child: toV2PublicActivity(valid.child),
  };
}
