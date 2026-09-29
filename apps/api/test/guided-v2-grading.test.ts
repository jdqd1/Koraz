import { describe, expect, it } from "vitest";
import { RouteActivitySchema, type RouteActivity } from "@cediah/contracts";
import {
  gradeBasicActivity, gradeConstructedResponse, gradeImageTarget, gradeMatch, gradeSequence,
  gradeShortAnswer, gradeSingleChoice, isValidNormalizedPolygon, normalizeShortAnswer, pointInPolygonInclusive,
} from "../src/guided-learning/v2/grading.js";

type Choice = Extract<RouteActivity, { kind: "single_choice" }>;
type Short = Extract<RouteActivity, { kind: "short_answer" }>;
type Constructed = Extract<RouteActivity, { kind: "constructed_response" }>;
type Match = Extract<RouteActivity, { kind: "match" }>;
type Sequence = Extract<RouteActivity, { kind: "sequence" }>;
type Image = Extract<RouteActivity, { kind: "image_target" }>;

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

function match(): Match {
  return RouteActivitySchema.parse({ ...base, kind: "match", representation: "table", payload: {
    presentation: "comparison_table",
    prompts: ["a", "b", "c", "d"].map((key) => ({ key, text: `Enunciado ${key}` })),
    choices: ["one", "two", "three", "four"].map((key) => ({ key, text: `Opción ${key}` })),
    correctByPrompt: { a: "one", b: "two", c: "three", d: "four" }, allowReuse: false, edges: [],
  } }) as Match;
}

function sequence(): Sequence {
  return RouteActivitySchema.parse({ ...base, kind: "sequence", payload: {
    items: ["a", "b", "c", "d"].map((key) => ({ key, text: `Paso ${key}` })),
    acceptedOrders: [["a", "b", "c", "d"], ["b", "a", "c", "d"]], whyActivityKey: null,
  } }) as Sequence;
}

const square = [
  { x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 },
];
function image(mode: "hotspot" | "labeling", masking: "no_labels" | "partial_labels" = "no_labels"): Image {
  const targets = mode === "hotspot" ? [{ key: "heart", prompt: "Señala el órgano", polygon: square, label: "Corazón" }]
    : [
      { key: "heart", prompt: "Etiqueta el corazón", polygon: square, label: "Corazón" },
      { key: "lung", prompt: "Etiqueta el pulmón", polygon: [
        { x: 0.05, y: 0.05 }, { x: 0.15, y: 0.05 }, { x: 0.15, y: 0.15 }, { x: 0.05, y: 0.15 },
      ], label: "Pulmón" },
    ];
  return RouteActivitySchema.parse({ ...base, kind: "image_target", representation: "image", payload: {
    assetKey: "diagram", mode, targets,
    labels: mode === "hotspot" ? [] : [{ key: "heart-label", text: "Corazón" }, { key: "lung-label", text: "Pulmón" }],
    correctLabelByTarget: mode === "hotspot" ? {} : { heart: "heart-label", lung: "lung-label" },
    accessibleAlternativeKey: "text-alternative", masking,
  } }) as Image;
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

  it("P07 keeps 3/4 match credit binary and reports 0.75 only in feedback", () => {
    const activity = match();
    const partial = gradeMatch(activity, { kind: "match", pairs: { a: "one", b: "two", c: "four", d: "three" } });
    expect(partial).toMatchObject({ status: "graded", score01: 0, gradingSource: "server",
      feedback: { partialScore01: 0.5, sourceKeys: ["guide", "chapter"] } });
    const threeOfFour = gradeMatch(activity, { kind: "match", pairs: { a: "one", b: "two", c: "three", d: "one" } });
    expect(threeOfFour).toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    activity.payload.allowReuse = true;
    expect(gradeMatch(activity, { kind: "match", pairs: { a: "one", b: "two", c: "three", d: "one" } }))
      .toMatchObject({ status: "graded", score01: 0, feedback: { partialScore01: 0.75 } });
    expect(gradeMatch(activity, { kind: "match", pairs: { a: "one", b: "two", c: "three", d: "four" } }))
      .toMatchObject({ status: "graded", score01: 1, feedback: { partialScore01: 1 } });
    expect(gradeMatch(activity, { kind: "match", pairs: { a: "one", b: "two", c: "three", d: "four", extra: "one" } }))
      .toEqual({ status: "invalid", code: "INVALID_ANSWER" });
  });

  it("P07 rejects duplicate or foreign sequence keys and accepts alternative exact orders", () => {
    const activity = sequence();
    expect(gradeSequence(activity, { kind: "sequence", orderedKeys: ["a", "a", "c", "d"] }))
      .toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    expect(gradeSequence(activity, { kind: "sequence", orderedKeys: ["a", "b", "c", "foreign"] }))
      .toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    expect(gradeSequence(activity, { kind: "sequence", orderedKeys: ["b", "a", "c", "d"] }))
      .toMatchObject({ status: "graded", score01: 1, feedback: { partialScore01: 1 } });
    expect(gradeSequence(activity, { kind: "sequence", orderedKeys: ["a", "b", "d", "c"] }))
      .toMatchObject({ status: "graded", score01: 0, feedback: { partialScore01: 0.5 } });
    activity.payload.acceptedOrders = [["a", "b", "b", "d"]];
    expect(gradeSequence(activity, { kind: "sequence", orderedKeys: ["a", "b", "c", "d"] }))
      .toEqual({ status: "invalid", code: "INVALID_ACTIVITY" });
  });

  it("P07 uses normalized coordinates, includes the polygon border and rejects self-intersections", () => {
    const activity = image("hotspot");
    expect(isValidNormalizedPolygon(square)).toBe(true);
    expect(pointInPolygonInclusive({ x: 0.2, y: 0.5 }, square)).toBe(true);
    expect(gradeImageTarget(activity, { kind: "image_target", mode: "hotspot", targetKey: "heart", point: { x: 0.2, y: 0.5 } }))
      .toMatchObject({ status: "graded", score01: 1, feedback: { partialScore01: 1 } });
    expect(gradeImageTarget(activity, { kind: "image_target", mode: "hotspot", targetKey: "heart", point: { x: 0.1, y: 0.5 } }))
      .toMatchObject({ status: "graded", score01: 0, feedback: { partialScore01: 0 } });
    expect(gradeImageTarget(activity, { kind: "image_target", mode: "hotspot", targetKey: "unknown", point: { x: 0.5, y: 0.5 } }))
      .toEqual({ status: "invalid", code: "INVALID_TARGET_KEY" });
    expect(gradeBasicActivity(activity, { kind: "image_target", mode: "hotspot", targetKey: "heart", point: { x: 50, y: 50 } }))
      .toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    const bowTie = [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 }, { x: 0.8, y: 0.2 }];
    expect(isValidNormalizedPolygon(bowTie)).toBe(false);
    const pentagon = Array.from({ length: 5 }, (_, index) => ({
      x: 0.5 + 0.4 * Math.cos(-Math.PI / 2 + 2 * Math.PI * index / 5),
      y: 0.5 + 0.4 * Math.sin(-Math.PI / 2 + 2 * Math.PI * index / 5),
    }));
    expect(isValidNormalizedPolygon([0, 2, 4, 1, 3].map((index) => pentagon[index]!))).toBe(false);
    activity.payload.targets[0]!.polygon = bowTie;
    expect(gradeImageTarget(activity, { kind: "image_target", mode: "hotspot", targetKey: "heart", point: { x: 0.5, y: 0.5 } }))
      .toEqual({ status: "invalid", code: "INVALID_ACTIVITY" });
  });

  it("labels every target exactly and withholds objective credit while labels are shown", () => {
    const activity = image("labeling");
    const partial = { kind: "image_target" as const, mode: "labeling" as const,
      labelsByTarget: { heart: "heart-label", lung: "heart-label" } };
    expect(gradeImageTarget(activity, partial)).toMatchObject({ status: "graded", score01: 0,
      feedback: { partialScore01: 0.5 } });
    expect(gradeImageTarget(activity, { ...partial, labelsByTarget: { ...partial.labelsByTarget, extra: "lung-label" } }))
      .toEqual({ status: "invalid", code: "INVALID_ANSWER" });
    activity.payload.masking = "partial_labels";
    expect(gradeImageTarget(activity, partial)).toMatchObject({ status: "practice", score01: null,
      gradingSource: "none", feedback: { partialScore01: 0.5 } });
  });

  it("acknowledges study without scoring it", () => {
    const study = RouteActivitySchema.parse({ ...base, kind: "study", payload: {
      body: "Explicación", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null,
    } });
    expect(gradeBasicActivity(study, { kind: "study", acknowledged: true }))
      .toMatchObject({ status: "acknowledged", score01: null, gradingSource: "none" });
  });
});
