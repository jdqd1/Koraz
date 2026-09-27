import { describe, expect, it } from "vitest";
import { RouteActivitySchema, type RouteActivity } from "@cediah/contracts";
import {
  gradeBasicActivity, gradeConstructedResponse, gradeShortAnswer, gradeSingleChoice, normalizeShortAnswer,
} from "../src/guided-learning/v2/grading.js";

type Choice = Extract<RouteActivity, { kind: "single_choice" }>;
type Short = Extract<RouteActivity, { kind: "short_answer" }>;
type Constructed = Extract<RouteActivity, { kind: "constructed_response" }>;

const base = {
  key: "activity", objectiveKey: "objective", relatedObjectiveKeys: [], phase: "retrieve", required: true,
  sourceKeys: ["guide"], representation: "text", equivalenceKey: "family", hints: [], use: "learning",
  prompt: "Pregunta sintética", feedback: {
    explanation: "La fuente explica la relación clínica sintética.",
    commonError: "Revisa la unidad y la dirección de la relación.", sourceKeys: ["guide", "chapter"],
  },
  misconceptionMappings: [], alternativeActivityKey: null,
};

function choice(): Choice {
  return RouteActivitySchema.parse({ ...base, kind: "single_choice", payload: {
    options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }, { key: "unknown", text: "No sé" }],
    correctKey: "yes", distractorFeedback: { no: "La negación invierte la respuesta.", unknown: "Revisa la guía." },
  } }) as Choice;
}

function short(): Short {
  return RouteActivitySchema.parse({ ...base, kind: "short_answer", payload: {
    acceptedAnswers: ["15 mg", "quince miligramos", "sí administrar"], maxChars: 80,
    modelAnswer: "15 mg", normalization: "nfkc-lower-space",
  } }) as Short;
}

function constructed(): Constructed {
  return RouteActivitySchema.parse({ ...base, kind: "constructed_response", phase: "elaborate", payload: {
    rubric: [{ key: "cause", criterion: "Explica la dirección causal", example: "A causa B" }],
    modelAnswer: "A causa B por un mecanismo sintético.", verificationActivityKey: "objective-check",
  } }) as Constructed;
}

describe("guided v2 basic grading", () => {
  it("P05 applies only NFKC, Spanish lowercase, trim and whitespace collapse", () => {
    expect(normalizeShortAnswer("  １５\u00a0 MG \t ")).toBe("15 mg");
    expect(normalizeShortAnswer("  SÍ  administrar  ")).toBe("sí administrar");
    expect(normalizeShortAnswer("NO administrar")).toBe("no administrar");
    expect(normalizeShortAnswer("sí")).not.toBe(normalizeShortAnswer("si"));
    expect(normalizeShortAnswer("15 mg")).not.toBe(normalizeShortAnswer("15 mcg"));
  });

  it("P05 accepts only complete explicit short-answer aliases", () => {
    const activity = short();
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: "  １５   MG  " })).toMatchObject({
      status: "graded", score01: 1, gradingSource: "server", feedback: { sourceKeys: ["guide", "chapter"] },
    });
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: "QUINCE   MILIGRAMOS" })).toMatchObject({ status: "graded", score01: 1 });
    for (const text of ["15mg", "15 mcg", "no 15 mg", "administrar", "si administrar", "15 mg extra"]) {
      expect(gradeShortAnswer(activity, { kind: "short_answer", text })).toMatchObject({
        status: "graded", score01: 0, feedback: { commonError: activity.feedback.commonError },
      });
    }
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: "NO administrar" })).toMatchObject({ status: "graded", score01: 0 });
    activity.payload.acceptedAnswers.push("NO administrar");
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: " no   ADMINISTRAR " })).toMatchObject({ status: "graded", score01: 1 });
  });

  it("rejects blank and overlong text instead of awarding a wrong score", () => {
    const activity = short();
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: "  " })).toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: "x".repeat(81) })).toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    activity.payload.acceptedAnswers = ["  "];
    expect(gradeShortAnswer(activity, { kind: "short_answer", text: "15 mg" })).toEqual({ status: "invalid", code: "INVALID_ACTIVITY" });
  });

  it("scores choice once, gives the selected distractor feedback and rejects foreign keys", () => {
    const activity = choice();
    expect(gradeSingleChoice(activity, { kind: "single_choice", optionKey: "yes" })).toMatchObject({
      status: "graded", score01: 1, gradingSource: "server", responseKey: "yes",
      feedback: { commonError: "", sourceKeys: ["guide", "chapter"] },
    });
    expect(gradeSingleChoice(activity, { kind: "single_choice", optionKey: "no" })).toMatchObject({
      status: "graded", score01: 0, responseKey: "no", feedback: { commonError: "La negación invierte la respuesta." },
    });
    expect(gradeSingleChoice(activity, { kind: "single_choice", optionKey: "foreign" })).toEqual({ status: "invalid", code: "INVALID_OPTION_KEY" });
    activity.payload.correctKey = "foreign";
    expect(gradeSingleChoice(activity, { kind: "single_choice", optionKey: "yes" })).toEqual({ status: "invalid", code: "INVALID_ACTIVITY" });
  });

  it("keeps confidence separate from server scoring and rejects extra answer fields", () => {
    const activity = choice();
    const original = structuredClone(activity);
    const answer = { kind: "single_choice", optionKey: "no" };
    const sure = gradeBasicActivity(activity, answer, { confidence: "sure" });
    const guessed = gradeBasicActivity(activity, answer, { confidence: "guessed" });
    expect(sure).toEqual(guessed);
    expect(gradeBasicActivity(activity, answer)).toEqual(sure);
    expect(activity).toEqual(original);
    expect(gradeBasicActivity(activity, { ...answer, score01: 1 })).toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    expect(gradeBasicActivity(activity, { kind: "short_answer", text: "yes" })).toEqual({ status: "invalid", code: "INVALID_ANSWER" });
  });

  it("P06 keeps constructed text private until reveal and never assigns objective correctness", () => {
    const activity = constructed();
    const reversed = { kind: "constructed_response" as const, text: "B causa A; por tanto A produce B.", selfRating: null };
    const submitted = gradeConstructedResponse(activity, reversed);
    expect(submitted).toMatchObject({ status: "awaiting_reveal", score01: null, gradingSource: "self",
      submittedText: reversed.text, feedback: null, verificationActivityKey: "objective-check" });
    expect(submitted).not.toHaveProperty("reveal");
    const revealed = gradeConstructedResponse(activity, reversed, { revealed: true });
    expect(revealed).toMatchObject({ status: "awaiting_self_rating", score01: null, gradingSource: "self",
      reveal: { modelAnswer: activity.payload.modelAnswer, rubric: activity.payload.rubric },
      feedback: { sourceKeys: ["guide", "chapter"] } });
    const rated = gradeConstructedResponse(activity, { ...reversed, selfRating: "good" },
      { revealed: true, submittedText: reversed.text, confidence: "sure" });
    expect(rated).toMatchObject({ status: "self_reported", score01: null, gradingSource: "self", selfRating: "good" });
    expect(gradeConstructedResponse(activity, { ...reversed, selfRating: "again" },
      { revealed: true, submittedText: reversed.text, confidence: "guessed" })).toMatchObject({ score01: null, gradingSource: "self" });
  });

  it("requires reveal and the original submitted text before self-rating", () => {
    const activity = constructed();
    const answer = { kind: "constructed_response" as const, text: "A causa B", selfRating: "hard" as const };
    expect(gradeConstructedResponse(activity, answer)).toEqual({ status: "invalid", code: "REVEAL_REQUIRED" });
    expect(gradeConstructedResponse(activity, answer, { revealed: true })).toEqual({ status: "invalid", code: "SUBMISSION_REQUIRED" });
    expect(gradeConstructedResponse(activity, answer, { revealed: true, submittedText: "Texto anterior" })).toEqual({ status: "invalid", code: "SUBMISSION_REQUIRED" });
    expect(gradeBasicActivity(activity, { ...answer, selfRating: null, injectedScore: 1 })).toEqual({ status: "invalid", code: "INVALID_ANSWER" });
  });
});
