"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { V2AttemptManifest, V2FeedbackSource, V2RouteState } from "@cediah/contracts";
import { safeMapReturnHref } from "../map/map-route";
import { createV2PlayerClient, readV2AttemptImage, V2RequestError, type PlayerAction, type PlayerResult } from "./client";
import { RouteSignals } from "./signals";
import { ActivityComposition, SequenceRecap } from "./composition";
import { MaintenanceSessionSummary } from "./maintenance";
import local from "./player.module.css";

type Feedback = { activityKey: string; explanation: string; commonError: string; score01: number | null; sources?: V2FeedbackSource[]; partialScore01?: number };
function PartialFeedback({ value }: { value?: number }) {
  return value !== undefined && value > 0 && value < 1 ? <p>Acierto parcial: {Math.round(value * 100)} %. Aún falta una respuesta completamente correcta.</p> : null;
}
type Answer = Extract<PlayerAction, { operation: "response" }>["body"]["answer"];
function FeedbackSources({ sources }: { sources: V2FeedbackSource[] }) {
  if (!sources.length) return <p>No hay una fuente vinculada a esta respuesta.</p>;
  return <div><h3>Fuentes de esta respuesta</h3>{sources.map(source => <article key={source.key}>
    <h4>{source.title}</h4><p>{source.citation}</p>
    <p>{[...source.locator.sectionPath, source.locator.heading, source.locator.page === null ? "" : `Página ${source.locator.page}`].filter(Boolean).join(" · ")}</p>
    <blockquote style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{source.excerpt}</blockquote>
    {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">Consultar referencia</a> : null}
  </article>)}</div>;
}
type PlayerProps = { initialAttempt: V2AttemptManifest; initialState: V2RouteState | null; returnTo?: string | null } & (
  { preview?: false; transport?: ReturnType<typeof createV2PlayerClient>; readImage?: typeof readV2AttemptImage; onExit?: () => void }
  | { preview: true; transport: ReturnType<typeof createV2PlayerClient>; readImage: typeof readV2AttemptImage; onExit: () => void });
export function V2Player({ initialAttempt, initialState, returnTo, preview = false, transport, readImage, onExit }: PlayerProps) {
  const [attempt, setAttempt] = useState(initialAttempt);
  const [state, setState] = useState(initialState?.enrollmentId === initialAttempt.enrollmentId && initialState.pathVersionId === initialAttempt.pathVersionId ? initialState : null);
  const [client] = useState(() => { if (preview && !transport) throw new Error("La vista previa requiere un simulador aislado."); return transport ?? createV2PlayerClient(initialAttempt.attemptId); });
  const [busy, setBusy] = useState(false), lock = useRef(false);
  const pending = useSyncExternalStore(client.subscribe, () => Boolean(client.pending()), () => false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [help, setHelp] = useState<{ activityKey: string; kind: "hint" | "source" | "reveal"; text: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [submittedActivity, setSubmittedActivity] = useState(initialAttempt.activeActivity);
  const activity = attempt.activeActivity;
  const comparison = attempt.constructedResponse?.activityKey === activity?.key ? attempt.constructedResponse : null;
  const disabled = busy || pending || attempt.status !== "open";
  const view = feedback ? `feedback:${feedback.activityKey}` : activity?.key ?? attempt.status;
  useEffect(() => { heading.current?.focus(); }, [view]);

  function apply(result: PlayerResult) {
    if (result.value.attempt.enrollmentId !== initialAttempt.enrollmentId || result.value.attempt.pathVersionId !== initialAttempt.pathVersionId) throw new Error("La sesión recibida no corresponde a esta ruta.");
    if (result.value.attempt.rowVersion < attempt.rowVersion) throw new Error("Recarga el estado más reciente de la sesión.");
    setAttempt(result.value.attempt);
    if (result.operation === "help") {
      setHelp({ activityKey: result.body.activityKey, ...result.value.help });
      setMessage("Consulta registrada por el servidor. Esta actividad se practica con ayuda.");
    } else if (result.operation === "alternative") {
      setState(result.value.state); setFeedback(null); setHelp(null); setMessage("Variante de texto o tabla confirmada. Es práctica formativa; la actividad espacial sigue pendiente.");
    } else {
      setState(result.value.state);
      if (result.operation === "response") {
        if (result.value.accepted) {
          setSubmittedActivity(activity);
          setHelp(null);
          if (result.body.answer.kind === "study") { setFeedback(null); }
          else setFeedback({ activityKey: result.body.activityKey, ...result.value.feedback });
          setMessage(preview ? "Respuesta simulada. No guarda progreso." : "Respuesta confirmada y guardada.");
        } else if (result.body.answer.kind === "constructed_response" && result.body.answer.selfRating === null) {
          setMessage("Texto guardado para comparar. Aún falta tu valoración formativa.");
        } else throw new Error("La respuesta sigue sin confirmarse.");
      } else { setFeedback(null); setHelp(null); setMessage("Sesión completada y guardada."); }
    }
  }
  async function run(action?: PlayerAction) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(preview ? "Confirmando en la vista previa…" : "Confirmando con el servidor…");
    try { apply(action ? await client.execute(action) : await client.retry()); }
    catch (error) {
      const uncertain = Boolean(client.pending());
      setMessage(uncertain ? "No pudimos confirmar la solicitud. Puede haberse guardado; reintenta con la misma solicitud. No hay acierto ni avance confirmado."
        : error instanceof V2RequestError && error.status === 409 ? "La sesión cambió en otra pestaña. Recarga para continuar con el estado del servidor."
          : error instanceof V2RequestError && [401, 403, 404].includes(error.status) ? "La sesión o el material no están disponibles para tu cuenta. Tu historial se conserva."
            : "El servidor rechazó la solicitud. Recarga para revisar el estado confirmado.");
    } finally { lock.current = false; setBusy(false); }
  }
  function respond(answer: Answer) { if (activity && !disabled) void run({ operation: "response", body: { activityKey: activity.key, answer, confidence: null, expectedVersion: attempt.rowVersion } }); }
  function requestHelp(kind: "hint" | "source" | "reveal") { if (activity && !disabled) void run({ operation: "help", body: { activityKey: activity.key, kind, expectedVersion: attempt.rowVersion } }); }
  function next() { setFeedback(null); setHelp(null); }
  const Surface = preview ? "div" : "main";
  return <Surface><section aria-label="Sesión de aprendizaje" className="learning-activity-main" data-engine-version="guided-v2">
    <header className={`${local.header} learning-activity-header`}>{preview ? <button type="button" className="learning-secondary-button" onClick={onExit}>Cerrar vista previa</button> : <Link href={safeMapReturnHref(returnTo) ?? "/aprendizaje?tab=hoy"}>Volver a mi aprendizaje</Link>}<div><span>{attempt.purpose === "review" ? "Repaso" : "Aprendizaje guiado"}</span><h1>Tu sesión de aprendizaje</h1></div><div className={`learning-save-state is-${pending ? "pending" : busy ? "saving" : "confirmed"}`} role="status">{pending ? "Pendiente de confirmar" : busy ? preview ? "Simulando…" : "Guardando…" : preview ? "Estado simulado" : "Estado del servidor"}</div></header>
    <p className="learning-activity-message" role="status" aria-live="polite">{message}</p>
    {pending ? <div><p>Hay una solicitud pendiente de confirmar. El servidor debe confirmar su resultado antes de continuar.</p><button type="button" className="learning-primary-button" disabled={busy} onClick={() => void run()}>Reintentar solicitud pendiente</button></div> : null}
    {!pending && message.includes("Recarga") ? <button type="button" className="learning-secondary-button" onClick={() => window.location.reload()}>Recargar estado confirmado</button> : null}
    {state ? <RouteSignals state={state} /> : <p role="alert">No pudimos cargar el resumen de progreso confirmado.</p>}
    {feedback ? <section className={`learning-feedback ${feedback.score01 === 0 ? "is-incorrect" : ""}`} role="status" aria-live="polite"><div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
      <h2 ref={heading} tabIndex={-1}>{feedback.score01 === 1 ? "Respuesta correcta" : feedback.score01 === 0 ? "Vamos a reforzar este punto" : "Práctica registrada"}</h2>
      <PartialFeedback value={feedback.partialScore01} />
      {attempt.acceptedResponses.filter(response => response.activityKey === feedback.activityKey).map(response => <SequenceRecap key={response.activityKey} response={response} activity={submittedActivity} />)}
      {feedback.explanation ? <><h3>Por qué</h3><p style={{ whiteSpace: "pre-wrap" }}>{feedback.explanation}</p></> : <p>Respuesta guardada. La explicación se mostrará cuando el servidor la autorice.</p>}
      {feedback.commonError ? <><h3>Error frecuente</h3><p>{feedback.commonError}</p></> : null}
      <FeedbackSources sources={feedback.sources ?? []} />
      <p>{state?.nextAction.reason}</p><button className="learning-primary-button" type="button" onClick={next}>{activity ? "Continuar" : "Ver cierre de sesión"}</button>
    </div></section> : attempt.status === "completed" ? <section className="learning-completion-panel"><h2 ref={heading} tabIndex={-1}>Sesión completada</h2><p>El recorrido y el dominio se muestran por separado en el resumen confirmado.</p><details><summary>Respuestas confirmadas</summary>{attempt.acceptedResponses.map(response => <article key={response.activityKey}><h3>{response.answer.kind === "study" ? "Lectura registrada" : "Respuesta guardada"}</h3><p>{response.feedback.explanation}</p><p>{response.feedback.commonError}</p><PartialFeedback value={response.feedback.partialScore01} /><FeedbackSources sources={response.feedback.sources ?? []} /></article>)}</details></section>
      : attempt.status !== "open" ? <section className="learning-empty"><h2 ref={heading} tabIndex={-1}>{attempt.status === "paused" ? "Sesión pausada" : "Sesión cerrada"}</h2><p>Tu historial se conserva. Vuelve a tu aprendizaje para comprobar las opciones disponibles.</p></section>
        : activity ? <section style={{ minWidth: 0, overflowWrap: "anywhere" }} aria-busy={busy}>
          <p className="learning-activity-counter">Objetivo: {state?.objectives.find(item => item.objectiveKey === activity.objectiveKey) ? "Práctica del objetivo actual" : "Recuperar y aplicar"}</p>
          <h2 ref={heading} tabIndex={-1} style={{ whiteSpace: "pre-wrap" }}>{activity.prompt}</h2>
          {attempt.accessiblePractice ? <p role="status">Variante accesible de texto o tabla. Esta práctica no acredita identificación espacial. Al responder volverás a la imagen pendiente.</p> : null}
          {activity.kind !== "study" ? <p>Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.</p> : null}
          <ActivityComposition key={activity.key} activity={activity} attemptId={attempt.attemptId} rowVersion={attempt.rowVersion} disabled={disabled} comparison={comparison} readImage={readImage} onSubmit={respond} onReveal={() => requestHelp("reveal")} onAlternative={() => { if (!disabled) void run({ operation: "alternative", body: { activityKey: activity.key, expectedVersion: attempt.rowVersion } }); }} />
          {activity.kind !== "study" && attempt.purpose !== "assessment" && ["single_choice", "short_answer", "constructed_response"].includes(activity.kind) ? <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}><button type="button" className="learning-secondary-button" disabled={disabled} onClick={() => requestHelp("hint")}>Necesito ayuda</button><button type="button" className="learning-secondary-button" disabled={disabled} onClick={() => requestHelp("source")}>Consultar fuente con ayuda</button></div> : null}
          {help?.activityKey === activity.key && help.kind !== "reveal" ? <aside role="status" style={{ marginTop: 16, whiteSpace: "pre-wrap" }}><h3>{help.kind === "source" ? "Fuente para practicar con ayuda" : "Pista"}</h3><p>{help.text}</p><p>Consulta registrada: práctica con ayuda.</p></aside> : null}
        </section> : <section className="learning-completion-panel"><h2 ref={heading} tabIndex={-1}>Respuestas guardadas</h2><p>Confirma el cierre para consultar el resultado de la sesión.</p><button type="button" className="learning-primary-button" disabled={disabled} onClick={() => void run({ operation: "complete", body: { expectedVersion: attempt.rowVersion } })}>Finalizar sesión</button></section>}
    {state && !pending && attempt.status === "completed" ? <MaintenanceSessionSummary state={state} objectiveKeys={state.maintenance?.agenda.map(item => item.objectiveKey) ?? []} /> : null}
  </section></Surface>;
}
