import Link from "next/link";
import type { LearningHome } from "@cediah/contracts";
import { ReviewLauncher } from "./review-launcher";
import { stateMatches, type V2Card, type V2Path, type V2State } from "./v2/model";
import { RouteAction } from "./v2/route-action";
import { MaintenancePanel } from "./v2/maintenance";
import { ReviewQueuePanel } from "./v2/review";
import styles from "./review-center.module.css";

export type ReviewRoute = { card: V2Card; path: V2Path | null; state: V2State | null };
const objectiveCount = (count: number) => `${count} ${count === 1 ? "objetivo pendiente" : "objetivos pendientes"}`;

/** Counts use the server snapshot's clock. They describe objectives, never questions. */
export function reviewCategories(state: V2State) {
  if (!state.maintenance) return null;
  const now = Date.parse(state.maintenance.generatedAt);
  const due = (date: string | null) => !!date && Date.parse(date) <= now;
  const agenda = state.maintenance.agenda;
  return {
    maintenance: agenda.filter(item => due(item.dueAt)).length,
    seven: agenda.filter(item => !item.retention7.acceptedAt && due(item.retention7.dueAt)).length,
    thirty: agenda.filter(item => !!item.retention7.acceptedAt && !item.retention30.acceptedAt && due(item.retention30.dueAt)).length,
  };
}

export function ReviewCenter({ home, routes, unavailable, minutes }: {
  home: LearningHome | null; routes: ReviewRoute[]; unavailable: boolean; minutes: 5 | 10 | 20;
}) {
  const openReview = home?.tasks.find(task => task.kind === "resume" && task.key.startsWith("review-session:"));
  return <main className={`learning-main ${styles.screen}`}>
    <Link href="/aprendizaje?tab=hoy">Volver a mi aprendizaje</Link>
    <header><h1>Repasos pendientes</h1><p>Elige un bloque y vuelve aquí al terminar. Las preguntas y tarjetas se cuentan por ítem; las rutas por objetivos, por objetivo.</p></header>
    <section className={styles.block} aria-label="Preguntas y tarjetas">
      <h2>Preguntas y tarjetas</h2>
      {home ? <>
        <p>{home.counts.dueReviews} {home.counts.dueReviews === 1 ? "ítem pendiente" : "ítems pendientes"}: preguntas o tarjetas.</p>
        {openReview ? <><p>Hay una sesión de repaso abierta. Retómala para continuar donde la dejaste.</p><Link className="learning-primary-button" href={openReview.href}>Retomar repaso</Link></>
          : home.counts.dueReviews > 0 ? <ReviewLauncher minutes={minutes} embedded dueCount={home.counts.dueReviews} />
            : <p>No hay ítems disponibles para repasar ahora. Puedes continuar con otra actividad.</p>}
      </> : <p role="alert">No pudimos consultar las preguntas y tarjetas pendientes. Reintenta para ver su estado.</p>}
    </section>
    {unavailable ? <p role="alert">No pudimos consultar todas las rutas por objetivos. Sus repasos pueden seguir pendientes.</p> : null}
    {routes.map(({ card, path, state }) => <ReviewRouteBlock key={card.id} card={card} path={path} state={state} />)}
    {!unavailable && !routes.length ? <p>No tienes rutas por objetivos inscritas.</p> : null}
    <nav className={styles.actions} aria-label="Opciones del centro de repaso"><form action="/aprendizaje/repaso" method="get"><input type="hidden" name="minutos" value={minutes} /><button type="submit" className="learning-secondary-button">Actualizar repasos</button></form><Link href="/aprendizaje?tab=rutas">Continuar aprendiendo</Link></nav>
  </main>;
}

function ReviewRouteBlock({ card, path, state }: ReviewRoute) {
  const confirmed = path?.access === "enrolled" && stateMatches(path, state) ? state : null;
  const counts = confirmed ? reviewCategories(confirmed) : null;
  return <section className={styles.block} aria-label={`Repasos de ${card.title}`}>
    <h2>{card.title}</h2>
    {path && confirmed ? <>
      {counts ? <><dl className={styles.counts}>
        <div><dt>Mantenimiento</dt><dd>{objectiveCount(counts.maintenance)}</dd></div>
        <div><dt>Evaluación a 7 días</dt><dd>{objectiveCount(counts.seven)}</dd></div>
        <div><dt>Evaluación a 30 días</dt><dd>{objectiveCount(counts.thirty)}</dd></div>
      </dl><p>Un objetivo puede tener mantenimiento y evaluación pendientes. Estas cantidades no se suman; cada evaluación puede incluir varios objetivos.</p></>
        : <p role="status">Las categorías de repaso están por confirmar. Consulta la agenda de esta ruta.</p>}
      <h3>{confirmed.nextAction.kind === "resume" ? "Retoma tu sesión abierta" : "Siguiente paso recomendado"}</h3>
      <RouteAction path={path} state={confirmed} />
      {confirmed.nextAction.kind === "resume" ? <p>Primero termina la sesión abierta de esta ruta para comenzar otra.</p> : null}
      <ReviewQueuePanel path={path} state={confirmed} />
      <MaintenancePanel path={path} state={confirmed} />
    </> : <p role="alert">No pudimos confirmar el estado de esta ruta. Su historial se conserva.</p>}
    <Link href={`/aprendizaje/repaso?${new URLSearchParams({ motor: "guided-v2", ruta: card.slug })}`}>Ver práctica y agenda de esta ruta</Link>
  </section>;
}
