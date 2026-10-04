"use client";

import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import { nextLocalKeyV2 } from "./editor-model";
import { FieldV2, type FormIssueV2 } from "./sources-fields";
import type { EditableActivityV2 } from "./activity-model";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export type ActivityFieldsPropsV2<A extends EditableActivityV2 = EditableActivityV2> = {
  activity: A; pkg: RoutePackage; path: string; issues: FormIssueV2[]; onChange: (activity: A) => void;
};
export function ActivitySourcesV2({ pkg, value, path, label, onChange }: { pkg: RoutePackage; value: string[]; path: string; label: string; onChange: (keys: string[]) => void }) {
  return <fieldset className={local.choices} data-field-path={path} tabIndex={-1}><legend>{label}</legend>
    {pkg.sources.map((source) => <label key={source.key} className={styles.checkboxRow}><input type="checkbox" checked={value.includes(source.key)} onChange={(event) => onChange(event.target.checked ? [...value, source.key] : value.filter((key) => key !== source.key))} />{source.title || "Fuente sin título"}</label>)}
    {!pkg.sources.length ? <p className={styles.fieldHint}>Añade fuentes en Datos y fuentes.</p> : null}
    {value.some((key) => !pkg.sources.some((source) => source.key === key)) ? <p role="alert" className={styles.fieldError}>Hay fuentes ausentes. <button type="button" className={styles.textButton} onClick={() => onChange(value.filter((key) => pkg.sources.some((source) => source.key === key)))}>Retirar vínculos ausentes</button></p> : null}
  </fieldset>;
}
const phases: Record<RouteActivity["phase"], string> = { activate: "Activar conocimientos", learn: "Aprender", retrieve: "Recuperar", elaborate: "Elaborar", apply: "Aplicar", remediate: "Reforzar" };
const uses: Record<RouteActivity["use"], string> = { learning: "Aprendizaje", diagnostic: "Diagnóstico", gate: "Comprobación de unidad", final: "Reserva final", retention7: "Reserva a 7 días", retention30: "Reserva a 30 días" };
const representations: Record<RouteActivity["representation"], string> = { text: "Texto", image: "Imagen", table: "Tabla", diagram: "Diagrama", case: "Caso", video: "Video" };
export function ActivityCommonV2({ activity, pkg, path, issues, onChange }: ActivityFieldsPropsV2) {
  function patch(values: Partial<EditableActivityV2>) { onChange({ ...activity, ...values } as EditableActivityV2); }
  const families = [...new Map(pkg.activities.filter((item) => item.key !== activity.key && item.equivalenceKey !== activity.equivalenceKey).map((item) => [item.equivalenceKey, item])).values()];
  return <div className={local.stack}><div className={styles.fieldGrid}>
    <FieldV2 label={activity.kind === "constructed_response" ? "Pregunta o frente de la tarjeta" : "Consigna"} path={`${path}.prompt`} issues={issues} wide>{(input) => <textarea {...input} required rows={3} maxLength={4000} value={activity.prompt} onChange={(event) => patch({ prompt: event.target.value })} />}</FieldV2>
    <FieldV2 label="Objetivo principal" path={`${path}.objectiveKey`} issues={issues}>{(input) => <select {...input} value={activity.objectiveKey} onChange={(event) => patch({ objectiveKey: event.target.value })}>{!pkg.objectives.some((item) => item.key === activity.objectiveKey) ? <option value={activity.objectiveKey}>Selecciona un objetivo existente</option> : null}{pkg.objectives.map((item) => <option key={item.key} value={item.key}>{item.title || "Objetivo sin título"}</option>)}</select>}</FieldV2>
    <FieldV2 label="Fase de aprendizaje" path={`${path}.phase`} issues={issues}>{(input) => <select {...input} value={activity.phase} onChange={(event) => patch({ phase: event.target.value as RouteActivity["phase"] })}>{Object.entries(phases).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
    <label className={styles.checkboxRow}><input type="checkbox" data-field-path={`${path}.required`} checked={activity.required} onChange={(event) => patch({ required: event.target.checked })} />Actividad requerida</label>
  </div><ActivitySourcesV2 pkg={pkg} value={activity.sourceKeys} path={`${path}.sourceKeys`} label="Fuentes de la actividad" onChange={(sourceKeys) => patch({ sourceKeys })} />
    <details className={styles.disclosure}><summary>Organización y ayudas</summary><div className={`${styles.fieldGrid} ${local.activityDetailGrid}`}>
      <FieldV2 label="Uso en el recorrido" path={`${path}.use`} issues={issues} hint="Las reservas necesitan preguntas exclusivas; el validador comprueba su separación.">{(input) => <select {...input} value={activity.use} onChange={(event) => patch({ use: event.target.value as RouteActivity["use"] })}>{Object.entries(uses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
      <FieldV2 label="Representación" path={`${path}.representation`} issues={issues}>{(input) => <select {...input} value={activity.representation} onChange={(event) => patch({ representation: event.target.value as RouteActivity["representation"] })}>{Object.entries(representations).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</FieldV2>
      <FieldV2 label="Variante de la misma pregunta" path={`${path}.equivalenceKey`} issues={issues} hint="Los sinónimos y variantes del mismo ítem comparten familia; no cuentan como preguntas independientes.">{(input) => <select {...input} value={activity.equivalenceKey} onChange={(event) => patch({ equivalenceKey: event.target.value })}><option value={activity.equivalenceKey}>Familia actual</option>{families.map((item) => <option key={item.equivalenceKey} value={item.equivalenceKey}>{item.prompt || "Actividad sin consigna"}</option>)}</select>}</FieldV2>
      <button className={styles.secondaryButton} type="button" onClick={() => patch({ equivalenceKey: nextLocalKeyV2("familia", pkg.activities.map((item) => item.equivalenceKey)) })}>Asignar familia independiente</button>
      <FieldV2 label="Pistas opcionales" path={`${path}.hints`} issues={issues} wide hint="Una pista por línea, hasta tres. Consultar una pista convierte el intento en práctica con ayuda.">{(input) => <textarea {...input} rows={3} value={activity.hints.join("\n")} onChange={(event) => patch({ hints: event.target.value ? event.target.value.split("\n") : [] })} />}</FieldV2>
      <FieldV2 label="Actividad alternativa" path={`${path}.alternativeActivityKey`} issues={issues}>{(input) => <select {...input} value={activity.alternativeActivityKey ?? ""} onChange={(event) => patch({ alternativeActivityKey: event.target.value || null })}><option value="">Sin alternativa</option>{activity.alternativeActivityKey && !pkg.activities.some((item) => item.key === activity.alternativeActivityKey) ? <option value={activity.alternativeActivityKey}>Vínculo ausente: selecciona otra actividad</option> : null}{pkg.activities.filter((item) => item.key !== activity.key).map((item) => <option key={item.key} value={item.key}>{item.prompt || "Actividad sin consigna"}</option>)}</select>}</FieldV2>
      <fieldset className={local.choices} data-field-path={`${path}.relatedObjectiveKeys`} tabIndex={-1}><legend>Otros objetivos relacionados</legend>{pkg.objectives.filter((item) => item.key !== activity.objectiveKey).map((item) => <label className={styles.checkboxRow} key={item.key}><input type="checkbox" checked={activity.relatedObjectiveKeys.includes(item.key)} onChange={(event) => patch({ relatedObjectiveKeys: event.target.checked ? [...activity.relatedObjectiveKeys, item.key] : activity.relatedObjectiveKeys.filter((key) => key !== item.key) })} />{item.title || "Objetivo sin título"}</label>)}</fieldset>
    </div></details>
  </div>;
}
export function ActivityFeedbackV2({ activity, pkg, path, issues, onChange }: ActivityFieldsPropsV2) {
  return <div className={local.stack}><FieldV2 label="Explicación del feedback" path={`${path}.feedback.explanation`} issues={issues} hint="Explica el porqué de la respuesta, separado de la consigna.">{(input) => <textarea {...input} required rows={3} maxLength={4000} value={activity.feedback.explanation} onChange={(event) => onChange({ ...activity, feedback: { ...activity.feedback, explanation: event.target.value } })} />}</FieldV2>
    <FieldV2 label="Error común y cómo corregirlo" path={`${path}.feedback.commonError`} issues={issues}>{(input) => <textarea {...input} rows={2} maxLength={4000} value={activity.feedback.commonError} onChange={(event) => onChange({ ...activity, feedback: { ...activity.feedback, commonError: event.target.value } })} />}</FieldV2>
    <ActivitySourcesV2 pkg={pkg} path={`${path}.feedback.sourceKeys`} label="Fuentes del feedback y de los distractores" value={activity.feedback.sourceKeys} onChange={(sourceKeys) => onChange({ ...activity, feedback: { ...activity.feedback, sourceKeys } })} />
  </div>;
}
