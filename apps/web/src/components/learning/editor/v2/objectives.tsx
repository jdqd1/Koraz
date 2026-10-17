"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import type { RoutePackage } from "@cediah/contracts";
import { nextLocalKeyV2 } from "./editor-model";
import { DependenciesV2, DependencyOrderV2 } from "./dependencies";
import { FieldV2, focusFieldIssueV2, type FormPropsV2 } from "./sources-fields";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";
import { EditorDisclosureV2 } from "./editor-disclosure";
import { BookOpen, CaretRight, Plus, Target, Trash } from "@phosphor-icons/react";
import { sourceLabelV2 } from "./source-labels";

type Objective = RoutePackage["objectives"][number];
export const objectiveVerbsV2: Record<Objective["verb"], string> = { identify: "Identificar", recall: "Recordar", relate: "Relacionar", differentiate: "Diferenciar", explain: "Explicar", predict: "Predecir", order: "Ordenar", apply: "Aplicar", integrate: "Integrar" };
const importance: Record<Objective["criticality"], string> = { core: "Esencial", high_yield: "Prioritario", supporting: "Complementario", detail: "Detalle" };
export function objectiveDeletionBlockV2(pkg: RoutePackage, key: string) {
  if (pkg.activities.some((item) => item.objectiveKey === key || item.relatedObjectiveKeys.includes(key))) return "Este objetivo está vinculado a actividades. Reasígnalas antes de eliminarlo.";
  if (pkg.assessments.some((item) => item.objectiveKeys.includes(key))) return "Este objetivo está incluido en evaluaciones. Retíralo de ellas antes de eliminarlo.";
  return null;
}
export function deleteObjectiveV2(pkg: RoutePackage, key: string): RoutePackage {
  if (objectiveDeletionBlockV2(pkg, key)) return pkg;
  return { ...pkg, objectives: pkg.objectives.filter((item) => item.key !== key).map((item) => ({ ...item, prerequisiteKeys: item.prerequisiteKeys.filter((value) => value !== key) })), units: pkg.units.map((unit) => ({ ...unit, objectiveKeys: unit.objectiveKeys.filter((value) => value !== key) })), reviewPlan: { objectiveKeys: pkg.reviewPlan.objectiveKeys.filter((value) => value !== key) } };
}
export function moveObjectiveV2(pkg: RoutePackage, key: string, unitKey: string): RoutePackage {
  if (!pkg.units.some((unit) => unit.key === unitKey)) return pkg;
  const activityKeys = pkg.activities.filter((activity) => activity.objectiveKey === key).map((activity) => activity.key);
  return { ...pkg, objectives: pkg.objectives.map((item) => item.key === key ? { ...item, unitKey } : item), units: pkg.units.map((unit) => ({ ...unit, objectiveKeys: [...unit.objectiveKeys.filter((value) => value !== key), ...(unit.key === unitKey ? [key] : [])], activityKeys: [...unit.activityKeys.filter((value) => !activityKeys.includes(value)), ...(unit.key === unitKey ? activityKeys : [])] })) };
}
export function ObjectivesV2({ draft, disabled, onChange, issues = [] }: FormPropsV2) {
  const pkg = draft.package;
  const surface = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => { if (pendingFocus.current) { focusFieldIssueV2(surface.current, pendingFocus.current); pendingFocus.current = null; } });
  const [unitTitle, setUnitTitle] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  function change(next: RoutePackage) { if (!disabled) onChange({ ...draft, package: next }); }
  function patch(key: string, values: Partial<Objective>) { change({ ...pkg, objectives: pkg.objectives.map((item) => item.key === key ? { ...item, ...values } : item) }); }
  function locate(key: string) { const index = pkg.objectives.findIndex((item) => item.key === key); requestAnimationFrame(() => focusFieldIssueV2(surface.current, `package.objectives.${index}.title`)); }
  function add() {
    if (disabled || !pkg.units.length || pkg.objectives.length >= 200) return;
    const key = nextLocalKeyV2("objetivo", pkg.objectives.map((item) => item.key));
    const unit = pkg.units[0]!;
    pendingFocus.current = `package.objectives.${pkg.objectives.length}.title`;
    change({ ...pkg, objectives: [...pkg.objectives, { key, title: "", unitKey: unit.key, verb: "identify", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }], units: pkg.units.map((item) => item.key === unit.key ? { ...item, objectiveKeys: [...item.objectiveKeys, key] } : item) });
  }
  return <div ref={surface} className={local.objectivesLayout}>
    <aside className={`${styles.card} ${local.objectivesUnits}`} aria-label="Unidades de la ruta"><div className={local.objectivesUnitsHeading}><h2>Unidades</h2><span>{pkg.units.length}</span></div>
      {pkg.units.length ? <nav aria-label="Ver objetivos por unidad"><ul className={local.unitIndex}>{pkg.units.map((unit, index) => {
        const objectives = pkg.objectives.filter(item => item.unitKey === unit.key);
        return <li key={unit.key}><button type="button" data-field-path={`package.units.${index}`} disabled={!objectives.length} aria-label={`Ver objetivos de ${unit.title || "Unidad sin título"}`} onClick={() => { if (objectives[0]) locate(objectives[0].key); }}><BookOpen size={18} aria-hidden /><span><strong>{unit.title || "Unidad sin título"}</strong><small>{objectives.length ? `${objectives.length} ${objectives.length === 1 ? "objetivo" : "objetivos"}` : "Aún sin objetivos"}</small></span><CaretRight size={14} aria-hidden /></button></li>;
      })}</ul></nav> : <p className={local.unitsHint}>Las unidades agrupan los objetivos del mismo tema.</p>}
      <fieldset className={`${styles.fieldset} ${local.newUnitForm}`} disabled={disabled}><legend className={local.visuallyHidden}>Crear una unidad</legend><FieldV2 label="Nombre de nueva unidad" path="package.units" issues={issues}>{(input) => <input {...input} maxLength={240} placeholder="Ej. Arterias del abdomen" onChange={(event) => setUnitTitle(event.target.value)} value={unitTitle} />}</FieldV2><button className={styles.secondaryButton} type="button" disabled={disabled || !unitTitle.trim() || pkg.units.length >= 30} onClick={() => { const key = nextLocalKeyV2("unidad", pkg.units.map((item) => item.key)); change({ ...pkg, units: [...pkg.units, { key, title: unitTitle.trim(), objectiveKeys: [], activityKeys: [], support: "full", estimatedMinutes: null }] }); setUnitTitle(""); setMessage("Unidad añadida. Ya puedes asignar objetivos."); }}><Plus size={16} aria-hidden /> Añadir unidad</button></fieldset>
      {pkg.objectives.length ? <EditorDisclosureV2 title="Orden de aprendizaje"><DependencyOrderV2 pkg={pkg} onLocate={locate} embedded /></EditorDisclosureV2> : null}
    </aside>
    <section className={`${styles.card} ${local.objectivesPanel}`}><div className={`${styles.sectionHeading} ${local.objectivesHeading}`}><h2>Objetivos <span>{pkg.objectives.length}</span></h2><button ref={addRef} className={styles.primaryAction} disabled={disabled || !pkg.units.length || pkg.objectives.length >= 200} onClick={add} type="button" data-field-path="package.objectives"><Plus size={17} aria-hidden /> Añadir objetivo</button></div>
      {message ? <p role="status" className={local.objectiveNotice}>{message}</p> : null}
      {!pkg.objectives.length ? <div className={local.objectivesEmpty}><Target size={36} weight="light" aria-hidden /><h3>{pkg.units.length ? "Define qué aprenderá el estudiante" : "Crea tu primera unidad"}</h3><p>{pkg.units.length ? "Añade objetivos concretos, como identificar una estructura o explicar una relación." : "Después podrás añadir los objetivos y organizar el aprendizaje."}</p></div> : null}
    {pkg.objectives.map((objective, index) => { const path = `package.objectives.${index}`; const block = objectiveDeletionBlockV2(pkg, objective.key); return <section className={local.objectiveRow} key={objective.key} aria-label={`Objetivo ${index + 1}`}><EditorDisclosureV2 card title={objective.title || `Objetivo ${index + 1}`} description={pkg.units.find((unit) => unit.key === objective.unitKey)?.title || "Sin unidad"} badge={<span className={local.objectivePriority} data-priority={objective.criticality}>{importance[objective.criticality]}</span>} initiallyOpen={!objective.title || index === 0}>
      <fieldset className={styles.fieldset} disabled={disabled}><legend className={local.visuallyHidden}>Editar {objective.title || `objetivo ${index + 1}`}</legend><div className={local.objectiveFields}>
        <FieldV2 label="Objetivo de aprendizaje" path={`${path}.title`} issues={issues} wide hint="Por ejemplo: identificar las relaciones de una estructura.">{(input) => <input {...input} maxLength={240} placeholder="Ej. Identificar las ramas de la aorta abdominal" required value={objective.title} onChange={(event) => patch(objective.key, { title: event.target.value })} />}</FieldV2>
        <FieldV2 label="Unidad" path={`${path}.unitKey`} issues={issues}>{(input) => <select {...input} value={objective.unitKey} onChange={(event) => change(moveObjectiveV2(pkg, objective.key, event.target.value))}>{!pkg.units.some((unit) => unit.key === objective.unitKey) ? <option value={objective.unitKey}>Unidad ausente: selecciona otra</option> : null}{pkg.units.map((unit) => <option key={unit.key} value={unit.key}>{unit.title || "Unidad sin título"}</option>)}</select>}</FieldV2>
        <FieldV2 label="Acción del estudiante" path={`${path}.verb`} issues={issues}>{(input) => <select {...input} value={objective.verb} onChange={(event) => patch(objective.key, { verb: event.target.value as Objective["verb"] })}>{Object.entries(objectiveVerbsV2).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
        <FieldV2 label="Prioridad" path={`${path}.criticality`} issues={issues}>{(input) => <select {...input} value={objective.criticality} onChange={(event) => { const criticality = event.target.value as Objective["criticality"]; patch(objective.key, { criticality, required: criticality === "core" || objective.required }); }}>{Object.entries(importance).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
        <label className={`${styles.checkboxRow} ${local.objectiveRequired}`}><input data-field-path={`${path}.required`} disabled={disabled || objective.criticality === "core"} type="checkbox" checked={objective.required} onChange={(event) => patch(objective.key, { required: event.target.checked })} />Obligatorio{objective.criticality === "core" ? " (objetivo esencial)" : ""}</label>
      </div>
      <EditorDisclosureV2 title="Fuentes del objetivo" initiallyOpen={!objective.sourceKeys.length}>
        <p className={local.contextNote}>Indica dónde se enseña esta capacidad. Las actividades nuevas heredarán estas fuentes para que no tengas que elegirlas cada vez.</p>
        <fieldset className={`${local.choices} ${local.objectiveSources}`} data-field-path={`${path}.sourceKeys`} tabIndex={-1}>
          <legend className={local.visuallyHidden}>Fuentes del objetivo</legend>
          {pkg.sources.map(source => <label className={`${styles.checkboxRow} ${local.sourceChoice}`} key={source.key}>
            <input type="checkbox" checked={objective.sourceKeys.includes(source.key)} onChange={event => patch(objective.key, {
              sourceKeys: event.target.checked ? [...objective.sourceKeys, source.key] : objective.sourceKeys.filter(key => key !== source.key),
            })} />
            <span>{sourceLabelV2(pkg.sources, source)}{source.locator.heading && !source.title.includes(source.locator.heading) ? <small>{source.locator.heading}</small> : null}</span>
          </label>)}
          {!pkg.sources.length ? <p className={styles.fieldHint}>Añade una fuente en Datos y fuentes.</p> : null}
          {objective.sourceKeys.some(key => !pkg.sources.some(source => source.key === key)) ? <p role="alert" className={styles.fieldError}>Hay una fuente ausente. <button className={styles.textButton} type="button" onClick={() => patch(objective.key, { sourceKeys: objective.sourceKeys.filter(key => pkg.sources.some(source => source.key === key)) })}>Retirar referencias ausentes</button></p> : null}
        </fieldset>
      </EditorDisclosureV2>
      <EditorDisclosureV2 title="Requisitos previos"><DependenciesV2 pkg={pkg} objectiveKey={objective.key} disabled={disabled} issues={issues} onChange={change} /></EditorDisclosureV2>
      </fieldset><div className={local.objectiveFooter}><button className={styles.dangerButton} disabled={disabled || Boolean(block)} title={block ?? undefined} onClick={() => setDeleting(objective.key)} type="button"><Trash size={15} aria-hidden /> Eliminar objetivo</button>{block ? <p className={styles.fieldHint}>{block}</p> : null}</div></EditorDisclosureV2>
    </section>; })}
    </section>
    <AlertDialog.Root open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialog.Portal><AlertDialog.Overlay className={styles.dialogOverlay} /><AlertDialog.Content className={styles.dialog} data-editor-surface><AlertDialog.Title className={styles.dialogTitle}>Eliminar objetivo</AlertDialog.Title><AlertDialog.Description className={styles.dialogDescription}>Se quitará este objetivo de su unidad, del repaso y de los prerrequisitos de otros objetivos. Las actividades y evaluaciones vinculadas deben reasignarse primero.</AlertDialog.Description><div className={styles.dialogActions}><AlertDialog.Cancel asChild><button className={styles.secondaryButton} type="button">Cancelar</button></AlertDialog.Cancel><button className={styles.dangerButton} disabled={disabled || !deleting || Boolean(objectiveDeletionBlockV2(pkg, deleting))} type="button" onClick={() => { if (deleting) { change(deleteObjectiveV2(pkg, deleting)); setMessage("Objetivo eliminado; sus enlaces y referencias de repaso se retiraron."); } setDeleting(null); requestAnimationFrame(() => addRef.current?.focus()); }}>Confirmar eliminación</button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
