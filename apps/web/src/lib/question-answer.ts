import { firstDuplicateOptionIndex, isEditorialPlaceholder, type ContentDraft } from "@cediah/contracts";

export type QuizQuestion = Extract<ContentDraft, { kind: "quiz" }>["content"]["questions"][number];
export type QuizFieldIssue = {
  questionIndex: number;
  field: "prompt" | "explanation" | number;
  message: string;
};

export function quizFieldIssue(question: QuizQuestion, questionIndex: number): QuizFieldIssue | undefined {
  if (!question.prompt.trim() || isEditorialPlaceholder(question.prompt)) {
    return { questionIndex, field: "prompt", message: "Escribe el enunciado de la pregunta." };
  }
  const empty = question.options.findIndex(option => !option.trim());
  if (empty >= 0) return { questionIndex, field: empty, message: "Completa la opción de respuesta." };
  const duplicate = firstDuplicateOptionIndex(question.options);
  if (duplicate >= 0) return { questionIndex, field: duplicate, message: "Las opciones deben tener textos distintos." };
  if (isEditorialPlaceholder(question.explanation)) {
    return { questionIndex, field: "explanation", message: "Revisa la explicación de prueba o déjala vacía." };
  }
}

type QuestionWithAnswerOptions = {
  correctOptionIndex: number;
  optionIds?: string[];
  options: string[];
};

export function questionAnswer(question: QuestionWithAnswerOptions) {
  return question.options[question.correctOptionIndex] ?? question.options.find(Boolean) ?? "";
}
