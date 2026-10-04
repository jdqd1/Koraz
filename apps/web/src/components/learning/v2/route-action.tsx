"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { safeMapReturnHref } from "../map/map-route";
import { actionLabel, actionTarget, stateMatches, type V2Path, type V2State } from "./model";
import { createV2Launcher, V2RequestError } from "./client";
import styles from "./styles.module.css";

export function RouteAction({ path, state, returnTo }: { path: V2Path; state: V2State | null; returnTo?: string | null }) {
  const router = useRouter();
  const [transport] = useState(() => createV2Launcher());
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const confirmed = stateMatches(path, state) ? state : null;
  async function open() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      if (!path.enrollmentId && path.access === "available") { await transport.enroll(path.pathId); router.refresh(); return; }
      if (!confirmed) return;
      const target = actionTarget(confirmed.nextAction);
      const result = confirmed.nextAction.kind === "resume" && confirmed.nextAction.key
        ? await transport.resume(confirmed.nextAction.key)
        : target ? await transport.start(confirmed, target) : null;
      if (!result) return;
      if (result.attempt.enrollmentId !== confirmed.enrollmentId || result.attempt.pathVersionId !== confirmed.pathVersionId) throw new Error("La sesión corresponde a otra versión. Actualiza la ruta.");
      const safe = safeMapReturnHref(returnTo);
      router.push(`/aprendizaje/sesiones/${result.attempt.attemptId}${safe ? `?${new URLSearchParams({ returnTo: safe })}` : ""}`);
    } catch (error) { setMessage(error instanceof V2RequestError ? error.message : "No pudimos confirmar la apertura de la actividad. Reintenta con conexión."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const canStart = path.access === "available" && !path.enrollmentId;
  const canContinue = path.access === "enrolled" && confirmed && confirmed.nextAction.kind !== "none" && !!confirmed.nextAction.key;
  return <div className={styles.action}>
    {confirmed ? <p>{confirmed.nextAction.reason}</p> : null}
    {path.access === "revoked" ? <p role="alert">El acceso a esta ruta no está disponible. Tu historial se conserva.</p> : canStart || canContinue ? <button type="button" disabled={busy} onClick={() => void open()} className="learning-primary-button">{busy ? "Preparando…" : canStart ? "Comenzar" : actionLabel(confirmed?.nextAction ?? null)}</button> : path.enrollmentId && !confirmed ? <p role="alert">No pudimos cargar el estado confirmado. Actualiza la ruta para continuar.</p> : null}
    {message ? <div role="alert"><p>{message}</p><button type="button" className="learning-secondary-button" onClick={() => router.refresh()}>Actualizar ruta</button></div> : null}
  </div>;
}
