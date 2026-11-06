"use client";

import { CaretDown, CaretUp, CheckCircle, Plus, Question, Trash } from "@phosphor-icons/react";
import { ensureQuestionIdentity } from "@cediah/contracts";
import { useEffect, useRef, useState } from "react";
import { quizFieldIssue, type QuizFieldIssue, type QuizQuestion } from "@/lib/question-answer";

export function QuizPanel({
  disabled,
  onChange,
  questions,
  focusIssue,
  requireQuestion = false,
}: {
  focusIssue?: QuizFieldIssue;
  requireQuestion?: boolean;
  disabled: boolean;
  onChange: (questions: QuizQuestion[]) => void;
  questions: QuizQuestion[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(focusIssue?.questionIndex ?? 0);
  const focusRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  function captureFocusField(node: HTMLInputElement | HTMLTextAreaElement | null) { focusRef.current = node; }
  useEffect(() => { if (focusIssue && !disabled) focusRef.current?.focus(); }, [focusIssue, disabled]);
  const emptyQuestion = () => ensureQuestionIdentity(
    { correctOptionIndex: 0, explanation: "", options: ["", ""], prompt: "" },
    () => crypto.randomUUID(),
  ).value as QuizQuestion;

  function update(index: number, patch: Partial<QuizQuestion>) {
    onChange(questions.map((question, position) => position === index ? { ...question, ...patch } : question));
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const question = questions[questionIndex];
    if (!question) return;
    update(questionIndex, {
      options: question.options.map((option, index) => index === optionIndex ? value : option),
    });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const question = questions[questionIndex];
    if (!question || question.options.length <= 2) return;
    const options = question.options.filter((_, index) => index !== optionIndex);
    const optionIds = question.optionIds?.filter((_, index) => index !== optionIndex);
    const correctOptionIndex = question.correctOptionIndex === optionIndex
      ? 0
      : question.correctOptionIndex > optionIndex
        ? question.correctOptionIndex - 1
        : question.correctOptionIndex;
    update(questionIndex, { correctOptionIndex, optionIds, options });
  }

  return (
    <section className={`guide-companion-panel ${collapsed ? "is-collapsed" : ""}`}>
      <header>
        <button aria-expanded={!collapsed} type="button" onClick={() => setCollapsed((value) => !value)}>
          <span><Question size={19} /> Cuestionario <small className="guide-count guide-count-quiz">{questions.length}</small></span>
          {collapsed ? <CaretDown size={16} /> : <CaretUp size={16} />}
        </button>
      </header>
      {!collapsed && (
        <div className="guide-companion-body guide-quiz-builder">
          {questions.map((question, questionIndex) => {
            const issue = quizFieldIssue(question, questionIndex);
            const complete = !issue;
            const focusField = focusIssue?.questionIndex === questionIndex ? focusIssue.field : undefined;
            const open = openQuestion === questionIndex;
            return (
              <article className={`guide-question-answer-card${open ? " is-open" : ""}`} key={question.id ?? questionIndex}>
                <header>
                  <button aria-expanded={open} type="button" onClick={() => setOpenQuestion(open ? -1 : questionIndex)}>
                    {complete ? <CheckCircle size={16} weight="fill" /> : <span>{questionIndex + 1}</span>}
                    <span className="guide-question-answer-title">
                      <strong>{question.prompt || `Pregunta ${questionIndex + 1}`}</strong>
                    </span>
                    {open ? <CaretUp size={14} /> : <CaretDown size={14} />}
                  </button>
                  <button
                    aria-label={`Eliminar pregunta ${questionIndex + 1}`}
                    disabled={disabled || (requireQuestion && questions.length === 1)}
                    type="button"
                    onClick={() => onChange(questions.filter((_, index) => index !== questionIndex))}
                  >
                    <Trash size={14} />
                  </button>
                </header>
                {open && (
                  <div className="guide-quiz-fields guide-question-answer-fields">
                    <label className="guide-question-field">
                      <span>Enunciado</span>
                      <textarea
                        aria-label={`Enunciado de la pregunta ${questionIndex + 1}`}
                        aria-invalid={issue?.field === "prompt" || undefined}
                        disabled={disabled}
                        ref={focusField === "prompt" ? captureFocusField : undefined}
                        maxLength={2000}
                        placeholder="Escribe una pregunta breve y concreta…"
                        rows={2}
                        value={question.prompt}
                        onChange={(event) => update(questionIndex, { prompt: event.target.value })}
                      />
                    </label>
                    <fieldset className="guide-answer-options-field" disabled={disabled}>
                      <legend>Opciones de respuesta</legend>
                      <div className="guide-answer-options">
                        {question.options.map((option, optionIndex) => (
                          <div
                            className={`guide-quiz-option${question.correctOptionIndex === optionIndex ? " is-correct" : ""}`}
                            key={question.optionIds?.[optionIndex] ?? optionIndex}
                          >
                            <input
                              aria-label={`Marcar la opción ${optionIndex + 1} como correcta`}
                              checked={question.correctOptionIndex === optionIndex}
                              name={`guide-question-${questionIndex}-correct-option`}
                              type="radio"
                              onChange={() => update(questionIndex, { correctOptionIndex: optionIndex })}
                            />
                            <span aria-hidden="true" className="guide-option-letter">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <input
                              aria-label={`Opción ${optionIndex + 1} de la pregunta ${questionIndex + 1}`}
                              maxLength={500}
                              aria-invalid={issue?.field === optionIndex || undefined}
                              ref={focusField === optionIndex ? captureFocusField : undefined}
                              placeholder={`Opción ${String.fromCharCode(65 + optionIndex)}`}
                              type="text"
                              value={option}
                              onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                            />
                            <button
                              aria-label={`Eliminar opción ${optionIndex + 1}`}
                              disabled={disabled || question.options.length <= 2}
                              title={question.options.length <= 2 ? "Cada pregunta necesita al menos dos opciones" : "Eliminar opción"}
                              type="button"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        className="guide-quiz-inline-add"
                        disabled={disabled || question.options.length >= 8}
                        type="button"
                        onClick={() => update(questionIndex, {
                          optionIds: [
                            ...(question.optionIds ?? question.options.map(() => crypto.randomUUID())),
                            crypto.randomUUID(),
                          ],
                          options: [...question.options, ""],
                        })}
                      >
                        <Plus size={14} /> Añadir opción
                      </button>
                    </fieldset>
                    {issue && (issue.field === "explanation" || (typeof issue.field === "number" && question.options[issue.field]?.trim())) && <p role="status">{issue.message}</p>}
                    <label className="guide-answer-context-field">
                      <span>Explicación <small>(opcional)</small></span>
                      <textarea
                        aria-label={`Explicación de la pregunta ${questionIndex + 1}`}
                        aria-invalid={issue?.field === "explanation" || undefined}
                        disabled={disabled}
                        ref={focusField === "explanation" ? captureFocusField : undefined}
                        maxLength={4000}
                        placeholder="Aclara por qué la respuesta es correcta…"
                        rows={2}
                        value={question.explanation}
                        onChange={(event) => update(questionIndex, { explanation: event.target.value })}
                      />
                    </label>
                  </div>
                )}
              </article>
            );
          })}
          <button
            className="guide-panel-add"
            disabled={disabled || questions.length >= 100}
            type="button"
            onClick={() => {
              onChange([...questions, emptyQuestion()]);
              setOpenQuestion(questions.length);
            }}
          >
            <Plus size={15} /> Añadir pregunta
          </button>
        </div>
      )}
    </section>
  );
}
