"use client";

import { localDateInTimeZone } from "@cediah/contracts";
import { useUserTimeZone } from "../../user-time-zone";
import { objectiveLabels, type V2Path, type V2State } from "./model";
import styles from "./maintenance.module.css";
import { CaretDown, CalendarBlank } from "@phosphor-icons/react/dist/ssr";

/** Formatting only: dates and achievements always come from a confirmed DTO. */
export function formatMaintenanceDate(value: string, timeZone: string) {
  const date = new Date(value), clock = maintenanceClock(date, timeZone);
  const day = new Intl.DateTimeFormat("es-VE", { timeZone, day: "numeric", month: "long", year: "numeric" }).format(date);
  return `${day} ${clock.hour === 1 ? "a la" : "a las"} ${clock.text}`;
}

// Node and browsers use different ICU separators/day periods; assemble the clock consistently for hydration.
function maintenanceClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("es-VE", { timeZone, hour: "numeric", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const hour24 = Number(parts.find(part => part.type === "hour")!.value), hour = hour24 % 12 || 12;
  return { hour, text: `${hour}:${parts.find(part => part.type === "minute")!.value} ${hour24 < 12 ? "a. m." : "p. m."}` };
}

export function formatFriendlyMaintenanceDate(value: string, timeZone: string, relativeTo?: string) {
  const date = new Date(value), reference = relativeTo ? new Date(relativeTo) : null;
  const localDay = localDateInTimeZone(date, timeZone);
  const referenceDay = reference ? localDateInTimeZone(reference, timeZone) : null;
  const difference = referenceDay ? (Date.parse(`${localDay}T00:00:00Z`) - Date.parse(`${referenceDay}T00:00:00Z`)) / 86_400_000 : null;
  const sameYear = referenceDay?.slice(0, 4) === localDay.slice(0, 4);
  const parts = new Intl.DateTimeFormat("es-VE", { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value;
  const day = difference === 0 ? "hoy" : difference === 1 ? "mañana" : `el ${part("weekday")} ${part("day")} de ${part("month")}${sameYear ? "" : ` de ${part("year")}`}`;
  const clock = maintenanceClock(date, timeZone);
  return `${day} ${clock.hour === 1 ? "a la" : "a las"} ${clock.text}`;
}

export function MaintenanceDate({ value, timeZone, compact = false, friendly = false, relativeTo }: { value: string; timeZone?: string; compact?: boolean; friendly?: boolean; relativeTo?: string }) {
  const zone = useUserTimeZone(timeZone);
  const formatted = formatMaintenanceDate(value, zone);
  const full = `${formatted} (${zone})`;
  const date = new Date(value);
  const text = friendly ? formatFriendlyMaintenanceDate(value, zone, relativeTo) : compact
    ? `${new Intl.DateTimeFormat("es-VE", { timeZone: zone, day: "numeric", month: "short", year: "numeric" }).format(date)}, ${maintenanceClock(date, zone).text}` : formatted;
  return <time dateTime={value} title={full} data-time-zone={zone}>{text}</time>;
}

export function MaintenancePanel({ path, state }: { path: V2Path; state: V2State }) {
  const timeZone = state.maintenance?.timeZone;
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Mantenimiento de objetivos">
    <summary><CalendarBlank size={20} aria-hidden /><h2>Agenda de repaso</h2><CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}>
    {state.consolidatedAt ? <p className={styles.note}>Recordado en los repasos: <MaintenanceDate value={state.consolidatedAt} timeZone={timeZone} compact /></p> : <p className={styles.note}>Los próximos repasos comprobarán qué recuerdas con el tiempo.</p>}
    <ul className={styles.objectives}>{path.units.flatMap(unit => unit.objectives).map(objective => {
      const item = state.objectives.find(entry => entry.objectiveKey === objective.key);
      return <li key={objective.key}><details className={styles.objectiveDetail}>
        <summary><span><strong>{objective.title}</strong><span className={styles.badges}><span className={styles.badge} data-tone={item?.label}>{item ? objectiveLabels[item.label] : "Por comprobar"}</span>{item?.reviewDue ? <span className={styles.badge} data-tone="review">Repaso pendiente</span> : null}</span></span><CaretDown className={styles.caret} size={16} aria-hidden /></summary>
        <div className={styles.objectiveBody}>
        {item?.firstMasteredAt ? <p className={styles.note}>Aprendizaje comprobado por primera vez: <MaintenanceDate value={item.firstMasteredAt} timeZone={timeZone} compact /></p> : null}
        {item?.firstConsolidatedAt ? <p className={styles.note}>Recordado en los repasos desde: <MaintenanceDate value={item.firstConsolidatedAt} timeZone={timeZone} compact /></p> : null}
        <MaintenanceSchedule state={state} objectiveKey={objective.key} />
        {!state.maintenance?.agenda.some(entry => entry.objectiveKey === objective.key) ? <p className={styles.note}>Aún no hay fechas de repaso programadas para este objetivo.</p> : null}
        </div>
      </details>
      </li>;
    })}</ul>
    {!state.maintenance ? <p>Actualiza la ruta para consultar las próximas fechas de repaso y evaluación.</p> : null}
    <p className={styles.note}>Las fechas se muestran en tu horario local.</p>
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
