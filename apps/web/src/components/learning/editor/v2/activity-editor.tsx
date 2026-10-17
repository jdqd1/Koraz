"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import { Eye, PencilSimple, Plus, MagnifyingGlass, Trash, CaretRight, BookOpen } from "@phosphor-icons/react";
import { focusFieldIssueV2, type FormPropsV2 } from "./sources-fields";
import { activityDeletionBlockV2, activityTypesV2, activityValidationV2, addActivityV2, deleteActivityV2, replaceActivityV2, type ActivityPresetV2 } from "./activity-model";
import { ActivitySettingsV2 } from "./activity-fields";
import { ActivityContentV2 } from "./activity-content";
import { ActivityPickerV2, activityIconsV2 } from "./activity-picker";
import { ActivityStudentPreviewV2 } from "./activity-student-preview";
import { EditorDisclosureV2 } from "./editor-disclosure";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export function ActivityEditorV2({ draft, disabled, onChange, issues = [] }: FormPropsV2) {
  const pkg = draft.package;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => pkg.units.flatMap(unit => unit.activityKeys)[0] ?? null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [search, setSearch] = useState("");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const restoreAddFocus = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const path = pendingFocus.current; pendingFocus.current = null;
    requestAnimationFrame(() => focusFieldIssueV2(surfaceRef.current, path));
  });
  const validation = activityValidationV2(pkg);
  const formIssues = [...issues, ...validation.issues];
  const activityIndices = new Map(pkg.activities.map((activity, index) => [activity.key, index]));
  const selectedIndex = selectedKey ? activityIndices.get(selectedKey) : undefined;
  const activity = selectedIndex === undefined ? undefined : pkg.activities[selectedIndex];
  const path = `package.activities.${selectedIndex}`;
  const block = activity ? activityDeletionBlockV2(pkg, activity.key) : null;
  const fields = activity ? { activity, pkg, path, issues: formIssues, onChange: (next: typeof activity) => change(replaceActivityV2(pkg, next)) } : null;
  function change(next: typeof pkg) { if (!disabled) onChange({ ...draft, package: next }); }
  function select(key: string) { setSelectedKey(key); setMode("edit"); }
  function locate(issuePath: string) { setSearch(""); setMode("edit"); pendingFocus.current = issuePath; requestAnimationFrame(() => focusFieldIssueV2(surfaceRef.current, issuePath)); }
  function create(preset: ActivityPresetV2, objectiveKey: string) {
    const next = addActivityV2(pkg, preset, objectiveKey);
    if (next === pkg) return;
    setSearch(""); setMode("edit"); setSelectedKey(next.activities[pkg.activities.length]!.key);
    pendingFocus.current = `package.activities.${pkg.activities.length}.prompt`;
    change(next); setPickerOpen(false);
  }
  const matches = (key: string) => {
    const item = pkg.activities[activityIndices.get(key) ?? -1];
    return !search || Boolean(item && `${item.prompt} ${activityTypesV2[item.kind]}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));
  };
  return <div ref={surfaceRef} className={local.stack}>
    <div className={local.activitiesHeading}><h2>Actividades <span>{pkg.activities.length}</span></h2><button ref={addRef} data-field-path="activity.new" className={styles.primaryAction} type="button" disabled={disabled || !pkg.objectives.length || pkg.activities.length >= 2000} onClick={() => setPickerOpen(true)}><Plus size={18} aria-hidden /> Añadir actividad</button></div>
    <ActivityPickerV2 pkg={pkg} disabled={disabled} open={pickerOpen} onOpenChange={setPickerOpen} onCreate={create} />
    <div className={local.activityWorkspace}>
      <aside className={local.activityNavigator} aria-label="Actividades por unidad">
        <label className={local.activitySearch}><MagnifyingGlass size={17} aria-hidden /><span className={local.visuallyHidden}>Buscar actividad</span><input type="search" placeholder="Buscar actividad" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className={local.activityList}>{pkg.units.map(unit => <section key={unit.key} hidden={!unit.activityKeys.some(matches)} aria-label={unit.title || "Unidad"}>
          <h3 className={local.activityUnit}>{unit.title || "Unidad sin título"}<span>{unit.activityKeys.length}</span></h3>
          {unit.activityKeys.map(key => {
            const index = activityIndices.get(key); const item = index === undefined ? undefined : pkg.activities[index];
            if (!item || index === undefined) return <p key={key} role="alert">Hay una actividad ausente en la unidad.</p>;
            const active = activity?.key === key; const Icon = activityIconsV2[item.kind];
            return <details key={key} open={active} hidden={!matches(key)} className={local.activityListItem} onToggle={event => {
              if (!event.currentTarget.open) return;
              const summary = event.currentTarget.querySelector<HTMLElement>("summary");
              if (summary?.dataset.pendingFieldPath) { pendingFocus.current = summary.dataset.pendingFieldPath; delete summary.dataset.pendingFieldPath; setSearch(""); }
              if (!active) select(key);
            }}><summary onClick={event => { event.preventDefault(); select(key); }} data-field-path={active ? undefined : `package.activities.${index}`} data-lazy-activity={active ? undefined : "true"} aria-label={`${activityTypesV2[item.kind]} · ${item.prompt || `Actividad ${index + 1} sin consigna`}`}>
              <Icon size={19} aria-hidden /><span><strong>{item.prompt || "Actividad sin consigna"}</strong><small>{activityTypesV2[item.kind]}</small></span><CaretRight size={13} aria-hidden />
            </summary></details>;
          })}
        </section>)}</div>
        {!pkg.activities.length ? <p className={local.listEmpty}>Las actividades aparecerán aquí, organizadas por unidad.</p> : !pkg.activities.some(item => matches(item.key)) ? <p className={local.listEmpty}>No hay actividades con ese nombre.</p> : null}
      </aside>
      {activity && fields ? <div className={local.activityDetail} data-activity-form={activity.key} key={activity.key}>
        <div className={local.activityToolbar}><h3>{activityTypesV2[activity.kind]}</h3><div className={local.modeSwitch} aria-label="Modo de actividad"><button type="button" aria-pressed={mode === "edit"} onClick={() => setMode("edit")}><PencilSimple size={16} aria-hidden /> Editar</button><button type="button" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}><Eye size={17} aria-hidden /> Probar</button></div></div>
        <div className={local.activityColumns}>
          <aside className={local.activityInspector} aria-label="Configuración de la actividad">
            <fieldset disabled={disabled} className={styles.fieldset}><h3>Configuración</h3>
              <ActivityContentV2 {...fields} />
              <ActivitySettingsV2 {...fields} />
            </fieldset>
            <div className={local.inspectorDelete}><button className={styles.dangerButton} type="button" disabled={disabled || Boolean(block)} title={block ?? undefined} onClick={() => setDeleting(activity.key)}><Trash size={16} aria-hidden /> Eliminar actividad</button>{block ? <p className={styles.fieldHint}>{block}</p> : null}</div>
          </aside>
          <div className={local.activityCanvas}>
            <ActivityStudentPreviewV2 key={`${activity.key}:${mode}`} activity={activity} activities={pkg.activities} assets={pkg.assets} interactive={mode === "preview"} />
          </div>
        </div>
      </div> : <div className={local.activityWelcome}><BookOpen size={40} weight="light" aria-hidden /><h3>{pkg.objectives.length ? "Crea tu primera actividad" : "Añade un objetivo para comenzar"}</h3><p>{pkg.objectives.length ? "Explora los tipos y prueba un ejemplo antes de elegir." : "Cada actividad pertenece a un objetivo de aprendizaje."}</p>{pkg.objectives.length ? <button className={styles.primaryAction} type="button" disabled={disabled} onClick={() => setPickerOpen(true)}>Elegir actividad</button> : null}</div>}
    </div>
    {validation.objectives.some(group => group.issues.length) ? <EditorDisclosureV2 title="Pendientes para publicar" description={`${validation.objectives.filter(group => group.issues.length).length} objetivos por completar`}><section className={styles.card} aria-label="Validación por objetivo"><h2>Validación por objetivo</h2><p className={styles.fieldHint}>{validation.valid ? "Puedes seguir editando y guardar el borrador. Resuelve estos pendientes antes de publicar." : "Completa los campos marcados antes de guardar."}</p>{validation.objectives.filter(group => group.issues.length).map(group => <details key={group.objective.key} className={styles.disclosure}><summary>{group.objective.title || "Objetivo sin título"} · {group.issues.length} pendientes</summary><ul>{group.issues.map((issue, index) => <li key={`${issue.path}:${index}`}>{issue.message} {issue.suggestedFix} {issue.path.startsWith("/activities/") ? <button className={styles.textButton} type="button" onClick={() => locate(issue.path)}>Ir a la actividad</button> : null}</li>)}</ul></details>)}</section></EditorDisclosureV2> : null}
    <AlertDialog.Root open={Boolean(deleting)} onOpenChange={open => { if (!open) setDeleting(null); }}><AlertDialog.Portal><AlertDialog.Overlay className={`${styles.dialogOverlay} ${local.dialogOverlay}`} /><AlertDialog.Content className={`${styles.dialog} ${local.dialog}`} data-editor-surface onCloseAutoFocus={event => { if (restoreAddFocus.current) { event.preventDefault(); restoreAddFocus.current = false; addRef.current?.focus(); } }}><AlertDialog.Title className={styles.dialogTitle}>Eliminar actividad</AlertDialog.Title><AlertDialog.Description className={styles.dialogDescription}>Se quitará esta actividad del borrador y de su unidad. Los vínculos desde evaluaciones u otras actividades deben reasignarse primero.</AlertDialog.Description><div className={styles.dialogActions}><AlertDialog.Cancel asChild><button className={styles.secondaryButton} type="button">Cancelar</button></AlertDialog.Cancel><button className={styles.dangerButton} type="button" disabled={disabled || !deleting || Boolean(activityDeletionBlockV2(pkg, deleting))} onClick={() => { if (deleting) { restoreAddFocus.current = true; const next = deleteActivityV2(pkg, deleting); setSelectedKey(next.units.flatMap(unit => unit.activityKeys)[0] ?? null); change(next); } setDeleting(null); }}>Confirmar eliminación</button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
