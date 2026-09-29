import { V2AttemptManifestSchema, toV2PublicActivity, type RouteActivity, type V2AttemptManifest, type V2PublicActivity } from "@cediah/contracts";
import { validateCaseStage, type CaseStageState } from "./grading.js";
import type { GuidedV2AttemptResume, GuidedV2AttemptSnapshot } from "./service.js";

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

export type GuidedV2ManifestResponse = {
  activityKey: string;
  answer: unknown;
  acceptedAt: Date;
  score01: number | null;
  explanation: string;
  commonError: string;
};

/** Construct only allowlisted public fields from the private snapshot. */
export function guidedV2AttemptManifest(input: {
  attemptId: string; enrollmentId: string; pathVersionId: string;
  purpose: "activity" | "assessment" | "review";
  rowVersion: number; status: "in_progress" | "paused" | "completed" | "abandoned";
  snapshot: GuidedV2AttemptSnapshot; resume: GuidedV2AttemptResume;
  responses: readonly GuidedV2ManifestResponse[];
}): V2AttemptManifest {
  const activeKey = input.snapshot.orderedKeys[input.resume.activeIndex];
  const activity = activeKey ? input.snapshot.activities.find((item) => item.key === activeKey) : undefined;
  let activeActivity = activity ? toV2PublicActivity(activity) : null;
  if (activeActivity) {
    const wrapper = input.snapshot.activities.find((item) => item.kind === "case"
      && item.payload.stages.some((stage) => stage.childActivityKey === activeActivity?.key));
    if (wrapper?.kind === "case") {
      const stage = wrapper.payload.stages.find((item) => item.childActivityKey === activeActivity?.key)!;
      activeActivity = { ...activeActivity, prompt: `${stage.narrative}\n\n${activeActivity.prompt}` };
    }
  }
  return V2AttemptManifestSchema.parse({
    engineVersion: "guided-v2", attemptId: input.attemptId, enrollmentId: input.enrollmentId,
    pathVersionId: input.pathVersionId, policyVersion: "guided-v2.0", purpose: input.purpose,
    rowVersion: input.rowVersion,
    status: input.status === "in_progress" ? "open" : input.status,
    activeActivity: input.status === "in_progress" ? activeActivity : null,
    acceptedResponses: input.responses.map((item) => ({
      activityKey: item.activityKey, answer: item.answer, serverAcceptedAt: item.acceptedAt.toISOString(),
      score01: item.score01, feedback: { explanation: item.explanation, commonError: item.commonError },
    })),
  });
}
