"use client";

import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import type { ActivityFieldsPropsV2 } from "./activity-fields";
import { FieldV2 } from "./sources-fields";
import { nextLocalKeyV2 } from "./editor-model";
import { moveEntryV2 } from "./visual-presets";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";
type Case = Extract<RouteActivity, {kind: "case"}>;

export function caseChildrenV2(pkg: RoutePackage, activity: Case, stageKey: string) {
  const reserved = new Set(pkg.activities.filter((item) => item.kind === "case").flatMap((item) => item.payload.stages.filter((stage) => item.key !== activity.key || stage.key !== stageKey).map((stage) => stage.childActivityKey)));
  return pkg.activities.filter((item) => item.kind !== "case" && item.key !== activity.key && item.objectiveKey === activity.objectiveKey && item.use === activity.use && !reserved.has(item.key)
    && !pkg.assessments.some((assessment) => assessment.candidateActivityKeys.includes(item.key)));
}
export function CaseFieldsV2({ activity, pkg, path, issues, onChange }: ActivityFieldsPropsV2<Case>) {
  const stages = activity.payload.stages;
  const patch = (next: Case["payload"]["stages"]) => onChange({ ...activity, payload: { stages: next } });
  return <div className={local.stack}><p className={styles.fieldHint}>El caso presenta una etapa a la vez. Sus actividades responden y reciben feedback por separado; el contenedor no puntúa. Crea los hijos en este objetivo antes de vincularlos.</p>
    {stages.map((stage, i) => { const options = caseChildrenV2(pkg, activity, stage.key); return <fieldset key={stage.key} className={local.choices}><legend>Etapa {i + 1}</legend><div className={local.stack}>
      <FieldV2 label={`Narrativa de etapa ${i + 1}`} path={`${path}.payload.stages.${i}.narrative`} issues={issues}>{(input) => <textarea {...input} rows={3} maxLength={4000} value={stage.narrative} onChange={(e) => patch(stages.map((entry, j) => j === i ? { ...entry, narrative: e.target.value } : entry))} />}</FieldV2>
      <FieldV2 label={`Actividad de etapa ${i + 1}`} path={`${path}.payload.stages.${i}.childActivityKey`} issues={issues} hint="Cada hijo se usa en un único caso. Se excluyen casos anidados y actividades reservadas.">{(input) => <select {...input} value={stage.childActivityKey} onChange={(e) => patch(stages.map((entry, j) => j === i ? { ...entry, childActivityKey: e.target.value } : entry))}><option value="">Selecciona una actividad</option>{stage.childActivityKey && !options.some((item) => item.key === stage.childActivityKey) ? <option value={stage.childActivityKey}>Vínculo inválido: reasigna esta etapa</option> : null}{options.map((item) => <option value={item.key} key={item.key}>{item.prompt || "Actividad sin consigna"}</option>)}</select>}</FieldV2>
      <div className={local.inlineForm}><button type="button" className={styles.textButton} disabled={i === 0} aria-label={`Subir etapa ${i + 1}`} onClick={() => patch(moveEntryV2(stages, i, -1))}>Subir</button><button type="button" className={styles.textButton} disabled={i === stages.length - 1} aria-label={`Bajar etapa ${i + 1}`} onClick={() => patch(moveEntryV2(stages, i, 1))}>Bajar</button><button type="button" className={styles.textButton} disabled={stages.length <= 2} onClick={() => patch(stages.filter((_, j) => j !== i))}>Retirar etapa {i + 1}</button></div>
    </div></fieldset>; })}
    <button type="button" className={styles.secondaryButton} disabled={stages.length >= 6} onClick={() => patch([...stages, { key: nextLocalKeyV2("etapa", stages.map((item) => item.key)), narrative: "", childActivityKey: "" }])}>Añadir etapa</button>
  </div>;
}
