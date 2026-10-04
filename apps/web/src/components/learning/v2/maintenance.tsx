"use client";

import { useSyncExternalStore } from "react";
import { objectiveLabels, type V2Path, type V2State } from "./model";
import styles from "./maintenance.module.css";

/** Formatting only: dates and achievements always come from a confirmed DTO. */
export function formatMaintenanceDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-VE", { timeZone, dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

const subscribeZone = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => null;

export function MaintenanceDate({ value, timeZone }: { value: string; timeZone?: string }) {
  const localZone = useSyncExternalStore(subscribeZone, browserZone, serverZone);
  const zone = timeZone ?? localZone;
  return <time dateTime={value}>{zone ? `${formatMaintenanceDate(value, zone)} (${zone})` : `${formatMaintenanceDate(value, "UTC")} (UTC)`}</time>;
}

export function MaintenancePanel({ path, state }: { path: V2Path; state: V2State }) {
  const timeZone = state.maintenance?.timeZone;
  return <section className={styles.panel} aria-label="Mantenimiento de objetivos">
    <h2>Mantener lo aprendido</h2>
    <p>El repaso y las evaluaciones diferidas permiten volver a comprobar lo aprendido. Las mediciones de 7 y 30 días cuentan días reales desde el dominio; no prometen memoria permanente.</p>
    {state.consolidatedAt ? <p>Consolidación alcanzada: <MaintenanceDate value={state.consolidatedAt} timeZone={timeZone} /></p> : <p>Consolidación pendiente de evidencia diferida.</p>}
    <ul className={styles.objectives}>{path.units.flatMap(unit => unit.objectives).map(objective => {
      const item = state.objectives.find(entry => entry.objectiveKey === objective.key);
      return <li key={objective.key}><strong>{objective.title}</strong>
        <span>{item ? objectiveLabels[item.label] : "Por comprobar"}</span>
        {item?.reviewDue ? <span>Repaso pendiente</span> : null}
        {item?.firstMasteredAt ? <span>Primer dominio: <MaintenanceDate value={item.firstMasteredAt} timeZone={timeZone} /></span> : null}
        {item?.firstConsolidatedAt ? <span>Primera consolidación: <MaintenanceDate value={item.firstConsolidatedAt} timeZone={timeZone} /></span> : null}
        <MaintenanceSchedule state={state} objectiveKey={objective.key} />
      </li>;
    })}</ul>
    {!state.maintenance ? <p>Actualiza la ruta para consultar las próximas fechas de repaso y evaluación.</p> : null}
    <p>Un repaso pendiente no significa que hayas fallado.</p>
  </section>;
}

export function MaintenanceSchedule({ state, objectiveKey }: { state: V2State; objectiveKey: string }) {
  const maintenance = state.maintenance;
  const agenda = maintenance?.agenda.find(item => item.objectiveKey === objectiveKey);
  if (!maintenance || !agenda) return null;
  const due = Date.parse(agenda.dueAt) <= Date.parse(maintenance.generatedAt);
  return <div className={styles.schedule}>
    <p>{due ? "Repaso pendiente desde" : "Próximo repaso:"} <MaintenanceDate value={agenda.dueAt} timeZone={maintenance.timeZone} />{due ? ". Puedes retomarlo a tu ritmo." : null}</p>
    {([7, 30] as const).map(days => {
      const measurement = days === 7 ? agenda.retention7 : agenda.retention30;
      if (!measurement.dueAt) return null;
      const waiting = days === 30 && !agenda.retention7.acceptedAt;
      const overdue = !measurement.acceptedAt && !waiting && Date.parse(measurement.dueAt) <= Date.parse(maintenance.generatedAt);
      return <p key={days}>Evaluación diferida de {days} días: {measurement.acceptedAt ? <>realizada el <MaintenanceDate value={measurement.acceptedAt} timeZone={maintenance.timeZone} />{measurement.elapsedDays !== null ? ` · ${new Intl.NumberFormat("es-VE", { maximumFractionDigits: 1 }).format(measurement.elapsedDays)} días reales desde el primer dominio` : null}.</>
        : <>{overdue ? "pendiente desde" : "prevista para"} <MaintenanceDate value={measurement.dueAt} timeZone={maintenance.timeZone} />{waiting ? ". Disponible tras completar la primera medición; el servidor confirma la fecha." : overdue ? ". La ausencia no registra un fallo." : null}</>}</p>;
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
