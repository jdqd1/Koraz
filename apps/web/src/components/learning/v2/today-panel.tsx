import Link from "next/link";
import { actionLabel, routeHref, type V2Home, type V2State } from "./model";
import { RouteSignals } from "./signals";
import styles from "./styles.module.css";
export function V2TodayPanel({ home, states = [] }: { home: V2Home; states?: V2State[] }) {
  const state = states.find(item => item.enrollmentId === home.activePath?.enrollmentId && item.pathVersionId === home.activePath?.pathVersionId);
  return <section className={styles.notice} aria-label="Rutas con práctica por objetivos" data-engine-version="guided-v2">
    <h2>Práctica y repaso</h2>
    {home.activePath ? <><h3>{home.activePath.title}</h3>{state ? <RouteSignals state={state} /> : <p>Abre la ruta para consultar su estado confirmado.</p>}<p>{state?.nextAction.reason ?? home.nextAction?.reason}</p><Link className="learning-primary-button" href={routeHref(home.activePath.slug)}>{actionLabel(state?.nextAction ?? home.nextAction)}</Link></> : <p>No tienes una ruta activa de práctica por objetivos.</p>}
    <p>{home.dueReviews} repasos pendientes en tus rutas. Puedes continuar o volver a repasar a tu ritmo.</p>
  </section>;
}
