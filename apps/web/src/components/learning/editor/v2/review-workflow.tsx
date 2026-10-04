"use client";

import { useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import { validateRoutePackage, type V2IssueSchema, type V2BoundRouteDefinition } from "@cediah/contracts";
import type { z } from "zod";
import type { EditorV2Controller } from "./editor-controller";
import type { EditorV2State } from "./editor-model";
import { reviewIsCurrentV2 } from "./editor-model";
import { ExportPackageV2 } from "./export-package";
import { FieldV2 } from "./sources-fields";
import { ReviewAssetsV2 } from "./review-assets";
import { PreviewV2 } from "./preview";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

type Transition = "in_review" | "changes_requested" | "approved" | "published";
export function reviewActionsV2(state: EditorV2State, capabilities: { canReview: boolean; canPublish: boolean }): Transition[] {
  switch (state.confirmed?.status) {
    case "draft": case "changes_requested": return ["in_review"];
    case "in_review": return capabilities.canReview ? ["changes_requested", "approved"] : [];
    case "approved": return capabilities.canPublish ? ["published"] : [];
    default: return [];
  }
}
const labels: Record<Transition, string> = { in_review: "Enviar a revisión", changes_requested: "Solicitar cambios", approved: "Aprobar revisión", published: "Publicar ruta" };
export function reviewFailureNoticeV2(code: string, status: number) {
  if (code === "SOURCE_CHANGED" || code === "source_changed") return "La fuente cambió. Tus cambios están conservados: revisa los vínculos y vuelve a validar.";
  if (status === 409) return "La revisión guardada cambió. Conserva una copia local y abre la versión guardada antes de continuar.";
  if (status === 422) return "El servidor encontró incidencias. Corrige los campos indicados antes de continuar.";
  if (status === 401 || status === 403) return "No se pudo autorizar esta acción. Conserva tus cambios y comprueba la sesión y los permisos.";
  return "No se pudo confirmar la acción. Reintentar conserva la misma solicitud y tus cambios.";
}
export function ReviewWorkflowV2({ state, controller, canReview = false, canPublish = false, onLocate }: {
  state: EditorV2State; controller: EditorV2Controller; canReview?: boolean; canPublish?: boolean; onLocate: (path: string) => void;
}) {
  const [note, setNote] = useState("");
  const [serverReport, setReport] = useState<{ revision: number; hash: string; issues: z.infer<typeof V2IssueSchema>[]; ready: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const pending = useRef<{ fingerprint: string; key: string } | null>(null);
  const blocked = state.operation !== "idle" || state.dirty || state.conflict || !state.confirmed;
  const currentReport = !state.dirty && serverReport?.revision === state.confirmed?.editVersion && serverReport?.hash === state.confirmed?.contentHash ? serverReport : null;
  const issues = currentReport?.issues ?? validateRoutePackage(state.draft.package).issues;
  function requestKey(fingerprint: string) { if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() }; return pending.current.key; }
  function fail(code: string, status: number, serverIssues?: z.infer<typeof V2IssueSchema>[]) {
    const base = controller.getSnapshot().confirmed;
    if (base && serverIssues) setReport({ revision: base.editVersion, hash: base.contentHash, issues: serverIssues, ready: false });
    const message = reviewFailureNoticeV2(code, status); setNotice(message);
    controller.dispatch({ type: "failure", conflict: status === 409, notice: message });
  }
  async function run(action: "validate" | "version" | Transition) {
    const snapshot = controller.getSnapshot(); const base = snapshot.confirmed;
    if (!base || snapshot.dirty || snapshot.conflict || snapshot.operation !== "idle") return;
    if (action !== "validate" && action !== "version" && !reviewActionsV2(snapshot, { canReview, canPublish }).includes(action)) return;
    if (action === "published" && !reviewIsCurrentV2(snapshot)) return;
    const key = requestKey(JSON.stringify({ pathId: base.pathId, revision: base.editVersion, action, note }));
    controller.dispatch({ type: "operation", operation: "loading" }); setNotice("");
    try {
      if (action === "validate") {
        const result = await controller.api.validate(base.pathId, base.editVersion, key);
        if (!result.ok) { fail(result.code, result.status, result.issues); return; }
        if (result.value.validatedEditVersion !== null && result.value.validatedEditVersion !== base.editVersion) { fail("VERSION_CONFLICT", 409); return; }
        setReport({ revision: base.editVersion, hash: base.contentHash, issues: result.value.issues, ready: result.value.ready });
        setNotice(result.value.ready ? "La validación del servidor está al día." : "Revisa las incidencias del servidor."); pending.current = null;
      } else {
        let confirmed: V2BoundRouteDefinition;
        if (action === "version") {
          if (base.status !== "published") return;
          const result = await controller.api.version(base.pathId, { expectedVersion: base.editVersion, releaseNotes: note }, key);
          if (!result.ok) { fail(result.code, result.status, result.issues); return; }
          const loaded = await controller.api.get(base.pathId);
          if (!loaded.ok) { fail(loaded.code, loaded.status); return; }
          confirmed = loaded.value.route;
          if (confirmed.pathVersionId !== result.value.pathVersionId) { fail("VERSION_CONFLICT", 409); return; }
        } else {
          const result = await controller.api.transition(base.pathId, { expectedVersion: base.editVersion, status: action, reviewNote: note }, key);
          if (!result.ok) { fail(result.code, result.status, result.issues); return; }
          confirmed = result.value.route;
          if (confirmed.pathVersionId !== base.pathVersionId || confirmed.editVersion !== base.editVersion + 1 || confirmed.status !== action || confirmed.contentHash !== base.contentHash) { fail("invalid_confirmation", 503); return; }
        }
        if (!controller.confirmWorkflow(confirmed)) { fail("invalid_confirmation", 503); return; }
        setReport(null); setNotice("Estado confirmado por el servidor."); pending.current = null;
      }
    } catch { fail("network_error", 503); }
    finally { if (controller.getSnapshot().operation !== "idle") controller.dispatch({ type: "operation", operation: "idle" }); }
  }
  return <div className={local.stack}><section className={styles.card}><h2>Revisión editorial</h2><p>{reviewIsCurrentV2(state) ? "La aprobación corresponde al contenido confirmado." : "Este contenido necesita una revisión vigente antes de publicarse."}</p><p>{state.dirty ? "Guarda los cambios antes de validar, revisar o exportar." : "La validación comprueba cobertura y fuentes. La aprobación editorial debe comprobar el contenido."}</p>
    <FieldV2 label="Nota de revisión o de nueva versión" path="review.note">{(input) => <textarea {...input} maxLength={4000} disabled={state.operation !== "idle"} value={note} onChange={(event) => setNote(event.target.value)} />}</FieldV2>
    <div className={styles.inlineActions}><button className={styles.secondaryButton} disabled={blocked} type="button" onClick={() => void run("validate")}>Validar contenido</button>{reviewActionsV2(state, { canReview, canPublish }).map((action) => <button className={action === "changes_requested" ? styles.secondaryButton : styles.primaryAction} disabled={blocked || (action === "published" && !reviewIsCurrentV2(state))} key={action} type="button" onClick={() => action === "published" ? setPublishing(true) : void run(action)}>{labels[action]}</button>)}{state.confirmed?.status === "published" ? <button className={styles.secondaryButton} disabled={blocked} type="button" onClick={() => void run("version")}>Crear nueva versión</button> : null}</div>
    <p role="status">{state.operation !== "idle" ? "Confirmando con el servidor…" : notice}</p>
    <p>{currentReport ? `Validación del servidor · revisión ${currentReport.revision}` : "Comprobación local de cobertura; aún no confirma catálogo ni permisos."}</p>
    <ul className={local.issueList}>{issues.map((issue, index) => <li key={`${issue.code}:${issue.path}:${index}`}><strong>{issue.severity === "error" ? "Pendiente" : "Aviso"}:</strong> {issue.message}<p>{issue.suggestedFix}</p><button className={styles.textButton} type="button" onClick={() => onLocate(issue.path)}>Ir al campo</button></li>)}</ul>{!issues.length ? <p>No hay incidencias en esta comprobación.</p> : null}
    <FieldV2 label="Notas editoriales de la ruta" path="package.editorial.notes">{(input) => <textarea {...input} maxLength={4000} disabled={state.operation !== "idle" || !controller.canEdit()} value={state.draft.package.editorial.notes} onChange={(event) => controller.edit({ ...state.draft, package: { ...state.draft.package, editorial: { ...state.draft.package.editorial, notes: event.target.value } } })} />}</FieldV2>
  </section><PreviewV2 key={`${state.confirmed?.pathVersionId}:${state.confirmed?.editVersion}:${state.dirty}`} state={state} disabled={blocked} /><ReviewAssetsV2 draft={state.draft} disabled={state.operation !== "idle" || !controller.canEdit()} onChange={(draft) => controller.edit(draft)} />{state.confirmed ? <ExportPackageV2 pathId={state.confirmed.pathId} api={controller.api} disabled={blocked} /> : null}
    <AlertDialog.Root open={publishing} onOpenChange={setPublishing}><AlertDialog.Portal><AlertDialog.Overlay className={styles.dialogOverlay} /><AlertDialog.Content className={styles.dialog} data-editor-surface><AlertDialog.Title className={styles.dialogTitle}>Publicar la ruta revisada</AlertDialog.Title><AlertDialog.Description className={styles.dialogDescription}>Publicar «{state.confirmed?.definition.route.title}», revisión {state.confirmed?.editVersion}, con la aprobación vigente. La versión publicada quedará inmutable.</AlertDialog.Description><div className={styles.dialogActions}><AlertDialog.Cancel asChild><button className={styles.secondaryButton} type="button">Cancelar</button></AlertDialog.Cancel><AlertDialog.Action asChild><button className={styles.primaryAction} disabled={blocked || !canPublish || !reviewIsCurrentV2(state)} onClick={() => void run("published")} type="button">Confirmar publicación</button></AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
