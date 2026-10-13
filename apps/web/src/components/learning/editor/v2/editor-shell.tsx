"use client";

import Link from "next/link";
import { AlertDialog, Tabs } from "radix-ui";
import { useLayoutEffect, useRef, useState } from "react";
import { analyzeRouteGraph, type V2BoundRouteDefinition } from "@cediah/contracts";
import { editorStatusLabels } from "../editor-workflow";
import { editorV2Sections, type EditorV2Draft, type EditorV2Section } from "./editor-model";
import type { EditorV2Api } from "./editor-api";
import { serializeEditorV2 } from "./editor-serialization";
import { useRouteEditorV2 } from "./use-route-editor";
import { RouteBasicsV2 } from "./route-basics";
import { ObjectivesV2 } from "./objectives";
import { ActivityEditorV2 } from "./activity-editor";
import { AssessmentEditorV2 } from "./assessment-editor";
import { ReviewWorkflowV2 } from "./review-workflow";
import { ImportWizardV2 } from "./import-wizard";
import { activitySaveIssuesV2 } from "./activity-model";
import { sourceBindingIssuesV2 } from "./sources";
import { ArrowLeft, ArrowRight, FloppyDisk, UploadSimple } from "@phosphor-icons/react";
import { focusFieldIssueV2, normalizeFieldPathV2 } from "./sources-fields";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

function fieldIssueLabel(path: string, draft: EditorV2Draft) {
  const activity = /package\.activities\.(\d+)/.exec(path);
  if (activity) return `Actividad ${draft.package.activities[Number(activity[1])]?.prompt || Number(activity[1]) + 1}: revisa el campo marcado.`;
  const owner = /package\.(sources|objectives)\.(\d+)\.(.+)/.exec(path);
  if (owner) {
    const labels: Record<string, string> = { title: "el nombre", verb: "el verbo", criticality: "la criticidad", required: "si es requerido", unitKey: "la unidad", prerequisiteKeys: "los prerrequisitos", sourceKeys: "las fuentes", citation: "la cita bibliográfica", "locator.heading": "la sección", "locator.page": "la página", "locator.sectionPath": "la ruta de secciones", documentSha256: "la guía y revisión o el documento de referencia", binding: "la guía y revisión", excerpt: "el fragmento", url: "el enlace HTTPS", verification: "el estado bibliográfico", checkedAt: "la fecha de comprobación" };
    const index = Number(owner[2]);
    const object = owner[1] === "sources" ? draft.package.sources[index] : draft.package.objectives[index];
    const field = owner[3]!.replace(/\.\d+$/, "");
    return `${owner[1] === "sources" ? "Fuente" : "Objetivo"} ${object?.title || index + 1}: revisa ${labels[field] ?? "este campo"}.`;
  }
  if (path === "package.route.title") return "Completa el título de la ruta.";
  if (path === "package.route.summary") return "Completa la descripción de la ruta.";
  if (path.startsWith("package.objectives")) return "Revisa los objetivos de la ruta.";
  if (path.startsWith("package.units") || path.startsWith("package.activities")) return "Revisa las unidades y actividades del recorrido.";
  if (path.startsWith("package.assessments") || path.startsWith("package.reviewPlan")) return "Revisa la evaluación y el repaso.";
  return "Revisa los datos y las fuentes antes de guardar.";
}

export function EditorShellV2(props: {
  actorUserId: string; route?: V2BoundRouteDefinition; draft?: EditorV2Draft;
  transport?: EditorV2Api; replaceUrl?: (href: string) => void;
  canReview?: boolean; canPublish?: boolean;
}) {
  const editor = useRouteEditorV2(props);
  const { state, controller } = editor;
  const busy = state.operation !== "idle";
  const [showImport, setShowImport] = useState(false);
  const disabled = busy || showImport || !controller.canEdit() || Boolean(editor.recoveryCandidate);
  const [showErrors, setShowErrors] = useState(false);
  const [copyDownloaded, setCopyDownloaded] = useState(false);
  const surfaceRef = useRef<HTMLElement>(null);
  const importTrigger = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const pendingStepFocus = useRef(false);
  useLayoutEffect(() => {
    if (pendingFocus.current) {
      const path = pendingFocus.current;
      pendingFocus.current = null;
      requestAnimationFrame(() => focusFieldIssueV2(surfaceRef.current, path));
    }
    else if (pendingStepFocus.current) {
      pendingStepFocus.current = false;
      // Radix mounts the panel through Presence. Focus after that commit is complete.
      requestAnimationFrame(() => {
        const panel = surfaceRef.current?.querySelector<HTMLElement>('[role="tabpanel"][data-state="active"]');
        panel?.focus(); panel?.scrollIntoView({ block: "start" });
      });
    }
  });
  const pkg = state.draft.package;
  const stepIndex = editorV2Sections.findIndex((section) => section.key === state.section);
  const stepLabels = ["Datos y fuentes", "Objetivos", "Actividades", "Evaluación", "Revisión"];
  const mobileStepLabels = ["Datos", "Objetivos", "Práctica", "Evaluar", "Revisar"];
  const stepDescriptions = ["", String(pkg.objectives.length), String(pkg.activities.length), String(pkg.assessments.length), ""];
  const saveNotice = ["", "Cambios sin guardar. La revisión anterior ya no acredita esta copia.", "Borrador confirmado por el servidor."].includes(state.notice) ? "" : state.notice;
  const saveStatus = busy ? state.operation === "loading" ? "Procesando…" : "Guardando…" : state.dirty ? "Cambios sin guardar" : "Borrador al día";
  function goToStep(index: number) {
    const section = editorV2Sections[index];
    if (!section) return;
    pendingStepFocus.current = true;
    controller.dispatch({ type: "section", section: section.key });
  }
  const serialized = serializeEditorV2(state);
  const graphIssues = analyzeRouteGraph(pkg).issues;
  const bindingIssues = sourceBindingIssuesV2(state.draft);
  const activityIssues = activitySaveIssuesV2(pkg);
  const errors = showErrors ? [...(!serialized.ok ? serialized.issues : []), ...graphIssues, ...bindingIssues, ...activityIssues].filter((issue, index, all) => all.findIndex((item) => normalizeFieldPathV2(item.path) === normalizeFieldPathV2(issue.path)) === index) : [];
  function editDraft(draft: EditorV2Draft) {
    setCopyDownloaded(false);
    controller.edit(draft);
  }
  function locate(path: string) {
    const normalized = normalizeFieldPathV2(path);
    if (!path) { pendingFocus.current = "review.note"; controller.dispatch({ type: "section", section: "review" }); return; }
    pendingFocus.current = path;
    controller.dispatch({ type: "section", section: normalized.startsWith("package.assessments") || normalized.startsWith("package.reviewPlan") || normalized.startsWith("assessment.") ? "assessment" : normalized.startsWith("package.editorial") || normalized.startsWith("package.assets") || normalized.startsWith("review.") ? "review" : normalized.startsWith("package.activities") || normalized.startsWith("activity.") ? "journey" : normalized.startsWith("package.objectives") || normalized.startsWith("package.units") ? "objectives" : "sources" });
  }
  async function save() { setShowErrors(true); const blocking = [...graphIssues, ...bindingIssues, ...activityIssues]; if (blocking.length) { locate(blocking[0]!.path); return; } await controller.save(); }
  function download() { editor.downloadDraft(); setCopyDownloaded(true); }
  return <section aria-label="Editor de ruta" ref={surfaceRef} className={`${styles.editor} ${local.editor}`} data-editor-surface data-engine-version="guided-v2" data-current-section={state.section}>
    <header className={local.header}>
      <div className={local.headerTitle}><Link className={local.iconButton} aria-label="Volver a rutas de aprendizaje" href="/panel/rutas"><ArrowLeft size={20} aria-hidden /></Link><h1>{state.confirmed ? pkg.route.title : "Nueva ruta"}</h1></div>
      <div className={local.headerTools}>{state.confirmed ? <span className={local.statusBadge}>{editorStatusLabels[state.confirmed.status]}</span> : null}<button ref={importTrigger} aria-label="Importar archivo de ruta" className={styles.secondaryButton} disabled={busy || Boolean(editor.recoveryCandidate)} type="button" onClick={() => setShowImport(true)}><UploadSimple size={18} aria-hidden /><span className={local.desktopLabel}>Importar archivo de ruta</span><span className={local.mobileLabel}>Importar</span></button></div>
    </header>
    {showImport ? <ImportWizardV2 api={controller.api} state={state} onClose={() => { setShowImport(false); importTrigger.current?.focus(); }} /> : null}
    <Tabs.Root activationMode="manual" className={local.workspace} value={state.section} onValueChange={(section) => controller.dispatch({ type: "section", section: section as EditorV2Section })}>
      <Tabs.List aria-label="Secciones del editor de rutas" className={local.stepList}>
        {editorV2Sections.map((section, index) => <Tabs.Trigger className={local.step} aria-label={section.label} key={section.key} value={section.key}><strong><span className={local.desktopLabel}>{stepLabels[index]}</span><span className={local.mobileLabel}>{mobileStepLabels[index]}</span></strong>{stepDescriptions[index] ? <small>{stepDescriptions[index]}</small> : null}</Tabs.Trigger>)}
      </Tabs.List>
      <div className={local.stepContent}>
      <Tabs.Content className={styles.panel} value="sources">
        <RouteBasicsV2 draft={state.draft} disabled={disabled} onChange={editDraft} issues={errors} preserveSlug={Boolean(state.confirmed)} />
      </Tabs.Content>
      <Tabs.Content className={styles.panel} value="objectives"><ObjectivesV2 draft={state.draft} disabled={disabled} onChange={editDraft} issues={errors} /></Tabs.Content>
      <Tabs.Content className={styles.panel} value="journey"><ActivityEditorV2 draft={state.draft} disabled={disabled} onChange={editDraft} issues={errors} /></Tabs.Content>
      <Tabs.Content className={styles.panel} value="assessment"><AssessmentEditorV2 draft={state.draft} disabled={disabled} onChange={editDraft} issues={errors} /></Tabs.Content>
      <Tabs.Content className={styles.panel} value="review">{showImport || editor.recoveryCandidate ? <p>Cierra la importación o resuelve la copia local para continuar la revisión.</p> : <ReviewWorkflowV2 state={state} controller={controller} canReview={props.canReview} canPublish={props.canPublish} onLocate={locate} />}</Tabs.Content>
      </div>
    </Tabs.Root>
    {errors.length ? <section className={styles.recoveryBanner} aria-live="polite"><div><strong>Revisa estos campos</strong><ul>{errors.map((issue, index) => <li key={`${issue.path}:${index}`}>{fieldIssueLabel(normalizeFieldPathV2(issue.path), state.draft)} <button className={styles.textButton} type="button" onClick={() => locate(issue.path)}>Ir al campo</button></li>)}</ul></div></section> : null}
    {editor.recoveryCandidate ? <section aria-live="polite" className={styles.recoveryBanner}><div><strong>{editor.recoveryConflict ? "Hay una copia local de otra revisión" : "Hay cambios de esta pestaña sin guardar"}</strong><p>{editor.recoveryConflict ? "Descarga la copia para conservarla; no se aplicará sobre la nueva revisión." : "Puedes recuperar esta copia o descartarla."}</p></div><div className={styles.inlineActions}>{editor.recoveryConflict ? <button className={styles.secondaryButton} onClick={() => editor.downloadDraft(editor.recoveryCandidate!)} type="button">Descargar copia local</button> : <button className={styles.primaryAction} disabled={busy} onClick={editor.recover} type="button">Recuperar</button>}<button className={styles.textButton} disabled={busy} onClick={editor.discardRecovery} type="button">Descartar</button></div></section> : null}
    {state.conflict ? <section aria-live="polite" className={styles.conflictBanner}><div><strong>La ruta cambió en otra sesión</strong><p>Conserva tus cambios antes de abrir la versión guardada.</p></div><div className={styles.inlineActions}><button className={styles.secondaryButton} onClick={download} type="button">Descargar mis cambios</button><button className={styles.textButton} disabled={busy || !copyDownloaded} onClick={() => void controller.openSavedVersion()} type="button">Abrir versión guardada</button></div></section> : null}
    {!editor.recoveryAvailable ? <p role="status" className={styles.recoveryWarning}>La recuperación local no está disponible; descarga una copia antes de salir.</p> : null}
    {saveNotice ? <p role="status" className={local.saveNotice}>{saveNotice}</p> : null}
    <div className={`${styles.saveBar} ${local.saveBar}`} data-last-step={stepIndex === 4}>
      <div className={local.saveStatus} aria-live="polite" data-dirty={state.dirty} title={state.confirmedAt ? `Último guardado: ${new Date(state.confirmedAt).toLocaleString("es", { timeZone: "America/Caracas" })}` : saveStatus}><strong>{saveStatus}</strong></div>
      <div className={local.footerActions}>
        {stepIndex > 0 ? <button className={`${styles.textButton} ${local.previousAction}`} aria-label="Atrás" title="Atrás" type="button" onClick={() => goToStep(stepIndex - 1)}><ArrowLeft size={16} aria-hidden /><span className={local.desktopLabel}>Atrás</span></button> : null}
        <button className={`${stepIndex === 4 ? styles.primaryAction : styles.secondaryButton} ${local.saveControl}`} aria-label={state.operation === "saving" ? "Guardando…" : "Guardar borrador"} title="Guardar borrador" disabled={busy || showImport || !controller.canSave() || Boolean(editor.recoveryCandidate) || Boolean(state.confirmed && !state.dirty)} onClick={() => void save()} type="button"><FloppyDisk size={17} className={local.mobileIcon} aria-hidden /><span className={local.desktopLabel}>{state.operation === "saving" ? "Guardando…" : "Guardar borrador"}</span><span className={local.mobileLabel}>{state.operation === "saving" ? "Guardando…" : "Guardar"}</span></button>
        {stepIndex < 4 ? <button className={styles.primaryAction} type="button" onClick={() => goToStep(stepIndex + 1)}>Continuar <ArrowRight size={18} aria-hidden /></button> : null}
      </div>
    </div>
    <AlertDialog.Root open={Boolean(editor.pendingNavigation)} onOpenChange={(open) => { if (!open) editor.setPendingNavigation(null); }}><AlertDialog.Portal><AlertDialog.Overlay className={`${styles.dialogOverlay} ${local.dialogOverlay}`} /><AlertDialog.Content className={`${styles.dialog} ${local.dialog}`} data-editor-surface onCloseAutoFocus={(event) => { event.preventDefault(); editor.restoreNavigationFocus(); }}><AlertDialog.Title className={styles.dialogTitle}>¿Salir con cambios sin guardar?</AlertDialog.Title><AlertDialog.Description className={styles.dialogDescription}>Puedes guardar, conservar la copia local o seguir editando.</AlertDialog.Description><div className={styles.dialogActions}><AlertDialog.Cancel asChild><button className={styles.secondaryButton} type="button">Seguir editando</button></AlertDialog.Cancel><button className={styles.textButton} disabled={busy} onClick={editor.leave} type="button">Salir sin guardar</button><button className={styles.primaryAction} disabled={busy || state.conflict} onClick={() => void editor.saveAndLeave()} type="button">Guardar y salir</button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </section>;
}
