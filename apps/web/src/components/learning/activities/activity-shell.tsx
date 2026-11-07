"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LearningAttemptMutationResponseSchema,
  type LearningAttemptMutationResponse,
  learningOptionUnderReview,
  type LearningAttempt,
  type LearningAttemptResponseRecord,
  type LearningEnrollmentProgress,
  type LearningReward,
} from "@cediah/contracts";
import { recoverLearningMutations, sendQueuedLearningMutation } from "@/lib/learning-mutation-queue";
import { FlashcardActivity } from "./flashcard-activity";
import { GuideActivity } from "./guide-activity";
import { LearningCompletionPanel } from "./learning-completion-panel";
import { QuizActivity } from "./quiz-activity";
import { ReviewActivity } from "./review-activity";
import type { ActivityMutation } from "./types";
import { VideoActivity } from "./video-activity";
import { ActivityHeader } from "./activity-header";
import ui from "./activity-ui.module.css";

function pendingMessage(status?: number) {
  if (status === 401) return "Vuelve a iniciar sesión con la misma cuenta para confirmar el envío pendiente.";
  if (status === 429) return "Espera un momento antes de reintentar el envío pendiente.";
  return "Envío pendiente de confirmar. Reintenta con conexión.";
}

export function ActivityShell({
  initialAttempt,
  initialProgress,
  userId,
  returnHref,
}: {
  initialAttempt: LearningAttempt;
  initialProgress: LearningEnrollmentProgress | null;
  userId: string;
  returnHref?: string;
}) {
  const [attempt, setAttempt] = useState(initialAttempt);
  const [progress, setProgress] = useState(initialProgress);
  const [feedback, setFeedback] = useState<LearningAttemptResponseRecord | null>(null);
  const [awards, setAwards] = useState<LearningReward[]>([]);
  const [saveState, setSaveState] = useState<"confirmed" | "failed" | "pending" | "saving">("confirmed");
  const [message, setMessage] = useState("");

  const lock = useRef(false);
  const pending = useRef(false);
  const lastVersion = useRef(initialAttempt.rowVersion);
  const [checking, setChecking] = useState(true);

  const applyReceipt = useCallback((receipt: LearningAttemptMutationResponse) => {
    if (receipt.attempt.rowVersion < lastVersion.current) return false;
    lastVersion.current = receipt.attempt.rowVersion;
    setAttempt(receipt.attempt);
    if (receipt.progress) setProgress(receipt.progress);
    if (receipt.awards.length > 0) {
      setAwards((current) => {
        const next = new Map(current.map((award) => [award.awardKey, award]));
        for (const award of receipt.awards) next.set(award.awardKey, award);
        return [...next.values()];
      });
    }
    setSaveState("confirmed");
    setMessage("Progreso guardado.");
    return true;
  }, []);

  const rejectChange = useCallback((body: unknown) => {
    setSaveState("failed");
    const reason = body && typeof body === "object" && "error" in body ? body.error : null;
    setMessage(reason === "version_conflict" ? "La actividad cambió en otra pestaña. Recarga el estado confirmado."
      : reason === "resource_changed" ? "Este material fue retirado o actualizado. Vuelve a la ruta para elegir otra actividad."
        : "No pudimos guardar este cambio. Revisa el estado confirmado.");
  }, []);

  const recover = useCallback(async () => {
    if (lock.current) return;
    lock.current = true;
    try {
      const result = await recoverLearningMutations(userId, initialAttempt.id);
      for (const { response, body } of result.receipts) {
        if (!response.ok) { rejectChange(body); continue; }
        const receipt = LearningAttemptMutationResponseSchema.parse(body);
        if (applyReceipt(receipt)) setFeedback(receipt.feedback);
      }
      if (pending.current && !result.pending && !result.receipts.length) {
        // Another tab consumed our queue entry. Read its confirmed state from the server.
        window.location.reload();
        return;
      }
      pending.current = result.pending;
      if (result.pending) {
        setSaveState("pending");
        setMessage(pendingMessage(result.status));
      }
    } catch {
      if (pending.current) setMessage("No pudimos leer el envío pendiente. Reintenta desde este navegador.");
    } finally {
      setChecking(false);
      lock.current = false;
    }
  }, [applyReceipt, initialAttempt.id, rejectChange, userId]);

  useEffect(() => {
    const initialCheck = window.setTimeout(recover, 0);
    window.addEventListener("online", recover);
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener("online", recover);
    };
  }, [recover]);

  const mutate = useCallback<ActivityMutation>(async (path, method, body) => {
    if (lock.current || pending.current || checking) return null;
    lock.current = true;
    try {
      setSaveState("saving");
      setMessage("");
      const delivered = await sendQueuedLearningMutation({ body, method, url: path, userId });
      if (delivered.state === "pending") {
        pending.current = true;
        setSaveState("pending");
        setMessage(pendingMessage(delivered.status));
        return null;
      }
      if (delivered.state === "failed") {
        setSaveState("failed");
        setMessage("No pudimos confirmar ni conservar el envío en el dispositivo. Revisa el estado antes de volver a responder.");
        return null;
      }
      if (!delivered.response.ok) { rejectChange(delivered.body); return null; }
      const receipt = LearningAttemptMutationResponseSchema.parse(delivered.body);
      return applyReceipt(receipt) ? receipt : null;
    } finally {
      lock.current = false;
    }
  }, [applyReceipt, checking, rejectChange, userId]);

  if (attempt.status === "in_progress" && learningOptionUnderReview(attempt.stepOptionId)) return (
    <main className="learning-main"><section className="learning-empty"><div><h1>Material en revisión editorial</h1><p>Puedes continuar con otra actividad.</p></div>
      <Link className="learning-secondary-button" href={attempt.pathSlug ? `/aprendizaje/rutas/${attempt.pathSlug}` : "/aprendizaje/repaso"}>{attempt.pathSlug ? "Volver a la ruta" : "Volver al repaso"}</Link>
    </section></main>
  );
  return (
    <main className={`${ui.session} ${ui.immersive}`} aria-label="Sesión de aprendizaje" data-engine-version="guided-v1">
      <ActivityHeader title={attempt.manifest.title} eyebrow={attempt.manifest.projection === "quiz" ? "Cuestionario" : attempt.manifest.projection === "flashcards" ? "Tarjetas" : attempt.manifest.projection === "guide" ? "Lectura" : attempt.manifest.projection === "review" ? "Repaso" : "Video"}
        returnHref={returnHref ?? (attempt.pathSlug ? `/aprendizaje/rutas/${attempt.pathSlug}` : "/aprendizaje/mapa")}
        returnLabel={!returnHref && attempt.pathSlug ? "Volver a mi ruta" : "Volver a mi mapa"}
        completed={progress?.completedEssentialSteps} total={progress?.totalEssentialSteps} details={<p>{saveState === "saving" ? "Guardando…" : saveState === "pending" ? "Pendiente de guardar" : saveState === "failed" ? "Sin guardar" : "Progreso guardado"}</p>} />
      <p aria-live="polite" className={message && message !== "Progreso guardado." ? ui.notice : "sr-only"}>{message}</p>
      {saveState === "pending" && message === pendingMessage(401) ? <Link className="learning-secondary-button"
        href={`/acceder?${new URLSearchParams({ next: window.location.pathname + window.location.search })}`}>Iniciar sesión</Link> : null}
      {checking && attempt.status === "in_progress" ? <p role="status">Comprobando los envíos pendientes…</p> : null}
      {saveState === "pending" ? <button type="button" className="learning-primary-button" onClick={() => void recover()}>Reintentar envío pendiente</button> : null}
      {saveState === "failed" ? <button type="button" className="learning-secondary-button" onClick={() => window.location.reload()}>Recargar estado confirmado</button> : null}
      {saveState !== "pending" && attempt.status === "completed" && !feedback ? <LearningCompletionPanel attempt={attempt} awards={awards} progress={progress} returnHref={returnHref} /> : null}
      {!checking && saveState !== "pending" && (attempt.status !== "completed" || feedback) ? (
        attempt.manifest.projection === "quiz" ? <QuizActivity attempt={attempt as LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "quiz" }> }} feedback={feedback} mutate={mutate} onFeedback={setFeedback} />
          : attempt.manifest.projection === "flashcards" ? <FlashcardActivity attempt={attempt as LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "flashcards" }> }} mutate={mutate} />
            : attempt.manifest.projection === "guide" ? <GuideActivity attempt={attempt as LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "guide" }> }} mutate={mutate} />
              : attempt.manifest.projection === "review" ? <ReviewActivity attempt={attempt as LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "review" }> }} feedback={feedback} mutate={mutate} onFeedback={setFeedback} />
                : <VideoActivity attempt={attempt as LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "video" }> }} mutate={mutate} />
      ) : null}
    </main>
  );
}
