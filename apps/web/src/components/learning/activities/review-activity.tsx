"use client";

import { useState } from "react";
import Link from "next/link";
import { hasDuplicateOptionText } from "@cediah/contracts";
import { ArrowRight, CheckCircle, XCircle } from "@phosphor-icons/react";
import type { LearningAttempt, LearningAttemptResponseRecord } from "@cediah/contracts";
import type { ActivityMutation } from "./types";
import { MaintenanceDate } from "../v2/maintenance";
import ui from "./activity-ui.module.css";

const grades = [
  ["again", "No la recordé"],
  ["hard", "Me costó"],
  ["good", "La recordé"],
  ["easy", "Fue fácil"],
] as const;

type ReviewAttempt = LearningAttempt & {
  manifest: Extract<LearningAttempt["manifest"], { projection: "review" }>;
};

export function ReviewActivity({ attempt, feedback, mutate, onFeedback }: {
  attempt: ReviewAttempt;
  feedback: LearningAttemptResponseRecord | null;
  mutate: ActivityMutation;
  onFeedback: (feedback: LearningAttemptResponseRecord | null) => void;
}) {
  const item = attempt.manifest.items[attempt.resume.currentIndex];
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const itemResponses = attempt.responses.filter((response) => response.itemId === item?.itemId);
  const previous = itemResponses.at(-1);
  const round = (previous?.grading.sessionRetry ? previous.round + 1 : 1);
  const expectedReviewVersion = previous?.grading.sessionRetry
    ? previous.reviewState?.rowVersion
    : item?.reviewStateVersion;
  const revealed = attempt.revealedCards.find((entry) => entry.itemId === item?.itemId);

  async function answerQuiz() {
    if (item?.kind !== "quiz" || !selected || !expectedReviewVersion) return;
    setBusy(true);
    const result = await mutate(`/api/guided-learning/attempts/${attempt.id}/responses`, "POST", {
      expectedReviewVersion,
      expectedVersion: attempt.rowVersion,
      itemId: item.itemId,
      kind: "quiz",
      optionId: selected,
      round,
    });
    if (result?.feedback) onFeedback(result.feedback);
    setBusy(false);
  }

  async function reveal() {
    if (item?.kind !== "flashcards") return;
    setBusy(true);
    await mutate(`/api/guided-learning/attempts/${attempt.id}/items/${item.itemId}/reveal`, "POST", {
      expectedVersion: attempt.rowVersion,
    });
    setBusy(false);
  }

  async function rate(recallGrade: typeof grades[number][0]) {
    if (item?.kind !== "flashcards" || !expectedReviewVersion) return;
    setBusy(true);
    const result = await mutate(`/api/guided-learning/attempts/${attempt.id}/responses`, "POST", {
      expectedReviewVersion,
      expectedVersion: attempt.rowVersion,
      itemId: item.itemId,
      kind: "flashcards",
      recallGrade,
      round,
    });
    if (result?.feedback) onFeedback(result.feedback);
    setBusy(false);
  }

  if (feedback) {
    const correct = feedback.grading.correct ?? (feedback.grading.recallGrade === "again" ? false : undefined);
    return (
      <section className={`learning-feedback ${correct === false ? "is-incorrect" : "is-correct"}`} role="status">
        {correct === false ? <XCircle aria-hidden="true" size={34} weight="fill" /> : <CheckCircle aria-hidden="true" size={34} weight="fill" />}
        <div>
          <h2>{correct === false ? "Respuesta guardada" : "Repaso guardado"}</h2>
          {feedback.grading.explanation ? <p>{feedback.grading.explanation}</p> : null}
          {feedback.reviewState ? <p>Próximo repaso: <MaintenanceDate value={feedback.reviewState.nextDueAt} />.</p> : null}
          <details className={ui.disclosure}><summary>Detalles del repaso</summary><p>{feedback.scheduleApplied
            ? "Este ítem ya está atendido en esta pasada. Volverá a estar disponible en la fecha indicada."
            : "Otro dispositivo o una práctica reciente ya había actualizado el calendario; esta respuesta no lo movió de nuevo."}</p></details>
        </div>
        <button className="learning-primary-button" onClick={() => { setSelected(""); onFeedback(null); }} type="button">
          {attempt.status === "completed" ? "Ver resumen" : "Siguiente"}<ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>
    );
  }

  if (!item) return <section role="alert" className="learning-question-card">
    <h2>No pudimos cargar el siguiente ítem</h2>
    <p>Tus respuestas guardadas se conservan.</p>
    <Link className="learning-primary-button" href="/aprendizaje/repaso">Volver al repaso</Link>
  </section>;

  if (item.kind === "quiz") {
    if (hasDuplicateOptionText(item.options.map(option => option.text))) return <section className="learning-question-card">
      <h2>Pregunta en revisión editorial</h2><p>Las opciones están repetidas. Puedes iniciar otra pasada con los ítems disponibles.</p>
      <Link className="learning-primary-button" href="/aprendizaje/repaso">Volver al repaso</Link>
    </section>;
    return (
      <section className="learning-question-card" key={`${item.itemId}:${round}`}>
        <div className="learning-activity-counter">Ítem {attempt.resume.currentIndex + 1} de {attempt.manifest.items.length}{round > 1 ? ` · reaparición ${round - 1} de 2` : ""}</div>
        <h2>{item.prompt}</h2>
        <fieldset disabled={busy}>
          <legend className="sr-only">Elige una respuesta</legend>
          {item.options.map((option) => (
            <label className={selected === option.id ? "is-selected" : ""} key={option.id}>
              <input checked={selected === option.id} name={`review-${item.itemId}-${round}`} onChange={() => setSelected(option.id)} type="radio" />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
        <button className="learning-primary-button" disabled={!selected || busy} onClick={() => void answerQuiz()} type="button">
          {busy ? "Guardando…" : "Comprobar"}
        </button>
      </section>
    );
  }

  return (
    <section className="learning-flashcard" key={`${item.itemId}:${round}`}>
      <div className="learning-activity-counter">Ítem {attempt.resume.currentIndex + 1} de {attempt.manifest.items.length}{round > 1 ? ` · reaparición ${round - 1} de 2` : ""}</div>
      <article>
        <span>Intenta recordarlo antes de revelar</span>
        <h2>{item.front}</h2>
        {revealed ? <div className="learning-flashcard-back"><span>Respuesta</span><p>{revealed.back}</p></div> : null}
      </article>
      {!revealed ? (
        <button className="learning-primary-button" disabled={busy} onClick={() => void reveal()} type="button">
          {busy ? "Guardando…" : "Mostrar respuesta"}
        </button>
      ) : (
        <fieldset className="learning-recall-grades" disabled={busy}>
          <legend>¿Cómo te fue?</legend>
          {grades.map(([value, label]) => <button key={value} onClick={() => void rate(value)} type="button">{label}</button>)}
        </fieldset>
      )}
    </section>
  );
}
