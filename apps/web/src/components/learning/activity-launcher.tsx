"use client";

import Link from "next/link";
import { ArrowLeft, Play } from "@phosphor-icons/react";
import { useLearningActivityLauncher } from "./use-learning-activity-launcher";
import { learningSessionHref, learningRouteHref } from "@/lib/learning-navigation";

export function ActivityLauncher({
  existingAttemptId,
  optionId,
  pathSlug,
  stepTitle,
  returnTo,
  completed,
}: {
  existingAttemptId: string | null;
  optionId: string;
  pathSlug: string;
  stepTitle: string;
  returnTo?: string;
  completed?: boolean;
}) {
  const { busy, message, launch } = useLearningActivityLauncher();

  return (
    <main className="learning-main learning-activity-launcher">
      <Link className="learning-back-link" href={returnTo ?? learningRouteHref(pathSlug)}>
        <ArrowLeft aria-hidden="true" size={18} />Volver a la unidad
      </Link>
      <section>
        <span>Actividad elegida</span>
        <h1>{stepTitle}</h1>
        <p>Abre tu actividad para estudiar con seguimiento. Tu progreso se guarda al responder.</p>
        {existingAttemptId ? (
          <Link className="learning-primary-button" href={learningSessionHref(existingAttemptId, returnTo)}>
            <Play aria-hidden="true" size={19} />{completed ? "Consultar resultado" : "Continuar donde quedaste"}
          </Link>
        ) : (
          <button className="learning-primary-button" disabled={busy} onClick={() => void launch(optionId, null, returnTo)} type="button">
            <Play aria-hidden="true" size={19} />{busy ? "Iniciando…" : "Comenzar actividad"}
          </button>
        )}
        <p aria-live="polite" className="learning-activity-message">{message}</p>
      </section>
    </main>
  );
}
