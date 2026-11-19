"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { createV2Launcher, V2RequestError } from "./client";
import { actionTarget, type V2State } from "./model";
import { safeLearningReturnHref, learningSessionHref, learningReturnLabel, contextFromQuery, learningRouteHref } from "@/lib/learning-navigation";

export function ContinueSession({ state, returnTo, preferredObjectiveKey }: { state: V2State | null; returnTo?: string | null; preferredObjectiveKey?: string }) {
  const router = useRouter();
  const [launcher] = useState(() => createV2Launcher());
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const returnHref = safeLearningReturnHref(returnTo) ?? "/aprendizaje/mapa";
  const preferred = state?.nextAction.kind !== "resume" && state?.maintenance?.activities.find(item => item.objectiveKey === preferredObjectiveKey);
  const target = preferred ? { kind: "activity" as const, key: preferred.key } : state ? actionTarget(state.nextAction) : null;
  const canContinue = state && state.availability !== "maintenance" && (target || state.nextAction.kind === "resume" && state.nextAction.key);

  async function open() {
    if (!state || !canContinue || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const result = state.nextAction.kind === "resume" && state.nextAction.key
        ? await launcher.resume(state.nextAction.key) : target ? await launcher.start(state, target) : null;
      if (!result || result.attempt.enrollmentId !== state.enrollmentId || result.attempt.pathVersionId !== state.pathVersionId) throw new Error("La sesión no corresponde a esta ruta.");
      const route = new URL(returnHref, "https://learning.local"), slug = route.pathname.match(/^\/aprendizaje\/rutas\/([^/]+)$/)?.[1];
      const previous = contextFromQuery(Object.fromEntries(route.searchParams));
      const location = target?.key === state.nextAction.key ? state.nextActionContext : null;
      const nextReturn = slug ? learningRouteHref(slug, { ...previous, unit: location?.unitKey ?? previous.unit,
        objective: result.attempt.activeActivity?.objectiveKey ?? location?.objectiveKey ?? previous.objective,
        activity: state.nextAction.kind === "resume" ? previous.activity : target?.kind === "activity" ? target.key : undefined }) : returnHref;
      router.push(learningSessionHref(result.attempt.attemptId, nextReturn));
    } catch (cause) {
      setError(cause instanceof V2RequestError ? cause.message : "No pudimos abrir la siguiente actividad. Reintenta con conexión.");
    } finally { lock.current = false; setBusy(false); }
  }
  return <div>
    {canContinue ? <button type="button" className="learning-primary-button" disabled={busy} onClick={() => void open()}>{busy ? "Preparando…" : "Siguiente actividad"}<ArrowRight aria-hidden size={19} /></button>
      : <Link className="learning-primary-button" href={returnHref}>{learningReturnLabel(returnHref)}<ArrowRight aria-hidden size={19} /></Link>}
    {error ? <div role="alert"><p>{error}</p><button type="button" className="learning-secondary-button" onClick={() => window.location.reload()}>Actualizar sesión</button></div> : null}
  </div>;
}
