import Link from "next/link";
import { routeHref, type V2Path, type V2State } from "./model";
import styles from "./maintenance.module.css";
import { MaintenanceDate } from "./maintenance";
import { RouteAction } from "./route-action";
import { CaretDown, Lightbulb } from "@phosphor-icons/react/dist/ssr";

export function RemediationPanel({ path, state }: { path: V2Path; state: V2State }) {
  const pending = state.objectives.filter(item => item.label === "reinforce" || item.criticalErrorOpen);
  const maintenance = state.maintenance;
  if (!pending.length && !maintenance?.remediation.length && !maintenance?.exhaustedBanks.length && state.nextAction.kind !== "remediate" && state.nextAction.kind !== "none") return null;
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Refuerzo dirigido" open={state.nextAction.kind === "remediate"}>
    <summary><Lightbulb size={20} aria-hidden /><h2>Refuerzo</h2>{pending.length ? <span className={styles.badge} data-tone="reinforce">{pending.length} {pending.length === 1 ? "objetivo" : "objetivos"}</span> : null}<CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}>
    {pending.length ? <ul>{pending.map(item => {
      const unit = path.units.find(entry => entry.objectives.some(objective => objective.key === item.objectiveKey));
      const title = unit?.objectives.find(objective => objective.key === item.objectiveKey)?.title ?? "Objetivo por reforzar";
      return <li key={item.objectiveKey}>{unit ? <Link href={routeHref(path.slug, unit.key)}>{title}</Link> : title}{item.firstMasteredAt ? <span> · Dominio previo conservado</span> : null}</li>;
    })}</ul> : null}
    {maintenance?.remediation.map(item => <article key={item.objectiveKey}>
      <h3>{path.units.flatMap(unit => unit.objectives).find(objective => objective.key === item.objectiveKey)?.title ?? "Refuerzo del objetivo"}</h3>
      <p>{item.confusion}</p><p>{item.bankExhausted ? "La práctica sigue disponible. Ahora no hay una variante elegible para esta comprobación." : item.message}</p>
      {item.availableAfter ? <p>Próxima comprobación después de <MaintenanceDate value={item.availableAfter} timeZone={maintenance.timeZone} compact />.</p> : item.bankExhausted ? <p>La próxima comprobación requiere una revisión del banco de actividades.</p> : null}
      {item.pauseOffered ? <p>Después de estos reintentos puedes pausar, elegir otra rama disponible o volver más tarde.</p> : null}
      {item.activityKey && !item.bankExhausted && !item.pauseOffered ? <RouteAction path={path} state={state} target={{ kind: "activity", key: item.activityKey }} label="Reforzar este objetivo" showReason={false} appearance="secondary" /> : null}
    </article>)}
    {maintenance?.exhaustedBanks.filter(bank => !maintenance.remediation.some(item => item.objectiveKey === bank.objectiveKey)).map(bank => <p key={bank.objectiveKey}>La práctica sigue disponible. La próxima comprobación de {path.units.flatMap(unit => unit.objectives).find(item => item.key === bank.objectiveKey)?.title ?? "este objetivo"} será después de <MaintenanceDate value={bank.availableAfter} timeZone={maintenance.timeZone} compact />. Puedes pausar o elegir otra rama disponible.</p>)}
    {state.nextAction.kind === "none" ? <p>{state.nextAction.reason}</p> : null}
    <Link href="/aprendizaje?tab=rutas">Consultar otras rutas</Link>
    <details className={styles.help}><summary>Cómo reforzar un objetivo</summary><p>Revisa la explicación y el ejemplo antes de una nueva variante. Un error no borra el dominio que alcanzaste antes.</p><p>Puedes pausar o consultar tus otras rutas. No necesitas repetir toda la ruta para reforzar este punto.</p></details>
    </div>
  </details>;
}
