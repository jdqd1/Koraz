import Link from "next/link";
import { actionLabel, routeHref, type V2Home, type V2State } from "./model";
import { RouteSignals } from "./signals";
import styles from "./styles.module.css";
import { MaintenanceDate } from "./maintenance";
export function V2TodayPanel({ home, states = [] }: { home: V2Home; states?: V2State[] }) {
  const state = states.find(item => item.enrollmentId === home.activePath?.enrollmentId && item.pathVersionId === home.activePath?.pathVersionId);
  return <section className={styles.notice} aria-label="Rutas con práctica por objetivos" data-engine-version="guided-v2">
    <h2>Práctica y repaso</h2>
    {home.activePath ? <><h3>{home.activePath.title}</h3>{state ? <RouteSignals state={state} /> : <p>Abre la ruta para consultar su estado confirmado.</p>}<p>{state?.nextAction.reason ?? home.nextAction?.reason}</p><Link className="learning-primary-button" href={routeHref(home.activePath.slug)}>{actionLabel(state?.nextAction ?? home.nextAction)}</Link></> : <p>No tienes una ruta activa de práctica por objetivos.</p>}
    <p>{home.dueReviews} repasos pendientes en tus rutas. Puedes continuar o volver a repasar a tu ritmo.</p>
    {home.activePath ? <Link href={`/aprendizaje/repaso?${new URLSearchParams({ motor: "guided-v2", ruta: home.activePath.slug })}`}>Ver refuerzos y fechas de repaso</Link> : null}
    {state?.maintenance ? <><p>Grupo disponible: {state.maintenance.reviewBatch.length} objetivos, hasta diez. No necesitas vaciarlo para continuar.</p>
      {state.maintenance.agenda.slice(0, 3).map((item, index) => <p key={item.objectiveKey}>Repaso del objetivo {index + 1}: <MaintenanceDate value={item.dueAt} timeZone={state.maintenance!.timeZone} />{Date.parse(item.dueAt) <= Date.parse(state.maintenance!.generatedAt) ? " · pendiente" : ""}</p>)}</> : null}
  </section>;
}
