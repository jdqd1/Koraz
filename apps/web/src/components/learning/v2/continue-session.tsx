"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { createV2Launcher, V2RequestError } from "./client";
import { actionTarget, type V2State } from "./model";
import { safeMapReturnHref } from "../map/map-route";

export function ContinueSession({ state, returnTo }: { state: V2State | null; returnTo?: string | null }) {
  const router = useRouter();
  const [launcher] = useState(() => createV2Launcher());
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const returnHref = safeMapReturnHref(returnTo) ?? "/aprendizaje/mapa";
  const target = state ? actionTarget(state.nextAction) : null;
  const canContinue = state && state.availability !== "maintenance" && (target || state.nextAction.kind === "resume" && state.nextAction.key);

  async function open() {
    if (!state || !canContinue || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const result = state.nextAction.kind === "resume" && state.nextAction.key
        ? await launcher.resume(state.nextAction.key) : target ? await launcher.start(state, target) : null;
      if (!result || result.attempt.enrollmentId !== state.enrollmentId || result.attempt.pathVersionId !== state.pathVersionId) throw new Error("La sesión no corresponde a esta ruta.");
      router.push(`/aprendizaje/sesiones/${result.attempt.attemptId}?${new URLSearchParams({ returnTo: returnHref })}`);
    } catch (cause) {
      setError(cause instanceof V2RequestError ? cause.message : "No pudimos abrir la siguiente actividad. Reintenta con conexión.");
    } finally { lock.current = false; setBusy(false); }
  }
  return <div>
    {canContinue ? <button type="button" className="learning-primary-button" disabled={busy} onClick={() => void open()}>{busy ? "Preparando…" : "Siguiente actividad"}<ArrowRight aria-hidden size={19} /></button>
      : <Link className="learning-primary-button" href={returnHref}>Volver a mi mapa<ArrowRight aria-hidden size={19} /></Link>}
    {error ? <div role="alert"><p>{error}</p><button type="button" className="learning-secondary-button" onClick={() => window.location.reload()}>Actualizar sesión</button></div> : null}
  </div>;
}
