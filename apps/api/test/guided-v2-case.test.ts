import { describe, expect, it } from "vitest";
import { RouteActivitySchema, type RouteActivity } from "@cediah/contracts";
import { gradeBasicActivity, gradeCaseStage, initialCaseStageState, validateCaseStage } from "../src/guided-learning/v2/grading.js";
import { caseStageManifest } from "../src/guided-learning/v2/manifests.js";

type Case = Extract<RouteActivity, { kind: "case" }>;

const base = {
  objectiveKey: "objective", relatedObjectiveKeys: [], phase: "apply", required: true,
  sourceKeys: ["guide"], representation: "case", equivalenceKey: "family", hints: [], use: "learning",
  prompt: "Caso sintético", feedback: { explanation: "Explicación sintética", commonError: "Revisa la guía", sourceKeys: ["guide"] },
  misconceptionMappings: [], alternativeActivityKey: null,
};

function children(): RouteActivity[] {
  return [
    RouteActivitySchema.parse({ ...base, key: "choice-child", equivalenceKey: "choice-family", kind: "single_choice", payload: {
      options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes",
      distractorFeedback: { no: "La relación es positiva." },
    } }),
    RouteActivitySchema.parse({ ...base, key: "short-child", equivalenceKey: "short-family", kind: "short_answer", payload: {
      acceptedAnswers: ["15 mg"], maxChars: 80, modelAnswer: "15 mg", normalization: "nfkc-lower-space",
    } }),
  ];
}

function wrapper(): Case {
  return RouteActivitySchema.parse({ ...base, key: "case-wrapper", kind: "case", payload: {
    stages: [
      { key: "stage-one", narrative: "Primera etapa privada hasta abrirla", childActivityKey: "choice-child" },
      { key: "stage-two", narrative: "Segunda etapa aún oculta", childActivityKey: "short-child" },
    ],
  } }) as Case;
}

describe("guided v2 case stage grading", () => {
  it("shows only the active stage, scores each child once and never scores the wrapper", () => {
    const activity = wrapper();
    const bank = children();
    const initial = initialCaseStageState(activity);
    const firstManifest = caseStageManifest(activity, bank, initial);
    expect(firstManifest).toMatchObject({ status: "success", wrapper: {
      kind: "case", payload: { activeStage: { key: "stage-one", childActivityKey: "choice-child" } },
    }, child: { kind: "single_choice", key: "choice-child" } });
    expect(JSON.stringify(firstManifest)).not.toContain("Segunda etapa aún oculta");
    expect(JSON.stringify(firstManifest)).not.toContain("correctKey");
    const first = gradeCaseStage(activity, bank, initial, "choice-child", { kind: "single_choice", optionKey: "yes" });
    expect(first).toMatchObject({ status: "stage_completed", wrapperScore01: null, gradingSource: "none",
      childResult: { status: "graded", score01: 1 }, state: { activeStageIndex: 1, completedChildKeys: ["choice-child"] },
      nextStageKey: "stage-two" });
    if (first.status !== "stage_completed") return;
    expect(caseStageManifest(activity, bank, first.state)).toMatchObject({ status: "success", wrapper: {
      payload: { activeStage: { key: "stage-two" } },
    }, child: { kind: "short_answer", key: "short-child" } });
    expect(gradeCaseStage(activity, bank, first.state, "choice-child", { kind: "single_choice", optionKey: "yes" }))
      .toEqual({ status: "invalid", code: "INVALID_CHILD" });
    const second = gradeCaseStage(activity, bank, first.state, "short-child", { kind: "short_answer", text: "15 MG" });
    expect(second).toMatchObject({ status: "stage_completed", wrapperScore01: null,
      childResult: { status: "graded", score01: 1 }, state: { activeStageIndex: 2,
        completedChildKeys: ["choice-child", "short-child"] }, nextStageKey: null });
    if (second.status !== "stage_completed") return;
    expect(caseStageManifest(activity, bank, second.state)).toEqual({ status: "complete" });
    expect(gradeCaseStage(activity, bank, second.state, "short-child", { kind: "short_answer", text: "15 mg" }))
      .toEqual({ status: "invalid", code: "CASE_COMPLETE" });
    expect(gradeBasicActivity(activity, { kind: "single_choice", optionKey: "yes" }))
      .toEqual({ status: "invalid", code: "INVALID_ANSWER" });
  });

  it("does not advance a constructed child until reveal and self-rating finish", () => {
    const activity = wrapper();
    activity.payload.stages[0]!.childActivityKey = "constructed-child";
    const bank: RouteActivity[] = [
      RouteActivitySchema.parse({ ...base, key: "constructed-child", kind: "constructed_response", payload: {
        rubric: [{ key: "reason", criterion: "Explica la causa", example: "A causa B" }],
        modelAnswer: "A causa B", verificationActivityKey: "short-child",
      } }),
      ...children(),
    ];
    const initial = initialCaseStageState(activity);
    const answer = { kind: "constructed_response", text: "B causa A", selfRating: null };
    const pending = gradeCaseStage(activity, bank, initial, "constructed-child", answer);
    expect(pending).toMatchObject({ status: "stage_pending", wrapperScore01: null,
      childResult: { status: "awaiting_reveal", score01: null }, state: { activeStageIndex: 0 } });
    const revealed = gradeCaseStage(activity, bank, initial, "constructed-child", answer, { revealed: true });
    expect(revealed).toMatchObject({ status: "stage_pending", state: { activeStageIndex: 0 },
      childResult: { status: "awaiting_self_rating", score01: null } });
    const rated = gradeCaseStage(activity, bank, initial, "constructed-child", { ...answer, selfRating: "good" },
      { revealed: true, submittedText: answer.text });
    expect(rated).toMatchObject({ status: "stage_completed", wrapperScore01: null,
      childResult: { status: "self_reported", score01: null, gradingSource: "self" }, state: { activeStageIndex: 1 } });
  });

  it("rejects skipped, repeated, missing and nested case children", () => {
    const activity = wrapper();
    const bank = children();
    expect(validateCaseStage(activity, bank, { caseKey: activity.key, activeStageIndex: 1, completedChildKeys: [] }))
      .toEqual({ status: "invalid", code: "INVALID_CASE_STATE" });
    expect(validateCaseStage(activity, bank, { caseKey: activity.key, activeStageIndex: 1, completedChildKeys: ["short-child"] }))
      .toEqual({ status: "invalid", code: "INVALID_CASE_STATE" });
    expect(gradeCaseStage(activity, bank, initialCaseStageState(activity), "short-child", { kind: "short_answer", text: "15 mg" }))
      .toEqual({ status: "invalid", code: "INVALID_CHILD" });
    activity.payload.stages[1]!.childActivityKey = "choice-child";
    expect(validateCaseStage(activity, bank, initialCaseStageState(activity)))
      .toEqual({ status: "invalid", code: "INVALID_CASE" });
    activity.payload.stages[1]!.childActivityKey = "missing";
    expect(validateCaseStage(activity, bank, initialCaseStageState(activity)))
      .toEqual({ status: "invalid", code: "INVALID_CASE" });
    activity.payload.stages[1]!.childActivityKey = activity.key;
    expect(validateCaseStage(activity, [...bank, activity], initialCaseStageState(activity)))
      .toEqual({ status: "invalid", code: "INVALID_CASE" });
  });
});
