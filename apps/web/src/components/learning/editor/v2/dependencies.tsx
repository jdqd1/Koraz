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
  if (objective.prerequisiteKeys.includes(prerequisiteKey)) return { ok: false as const, message: "Ese prerrequisito ya está añadido." };
  const next = { ...pkg, objectives: pkg.objectives.map((item) => item.key === objectiveKey ? { ...item, prerequisiteKeys: [...item.prerequisiteKeys, prerequisiteKey] } : item) };
  const graph = analyzeRouteGraph(next);
  if (graph.cycle) return { ok: false as const, message: `No se añadió el enlace porque crea un ciclo: ${graph.cycle.map((key) => pkg.objectives.find((item) => item.key === key)?.title || "Objetivo sin título").join(" → ")}.` };
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
  return <div className={local.stack}>
    <FieldV2 label="Añadir prerrequisito" path={`package.objectives.${index}.prerequisiteKeys`} issues={issues} hint="Elige qué debe aprenderse antes. El orden de la lista no crea dependencias.">
      {(input) => <select {...input} ref={selectRef} disabled={disabled} onChange={(event) => { setSelected(event.target.value); setError(""); }} value={selected}><option value="">Selecciona un objetivo</option>{pkg.objectives.filter((item) => item.key !== objectiveKey && !objective.prerequisiteKeys.includes(item.key)).map((item) => <option key={item.key} value={item.key}>{item.title || "Objetivo sin título"}</option>)}</select>}
    </FieldV2>
    <button className={styles.secondaryButton} disabled={disabled || !selected} onClick={add} type="button">Añadir enlace</button>
    {error ? <p role="alert" className={styles.fieldError}>{error}</p> : null}
    {objective.prerequisiteKeys.length ? <ul className={local.linkList}>{objective.prerequisiteKeys.map((key) => <li key={key}><span>{pkg.objectives.find((item) => item.key === key)?.title || "Prerrequisito ausente"}</span><button className={styles.textButton} disabled={disabled} type="button" aria-label={`Quitar prerrequisito ${pkg.objectives.find((item) => item.key === key)?.title || "ausente"}`} onClick={() => { onChange({ ...pkg, objectives: pkg.objectives.map((item) => item.key === objectiveKey ? { ...item, prerequisiteKeys: item.prerequisiteKeys.filter((value) => value !== key) } : item) }); setError(""); selectRef.current?.focus(); }}>Quitar</button></li>)}</ul> : <p className={styles.fieldHint}>Sin prerrequisitos. Esta rama puede comenzar de forma independiente.</p>}
  </div>;
}
export function DependencyOrderV2({ pkg, onLocate }: { pkg: RoutePackage; onLocate: (key: string) => void }) {
  const graph = analyzeRouteGraph(pkg);
  return <section className={styles.card} aria-label="Orden de aprendizaje"><h2>Orden de aprendizaje</h2><p className={styles.fieldHint}>Los prerrequisitos aparecen antes que sus dependientes. Las ramas independientes conservan su orden editorial.</p>
    {graph.cycle ? <p role="alert" className={styles.fieldError}>Hay un ciclo en el borrador. Revisa los prerrequisitos; el orden todavía está incompleto.</p> : null}
    <ol className={local.orderList}>{graph.orderedObjectiveKeys.map((key) => { const objective = pkg.objectives.find((item) => item.key === key)!; return <li key={key}><button className={styles.textButton} type="button" onClick={() => onLocate(key)}>{objective.title || "Objetivo sin título"}</button><span className={styles.fieldHint}>{objective.prerequisiteKeys.length ? `Después de: ${objective.prerequisiteKeys.map((parent) => pkg.objectives.find((item) => item.key === parent)?.title || "Objetivo ausente").join(", ")}` : "Inicio de rama"}</span></li>; })}</ol>
  </section>;
}
