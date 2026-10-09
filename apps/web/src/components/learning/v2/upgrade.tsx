"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { V2HttpContracts } from "@cediah/contracts";
import type { z } from "zod";
import { createV2UpgradeClient } from "./upgrade-client";
import { V2RequestError } from "./client";

export function V2Upgrade({ enrollmentId, expectedVersion, disabled = false }: { enrollmentId: string; expectedVersion: number; disabled?: boolean }) {
  const router = useRouter();
  const [transport] = useState(() => createV2UpgradeClient(enrollmentId));
  const [preview, setPreview] = useState<z.infer<typeof V2HttpContracts.upgradePreview.response> | null>(null);
  const [acknowledged, setAcknowledged] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const inFlight = useRef(false);
  async function execute(adopt: boolean) {
    if (inFlight.current || disabled) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      if (transport.hasPending()) { await transport.retry(); router.refresh(); setPreview(null); }
      else if (adopt && preview && acknowledged && !preview.openAttempt && preview.availability !== "maintenance") {
        await transport.commit({ targetVersionId: preview.targetVersionId, expectedVersion: preview.expectedVersion ?? expectedVersion, acknowledgedReset: true });
        setPreview(null); setAcknowledged(false); router.refresh();
      } else { setPreview(await transport.preview()); setAcknowledged(false); }
    } catch (error) {
      setMessage(error instanceof V2RequestError && error.status === 409 ? "No se pudo adoptar otra versión. Actualiza la ruta y revisa si hay una sesión abierta o cambios en tu matrícula."
        : error instanceof V2RequestError ? error.message : "No pudimos confirmar la actualización. Reintenta para recuperar el resultado con la misma solicitud.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  if (disabled) return <aside className="learning-upgrade-card" role="status"><p>Ruta en mantenimiento. Tu versión y tu historial se conservan; la práctica y las actualizaciones están pausadas.</p></aside>;
  return <aside className="learning-upgrade-card" aria-label="Actualización de la ruta"><div>
    <h2>Versiones de esta ruta</h2><p>Puedes revisar otra versión antes de adoptarla. Tu historial permanece disponible.</p>
    {preview ? <div className="learning-upgrade-preview">
      <p>{preview.objectiveImpact.filter(item => item.willResetEvidence).length} objetivos necesitan nueva evidencia. La lectura previa se conserva solo como consumo; nunca acredita dominio por sí sola.</p>
      <ul>{preview.objectiveImpact.map((item, index) => <li key={item.objectiveKey}>{item.title ?? `Objetivo ${index + 1}`}: {item.willResetEvidence ? "Requiere nueva evidencia" : "Conserva evidencia equivalente"}</li>)}</ul>
      {preview.consumedActivities?.length ? <details><summary>Lecturas conservadas en el historial</summary><ul>{preview.consumedActivities.map((item, index) => <li key={index}>{item.title} · Consumo previo</li>)}</ul></details> : null}
      {preview.availability === "maintenance" ? <p role="status">Ruta en mantenimiento. Las actualizaciones están pausadas; tu historial se conserva.</p> : preview.openAttempt ? <p role="status">Termina o abandona explícitamente la sesión abierta antes de adoptar otra versión.</p> : <label><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />Entiendo qué evidencia debe volver a demostrarse y quiero adoptar esta versión.</label>}
      <div className="learning-upgrade-actions"><button className="learning-primary-button" type="button" disabled={busy || !acknowledged || preview.openAttempt || preview.availability === "maintenance"} onClick={() => void execute(true)}>{busy ? "Confirmando…" : "Adoptar versión"}</button><button className="learning-secondary-button" type="button" disabled={busy} onClick={() => { setPreview(null); setAcknowledged(false); }}>Guardar para después</button></div>
    </div> : <button className="learning-secondary-button" type="button" disabled={busy} onClick={() => void execute(false)}>{busy ? "Revisando…" : "Revisar actualización o recuperar solicitud"}</button>}
    {message ? <div role="alert"><p>{message}</p><button type="button" className="learning-secondary-button" onClick={() => router.refresh()}>Actualizar ruta</button></div> : null}
  </div></aside>;
}
