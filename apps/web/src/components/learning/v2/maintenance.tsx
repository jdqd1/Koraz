"use client";

import { useSyncExternalStore } from "react";
import { objectiveLabels, type V2Path, type V2State } from "./model";
import styles from "./maintenance.module.css";
import { CaretDown, CalendarBlank } from "@phosphor-icons/react/dist/ssr";

/** Formatting only: dates and achievements always come from a confirmed DTO. */
export function formatMaintenanceDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-VE", { timeZone, dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

const subscribeZone = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => null;

export function MaintenanceDate({ value, timeZone, compact = false }: { value: string; timeZone?: string; compact?: boolean }) {
  const localZone = useSyncExternalStore(subscribeZone, browserZone, serverZone);
  const zone = timeZone ?? localZone;
  const full = `${formatMaintenanceDate(value, zone ?? "UTC")} (${zone ?? "UTC"})`;
  return <time dateTime={value} title={compact ? full : undefined}>{compact ? new Intl.DateTimeFormat("es-VE", { timeZone: zone ?? "UTC", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : full}</time>;
}

export function MaintenancePanel({ path, state }: { path: V2Path; state: V2State }) {
  const timeZone = state.maintenance?.timeZone;
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Mantenimiento de objetivos">
    <summary><CalendarBlank size={20} aria-hidden /><h2>Agenda de repaso</h2><CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}>
    {state.consolidatedAt ? <p className={styles.note}>Consolidación alcanzada: <MaintenanceDate value={state.consolidatedAt} timeZone={timeZone} compact /></p> : <p className={styles.note}>Consolidación pendiente de evidencia diferida.</p>}
    <ul className={styles.objectives}>{path.units.flatMap(unit => unit.objectives).map(objective => {
      const item = state.objectives.find(entry => entry.objectiveKey === objective.key);
      return <li key={objective.key}><details className={styles.objectiveDetail}>
        <summary><span><strong>{objective.title}</strong><span className={styles.badges}><span className={styles.badge} data-tone={item?.label}>{item ? objectiveLabels[item.label] : "Por comprobar"}</span>{item?.reviewDue ? <span className={styles.badge} data-tone="review">Repaso pendiente</span> : null}</span></span><CaretDown className={styles.caret} size={16} aria-hidden /></summary>
        <div className={styles.objectiveBody}>
        {item?.firstMasteredAt ? <p className={styles.note}>Primer dominio: <MaintenanceDate value={item.firstMasteredAt} timeZone={timeZone} compact /></p> : null}
        {item?.firstConsolidatedAt ? <p className={styles.note}>Primera consolidación: <MaintenanceDate value={item.firstConsolidatedAt} timeZone={timeZone} compact /></p> : null}
        <MaintenanceSchedule state={state} objectiveKey={objective.key} />
        {!state.maintenance?.agenda.some(entry => entry.objectiveKey === objective.key) ? <p className={styles.note}>Aún no hay fechas de repaso programadas para este objetivo.</p> : null}
        </div>
      </details>
      </li>;
    })}</ul>
    {!state.maintenance ? <p>Actualiza la ruta para consultar las próximas fechas de repaso y evaluación.</p> : null}
    {timeZone ? <p className={styles.note}>Fechas en {timeZone}.</p> : null}
    <details className={styles.help}><summary>Cómo se comprueba lo aprendido</summary><p>El repaso y las evaluaciones diferidas permiten volver a comprobar lo aprendido. Las mediciones de 7 y 30 días cuentan días reales desde el dominio; no prometen memoria permanente.</p><p>Un repaso pendiente no significa que hayas fallado.</p></details>
    </div>
  </details>;
}

export function MaintenanceSchedule({ state, objectiveKey }: { state: V2State; objectiveKey: string }) {
  const maintenance = state.maintenance;
  const agenda = maintenance?.agenda.find(item => item.objectiveKey === objectiveKey);
  if (!maintenance || !agenda) return null;
  const due = Date.parse(agenda.dueAt) <= Date.parse(maintenance.generatedAt);
  return <div className={styles.schedule}>
    <div className={styles.scheduleItem}><strong>{due ? "Repaso pendiente desde" : "Próximo repaso:"}</strong><MaintenanceDate value={agenda.dueAt} timeZone={maintenance.timeZone} compact />{due ? <span>Puedes retomarlo a tu ritmo.</span> : null}</div>
    {([7, 30] as const).map(days => {
      const measurement = days === 7 ? agenda.retention7 : agenda.retention30;
      if (!measurement.dueAt) return null;
      const waiting = days === 30 && !agenda.retention7.acceptedAt;
      const overdue = !measurement.acceptedAt && !waiting && Date.parse(measurement.dueAt) <= Date.parse(maintenance.generatedAt);
      return <div className={styles.scheduleItem} key={days}><strong>Evaluación diferida de {days} días</strong>{measurement.acceptedAt ? <><span>Realizada</span><MaintenanceDate value={measurement.acceptedAt} timeZone={maintenance.timeZone} compact />{measurement.elapsedDays !== null ? <span>{`${new Intl.NumberFormat("es-VE", { maximumFractionDigits: 1 }).format(measurement.elapsedDays)} días reales desde el primer dominio`}</span> : null}</>
        : <><span>{overdue ? "Pendiente desde" : "Prevista para"}</span><MaintenanceDate value={measurement.dueAt} timeZone={maintenance.timeZone} compact />{waiting ? <span>Disponible tras completar la primera medición; el servidor confirma la fecha.</span> : overdue ? <span>La ausencia no registra un fallo.</span> : null}</>}</div>;
    })}
  </div>;
}

export function MaintenanceSessionSummary({ state, objectiveKeys }: { state: V2State; objectiveKeys: string[] }) {
  if (!state.maintenance) return null;
  return <section className={styles.panel} aria-label="Próximos pasos confirmados">
    <h2>Cómo continuar</h2><p>{state.nextAction.reason}</p>
    {state.maintenance.remediation.filter(item => objectiveKeys.includes(item.objectiveKey)).map(item => <div key={item.objectiveKey}><p>{item.confusion}</p><p>{item.message}</p>{item.availableAfter ? <p>Próxima comprobación después de <MaintenanceDate value={item.availableAfter} timeZone={state.maintenance!.timeZone} />.</p> : null}</div>)}
    {objectiveKeys.length ? <details><summary>Agenda confirmada de la ruta</summary>{[...new Set(objectiveKeys)].map((key, index) => <article key={key}><h3>Repaso programado {index + 1}</h3><MaintenanceSchedule state={state} objectiveKey={key} /></article>)}</details> : null}
  </section>;
}
