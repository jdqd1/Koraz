import { RouteActivitySchema, V2AnswerSchema, type RouteActivity } from "@cediah/contracts";
import type { z } from "zod";

type Answer = z.infer<typeof V2AnswerSchema>;
type ChoiceActivity = Extract<RouteActivity, { kind: "single_choice" }>;
type ShortActivity = Extract<RouteActivity, { kind: "short_answer" }>;
type ConstructedActivity = Extract<RouteActivity, { kind: "constructed_response" }>;
type StudyActivity = Extract<RouteActivity, { kind: "study" }>;
type MatchActivity = Extract<RouteActivity, { kind: "match" }>;
type SequenceActivity = Extract<RouteActivity, { kind: "sequence" }>;
type ImageActivity = Extract<RouteActivity, { kind: "image_target" }>;
type CaseActivity = Extract<RouteActivity, { kind: "case" }>;
type ChoiceAnswer = Extract<Answer, { kind: "single_choice" }>;
type ShortAnswer = Extract<Answer, { kind: "short_answer" }>;
type ConstructedAnswer = Extract<Answer, { kind: "constructed_response" }>;
type StudyAnswer = Extract<Answer, { kind: "study" }>;
type MatchAnswer = Extract<Answer, { kind: "match" }>;
type SequenceAnswer = Extract<Answer, { kind: "sequence" }>;
type ImageAnswer = Extract<Answer, { kind: "image_target" }>;

export type BasicGradingContext = {
  confidence?: "sure" | "unsure" | "guessed" | null;
  revealed?: boolean;
  submittedText?: string | null;
};

export type BasicGradingFeedback = {
  explanation: string;
  commonError: string;
  sourceKeys: string[];
  partialScore01?: number;
};

export type BasicGradingResult =
  | { status: "graded"; score01: 0 | 1; gradingSource: "server"; feedback: BasicGradingFeedback; responseKey: string | null }
  | { status: "acknowledged" | "practice"; score01: null; gradingSource: "none"; feedback: BasicGradingFeedback }
  | { status: "awaiting_reveal"; score01: null; gradingSource: "self"; feedback: null; submittedText: string; verificationActivityKey: string | null }
  | { status: "awaiting_self_rating" | "self_reported"; score01: null; gradingSource: "self";
      feedback: BasicGradingFeedback; submittedText: string; verificationActivityKey: string | null;
      reveal: { modelAnswer: string; rubric: ConstructedActivity["payload"]["rubric"] }; selfRating: ConstructedAnswer["selfRating"] }
  | { status: "invalid"; code: "INVALID_ACTIVITY" | "INVALID_ANSWER" | "INVALID_OPTION_KEY" | "INVALID_TARGET_KEY" | "REVEAL_REQUIRED" | "SUBMISSION_REQUIRED" | "UNSUPPORTED_KIND" };

/** NFKC, Spanish lowercase, trim and whitespace collapse only. Accents, negation and units remain meaningful. */
export function normalizeShortAnswer(text: string): string {
  return text.normalize("NFKC").trim().toLocaleLowerCase("es").replace(/\s+/gu, " ");
}

function feedback(activity: RouteActivity, commonError: string, partialScore01?: number): BasicGradingFeedback {
  return {
    explanation: activity.feedback.explanation,
    commonError,
    sourceKeys: [...activity.feedback.sourceKeys],
    ...(partialScore01 === undefined ? {} : { partialScore01 }),
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

export function gradeStudy(activity: StudyActivity, answer: StudyAnswer): BasicGradingResult {
  if (answer.acknowledged !== true) return { status: "invalid", code: "INVALID_ANSWER" };
  return { status: "acknowledged", score01: null, gradingSource: "none", feedback: feedback(activity, "") };
}

function sameKeys(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && new Set(actual).size === actual.length
    && actual.every((key) => expected.includes(key));
}

export function gradeMatch(activity: MatchActivity, answer: MatchAnswer): BasicGradingResult {
  const prompts = activity.payload.prompts.map((item) => item.key);
  const choices = activity.payload.choices.map((item) => item.key);
  const solution = activity.payload.correctByPrompt;
  const solutionValues = Object.values(solution);
  if (prompts.length === 0 || choices.length === 0 || !sameKeys(prompts, prompts) || !sameKeys(choices, choices)
    || !sameKeys(Object.keys(solution), prompts)
    || solutionValues.some((key) => !choices.includes(key))
    || (!activity.payload.allowReuse && new Set(solutionValues).size !== solutionValues.length)) {
    return { status: "invalid", code: "INVALID_ACTIVITY" };
  }
  if (!sameKeys(Object.keys(answer.pairs), prompts)
    || Object.values(answer.pairs).some((key) => !choices.includes(key))
    || (!activity.payload.allowReuse && new Set(Object.values(answer.pairs)).size !== prompts.length)) {
    return { status: "invalid", code: "INVALID_ANSWER" };
  }
  const correctCount = prompts.filter((key) => answer.pairs[key] === solution[key]).length;
  const partialScore01 = correctCount / prompts.length;
  return { status: "graded", score01: correctCount === prompts.length ? 1 : 0, gradingSource: "server", responseKey: null,
    feedback: feedback(activity, correctCount === prompts.length ? "" : activity.feedback.commonError, partialScore01) };
}

export function gradeSequence(activity: SequenceActivity, answer: SequenceAnswer): BasicGradingResult {
  const keys = activity.payload.items.map((item) => item.key);
  if (keys.length < 3 || activity.payload.acceptedOrders.length === 0
    || !sameKeys(keys, keys) || activity.payload.acceptedOrders.some((order) => !sameKeys(order, keys))) {
    return { status: "invalid", code: "INVALID_ACTIVITY" };
  }
  if (!sameKeys(answer.orderedKeys, keys)) return { status: "invalid", code: "INVALID_ANSWER" };
  const correctCount = Math.max(...activity.payload.acceptedOrders.map((order) =>
    order.filter((key, index) => key === answer.orderedKeys[index]).length));
  const partialScore01 = correctCount / keys.length;
  return { status: "graded", score01: correctCount === keys.length ? 1 : 0, gradingSource: "server", responseKey: null,
    feedback: feedback(activity, correctCount === keys.length ? "" : activity.feedback.commonError, partialScore01) };
}

type Point = ImageActivity["payload"]["targets"][number]["polygon"][number];
const GEOMETRY_EPSILON = 1e-6;
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const near = (a: Point, b: Point) => Math.abs(a.x - b.x) <= GEOMETRY_EPSILON && Math.abs(a.y - b.y) <= GEOMETRY_EPSILON;

function onSegment(a: Point, b: Point, point: Point): boolean {
  return Math.abs(cross(a, b, point)) <= GEOMETRY_EPSILON
    && point.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON
    && point.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON
    && point.y >= Math.min(a.y, b.y) - GEOMETRY_EPSILON
    && point.y <= Math.max(a.y, b.y) + GEOMETRY_EPSILON;
}

function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (Math.abs(abC) <= GEOMETRY_EPSILON && onSegment(a, b, c)) return true;
  if (Math.abs(abD) <= GEOMETRY_EPSILON && onSegment(a, b, d)) return true;
  if (Math.abs(cdA) <= GEOMETRY_EPSILON && onSegment(c, d, a)) return true;
  if (Math.abs(cdB) <= GEOMETRY_EPSILON && onSegment(c, d, b)) return true;
  return (abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0);
}

export function isValidNormalizedPolygon(points: readonly Point[]): boolean {
  if (points.length < 3 || points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) return false;
  if (new Set(points.map((point) => `${point.x},${point.y}`)).size !== points.length) return false;
  const area = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  if (Math.abs(area) <= 1e-12) return false;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    if (near(a, b)) return false;
    const c = points[(i + 2) % points.length]!;
    if (Math.abs(cross(a, b, c)) <= GEOMETRY_EPSILON
      && (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y) < 0) return false;
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      if (intersects(a, b, points[j]!, points[(j + 1) % points.length]!)) return false;
    }
  }
  return true;
}

export function pointInPolygonInclusive(point: Point, polygon: readonly Point[]): boolean {
  if (!isValidNormalizedPolygon(polygon) || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j]!;
    const b = polygon[i]!;
    if (onSegment(a, b, point)) return true;
    if ((a.y > point.y) !== (b.y > point.y)) {
      const crossingX = a.x + (point.y - a.y) * (b.x - a.x) / (b.y - a.y);
      if (point.x < crossingX) inside = !inside;
    }
  }
  return inside;
}

export function gradeImageTarget(activity: ImageActivity, answer: ImageAnswer): BasicGradingResult {
  const targetKeys = activity.payload.targets.map((target) => target.key);
  const labelKeys = activity.payload.labels.map((label) => label.key);
  if (targetKeys.length === 0 || (activity.payload.mode === "labeling" && labelKeys.length === 0)
    || !sameKeys(targetKeys, targetKeys) || !sameKeys(labelKeys, labelKeys)
    || activity.payload.targets.some((target) => !isValidNormalizedPolygon(target.polygon))) {
    return { status: "invalid", code: "INVALID_ACTIVITY" };
  }
  if (activity.payload.mode !== answer.mode) return { status: "invalid", code: "INVALID_ANSWER" };
  let correctCount: number;
  if (answer.mode === "hotspot") {
    if (Object.keys(activity.payload.correctLabelByTarget).length) return { status: "invalid", code: "INVALID_ACTIVITY" };
    if (!Number.isFinite(answer.point.x) || !Number.isFinite(answer.point.y)
      || answer.point.x < 0 || answer.point.x > 1 || answer.point.y < 0 || answer.point.y > 1) {
      return { status: "invalid", code: "INVALID_ANSWER" };
    }
    const target = activity.payload.targets.find((item) => item.key === answer.targetKey);
    if (!target) return { status: "invalid", code: "INVALID_TARGET_KEY" };
    correctCount = pointInPolygonInclusive(answer.point, target.polygon) ? 1 : 0;
  } else {
    const solution = activity.payload.correctLabelByTarget;
    if (!sameKeys(Object.keys(solution), targetKeys) || Object.values(solution).some((key) => !labelKeys.includes(key))) {
      return { status: "invalid", code: "INVALID_ACTIVITY" };
    }
    if (!sameKeys(Object.keys(answer.labelsByTarget), targetKeys)
      || Object.values(answer.labelsByTarget).some((key) => !labelKeys.includes(key))) {
      return { status: "invalid", code: "INVALID_ANSWER" };
    }
    correctCount = targetKeys.filter((key) => answer.labelsByTarget[key] === solution[key]).length;
  }
  const total = answer.mode === "hotspot" ? 1 : targetKeys.length;
  const partialScore01 = correctCount / total;
  const gradedFeedback = feedback(activity, correctCount === total ? "" : activity.feedback.commonError, partialScore01);
  if (activity.payload.masking !== "no_labels") return {
    status: "practice", score01: null, gradingSource: "none", feedback: gradedFeedback,
  };
  return { status: "graded", score01: correctCount === total ? 1 : 0, gradingSource: "server", responseKey: null,
    feedback: gradedFeedback };
}

export type CaseStageState = {
  caseKey: string;
  activeStageIndex: number;
  completedChildKeys: string[];
};

export type CaseStageValidation =
  | { status: "success"; child: RouteActivity | null }
  | { status: "invalid"; code: "INVALID_CASE" | "INVALID_CASE_STATE" };

export function initialCaseStageState(activity: CaseActivity): CaseStageState {
  return { caseKey: activity.key, activeStageIndex: 0, completedChildKeys: [] };
}

export function validateCaseStage(
  activity: CaseActivity, activities: readonly RouteActivity[], state: CaseStageState,
): CaseStageValidation {
  const stages = activity.payload.stages;
  const childKeys = stages.map((stage) => stage.childActivityKey);
  const activityKeys = activities.map((child) => child.key);
  if (new Set(childKeys).size !== childKeys.length || new Set(stages.map((stage) => stage.key)).size !== stages.length
    || new Set(activityKeys).size !== activityKeys.length || childKeys.some((key) => {
      const child = activities.find((item) => item.key === key);
      return !child || child.kind === "case";
    })) return { status: "invalid", code: "INVALID_CASE" };
  if (state.caseKey !== activity.key || !Number.isInteger(state.activeStageIndex)
    || state.activeStageIndex < 0 || state.activeStageIndex > stages.length
    || state.completedChildKeys.length !== state.activeStageIndex
    || state.completedChildKeys.some((key, index) => key !== childKeys[index])) {
    return { status: "invalid", code: "INVALID_CASE_STATE" };
  }
  const active = stages[state.activeStageIndex];
  return { status: "success", child: active ? activities.find((item) => item.key === active.childActivityKey)! : null };
}

export type CaseStageGradeResult =
  | { status: "stage_pending" | "stage_completed"; wrapperScore01: null; gradingSource: "none";
      childResult: BasicGradingResult; state: CaseStageState; nextStageKey: string | null }
  | { status: "invalid"; code: "INVALID_CASE" | "INVALID_CASE_STATE" | "INVALID_CHILD" | "CASE_COMPLETE" | "INVALID_ANSWER" };

/** The wrapper never scores: only its current child produces one grading result. */
export function gradeCaseStage(
  activity: CaseActivity, activities: readonly RouteActivity[], state: CaseStageState,
  childKey: string, answer: unknown, context: BasicGradingContext = {},
): CaseStageGradeResult {
  const valid = validateCaseStage(activity, activities, state);
  if (valid.status === "invalid") return valid;
  if (!valid.child) return { status: "invalid", code: "CASE_COMPLETE" };
  if (valid.child.key !== childKey) return { status: "invalid", code: "INVALID_CHILD" };
  const childResult = gradeBasicActivity(valid.child, answer, context);
  if (childResult.status === "invalid") return { status: "invalid",
    code: childResult.code === "INVALID_ACTIVITY" || childResult.code === "UNSUPPORTED_KIND" ? "INVALID_CASE" : "INVALID_ANSWER" };
  const completed = childResult.status === "graded" || childResult.status === "acknowledged"
    || childResult.status === "practice" || childResult.status === "self_reported";
  const nextState = completed ? {
    caseKey: state.caseKey, activeStageIndex: state.activeStageIndex + 1,
    completedChildKeys: [...state.completedChildKeys, childKey],
  } : { ...state, completedChildKeys: [...state.completedChildKeys] };
  return {
    status: completed ? "stage_completed" : "stage_pending", wrapperScore01: null, gradingSource: "none",
    childResult, state: nextState,
    nextStageKey: activity.payload.stages[nextState.activeStageIndex]?.key ?? null,
  };
}

/** Pure grading of the answer-bearing activity families; confidence is deliberately excluded from scoring. */
export function gradeBasicActivity(activityInput: unknown, answerInput: unknown, context: BasicGradingContext = {}): BasicGradingResult {
  const activity = RouteActivitySchema.safeParse(activityInput);
  if (!activity.success) return { status: "invalid", code: "INVALID_ACTIVITY" };
  const answer = V2AnswerSchema.safeParse(answerInput);
  if (!answer.success || activity.data.kind !== answer.data.kind) return { status: "invalid", code: "INVALID_ANSWER" };
  switch (activity.data.kind) {
    case "study": return gradeStudy(activity.data, answer.data as StudyAnswer);
    case "single_choice": return gradeSingleChoice(activity.data, answer.data as ChoiceAnswer);
    case "short_answer": return gradeShortAnswer(activity.data, answer.data as ShortAnswer);
    case "constructed_response": return gradeConstructedResponse(activity.data, answer.data as ConstructedAnswer, context);
    case "match": return gradeMatch(activity.data, answer.data as MatchAnswer);
    case "sequence": return gradeSequence(activity.data, answer.data as SequenceAnswer);
    case "image_target": return gradeImageTarget(activity.data, answer.data as ImageAnswer);
    default: return { status: "invalid", code: "UNSUPPORTED_KIND" };
  }
}
