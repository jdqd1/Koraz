"use client";

import type { RouteActivity } from "@cediah/contracts";
import type { ActivityFieldsPropsV2 } from "./activity-fields";
import { FieldV2 } from "./sources-fields";
import { nextLocalKeyV2 } from "./editor-model";
import { moveEntryV2 } from "./visual-presets";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";
type Sequence = Extract<RouteActivity, {kind: "sequence"}>;

export function SequenceFieldsV2({ activity, pkg, path, issues, onChange, solution = false }: ActivityFieldsPropsV2<Sequence> & {solution?: boolean}) {
  const p = activity.payload;
  const patch = (values: Partial<Sequence["payload"]>) => onChange({ ...activity, payload: { ...p, ...values } });
  if (solution) return <div className={local.stack}><h4>Órdenes aceptados</h4><p className={styles.fieldHint}>Cada orden debe contener todos los pasos una sola vez. Sube o baja cada paso con los botones; no requiere arrastrar.</p>
    {p.acceptedOrders.map((order, i) => <fieldset key={i} className={local.choices} data-field-path={`${path}.payload.acceptedOrders.${i}`} tabIndex={-1}><legend>Orden aceptado {i + 1}</legend><ol className={local.orderList}>{order.map((key, j) => <li key={`${key}:${j}`}><span>{p.items.find((item) => item.key === key)?.text || `Paso ${j + 1} pendiente`}</span><div className={local.inlineForm}><button type="button" className={styles.textButton} disabled={j === 0} aria-label={`Subir paso ${j + 1} del orden ${i + 1}`} onClick={() => patch({ acceptedOrders: p.acceptedOrders.map((entry, k) => k === i ? moveEntryV2(entry, j, -1) : entry) })}>Subir</button><button type="button" className={styles.textButton} disabled={j === order.length - 1} aria-label={`Bajar paso ${j + 1} del orden ${i + 1}`} onClick={() => patch({ acceptedOrders: p.acceptedOrders.map((entry, k) => k === i ? moveEntryV2(entry, j, 1) : entry) })}>Bajar</button></div></li>)}</ol><button type="button" className={styles.textButton} disabled={p.acceptedOrders.length === 1} onClick={() => patch({ acceptedOrders: p.acceptedOrders.filter((_, j) => j !== i) })}>Retirar orden {i + 1}</button></fieldset>)}
    <button type="button" className={styles.secondaryButton} disabled={p.acceptedOrders.length >= 5} onClick={() => patch({ acceptedOrders: [...p.acceptedOrders, p.items.map((item) => item.key)] })}>Añadir orden aceptado</button>
    {p.acceptedOrders.some((order) => order.length !== p.items.length || new Set(order).size !== p.items.length || order.some((key) => !p.items.some((item) => item.key === key))) ? <p role="alert">El orden importado tiene pasos repetidos o ausentes. <button type="button" className={styles.textButton} onClick={() => patch({ acceptedOrders: [p.items.map((item) => item.key)] })}>Restablecer con todos los pasos</button></p> : null}
    <FieldV2 label="Actividad para explicar el porqué" path={`${path}.payload.whyActivityKey`} issues={issues}>{(input) => <select {...input} value={p.whyActivityKey ?? ""} onChange={(e) => patch({ whyActivityKey: e.target.value || null })}><option value="">Sin explicación vinculada</option>{p.whyActivityKey && !pkg.activities.some((item) => item.key === p.whyActivityKey) ? <option value={p.whyActivityKey}>Vínculo ausente</option> : null}{pkg.activities.filter((item) => item.key !== activity.key && item.kind !== "case" && item.objectiveKey === activity.objectiveKey).map((item) => <option key={item.key} value={item.key}>{item.prompt || "Actividad sin consigna"}</option>)}</select>}</FieldV2>
  </div>;
  return <div className={local.stack}><h4>Pasos de la secuencia</h4>{p.items.map((item, i) => <div key={item.key} className={local.activityOption}><FieldV2 label={`Paso ${i + 1}`} path={`${path}.payload.items.${i}.text`} issues={issues}>{(input) => <textarea {...input} rows={2} maxLength={2000} value={item.text} onChange={(e) => patch({ items: p.items.map((entry, j) => j === i ? { ...entry, text: e.target.value } : entry) })} />}</FieldV2><button type="button" className={styles.textButton} disabled={p.items.length <= 3} onClick={() => patch({ items: p.items.filter((_, j) => j !== i), acceptedOrders: p.acceptedOrders.map((order) => order.filter((key) => key !== item.key)) })}>Retirar paso {i + 1}</button></div>)}
    <button type="button" className={styles.secondaryButton} disabled={p.items.length >= 12} onClick={() => { const key = nextLocalKeyV2("paso", p.items.map((item) => item.key)); patch({ items: [...p.items, { key, text: "" }], acceptedOrders: p.acceptedOrders.map((order) => [...order, key]) }); }}>Añadir paso</button>
  </div>;
}
