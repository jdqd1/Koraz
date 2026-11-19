import Link from "next/link";
import type { LearningOverview } from "@/lib/server/learning-overview";
import { RouteSignals } from "./v2/signals";
import { routeHref } from "./v2/model";

export function LearningDashboardRoutes({ routes, unavailable }: {
  routes: LearningOverview["v2Routes"]; unavailable: boolean;
}) {
  if (!routes.length && !unavailable) return null;
  return <section className="dashboard-learning-state" aria-label="Mis rutas por objetivos">
    <h2>Mis rutas por objetivos</h2>
    {unavailable ? <p role="alert">No pudimos cargar todas tus rutas. <Link href="/dashboard">Reintentar</Link></p> : null}
    {routes.map(({ card, state }) => <article className="learning-status-card" key={card.enrollmentId}>
      <h3><Link href={routeHref(card.slug)}>{card.title}</Link></h3>
      {state ? <><RouteSignals state={state} /><p>{state.nextAction.reason}</p></> : <p role="status">No pudimos cargar el estado confirmado de esta ruta.</p>}
      <Link className="learning-primary-button" href={routeHref(card.slug, state?.nextActionContext?.unitKey ?? undefined)}>Abrir mi ruta</Link>
    </article>)}
  </section>;
}
