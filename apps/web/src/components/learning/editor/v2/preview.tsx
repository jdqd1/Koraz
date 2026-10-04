"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { EditorV2State } from "./editor-model";
import { openPreviewV2, type PreviewConnection, type PreviewSnapshot } from "./preview-transport";
import { V2Player } from "../../v2/player";
import { RouteSignals } from "../../v2/signals";
import { MaintenanceSessionSummary } from "../../v2/maintenance";
import styles from "../route-editor.module.css";

function PreviewSession({ connection, onClose }: { connection: PreviewConnection; onClose: () => void }) {
  const snapshot = useSyncExternalStore(connection.subscribe, connection.getSnapshot, connection.getSnapshot);
  const [busy, setBusy] = useState(false), lock = useRef(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const [transport, setTransport] = useState<{ attemptId: string; client: ReturnType<PreviewConnection["player"]> } | null>(null);
  async function run(operation: "start" | "clock" | "omit_diagnostic", key?: string, kind?: "activity" | "assessment" | "review", days = 0) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const expectedVersion = connection.getSnapshot().state.rowVersion;
      if (operation === "start" && key && kind) {
        await connection.action({ operation, body: { expectedVersion, target: { kind, key } } });
        const attempt = connection.getSnapshot().attempt!;
        setTransport({ attemptId: attempt.attemptId, client: connection.player(attempt.attemptId) });
      } else if (operation === "clock") await connection.action({ operation, body: { expectedVersion, now: new Date(Date.parse(connection.getSnapshot().now) + days * 86400000).toISOString() } });
      else if (operation === "omit_diagnostic") await connection.action({ operation, body: { expectedVersion } });
    } catch { setMessage("No se pudo confirmar la simulación. La sesión puede haber vencido; cierra y vuelve a abrir la vista previa."); }
    finally { lock.current = false; setBusy(false); }
  }
  const open = snapshot.attempt?.status === "open";
  const next = snapshot.state.nextAction;
  const nextTarget = snapshot.targets.find(item => item.key === next.key);
  return <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
    <p>Reloj simulado: <time dateTime={snapshot.now}>{new Date(snapshot.now).toLocaleString("es-VE", { timeZone: "America/Caracas" })}</time> (America/Caracas).</p>
    <p>La sesión editorial vence en diez minutos reales. Cerrar o reiniciar descarta sus resultados.</p>
    {snapshot.profileWarning ? <p role="alert">{snapshot.profileWarning}</p> : null}
    <div className={styles.inlineActions}>{[1, 7, 30].map(days => <button className={styles.secondaryButton} key={days} type="button" disabled={busy || open} onClick={() => void run("clock", undefined, undefined, days)}>Avanzar {days} {days === 1 ? "día" : "días"}</button>)}<button className={styles.textButton} type="button" onClick={onClose}>Cerrar vista previa</button></div>
    <p role="status" aria-live="polite">{busy ? "Preparando simulación…" : message}</p>
    {!open ? <>
      <RouteSignals state={snapshot.state} />
      {snapshot.state.maintenance?.diagnostic.status === "pending" ? <div className={styles.inlineActions}><button className={styles.secondaryButton} disabled={busy} type="button" onClick={() => void run("start", snapshot.state.maintenance!.diagnostic.assessmentKey!, "assessment")}>Simular diagnóstico</button><button className={styles.textButton} disabled={busy} type="button" onClick={() => void run("omit_diagnostic")}>Omitir diagnóstico en preview</button></div> : null}
      <p>{next.reason}</p>
      {next.key && (nextTarget || next.kind === "review") ? <button className={styles.primaryAction} disabled={busy} type="button" onClick={() => void run("start", next.key!, next.kind === "review" ? "review" : nextTarget!.kind)}>Simular siguiente actividad</button> : null}
      <label>Explorar un punto de la ruta<select value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}><option value="">Elige una actividad o evaluación</option>{snapshot.targets.map(item => <option key={`${item.kind}:${item.key}`} value={`${item.kind}:${item.key}`}>{item.title}</option>)}</select></label>
      <button className={styles.secondaryButton} type="button" disabled={busy || !selected} onClick={() => { const [kind, key] = selected.split(":"); void run("start", key, kind as "activity" | "assessment"); }}>Abrir punto seleccionado</button>
      {!snapshot.targets.length ? <p>Este borrador aún no tiene actividades. Añade el recorrido para previsualizarlo.</p> : null}
      <MaintenanceSessionSummary state={snapshot.state} objectiveKeys={snapshot.state.objectives.map(item => item.objectiveKey)} />
    </> : null}
    {snapshot.attempt && transport?.attemptId === snapshot.attempt.attemptId ? <V2Player key={snapshot.attempt.attemptId} initialAttempt={snapshot.attempt} initialState={snapshot.state} preview transport={transport.client} readImage={connection.readImage} onExit={onClose} /> : null}
  </div>;
}

export function PreviewV2({ state, disabled = false }: { state: EditorV2State; disabled?: boolean }) {
  const [profile, setProfile] = useState<PreviewSnapshot["profile"]>("beginner");
  const [connection, setConnection] = useState<PreviewConnection | null>(null);
  const [busy, setBusy] = useState(false), lock = useRef(false);
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  async function open() {
    if (lock.current || !state.confirmed || disabled) return;
    lock.current = true; setBusy(true); setNotice("");
    try { setConnection(await openPreviewV2(state.confirmed.pathId, state.draft.package, state.draft.bindings, profile, new Date().toISOString())); }
    catch { setNotice("No se pudo abrir la vista previa. Comprueba los permisos, las fuentes y las incidencias del borrador."); }
    finally { lock.current = false; setBusy(false); }
  }
  function close() { setConnection(null); requestAnimationFrame(() => trigger.current?.focus()); }
  return <section className={styles.card} aria-label="Vista previa editorial" data-editor-preview>
    <h2>Vista previa de la ruta</h2><p role="status"><strong>Vista previa · no guarda progreso</strong></p>
    <p>Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.</p>
    {connection ? <PreviewSession connection={connection} onClose={close} /> : <>
      <label>Perfil de vista previa<select disabled={disabled || busy} value={profile} onChange={event => setProfile(event.target.value as PreviewSnapshot["profile"])}><option value="beginner">Principiante</option><option value="diagnostic_correct">Diagnóstico correcto</option><option value="core_error">Error CORE</option></select></label>
      <button ref={trigger} className={styles.secondaryButton} type="button" disabled={disabled || busy || !state.confirmed} onClick={() => void open()}>{busy ? "Abriendo vista previa…" : "Abrir vista previa"}</button>
      <p role="status" aria-live="polite">{notice}</p>
    </>}
  </section>;
}
