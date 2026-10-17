"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { safeMapReturnHref } from "../map/map-route";
import { actionLabel, actionTarget, stateMatches, type V2Path, type V2State } from "./model";
import { createV2Launcher, V2RequestError } from "./client";
import styles from "./styles.module.css";
import { RouteReason } from "./route-reason";
import type { V2AttemptTarget } from "@cediah/contracts";

export type V2LaunchTarget = V2AttemptTarget;
/** A display offer is launchable only while it occurs in this server snapshot. */
export function authorizedMaintenanceTarget(state: V2State, target: V2LaunchTarget) {
  if (state.nextAction.kind === "resume") return false;
  if (target.kind === "assessment" && target.objectiveKey) return state.maintenance?.placements?.some(item => item.objectiveKey === target.objectiveKey
    && item.assessmentKey === target.key && item.status === "available") ?? false;
  const recommended = actionTarget(state.nextAction);
  if (recommended?.kind === target.kind && recommended.key === target.key) return true;
  const maintenance = state.maintenance;
  if (!maintenance) return false;
  if (target.kind === "assessment") return maintenance.diagnostic.status !== "completed" && maintenance.diagnostic.status !== "unavailable" && maintenance.diagnostic.assessmentKey === target.key;
  if (target.kind === "review") return maintenance.reviewBatch.some(item => item.key === target.key);
  return maintenance.activities.some(item => item.key === target.key)
    || state.motivation?.practiceOffers.some(item => item.key === target.key && item.available)
    || maintenance.remediation.some(item => item.activityKey === target.key && !item.bankExhausted && !item.pauseOffered);
}

export function RouteAction({ path, state, returnTo, target: offeredTarget, label, showReason = true, appearance = "primary" }: { path: V2Path; state: V2State | null; returnTo?: string | null; target?: V2LaunchTarget; label?: string; showReason?: boolean; appearance?: "primary" | "secondary" }) {
  const router = useRouter();
  const [transport] = useState(() => createV2Launcher());
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const confirmed = stateMatches(path, state) ? state : null;
  const maintenance = path.availability === "maintenance" || confirmed?.availability === "maintenance";
  async function open() {
    if (inFlight.current || maintenance) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      if (!path.enrollmentId && path.access === "available") { await transport.enroll(path.pathId); router.refresh(); return; }
      if (!confirmed) return;
      if (offeredTarget && !authorizedMaintenanceTarget(confirmed, offeredTarget)) return;
      const target = offeredTarget ?? actionTarget(confirmed.nextAction);
      const result = !offeredTarget && confirmed.nextAction.kind === "resume" && confirmed.nextAction.key
        ? await transport.resume(confirmed.nextAction.key)
        : target ? await transport.start(confirmed, target) : null;
      if (!result) return;
      if (result.attempt.enrollmentId !== confirmed.enrollmentId || result.attempt.pathVersionId !== confirmed.pathVersionId) throw new Error("La sesión corresponde a otra versión. Actualiza la ruta.");
      const safe = safeMapReturnHref(returnTo);
      router.push(`/aprendizaje/sesiones/${result.attempt.attemptId}${safe ? `?${new URLSearchParams({ returnTo: safe })}` : ""}`);
    } catch (error) { setMessage(error instanceof V2RequestError ? error.message : "No pudimos confirmar la apertura de la actividad. Reintenta con conexión."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const canStart = !maintenance && !offeredTarget && path.access === "available" && !path.enrollmentId;
  const canContinue = !maintenance && path.access === "enrolled" && confirmed && (offeredTarget ? authorizedMaintenanceTarget(confirmed, offeredTarget) : confirmed.nextAction.kind !== "none" && !!confirmed.nextAction.key);
  return <div className={styles.action}>
    {confirmed && showReason ? <p><RouteReason reason={confirmed.nextAction.reason} timeZone={confirmed.maintenance?.timeZone} /></p> : null}
    {path.access === "revoked" ? <p role="alert">El acceso a esta ruta no está disponible. Tu historial se conserva.</p> : canStart || canContinue ? <button type="button" disabled={busy} onClick={() => void open()} className={appearance === "secondary" ? "learning-secondary-button" : "learning-primary-button"}>{busy ? "Preparando…" : label ?? (canStart ? "Comenzar" : actionLabel(confirmed?.nextAction ?? null))}</button> : path.enrollmentId && !confirmed ? <p role="alert">No pudimos cargar el estado confirmado. Actualiza la ruta para continuar.</p> : null}
    {message ? <div role="alert"><p>{message}</p><button type="button" className="learning-secondary-button" onClick={() => router.refresh()}>Actualizar ruta</button></div> : null}
  </div>;
}
