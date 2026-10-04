import { V2AttemptManifestSchema, toV2PublicActivity, type RouteActivity, type RoutePackage, type V2FeedbackSource, type V2AttemptManifest, type V2PublicActivity } from "@cediah/contracts";
import { validateCaseStage, type CaseStageState } from "./grading.js";
import { accessibleVariant, activeGuidedV2ActivityKey, type GuidedV2AttemptResume, type GuidedV2AttemptSnapshot } from "./service.js";
import { assessmentCoverageV2, type AssessmentPlanV2 } from "./assessments.js";

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
  partialScore01?: number;
};

/** Call only for authorized correction: explicit allowlist from the frozen version. */
export function guidedV2FeedbackSources(activities: readonly RouteActivity[], sources: RoutePackage["sources"], activityKey: string): V2FeedbackSource[] {
  const keys = new Set(activities.find(item => item.key === activityKey)?.feedback.sourceKeys ?? []);
  return sources.filter(source => keys.has(source.key)).map(({ key, title, citation, locator, excerpt, url }) => ({
    key, title, citation, locator: { ...locator, sectionPath: [...locator.sectionPath] }, excerpt, url,
  }));
}

/** Construct only allowlisted public fields from the private snapshot. */
export function guidedV2AttemptManifest(input: {
  attemptId: string; enrollmentId: string; pathVersionId: string;
  purpose: "activity" | "assessment" | "review";
  rowVersion: number; status: "in_progress" | "paused" | "completed" | "abandoned";
  snapshot: GuidedV2AttemptSnapshot; resume: GuidedV2AttemptResume;
  responses: readonly GuidedV2ManifestResponse[];
  sources?: RoutePackage["sources"];
}): V2AttemptManifest {
  const activeKey = activeGuidedV2ActivityKey(input.snapshot, input.resume);
  const activity = activeKey ? input.snapshot.activities.find((item) => item.key === activeKey) : undefined;
  const reserved = (key: string) => input.snapshot.activities.some((item) => item.key === key
    && ["final", "retention7", "retention30"].includes(item.use));
  const deferred = input.purpose === "assessment" && input.snapshot.orderedKeys.some(reserved) && input.status !== "completed";
  let activeActivity = activity && (input.purpose === "assessment" || !reserved(activity.key)) ? toV2PublicActivity(activity) : null;
  if (activeActivity?.kind === "image_target") {
    const variant = accessibleVariant(input.snapshot, activeActivity.key);
    activeActivity.payload.accessibleAlternativeKey = variant && !input.responses.some(item => item.activityKey === variant.key) ? variant.key : null;
  }
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
    accessiblePractice: input.status === "in_progress" && input.resume.accessiblePractice
      ? { sourceActivityKey: input.resume.accessiblePractice.sourceActivityKey } : null,
    constructedResponse: input.status === "in_progress" && activeActivity?.kind === "constructed_response"
      && activity?.kind === "constructed_response" && input.resume.submittedTextByActivity[activity.key]?.trim()
      ? input.resume.revealedKeys.includes(activity.key) && input.purpose !== "assessment"
        ? { activityKey: activity.key, stage: "revealed", text: input.resume.submittedTextByActivity[activity.key],
          modelAnswer: activity.payload.modelAnswer, rubric: activity.payload.rubric.map(item => ({ ...item })) }
        : { activityKey: activity.key, stage: "submitted", text: input.resume.submittedTextByActivity[activity.key] }
      : null,
    acceptedResponses: input.responses.filter((item) => input.purpose === "assessment" || !reserved(item.activityKey)).map((item) => ({
      activityKey: item.activityKey, answer: item.answer, serverAcceptedAt: item.acceptedAt.toISOString(),
      score01: deferred ? null : item.score01,
      feedback: { explanation: deferred ? "" : item.explanation, commonError: deferred ? "" : item.commonError,
        ...(!deferred && input.purpose !== "assessment" && item.partialScore01 !== undefined ? { partialScore01: item.partialScore01 } : {}),
        sources: deferred ? [] : guidedV2FeedbackSources(input.snapshot.activities, input.sources ?? [], item.activityKey) },
    })),
  });
}

/** A learner receives only the active item; private plans and future segments stay server-side. */
export function assessmentSegmentManifestV2(input: {
  plan: AssessmentPlanV2; segmentKey: string; activeIndex: number;
  mode: "assessment" | "practice" | "student_preview";
  submittedSegmentKeys: readonly string[]; responses: readonly GuidedV2ManifestResponse[];
}) {
  const segment = input.plan.segments.find((item) => item.key === input.segmentKey);
  if (!segment || !Number.isInteger(input.activeIndex) || input.activeIndex < 0 || input.activeIndex > segment.items.length) {
    throw new TypeError("Segmento o posición de evaluación inválidos");
  }
  const authorized = input.mode === "assessment" || input.plan.kind === "checkpoint";
  const submitted = input.submittedSegmentKeys.includes(segment.key);
  const own = input.responses.filter((response) => segment.items.some((item) => item.activity.key === response.activityKey));
  const coverage = assessmentCoverageV2(input.plan, input.submittedSegmentKeys, input.responses.map((response) => ({
    activityKey: response.activityKey, score01: response.score01, gradingSource: "server", assisted: false,
  })));
  return {
    assessmentKey: input.plan.assessmentKey, kind: input.plan.kind, segmentKey: segment.key,
    segmentIndex: segment.index, totalSegments: input.plan.segments.length,
    totalObjectives: input.plan.requiredObjectiveKeys.length, covered: coverage.covered,
    activeActivity: authorized && !submitted && input.activeIndex < segment.items.length
      ? toV2PublicActivity(segment.items[input.activeIndex]!.activity) : null,
    acceptedResponses: authorized ? own.map((response) => ({
      activityKey: response.activityKey, answer: response.answer, serverAcceptedAt: response.acceptedAt.toISOString(),
      score01: submitted ? response.score01 : null,
      feedback: { explanation: submitted ? response.explanation : "", commonError: submitted ? response.commonError : "" },
    })) : [],
  };
}
