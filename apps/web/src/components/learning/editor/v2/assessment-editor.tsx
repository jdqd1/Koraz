"use client";

import { useLayoutEffect, useRef } from "react";
import { type RoutePackage, validateRoutePackage } from "@cediah/contracts";
import { nextLocalKeyV2 } from "./editor-model";
import { FieldV2, focusFieldIssueV2, type FormPropsV2 } from "./sources-fields";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

type Assessment = RoutePackage["assessments"][number];
export const assessmentLabelsV2: Record<Assessment["kind"], string> = { diagnostic: "Diagnóstico", unit_gate: "Comprobación de unidad", checkpoint: "Comprobación acumulativa", final: "Evaluación final", retention7: "Retención a 7 días", retention30: "Retención a 30 días" };
export function assessmentCandidatesV2(pkg: RoutePackage, assessment: Assessment) {
  const children = new Set(pkg.activities.flatMap((activity) => activity.kind === "case" ? activity.payload.stages.map((stage) => stage.childActivityKey) : []));
  const reserved = ["diagnostic", "final", "retention7", "retention30"].includes(assessment.kind);
  return pkg.activities.filter((activity) => !children.has(activity.key) && !["study", "constructed_response"].includes(activity.kind)
    && assessment.objectiveKeys.includes(activity.objectiveKey)
    && (reserved ? activity.use === assessment.kind : ["learning", "gate"].includes(activity.use))
    && !pkg.assessments.some((other) => other.key !== assessment.key && other.candidateActivityKeys.includes(activity.key) && (reserved || ["diagnostic", "final", "retention7", "retention30"].includes(other.kind))));
}
export function addAssessmentV2(pkg: RoutePackage, kind: Assessment["kind"]): RoutePackage {
  if (pkg.assessments.length >= 200) return pkg;
  return { ...pkg, assessments: [...pkg.assessments, { key: nextLocalKeyV2(kind, pkg.assessments.map((item) => item.key)), kind, afterUnitKey: kind === "unit_gate" || kind === "checkpoint" ? pkg.units[0]?.key ?? null : null, objectiveKeys: [], candidateActivityKeys: [], thresholdPercent: 80, thresholdRationale: "" }] };
}
function toggle(keys: string[], key: string, checked: boolean) { return checked ? [...new Set([...keys, key])] : keys.filter((item) => item !== key); }
export function AssessmentEditorV2({ draft, disabled, onChange, issues = [] }: FormPropsV2) {
  const pkg = draft.package;
  const surface = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => { if (pendingFocus.current) { focusFieldIssueV2(surface.current, pendingFocus.current); pendingFocus.current = null; } });
  function update(next: RoutePackage) { onChange({ ...draft, package: next }); }
  function patch(key: string, values: Partial<Assessment>) { update({ ...pkg, assessments: pkg.assessments.map((item) => item.key === key ? { ...item, ...values } : item) }); }
  const coverage = validateRoutePackage(pkg).issues.filter((issue) => ["OBJECTIVE_COVERAGE", "BANK_TOO_SMALL", "RESERVE_LEAK", "CRITICAL_GATE_MISSING"].includes(issue.code));
  return <div ref={surface} className={local.stack}>
    <section className={styles.card}><h2>Evaluación y repaso</h2><p>Selecciona preguntas existentes. Las reservas final, 7 y 30 días se mantienen separadas de la práctica.</p><div className={`${styles.inlineActions} ${local.assessmentActions}`}>{Object.entries(assessmentLabelsV2).map(([kind, label]) => <button className={styles.secondaryButton} disabled={disabled || pkg.assessments.length >= 200} type="button" key={kind} onClick={() => { pendingFocus.current = `package.assessments.${pkg.assessments.length}.objectiveKeys`; update(addAssessmentV2(pkg, kind as Assessment["kind"])); }}>Añadir {label.toLocaleLowerCase("es")}</button>)}</div></section>
    {pkg.assessments.map((item, index) => { const path = `package.assessments.${index}`; const candidates = assessmentCandidatesV2(pkg, item); const unavailable = item.candidateActivityKeys.filter((key) => !candidates.some((activity) => activity.key === key)); return <section className={styles.card} key={item.key}>
      <div className={styles.sectionHeading}><h3>{assessmentLabelsV2[item.kind]}</h3><button className={styles.dangerButton} type="button" disabled={disabled} onClick={() => update({ ...pkg, assessments: pkg.assessments.filter((assessment) => assessment.key !== item.key) })}>Eliminar evaluación {index + 1}</button></div>
      <fieldset disabled={disabled} className={styles.fieldset}><legend className={local.visuallyHidden}>Configurar {assessmentLabelsV2[item.kind]}</legend><div className={styles.fieldGrid}>
        <FieldV2 label="Después de la unidad" path={`${path}.afterUnitKey`} issues={issues}>{(input) => <select {...input} value={item.afterUnitKey ?? ""} onChange={(event) => patch(item.key, { afterUnitKey: event.target.value || null })}><option value="">Sin unidad específica</option>{pkg.units.map((unit) => <option key={unit.key} value={unit.key}>{unit.title || unit.key}</option>)}</select>}</FieldV2>
        <FieldV2 label="Objetivos evaluados" path={`${path}.objectiveKeys`} issues={issues} wide>{(input) => <div {...input} tabIndex={-1} className={local.choices}>{pkg.objectives.map((objective) => <label key={objective.key} className={local.checkOption}><input type="checkbox" checked={item.objectiveKeys.includes(objective.key)} onChange={(event) => { const objectiveKeys = toggle(item.objectiveKeys, objective.key, event.target.checked); patch(item.key, { objectiveKeys, candidateActivityKeys: item.candidateActivityKeys.filter((key) => objectiveKeys.includes(pkg.activities.find((activity) => activity.key === key)?.objectiveKey ?? "")) }); }} />{objective.title || objective.key}</label>)}</div>}</FieldV2>
        <FieldV2 label="Banco de preguntas" path={`${path}.candidateActivityKeys`} issues={issues} wide>{(input) => <div {...input} tabIndex={-1} className={local.choices}>{!candidates.length ? <p>No disponible: falta banco de preguntas para estos objetivos y esta evaluación.</p> : candidates.map((activity) => <label className={local.checkOption} key={activity.key}><input type="checkbox" checked={item.candidateActivityKeys.includes(activity.key)} onChange={(event) => patch(item.key, { candidateActivityKeys: toggle(item.candidateActivityKeys, activity.key, event.target.checked) })} />{activity.prompt || activity.key}</label>)}{unavailable.map((key) => <label className={local.checkOption} key={key}><input type="checkbox" checked onChange={() => patch(item.key, { candidateActivityKeys: item.candidateActivityKeys.filter((entry) => entry !== key) })} />Pregunta incompatible: {pkg.activities.find((activity) => activity.key === key)?.prompt || key} · retira el vínculo</label>)}<p>{new Set(candidates.filter((activity) => item.candidateActivityKeys.includes(activity.key)).map((activity) => activity.equivalenceKey)).size} familias seleccionadas.</p></div>}</FieldV2>
      </div><details className={local.activitySubcard}><summary>Umbral y justificación editorial</summary><div className={styles.fieldGrid}><FieldV2 label="Umbral de producto (%)" path={`${path}.thresholdPercent`} issues={issues} hint={item.kind === "diagnostic" ? "El diagnóstico no acredita dominio; 80 es un campo no operativo." : "Entre 80 y 100. Es una decisión editorial, no una constante científica."}>{(input) => <input {...input} type="number" min={80} max={100} step={1} disabled={item.kind === "diagnostic"} value={item.thresholdPercent} onChange={(event) => patch(item.key, { thresholdPercent: event.target.valueAsNumber || 0 })} />}</FieldV2><FieldV2 label="Justificación del umbral" path={`${path}.thresholdRationale`} issues={issues} wide hint="Obligatoria: entre 40 y 2000 caracteres.">{(input) => <textarea {...input} required minLength={40} maxLength={2000} value={item.thresholdRationale} onChange={(event) => patch(item.key, { thresholdRationale: event.target.value })} />}</FieldV2></div></details></fieldset>
    </section>; })}
    <section className={styles.card}><h3>Objetivos para repasar</h3><fieldset disabled={disabled} className={styles.fieldset}><legend className={local.visuallyHidden}>Plan de repaso</legend><div data-field-path="package.reviewPlan.objectiveKeys" tabIndex={-1}>{pkg.objectives.map((objective) => <label className={local.checkOption} key={objective.key}><input type="checkbox" checked={pkg.reviewPlan.objectiveKeys.includes(objective.key)} onChange={(event) => update({ ...pkg, reviewPlan: { objectiveKeys: toggle(pkg.reviewPlan.objectiveKeys, objective.key, event.target.checked) } })} />{objective.title || objective.key}</label>)}</div></fieldset><p>{coverage.length ? `${coverage.length} incidencias de cobertura pendientes. Consulta Revisión para ir a cada campo.` : "La cobertura local no presenta incidencias. El servidor verificará las fuentes y los permisos."}</p></section>
  </div>;
}

