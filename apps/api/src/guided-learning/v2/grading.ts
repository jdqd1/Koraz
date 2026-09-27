import { RouteActivitySchema, V2AnswerSchema, type RouteActivity } from "@cediah/contracts";
import type { z } from "zod";

type Answer = z.infer<typeof V2AnswerSchema>;
type ChoiceActivity = Extract<RouteActivity, { kind: "single_choice" }>;
type ShortActivity = Extract<RouteActivity, { kind: "short_answer" }>;
type ConstructedActivity = Extract<RouteActivity, { kind: "constructed_response" }>;
type ChoiceAnswer = Extract<Answer, { kind: "single_choice" }>;
type ShortAnswer = Extract<Answer, { kind: "short_answer" }>;
type ConstructedAnswer = Extract<Answer, { kind: "constructed_response" }>;

export type BasicGradingContext = {
  confidence?: "sure" | "unsure" | "guessed" | null;
  revealed?: boolean;
  submittedText?: string | null;
};

export type BasicGradingFeedback = {
  explanation: string;
  commonError: string;
  sourceKeys: string[];
};

export type BasicGradingResult =
  | { status: "graded"; score01: 0 | 1; gradingSource: "server"; feedback: BasicGradingFeedback; responseKey: string | null }
  | { status: "awaiting_reveal"; score01: null; gradingSource: "self"; feedback: null; submittedText: string; verificationActivityKey: string | null }
  | { status: "awaiting_self_rating" | "self_reported"; score01: null; gradingSource: "self";
      feedback: BasicGradingFeedback; submittedText: string; verificationActivityKey: string | null;
      reveal: { modelAnswer: string; rubric: ConstructedActivity["payload"]["rubric"] }; selfRating: ConstructedAnswer["selfRating"] }
  | { status: "invalid"; code: "INVALID_ACTIVITY" | "INVALID_ANSWER" | "INVALID_OPTION_KEY" | "REVEAL_REQUIRED" | "SUBMISSION_REQUIRED" | "UNSUPPORTED_KIND" };

/** NFKC, Spanish lowercase, trim and whitespace collapse only. Accents, negation and units remain meaningful. */
export function normalizeShortAnswer(text: string): string {
  return text.normalize("NFKC").trim().toLocaleLowerCase("es").replace(/\s+/gu, " ");
}

function feedback(activity: ChoiceActivity | ShortActivity | ConstructedActivity, commonError: string): BasicGradingFeedback {
  return {
    explanation: activity.feedback.explanation,
    commonError,
    sourceKeys: [...activity.feedback.sourceKeys],
  };
}

export function gradeSingleChoice(activity: ChoiceActivity, answer: ChoiceAnswer): BasicGradingResult {
  const keys = activity.payload.options.map((option) => option.key);
  const incorrect = keys.filter((key) => key !== activity.payload.correctKey);
  const distractors = Object.keys(activity.payload.distractorFeedback);
  if (new Set(keys).size !== keys.length || !keys.includes(activity.payload.correctKey)
    || distractors.length !== incorrect.length
    || incorrect.some((key) => !activity.payload.distractorFeedback[key])) return { status: "invalid", code: "INVALID_ACTIVITY" };
  if (!keys.includes(answer.optionKey)) return { status: "invalid", code: "INVALID_OPTION_KEY" };
  const correct = answer.optionKey === activity.payload.correctKey;
  return {
    status: "graded", score01: correct ? 1 : 0, gradingSource: "server", responseKey: answer.optionKey,
    feedback: feedback(activity, correct ? "" : activity.payload.distractorFeedback[answer.optionKey]!),
  };
}

export function gradeShortAnswer(activity: ShortActivity, answer: ShortAnswer): BasicGradingResult {
  if (activity.payload.normalization !== "nfkc-lower-space"
    || activity.payload.acceptedAnswers.some((alias) => alias.length > activity.payload.maxChars || !normalizeShortAnswer(alias))) {
    return { status: "invalid", code: "INVALID_ACTIVITY" };
  }
  if (answer.text.length > activity.payload.maxChars || !normalizeShortAnswer(answer.text)) {
    return { status: "invalid", code: "INVALID_ANSWER" };
  }
  const normalized = normalizeShortAnswer(answer.text);
  const correct = activity.payload.acceptedAnswers.some((alias) => normalizeShortAnswer(alias) === normalized);
  return {
    status: "graded", score01: correct ? 1 : 0, gradingSource: "server", responseKey: null,
    feedback: feedback(activity, correct ? "" : activity.feedback.commonError),
  };
}

export function gradeConstructedResponse(
  activity: ConstructedActivity, answer: ConstructedAnswer, context: BasicGradingContext = {},
): BasicGradingResult {
  if (!answer.text.trim()) return { status: "invalid", code: "INVALID_ANSWER" };
  const common = {
    score01: null as null, gradingSource: "self" as const,
    submittedText: answer.text, verificationActivityKey: activity.payload.verificationActivityKey,
  };
  if (!context.revealed) {
    if (answer.selfRating !== null) return { status: "invalid", code: "REVEAL_REQUIRED" };
    return { ...common, status: "awaiting_reveal", feedback: null };
  }
  const revealed = {
    ...common,
    feedback: feedback(activity, activity.feedback.commonError),
    reveal: { modelAnswer: activity.payload.modelAnswer, rubric: activity.payload.rubric.map((item) => ({ ...item })) },
  };
  if (answer.selfRating === null) return { ...revealed, status: "awaiting_self_rating", selfRating: null };
  if (context.submittedText !== answer.text) return { status: "invalid", code: "SUBMISSION_REQUIRED" };
  return { ...revealed, status: "self_reported", selfRating: answer.selfRating };
}

/** Pure grading of the T013 activity families; confidence is deliberately excluded from scoring. */
export function gradeBasicActivity(activityInput: unknown, answerInput: unknown, context: BasicGradingContext = {}): BasicGradingResult {
  const activity = RouteActivitySchema.safeParse(activityInput);
  if (!activity.success) return { status: "invalid", code: "INVALID_ACTIVITY" };
  const answer = V2AnswerSchema.safeParse(answerInput);
  if (!answer.success || activity.data.kind !== answer.data.kind) return { status: "invalid", code: "INVALID_ANSWER" };
  switch (activity.data.kind) {
    case "single_choice": return gradeSingleChoice(activity.data, answer.data as ChoiceAnswer);
    case "short_answer": return gradeShortAnswer(activity.data, answer.data as ShortAnswer);
    case "constructed_response": return gradeConstructedResponse(activity.data, answer.data as ConstructedAnswer, context);
    default: return { status: "invalid", code: "UNSUPPORTED_KIND" };
  }
}
