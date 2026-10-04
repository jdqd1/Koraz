"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import { FieldV2, focusFieldIssueV2, type FormPropsV2 } from "./sources-fields";
import { activityDeletionBlockV2, activityTypesV2, activityValidationV2, addActivityV2, deleteActivityV2, replaceActivityV2, type ActivityPresetV2 } from "./activity-model";
import { ActivityCommonV2, ActivityFeedbackV2 } from "./activity-fields";
import { ActivityStudyV2, ActivityChoiceOptionsV2, ActivityChoiceSolutionV2, ActivityShortSolutionV2, ActivityConstructedSolutionV2 } from "./activity-payloads";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";
import { VisualActivityV2 } from "./visual-activity";

export function ActivityEditorV2({ draft, disabled, onChange, issues = [] }: FormPropsV2) {
  const pkg = draft.package;
  const [preset, setPreset] = useState<ActivityPresetV2>("study");
  const [objectiveKey, setObjectiveKey] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const restoreAddFocus = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => { if (pendingFocus.current) { focusFieldIssueV2(surfaceRef.current, pendingFocus.current); pendingFocus.current = null; } });
  const validation = activityValidationV2(pkg);
  const formIssues = [...issues, ...validation.issues];
  const selectedObjective = pkg.objectives.some((item) => item.key === objectiveKey) ? objectiveKey : pkg.objectives[0]?.key ?? "";
  function change(next: typeof pkg) { if (!disabled) onChange({ ...draft, package: next }); }
  function locate(path: string) { focusFieldIssueV2(surfaceRef.current, path); }
  return <div ref={surfaceRef} className={local.stack}>
    <section className={styles.card}><div className={styles.sectionHeading}><div><span>Paso 3 de 5</span><h2>Recorrido</h2><p>Organiza estudio y práctica por objetivo. Abre una actividad para editarla.</p></div></div>
      <fieldset className={styles.fieldset} disabled={disabled}><div className={styles.fieldGrid}>
        <FieldV2 label="Tipo de nueva actividad" path="activity.newKind">{(input) => <select {...input} value={preset} onChange={(event) => setPreset(event.target.value as ActivityPresetV2)}>{Object.entries(activityTypesV2).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
        <FieldV2 label="Objetivo de nueva actividad" path="activity.newObjective">{(input) => <select {...input} value={selectedObjective} onChange={(event) => setObjectiveKey(event.target.value)}>{!selectedObjective ? <option value="">Añade un objetivo primero</option> : null}{pkg.objectives.map((objective) => <option value={objective.key} key={objective.key}>{objective.title || "Objetivo sin título"}</option>)}</select>}</FieldV2>
        <button ref={addRef} className={styles.primaryAction} type="button" disabled={disabled || !selectedObjective || pkg.activities.length >= 2000} onClick={() => { const next = addActivityV2(pkg, preset, selectedObjective); if (next === pkg) return; pendingFocus.current = `package.activities.${pkg.activities.length}.prompt`; change(next); }}>Añadir actividad</button>
      </div></fieldset>
      {!pkg.objectives.length ? <p className={styles.emptyState}>Crea una unidad y un objetivo en Objetivos para comenzar.</p> : null}
      {!pkg.activities.length ? <p className={styles.fieldHint}>No hay actividades todavía.</p> : null}
    </section>
    {validation.objectives.some((group) => group.issues.length) ? <section className={styles.card} aria-label="Validación por objetivo"><h2>Validación por objetivo</h2><p className={styles.fieldHint}>{validation.valid ? "El borrador tiene estructura válida. Estos pendientes impiden publicar; puedes seguir editando y guardarlo." : "Completa los campos de las actividades antes de guardar. Después se comprobará la cobertura para publicar."}</p>
      {validation.objectives.filter((group) => group.issues.length).map((group) => <details key={group.objective.key} className={styles.disclosure}><summary>{group.objective.title || "Objetivo sin título"} · {group.issues.length} pendientes</summary><ul>{group.issues.map((issue, index) => <li key={`${issue.path}:${index}`}>{issue.message} {issue.suggestedFix} {issue.path.startsWith("/activities/") ? <button className={styles.textButton} type="button" onClick={() => locate(issue.path)}>Ir a la actividad</button> : null}</li>)}</ul></details>)}
    </section> : null}
    {pkg.units.map((unit) => <section key={unit.key} aria-label={unit.title || "Unidad"} className={local.stack}><h2>{unit.title || "Unidad sin título"}</h2>
      {unit.activityKeys.map((key) => { const index = pkg.activities.findIndex((item) => item.key === key); const activity = pkg.activities[index]; if (!activity) return <p key={key} role="alert">Hay una actividad ausente en la unidad.</p>; const path = `package.activities.${index}`; const block = activityDeletionBlockV2(pkg, key); const onActivityChange = (next: typeof activity) => change(replaceActivityV2(pkg, next)); const fields = { activity, pkg, path, issues: formIssues, onChange: onActivityChange };
        return <details key={key} className={`${styles.card} ${local.activityCard}`}><summary className={local.activitySummary}>{activity.kind === "constructed_response" ? "Respuesta construida / tarjeta" : activityTypesV2[activity.kind]} · {activity.prompt || `Actividad ${index + 1} sin consigna`}</summary>
          <div className={local.stack}><div className={styles.sectionHeading}><h3>{activityTypesV2[activity.kind]}</h3><button className={styles.dangerButton} type="button" disabled={disabled || Boolean(block)} title={block ?? undefined} onClick={() => setDeleting(key)}>Eliminar actividad</button></div>{block ? <p className={styles.fieldHint}>{block}</p> : null}
            <fieldset disabled={disabled} className={styles.fieldset}><div className={local.stack}><ActivityCommonV2 {...fields} />
              {activity.kind === "study" ? <ActivityStudyV2 {...fields} activity={activity} /> : null}
              {activity.kind === "single_choice" ? <ActivityChoiceOptionsV2 {...fields} activity={activity} /> : null}
              <VisualActivityV2 {...fields} />
              <details className={`${styles.disclosure} ${local.activitySolution}`}><summary>Solución y feedback · solo edición</summary><p className={styles.fieldHint}>Área editorial. La entrega de soluciones al alumno depende del envío o revelado autorizado por el servidor.</p><div className={local.stack}>
                {activity.kind === "single_choice" ? <ActivityChoiceSolutionV2 {...fields} activity={activity} /> : null}
                {activity.kind === "short_answer" ? <ActivityShortSolutionV2 {...fields} activity={activity} /> : null}
                {activity.kind === "constructed_response" ? <ActivityConstructedSolutionV2 {...fields} activity={activity} /> : null}
                <VisualActivityV2 {...fields} solution />
                <ActivityFeedbackV2 {...fields} />
              </div></details>
            </div></fieldset>
          </div>
        </details>;
      })}
    </section>)}
    <AlertDialog.Root open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialog.Portal><AlertDialog.Overlay className={styles.dialogOverlay} /><AlertDialog.Content className={styles.dialog} data-editor-surface onCloseAutoFocus={(event) => { if (restoreAddFocus.current) { event.preventDefault(); restoreAddFocus.current = false; addRef.current?.focus(); } }}><AlertDialog.Title className={styles.dialogTitle}>Eliminar actividad</AlertDialog.Title><AlertDialog.Description className={styles.dialogDescription}>Se quitará esta actividad del borrador y de su unidad. Los vínculos desde evaluaciones u otras actividades deben reasignarse primero.</AlertDialog.Description><div className={styles.dialogActions}><AlertDialog.Cancel asChild><button className={styles.secondaryButton} type="button">Cancelar</button></AlertDialog.Cancel><button className={styles.dangerButton} type="button" disabled={disabled || !deleting || Boolean(activityDeletionBlockV2(pkg, deleting))} onClick={() => { if (deleting) { restoreAddFocus.current = true; change(deleteActivityV2(pkg, deleting)); } setDeleting(null); }}>Confirmar eliminación</button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
