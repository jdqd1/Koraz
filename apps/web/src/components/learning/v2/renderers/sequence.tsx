"use client";

import { useRef, useState, type ReactNode } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import styles from "../composition.module.css";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import ui from "../../activities/activity-ui.module.css";

type Activity = Extract<V2PublicActivity, { kind: "sequence" }>;
export function moveSequenceItem(order: readonly string[], key: string, offset: -1 | 1): string[] {
  const index = order.indexOf(key), target = index + offset;
  const next = [...order];
  if (index < 0 || target < 0 || target >= order.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
export function validSequenceOrder(items: Activity["payload"]["items"], order: readonly string[]) {
  return items.length >= 3 && items.length <= 12 && new Set(items.map(item => item.key)).size === items.length
    && order.length === items.length && new Set(order).size === order.length
    && order.every(key => items.some(item => item.key === key));
}

export function SequenceRenderer({ activity, disabled, tools, onSubmit }: { activity: Activity; disabled: boolean; tools?: ReactNode; onSubmit: (orderedKeys: string[]) => void }) {
  const [order, setOrder] = useState(() => activity.payload.items.map(item => item.key));
  const [announcement, setAnnouncement] = useState("");
  const controls = useRef(new Map<string, HTMLButtonElement>());
  function move(key: string, offset: -1 | 1) {
    if (disabled) return;
    const next = moveSequenceItem(order, key, offset);
    setOrder(next);
    setAnnouncement(`${activity.payload.items.find(item => item.key === key)?.text}. Posición ${next.indexOf(key) + 1} de ${next.length}.`);
    // At a boundary the pressed button becomes disabled. Keep focus on the same item.
    const direction = offset === -1 && next.indexOf(key) === 0 ? 1 : offset === 1 && next.indexOf(key) === next.length - 1 ? -1 : offset;
    controls.current.get(`${key}:${direction}`)?.focus();
  }
  return <form className={styles.sequence} onSubmit={event => { event.preventDefault(); if (!disabled && validSequenceOrder(activity.payload.items, order)) onSubmit([...order]); }}>
    <fieldset disabled={disabled}><legend className="sr-only">Ordena los pasos</legend>
      <p className={styles.instruction}>Usa las flechas para ordenar los pasos.</p>
      <ol className={styles.steps}>{order.map((key, index) => <li key={key}>
        <span className={styles.stepNumber} aria-hidden>{index + 1}</span>
        <span className={styles.stepText}>{activity.payload.items.find(item => item.key === key)?.text}</span>
        <div className={styles.controls}>{([-1, 1] as const).map(offset => <button key={offset} ref={element => { if (element) controls.current.set(`${key}:${offset}`, element); else controls.current.delete(`${key}:${offset}`); }} type="button" disabled={disabled || (offset === -1 ? index === 0 : index === order.length - 1)} aria-label={`${offset === -1 ? "Subir" : "Bajar"}: ${activity.payload.items.find(item => item.key === key)?.text}`} onClick={() => move(key, offset)}>{offset === -1 ? <ArrowUp aria-hidden size={18} /> : <ArrowDown aria-hidden size={18} />}</button>)}</div>
      </li>)}</ol>
    </fieldset>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    {tools}<div className={ui.action}><button type="submit" className="learning-primary-button" disabled={disabled || !validSequenceOrder(activity.payload.items, order)}>Comprobar secuencia</button></div>
  </form>;
}
