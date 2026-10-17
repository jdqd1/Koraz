"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { type RoutePackage, validateRoutePackage } from "@cediah/contracts";
import { Plus, Exam, Clock, Trash } from "@phosphor-icons/react";
import { nextLocalKeyV2 } from "./editor-model";
import { FieldV2, focusFieldIssueV2, type FormPropsV2 } from "./sources-fields";
import { ActivityContentV2 } from "./activity-content";
import { ActivityPickerV2 } from "./activity-picker";
import { addActivityV2, replaceActivityV2, activityTypesV2, type ActivityPresetV2 } from "./activity-model";
import { EditorDisclosureV2 } from "./editor-disclosure";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

type Assessment = RoutePackage["assessments"][number];
export const assessmentLabelsV2: Record<Assessment["kind"], string> = { diagnostic: "Diagnóstico inicial", unit_gate: "Comprobación de unidad", checkpoint: "Repaso acumulativo", final: "Evaluación final", retention7: "Control a 7 días", retention30: "Control a 30 días" };
const purposes: Record<Assessment["kind"], string> = {
  diagnostic: "Antes de empezar. Orienta el estudio y el estudiante puede omitirlo; no decide si aprueba.",
  unit_gate: "Al terminar una unidad. Comprueba que puede recordar y aplicar sus objetivos esenciales.",
  checkpoint: "Tras varias unidades. Mezcla lo anterior para recuperarlo durante la preparación del examen.",
  final: "Al terminar la ruta. Usa preguntas nuevas para comprobar que sabe aplicar lo aprendido.",
  retention7: "Después del primer dominio. Comprueba qué recuerda una semana más tarde.",
  retention30: "Después del primer dominio. Comprueba qué conserva al mes.",
};
const questionPresets: readonly ActivityPresetV2[] = ["single_choice", "short_answer", "match", "comparison", "causal_map", "sequence", "image_target"];
const isDeferred = (kind: Assessment["kind"]) => kind === "retention7" || kind === "retention30";
const isReserved = (kind: Assessment["kind"]) => ["diagnostic", "final", "retention7", "retention30"].includes(kind);
export function assessmentCandidatesV2(pkg: RoutePackage, assessment: Assessment) {
  const children = new Set(pkg.activities.flatMap(activity => activity.kind === "case" ? activity.payload.stages.map(stage => stage.childActivityKey) : []));
  return pkg.activities.filter(activity => !children.has(activity.key) && ["single_choice", "short_answer", "match", "sequence", "image_target"].includes(activity.kind)
    && (activity.kind !== "image_target" || activity.payload.masking === "no_labels") && assessment.objectiveKeys.includes(activity.objectiveKey)
    && (isReserved(assessment.kind) ? activity.use === assessment.kind : ["learning", "gate"].includes(activity.use))
    && !pkg.assessments.some(other => other.key !== assessment.key && other.candidateActivityKeys.includes(activity.key) && (isReserved(assessment.kind) || isReserved(other.kind))));
}
export function addAssessmentV2(pkg: RoutePackage, kind: Assessment["kind"]): RoutePackage {
  if (pkg.assessments.length >= 200) return pkg;
  const afterUnitKey = kind === "unit_gate" || kind === "checkpoint" ? pkg.units[0]?.key ?? null : null;
  const objectiveKeys = pkg.objectives.filter(objective => kind === "diagnostic" ? objective.criticality === "core" && !objective.prerequisiteKeys.length : objective.required && (!afterUnitKey || objective.unitKey === afterUnitKey)).map(objective => objective.key);
  return { ...pkg, assessments: [...pkg.assessments, { key: nextLocalKeyV2(kind, pkg.assessments.map(item => item.key)), kind, afterUnitKey, objectiveKeys, candidateActivityKeys: [], thresholdPercent: 80,
    thresholdRationale: kind === "diagnostic" ? "El diagnóstico orienta el estudio y no acredita dominio ni impide avanzar. Su umbral numérico no se utiliza." : "Este control usa el criterio de producto predeterminado del 80 %; no representa un estándar universal de dominio." }] };
}
export function addAssessmentQuestionV2(pkg: RoutePackage, assessmentKey: string, preset: ActivityPresetV2, objectiveKey: string): RoutePackage {
  const assessment = pkg.assessments.find(item => item.key === assessmentKey);
  if (!assessment || !assessment.objectiveKeys.includes(objectiveKey) || !questionPresets.includes(preset)) return pkg;
  const next = addActivityV2(pkg, preset, objectiveKey);
  const created = next.activities[pkg.activities.length];
  if (!created) return pkg;
  const activity = { ...created, use: isReserved(assessment.kind) ? assessment.kind as "diagnostic" | "final" | "retention7" | "retention30" : "gate" as const,
    phase: isDeferred(assessment.kind) ? "retrieve" as const : created.phase };
  return { ...next, activities: next.activities.map(item => item.key === activity.key ? activity : item), assessments: next.assessments.map(item => item.key === assessmentKey ? { ...item, candidateActivityKeys: [...item.candidateActivityKeys, activity.key] } : item) };
}
function toggle(keys: string[], key: string, checked: boolean) { return checked ? [...new Set([...keys, key])] : keys.filter(item => item !== key); }

export function AssessmentEditorV2({ draft, disabled, onChange, issues = [] }: FormPropsV2) {
  const pkg = draft.package;
  const [newKind, setNewKind] = useState<Assessment["kind"]>("final");
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => { if (pendingFocus.current) { focusFieldIssueV2(surface.current, pendingFocus.current); pendingFocus.current = null; } });
  function update(next: RoutePackage) { if (!disabled) onChange({ ...draft, package: next }); }
  function patch(key: string, values: Partial<Assessment>) { update({ ...pkg, assessments: pkg.assessments.map(item => item.key === key ? { ...item, ...values } : item) }); }
  const target = pkg.assessments.find(item => item.key === creatingFor);
  const coverage = validateRoutePackage(pkg).issues.filter(issue => ["OBJECTIVE_COVERAGE", "BANK_TOO_SMALL", "RESERVE_LEAK", "CRITICAL_GATE_MISSING"].includes(issue.code));
  function renderAssessment(item: Assessment, index: number) {
    const path = `package.assessments.${index}`;
    const candidates = assessmentCandidatesV2(pkg, item);
    const unavailable = item.candidateActivityKeys.filter(key => !candidates.some(activity => activity.key === key));
    const unit = pkg.units.find(entry => entry.key === item.afterUnitKey);
    return <section className={`${styles.card} ${local.assessmentCard}`} key={item.key} aria-label={`${assessmentLabelsV2[item.kind]} ${index + 1}`}><EditorDisclosureV2 card title={unit ? `${assessmentLabelsV2[item.kind]} · ${unit.title}` : assessmentLabelsV2[item.kind]} description={`${item.objectiveKeys.length} ${item.objectiveKeys.length === 1 ? "objetivo" : "objetivos"} · ${item.candidateActivityKeys.length} ${item.candidateActivityKeys.length === 1 ? "pregunta" : "preguntas"}`} initiallyOpen={index === 0 || !item.objectiveKeys.length}>
      <p className={local.contextNote}>{purposes[item.kind]}</p><fieldset disabled={disabled} className={styles.fieldset}><legend className={local.visuallyHidden}>Configurar {assessmentLabelsV2[item.kind]}</legend>
        {item.kind === "unit_gate" || item.kind === "checkpoint" ? <FieldV2 label="Después de la unidad" path={`${path}.afterUnitKey`} issues={issues}>{input => <select {...input} value={item.afterUnitKey ?? ""} onChange={event => patch(item.key, { afterUnitKey: event.target.value || null })}><option value="">Selecciona una unidad</option>{pkg.units.map(entry => <option key={entry.key} value={entry.key}>{entry.title || entry.key}</option>)}</select>}</FieldV2> : null}
        <EditorDisclosureV2 title="Qué se evalúa" description={`${item.objectiveKeys.length} ${item.objectiveKeys.length === 1 ? "objetivo seleccionado" : "objetivos seleccionados"}`} initiallyOpen={!item.objectiveKeys.length}><FieldV2 label="Objetivos evaluados" path={`${path}.objectiveKeys`} issues={issues} wide>{input => <div {...input} tabIndex={-1} className={local.objectiveTags}>{pkg.objectives.map(objective => <label key={objective.key} data-selected={item.objectiveKeys.includes(objective.key)}><input type="checkbox" checked={item.objectiveKeys.includes(objective.key)} onChange={event => { const objectiveKeys = toggle(item.objectiveKeys, objective.key, event.target.checked); patch(item.key, { objectiveKeys, candidateActivityKeys: item.candidateActivityKeys.filter(key => objectiveKeys.includes(pkg.activities.find(activity => activity.key === key)?.objectiveKey ?? "")) }); }} />{objective.title || objective.key}</label>)}</div>}</FieldV2></EditorDisclosureV2>
        <div className={local.questionBankHeading}><h3>Preguntas y respuestas</h3><button className={styles.secondaryButton} type="button" disabled={!item.objectiveKeys.length || pkg.activities.length >= 2000} onClick={() => setCreatingFor(item.key)}><Plus size={16} aria-hidden /> Crear pregunta</button></div>
        <p className={local.contextNote}>{isReserved(item.kind) ? "Son exclusivas de esta evaluación. Crea una demanda diferente; cambiar solo las palabras permite memorizar la pregunta." : "Pueden usar actividades de práctica. El estudiante vuelve a responder para comprobar lo aprendido."}</p>
        <FieldV2 label="Banco de preguntas" path={`${path}.candidateActivityKeys`} issues={issues} wide hint="Marca las preguntas que participarán. Abre «Ver respuesta y editar» para cambiar el enunciado, las opciones y la solución.">{input => <div {...input} tabIndex={-1} className={local.questionBank}>
          {!candidates.length ? <div className={local.bankEmpty}><Exam size={26} weight="light" aria-hidden /><p>No disponible: falta banco de preguntas para estos objetivos y esta evaluación.</p><span>Crea aquí la primera pregunta. Su respuesta se configura en el mismo lugar.</span></div> : candidates.map(activity => {
            const activityPath = `package.activities.${pkg.activities.indexOf(activity)}`;
            const questionEditorKey = `${item.key}:${activity.key}`;
            return <div className={local.bankQuestion} key={activity.key}><label className={local.bankQuestionTitle}><input type="checkbox" checked={item.candidateActivityKeys.includes(activity.key)} onChange={event => patch(item.key, { candidateActivityKeys: toggle(item.candidateActivityKeys, activity.key, event.target.checked) })} /><span><strong>{activity.prompt || "Pregunta por redactar"}</strong><small>{activityTypesV2[activity.kind]} · {pkg.objectives.find(objective => objective.key === activity.objectiveKey)?.title}</small></span></label>
              <details className={local.bankQuestionEditor} open={editingQuestion === questionEditorKey} onToggle={event => { if (event.currentTarget.open) setEditingQuestion(questionEditorKey); else if (editingQuestion === questionEditorKey) setEditingQuestion(null); }}><summary data-field-path={activityPath} data-lazy-activity="true">Ver respuesta y editar</summary>{editingQuestion === questionEditorKey ? <ActivityContentV2 activity={activity} pkg={pkg} path={activityPath} issues={issues} onChange={next => update(replaceActivityV2(pkg, next))} /> : null}</details>
            </div>;
          })}
          {unavailable.map(key => <label className={local.checkOption} key={key}><input type="checkbox" checked onChange={() => patch(item.key, { candidateActivityKeys: item.candidateActivityKeys.filter(entry => entry !== key) })} />Pregunta incompatible: {pkg.activities.find(activity => activity.key === key)?.prompt || key} · retira el vínculo</label>)}
        </div>}</FieldV2>
        <EditorDisclosureV2 title="Criterio para aprobar" description={item.kind === "diagnostic" ? "Sin calificación de aprobación" : `${item.thresholdPercent} % de aciertos`}><div className={styles.fieldGrid}><FieldV2 label="Umbral de producto (%)" path={`${path}.thresholdPercent`} issues={issues} hint={item.kind === "diagnostic" ? "El diagnóstico no acredita dominio; este número no se utiliza." : "Entre 80 y 100. Es una decisión editorial, no una constante científica."}>{input => <input {...input} type="number" min={80} max={100} step={1} disabled={item.kind === "diagnostic"} value={item.thresholdPercent} onChange={event => patch(item.key, { thresholdPercent: event.target.valueAsNumber || 0 })} />}</FieldV2><FieldV2 label="Justificación del umbral" path={`${path}.thresholdRationale`} issues={issues} wide hint="Explica por qué este criterio es adecuado para la ruta. El texto inicial describe el valor de producto predeterminado.">{input => <textarea {...input} required rows={3} minLength={40} maxLength={2000} value={item.thresholdRationale} onChange={event => patch(item.key, { thresholdRationale: event.target.value })} />}</FieldV2></div></EditorDisclosureV2>
      </fieldset><div className={local.sourceFooter}><button className={styles.dangerButton} type="button" disabled={disabled} onClick={() => update({ ...pkg, assessments: pkg.assessments.filter(entry => entry.key !== item.key) })}><Trash size={15} aria-hidden /> Eliminar evaluación {index + 1}</button></div>
    </EditorDisclosureV2></section>;
  }
  return <div ref={surface} className={local.stack}>
    <section className={`${styles.card} ${local.assessmentIntro}`}><div className={styles.sectionHeading}><h2>Evaluación y repaso</h2></div>
      <ol className={local.assessmentFlow}><li><span>1</span><strong>Diagnosticar</strong><small>Antes de empezar</small></li><li><span>2</span><strong>Comprobar</strong><small>Durante el estudio</small></li><li><span>3</span><strong>Evaluar</strong><small>Al terminar</small></li></ol>
      <div className={local.inlineForm}><FieldV2 label="Tipo de evaluación" path="assessment.newKind">{input => <select {...input} disabled={disabled} value={newKind} onChange={event => setNewKind(event.target.value as Assessment["kind"])}>{Object.entries(assessmentLabelsV2).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select>}</FieldV2><button className={styles.primaryAction} disabled={disabled || pkg.assessments.length >= 200} type="button" onClick={() => { pendingFocus.current = `package.assessments.${pkg.assessments.length}.objectiveKeys`; update(addAssessmentV2(pkg, newKind)); }}><Plus size={16} aria-hidden /> Añadir evaluación</button></div>
      <p className={local.contextNote}>Para un examen próximo, combina práctica sin ayuda, repasos acumulativos y una evaluación final con preguntas diferentes.</p>
    </section>
    {pkg.assessments.map((item, index) => !isDeferred(item.kind) ? renderAssessment(item, index) : null)}
    <section className={`${styles.card} ${local.longTermCard}`}><EditorDisclosureV2 card title="Conservar lo aprendido" badge={<Clock size={20} aria-hidden />} description="Controles posteriores a 7 y 30 días"><p className={local.contextNote}>Sirven para comprobar retención a largo plazo. No necesitas esperar a estos controles para completar la ruta y preparar tu examen. El sistema programa los repasos; estos días no son campos que debas configurar.</p>
      {pkg.assessments.map((item, index) => isDeferred(item.kind) ? renderAssessment(item, index) : null)}
      <EditorDisclosureV2 title="Objetivos para repasar"><fieldset disabled={disabled} className={styles.fieldset}><legend className={local.visuallyHidden}>Plan de repaso</legend><div data-field-path="package.reviewPlan.objectiveKeys" tabIndex={-1}>{pkg.objectives.map(objective => <label className={local.checkOption} key={objective.key}><input type="checkbox" checked={pkg.reviewPlan.objectiveKeys.includes(objective.key)} onChange={event => update({ ...pkg, reviewPlan: { objectiveKeys: toggle(pkg.reviewPlan.objectiveKeys, objective.key, event.target.checked) } })} />{objective.title || objective.key}</label>)}</div></fieldset></EditorDisclosureV2>
    </EditorDisclosureV2></section>
    <p className={local.contextNote}>{coverage.length ? `${coverage.length} pendientes de cobertura. Revisión te llevará a cada punto.` : "La cobertura local no presenta incidencias. El servidor verificará las fuentes y los permisos."}</p>
    {target ? <ActivityPickerV2 key={target.key} pkg={{ ...pkg, objectives: pkg.objectives.filter(objective => target.objectiveKeys.includes(objective.key)) }} disabled={disabled} open onOpenChange={open => { if (!open) setCreatingFor(null); }} presets={questionPresets} onCreate={(preset, objectiveKey) => { const next = addAssessmentQuestionV2(pkg, target.key, preset, objectiveKey); if (next === pkg) return; const created = next.activities[pkg.activities.length]!; setEditingQuestion(`${target.key}:${created.key}`); pendingFocus.current = `package.activities.${pkg.activities.length}.prompt`; update(next); setCreatingFor(null); }} /> : null}
  </div>;
}
