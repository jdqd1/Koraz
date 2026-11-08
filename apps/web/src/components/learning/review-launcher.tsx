"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react";
import { LearningAttemptMutationResponseSchema } from "@cediah/contracts";

export function ReviewLauncher({ minutes, embedded = false, dueCount }: { minutes: 5 | 10 | 20; embedded?: boolean; dueCount?: number }) {
  const router = useRouter();
  const [identity] = useState(() => ({
    clientAttemptId: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
  }));
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");

  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/guided-learning/review-sessions", {
        body: JSON.stringify({ clientAttemptId: identity.clientAttemptId, sessionMinutes: minutes }),
        headers: { "Content-Type": "application/json", "Idempotency-Key": identity.idempotencyKey },
        method: "POST",
      });
      const body: unknown = await response.json();
      const parsed = LearningAttemptMutationResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) {
        setMessage(response.status === 409
          ? "La cola cambió o ya no quedan ítems vencidos. Vuelve a Inicio para ver el estado actual."
          : "No pudimos preparar el repaso. No se modificó ninguna fecha.");
        return;
      }
      router.push(`/aprendizaje/sesiones/${parsed.data.attempt.id}`);
    } catch {
      setMessage("Necesitas conexión para congelar una sesión nueva. Ningún repaso se marcó como realizado.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const Surface = embedded ? "div" : "main";
  const Heading = embedded ? "h3" : "h1";
  const limit = minutes === 5 ? 5 : 10;
  const batch = dueCount === undefined ? limit : Math.min(dueCount, limit);
  return (
    <Surface className={embedded ? undefined : "learning-main learning-activity-launcher"}>
      {!embedded ? <Link className="learning-back-link" href="/aprendizaje"><ArrowLeft aria-hidden="true" size={18} />Volver a Inicio</Link> : null}
      <section>
        <span>Repaso recomendado</span>
        <ClockCounterClockwise aria-hidden="true" className="learning-launcher-icon" size={38} />
        <Heading>Una sesión breve y acotada</Heading>
        <p>Prepararemos hasta {batch} ítems vencidos. Incluye preguntas y tarjetas; la selección se confirma al comenzar.</p>
        {dueCount !== undefined && dueCount > batch ? <p>Quedarán al menos {dueCount - batch} ítems para otro bloque. Puedes parar después de esta sesión.</p> : null}
        <fieldset className="learning-session-length">
          <legend>Tiempo disponible aproximado</legend>
          <div>
            {([5, 10, 20] as const).map((option) => (
              <Link
                aria-current={option === minutes ? "true" : undefined}
                href={`/aprendizaje/repaso?minutos=${option}`}
                key={option}
              >
                {option} min
              </Link>
            ))}
          </div>
        </fieldset>
        <button className="learning-primary-button" disabled={busy} onClick={() => void start()} type="button">
          {busy ? "Preparando…" : `Comenzar · unos ${minutes} min`}
        </button>
        <p>El tiempo es una estimación, no un temporizador. Los bloques de 10 y 20 minutos incluyen como máximo diez ítems.</p>
        <p aria-live="polite" className="learning-activity-message">{message}</p>
      </section>
    </Surface>
  );
}
