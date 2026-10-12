"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowCounterClockwise, ArrowRight, BookOpen, CaretUp, CheckCircle, Lightbulb, MapTrifold } from "@phosphor-icons/react";
import type { V2AttemptManifest, V2FeedbackSource, V2RouteState } from "@cediah/contracts";
import { safeMapReturnHref } from "../map/map-route";
import { createV2PlayerClient, readV2AttemptImage, V2RequestError, type PlayerAction, type PlayerResult } from "./client";
import { RouteSignals } from "./signals";
import { ActivityComposition, SequenceRecap } from "./composition";
import { MaintenanceSessionSummary } from "./maintenance";
import { ActivityHeader } from "../activities/activity-header";
import { ContinueSession } from "./continue-session";
import ui from "../activities/activity-ui.module.css";

type Feedback = { activityKey: string; explanation: string; commonError: string; score01: number | null; sources?: V2FeedbackSource[]; partialScore01?: number };
function PartialFeedback({ value }: { value?: number }) {
  return value !== undefined && value > 0 && value < 1 ? <p>Acierto parcial: {Math.round(value * 100)} %. Aún falta una respuesta completamente correcta.</p> : null;
}
type Answer = Extract<PlayerAction, { operation: "response" }>["body"]["answer"];
function FeedbackSources({ sources }: { sources: V2FeedbackSource[] }) {
  if (!sources.length) return null;
  return <details className={ui.disclosure}><summary><BookOpen aria-hidden size={18} />Fuente de la respuesta</summary><div>{sources.map(source => <article key={source.key}>
    <h4>{source.title}</h4><p>{source.citation}</p>
    <p>{[...source.locator.sectionPath, source.locator.heading, source.locator.page === null ? "" : `Página ${source.locator.page}`].filter(Boolean).join(" · ")}</p>
    <blockquote style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{source.excerpt}</blockquote>
    {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">Consultar referencia</a> : null}
  </article>)}</div></details>;
}

function AnswerRecap({ attempt, activityKey, activity }: { attempt: V2AttemptManifest; activityKey: string; activity: V2AttemptManifest["activeActivity"] }) {
  const response = attempt.acceptedResponses.find(item => item.activityKey === activityKey);
  if (!response) return null;
  const answer = response.answer;
  const text = answer.kind === "short_answer" || answer.kind === "constructed_response" ? answer.text
    : answer.kind === "single_choice" && activity?.kind === "single_choice" ? activity.payload.options.find(item => item.key === answer.optionKey)?.text : null;
  return text ? <p className={ui.answerRecap}>{text}</p> : <SequenceRecap response={response} activity={activity} />;
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
  const [helpExpanded, setHelpExpanded] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const [submittedActivity, setSubmittedActivity] = useState(initialAttempt.activeActivity);
  const activity = attempt.activeActivity;
  const comparison = attempt.constructedResponse?.activityKey === activity?.key ? attempt.constructedResponse : null;
  const disabled = busy || pending || attempt.status !== "open";
  const view = feedback ? `feedback:${feedback.activityKey}` : activity?.key ?? attempt.status;
  const previousView = useRef(view);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (!preview && previousView.current !== view) heading.current?.closest('[aria-label="Sesión de aprendizaje"]')?.scrollIntoView({ block: "start", behavior: "instant" });
    previousView.current = view;
  }, [view, preview]);

  function apply(result: PlayerResult) {
    if (result.value.attempt.enrollmentId !== initialAttempt.enrollmentId || result.value.attempt.pathVersionId !== initialAttempt.pathVersionId) throw new Error("La sesión recibida no corresponde a esta ruta.");
    if (result.value.attempt.rowVersion < attempt.rowVersion) throw new Error("Recarga el estado más reciente de la sesión.");
    setAttempt(result.value.attempt);
    if (result.operation === "help") {
      setHelp({ activityKey: result.body.activityKey, ...result.value.help });
      setHelpExpanded(true);
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
  function requestHelp(kind: "hint" | "source" | "reveal") {
    if (help?.activityKey === activity?.key && help?.kind === kind && kind !== "reveal") { setHelpExpanded(value => !value); return; }
    if (activity && !disabled) void run({ operation: "help", body: { activityKey: activity.key, kind, expectedVersion: attempt.rowVersion } });
  }
  function next() {
    if (!activity) { void run({ operation: "complete", body: { expectedVersion: attempt.rowVersion } }); return; }
    setFeedback(null); setHelp(null);
  }
  const Surface = preview ? "div" : "main";
  const returnHref = safeMapReturnHref(returnTo) ?? "/aprendizaje/mapa";
  const hasError = !busy && (pending || /No pudimos|rechazó|Recarga|no están disponibles/.test(message));
  const visibleActivity = feedback ? submittedActivity : activity;
  // Only the authorized current narrative is present; later case stages never enter the DOM.
  const promptParts = visibleActivity?.representation === "case" && visibleActivity.kind !== "case" ? visibleActivity.prompt.split("\n\n") : [];
  const prompt = promptParts.length > 1 ? promptParts.at(-1)! : visibleActivity?.prompt;
  const narrative = promptParts.length > 1 ? promptParts.slice(0, -1).join("\n\n") : null;
  const tools = activity && attempt.purpose !== "assessment" && ["single_choice", "short_answer", "constructed_response", "sequence", "match"].includes(activity.kind) ? <div>
    <div className={ui.tools}>
      <button type="button" disabled={disabled} aria-label="Necesito ayuda" aria-pressed={help?.kind === "hint" && helpExpanded} onClick={() => requestHelp("hint")}><Lightbulb aria-hidden size={19} />Pista</button>
      <button type="button" disabled={disabled} aria-label="Consultar fuente con ayuda" aria-pressed={help?.kind === "source" && helpExpanded} onClick={() => requestHelp("source")}><BookOpen aria-hidden size={19} />Fuente</button>
    </div>
    {helpExpanded && help?.activityKey === activity.key && help.kind !== "reveal" ? <aside className={ui.help} role="status">
      <h3>{help.kind === "source" ? "Fuente para practicar con ayuda" : "Pista"}</h3><button type="button" aria-label="Ocultar ayuda" onClick={() => setHelpExpanded(false)}><CaretUp aria-hidden size={18} /></button>
      <p>{help.text}</p><small>Práctica con ayuda</small>
    </aside> : null}
  </div> : null;
  return <Surface className={`${ui.session} ${preview ? "" : ui.immersive}`}><section aria-label="Sesión de aprendizaje" data-engine-version="guided-v2">
    <ActivityHeader title="Tu sesión de aprendizaje" eyebrow={preview ? "Vista previa · sin guardar progreso" : attempt.purpose === "review" ? "Repaso" : attempt.purpose === "assessment" ? "Evaluación" : "Práctica"} returnHref={returnHref} onExit={preview ? onExit : undefined} completed={state?.completedActivities} total={state?.plannedRequiredActivities} details={<>
      <p>{pending ? "Pendiente de confirmar" : busy ? "Guardando…" : preview ? "Estado simulado" : "Progreso guardado"}</p>
      {state ? <><RouteSignals state={state} /><p>{state.nextAction.reason}</p></> : <p>No pudimos cargar el resumen de progreso confirmado.</p>}
    </>} />
    <p className="sr-only" role="status" aria-live="polite">{message}</p>
    {hasError ? <div className={ui.notice} role="alert"><p>{pending ? "Pendiente de confirmar. Reintenta para recuperar el resultado antes de continuar." : message}</p>
      {pending ? <button type="button" className="learning-primary-button" disabled={busy} onClick={() => void run()}>Reintentar solicitud pendiente</button>
        : <button type="button" className="learning-secondary-button" onClick={() => window.location.reload()}>Recargar estado confirmado</button>}
    </div> : null}
    {feedback ? <section key={view} className={ui.content}>
      <h2 className={ui.prompt}>{prompt}</h2>
      <AnswerRecap attempt={attempt} activityKey={feedback.activityKey} activity={submittedActivity} />
      <div className={ui.feedback} data-tone={feedback.score01 === 0 ? "incorrect" : feedback.score01 === null ? "neutral" : "correct"} role="status" aria-live="polite">
        <h3 ref={heading} tabIndex={-1}>{feedback.score01 === 0 ? <ArrowCounterClockwise aria-hidden size={23} /> : <CheckCircle aria-hidden size={23} />}{feedback.score01 === 1 ? "Respuesta correcta" : feedback.score01 === 0 ? "Vamos a reforzar este punto" : "Práctica registrada"}</h3>
        <PartialFeedback value={feedback.partialScore01} />
        {feedback.explanation ? <p>{feedback.explanation}</p> : null}
      </div>
      {feedback.commonError ? <details className={ui.disclosure}><summary>Qué conviene recordar</summary><p>{feedback.commonError}</p></details> : null}
      <FeedbackSources sources={feedback.sources ?? []} />
      <div className={ui.action}><button className="learning-primary-button" type="button" disabled={busy || pending} onClick={next}>Continuar<ArrowRight aria-hidden size={19} /></button></div>
    </section> : attempt.status === "completed" ? <section className={ui.completion}>
      <CheckCircle aria-hidden size={52} weight="duotone" /><h2 ref={heading} tabIndex={-1}>Sesión completada</h2><p>Tu progreso está guardado. Continúa a tu ritmo.</p>
      {preview ? <button type="button" className="learning-primary-button" onClick={onExit}>Cerrar vista previa</button> : <ContinueSession state={state} returnTo={returnTo} />}
      <details className={ui.disclosure}><summary>Respuestas confirmadas</summary><div>{attempt.acceptedResponses.map(response => <article key={response.activityKey}><h3>{response.answer.kind === "study" ? "Lectura registrada" : "Respuesta guardada"}</h3><p>{response.feedback.explanation}</p><p>{response.feedback.commonError}</p><PartialFeedback value={response.feedback.partialScore01} /><FeedbackSources sources={response.feedback.sources ?? []} /></article>)}</div></details>
      {state && !pending ? <details className={ui.disclosure}><summary>Progreso y próximos repasos</summary><div><MaintenanceSessionSummary state={state} objectiveKeys={state.maintenance?.agenda.map(item => item.objectiveKey) ?? []} /></div></details> : null}
      {!preview && state && state.availability !== "maintenance" && state.nextAction.kind !== "none" && state.nextAction.key ? <Link href={returnHref}><MapTrifold aria-hidden size={18} />Volver a mi mapa</Link> : null}
    </section> : attempt.status !== "open" ? <section className={ui.completion}><h2 ref={heading} tabIndex={-1}>{attempt.status === "paused" ? "Sesión pausada" : "Sesión cerrada"}</h2><p>Tu historial se conserva.</p><Link href={returnHref} className="learning-primary-button">Volver a mi mapa</Link></section>
      : activity ? <section key={activity.key} className={ui.content} aria-busy={busy}>
        {narrative ? <p className={ui.context}>{narrative}</p> : null}
        <h2 ref={heading} tabIndex={-1} className={ui.prompt}>{prompt}</h2>
        {attempt.accessiblePractice ? <p className={ui.notice} role="status">Práctica de texto o tabla. Después volverás a la imagen pendiente.</p> : null}
        <ActivityComposition key={activity.key} activity={activity} attemptId={attempt.attemptId} rowVersion={attempt.rowVersion} disabled={disabled} comparison={comparison} readImage={readImage} tools={tools} onSubmit={respond} onReveal={() => requestHelp("reveal")} onAlternative={() => { if (!disabled) void run({ operation: "alternative", body: { activityKey: activity.key, expectedVersion: attempt.rowVersion } }); }} />
      </section> : <section className={ui.completion}><CheckCircle aria-hidden size={48} weight="duotone" /><h2 ref={heading} tabIndex={-1}>Respuestas guardadas</h2><p>Todo listo para cerrar esta sesión.</p><button type="button" className="learning-primary-button" disabled={disabled} onClick={() => void run({ operation: "complete", body: { expectedVersion: attempt.rowVersion } })}>Finalizar sesión</button></section>}
  </section></Surface>;
}
