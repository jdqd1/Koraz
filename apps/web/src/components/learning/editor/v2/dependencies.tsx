"use client";

import { useRef, useState } from "react";
import { analyzeRouteGraph, type RoutePackage } from "@cediah/contracts";
import type { FormIssueV2 } from "./sources-fields";
import { FieldV2 } from "./sources-fields";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export function tryPrerequisiteV2(pkg: RoutePackage, objectiveKey: string, prerequisiteKey: string) {
  const objective = pkg.objectives.find((item) => item.key === objectiveKey);
  if (!objective || !pkg.objectives.some((item) => item.key === prerequisiteKey)) return { ok: false as const, message: "Selecciona un objetivo existente." };
  if (objective.prerequisiteKeys.includes(prerequisiteKey)) return { ok: false as const, message: "Este objetivo ya figura como requisito previo." };
  const next = { ...pkg, objectives: pkg.objectives.map((item) => item.key === objectiveKey ? { ...item, prerequisiteKeys: [...item.prerequisiteKeys, prerequisiteKey] } : item) };
  const graph = analyzeRouteGraph(next);
  if (graph.cycle) return { ok: false as const, message: `Estos objetivos se necesitan mutuamente para empezar: ${graph.cycle.map((key) => pkg.objectives.find((item) => item.key === key)?.title || "Objetivo sin título").join(" → ")}. Retira uno de los requisitos previos.` };
  return { ok: true as const, package: next };
}
export function DependenciesV2({ pkg, objectiveKey, disabled, issues, onChange }: { pkg: RoutePackage; objectiveKey: string; disabled: boolean; issues?: FormIssueV2[]; onChange: (pkg: RoutePackage) => void }) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const selectRef = useRef<HTMLSelectElement>(null);
  const index = pkg.objectives.findIndex((item) => item.key === objectiveKey);
  const objective = pkg.objectives[index];
  if (!objective) return null;
  function add() {
    const result = tryPrerequisiteV2(pkg, objectiveKey, selected);
    if (!result.ok) { setError(result.message); return; }
    onChange(result.package); setSelected(""); setError(""); selectRef.current?.focus();
  }
  return <div className={local.stack}><div className={local.inlineForm}>
    <FieldV2 label="Objetivo previo" path={`package.objectives.${index}.prerequisiteKeys`} issues={issues} hint="Elige qué necesita aprender el estudiante antes de este objetivo. Cambiar el orden de la lista no establece requisitos previos.">
      {(input) => <select {...input} ref={selectRef} disabled={disabled} onChange={(event) => { setSelected(event.target.value); setError(""); }} value={selected}><option value="">Selecciona un objetivo</option>{pkg.objectives.filter((item) => item.key !== objectiveKey && !objective.prerequisiteKeys.includes(item.key)).map((item) => <option key={item.key} value={item.key}>{item.title || "Objetivo sin título"}</option>)}</select>}
    </FieldV2>
    <button className={styles.secondaryButton} disabled={disabled || !selected} onClick={add} type="button">Vincular objetivo</button></div>
    {error ? <p role="alert" className={styles.fieldError}>{error}</p> : null}
    {objective.prerequisiteKeys.length ? <ul className={`${local.linkList} ${local.prerequisiteList}`}>{objective.prerequisiteKeys.map((key) => <li key={key}><span>{pkg.objectives.find((item) => item.key === key)?.title || "Objetivo previo ausente"}</span><button className={styles.textButton} disabled={disabled} type="button" aria-label={`Quitar prerrequisito ${pkg.objectives.find((item) => item.key === key)?.title || "ausente"}`} onClick={() => { onChange({ ...pkg, objectives: pkg.objectives.map((item) => item.key === objectiveKey ? { ...item, prerequisiteKeys: item.prerequisiteKeys.filter((value) => value !== key) } : item) }); setError(""); selectRef.current?.focus(); }}>Quitar</button></li>)}</ul> : <p className={styles.fieldHint}>El estudiante puede empezar este objetivo sin completar otro antes.</p>}
  </div>;
}
export function DependencyOrderV2({ pkg, onLocate, embedded = false }: { pkg: RoutePackage; onLocate: (key: string) => void; embedded?: boolean }) {
  const graph = analyzeRouteGraph(pkg);
  return <section className={embedded ? local.dependencyOrder : styles.card} aria-label="Orden de aprendizaje">{!embedded ? <h2>Orden de aprendizaje</h2> : null}<p className={styles.fieldHint}>Cada objetivo aparece después de los que necesita. Los objetivos sin requisitos previos pueden comenzar por separado.</p>
    {graph.cycle ? <p role="alert" className={styles.fieldError}>Hay objetivos que se necesitan mutuamente para empezar. Revisa sus requisitos previos.</p> : null}
    <ol className={local.orderList}>{graph.orderedObjectiveKeys.map((key) => { const objective = pkg.objectives.find((item) => item.key === key)!; return <li key={key}><button className={styles.textButton} type="button" onClick={() => onLocate(key)}>{objective.title || "Objetivo sin título"}</button><span className={styles.fieldHint}>{objective.prerequisiteKeys.length ? `Después de: ${objective.prerequisiteKeys.map((parent) => pkg.objectives.find((item) => item.key === parent)?.title || "Objetivo ausente").join(", ")}` : "Sin requisitos previos"}</span></li>; })}</ol>
  </section>;
}
