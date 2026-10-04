import Link from "next/link";
import { ArrowRight, Books, CalendarCheck, ChartLineUp, Medal, Path, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { LearningEnrollmentProgress, LearningHome, LearningPathCard as LearningPathCardData } from "@cediah/contracts";
import { LearningPathCard } from "./learning-path-card";
import { LearningTodayPanel } from "./learning-today-panel";
import { isV2Card, type V2Card, type V2Home, type V2State } from "./v2/model";
import { RouteSignals } from "./v2/signals";

type LearningTab = "hoy" | "rutas" | "progreso";

const tabs: Array<{ href: string; id: LearningTab; label: string }> = [
  { href: "/aprendizaje?tab=hoy", id: "hoy", label: "Hoy" },
  { href: "/aprendizaje?tab=rutas", id: "rutas", label: "Rutas" },
  { href: "/aprendizaje?tab=progreso", id: "progreso", label: "Progreso" },
];

function LearningEmpty({ available }: { available: boolean }) {
  return (
    <section className="learning-empty" role="status">
      <span className="learning-empty-icon"><Books aria-hidden="true" size={30} /></span>
      <div>
        <h2>{available ? "Aún no hay rutas publicadas" : "No pudimos cargar tus rutas"}</h2>
        <p>{available
          ? "Las rutas revisadas aparecerán aquí. Mientras tanto, puedes seguir usando la biblioteca."
          : "Tu sesión sigue protegida. Actualiza la página para volver a intentarlo."}</p>
      </div>
      <Link className="learning-secondary-button" href={available ? "/biblioteca" : "/aprendizaje?tab=rutas"}>
        {available ? "Abrir biblioteca" : "Reintentar"}
      </Link>
    </section>
  );
}

const evidenceLabels = {
  consolidated: "Consolidado",
  developing: "Bien encaminado",
  practicing: "En práctica",
  unassessed: "Por comprobar",
} as const;

export function LearningHomeScreen({ available, home, homeAvailable, paths, progress, tab, v2Home = null, v2States = [], v2Unavailable = false }: {
  available: boolean;
  home: LearningHome | null;
  homeAvailable: boolean;
  paths: Array<LearningPathCardData | V2Card>;
  progress: LearningEnrollmentProgress[];
  tab: LearningTab;
  v2Home?: V2Home | null;
  v2States?: V2State[];
  v2Unavailable?: boolean;
}) {
  const enrolled = paths.filter((path): path is LearningPathCardData => !isV2Card(path) && !!path.enrollment && path.enrollment.status !== "archived");
  const enrolledV2 = paths.filter((path): path is V2Card => isV2Card(path) && !!path.enrollmentId);

  return (
    <main className="learning-main" id="learning-main">
      <header className="learning-heading">
        <div>
          <span className="learning-eyebrow"><Path aria-hidden="true" size={17} /> Aprendizaje guiado</span>
          <h1>Elige cómo avanzar, sin perder el rumbo.</h1>
          <p>Rutas cortas que conectan comprensión, práctica y repaso. Tú decides qué actividad abrir.</p>
        </div>
      </header>

      <nav aria-label="Secciones de Aprendizaje guiado" className="learning-tabs">
        {tabs.map((item) => (
          <Link aria-current={tab === item.id ? "page" : undefined} className={tab === item.id ? "is-active" : ""} href={item.href} key={item.id}>
            {item.label}
          </Link>
        ))}
      </nav>
      {v2Unavailable ? <p role="alert">No pudimos cargar tus rutas de práctica por objetivos. <Link href={`/aprendizaje?tab=${tab}`}>Reintentar</Link></p> : null}

      {tab === "rutas" ? (
        <section aria-labelledby="learning-routes-title" className="learning-section">
          <div className="learning-section-heading">
            <div><span>Explorar</span><h2 id="learning-routes-title">Rutas disponibles</h2></div>
            <p>Abre la ficha completa antes de inscribirte.</p>
          </div>
          {paths.length > 0 ? <div className="learning-path-grid">{paths.map((path, index) => <LearningPathCard key={path.id} path={path} priority={index === 0} v2State={isV2Card(path) ? v2States.find(state => state.enrollmentId === path.enrollmentId && state.pathVersionId === path.pathVersionId) ?? null : null} />)}</div> : <LearningEmpty available={available} />}
        </section>
      ) : tab === "progreso" ? (
        <section aria-labelledby="learning-progress-title" className="learning-section">
          <div className="learning-section-heading"><div><span>Tu recorrido</span><h2 id="learning-progress-title">Progreso confirmado</h2></div><p>Avance, evidencia y constancia cuentan cosas distintas.</p></div>
          {enrolledV2.map(path => {
            const state = v2States.find(item => item.enrollmentId === path.enrollmentId && item.pathVersionId === path.pathVersionId);
            return <article className="learning-status-card" data-engine-version="guided-v2" key={path.id}><Link href={`/aprendizaje/rutas/${encodeURIComponent(path.slug)}`}>{path.title}</Link>{state ? <RouteSignals state={state} /> : <p role="status">No pudimos cargar el estado confirmado de esta ruta.</p>}</article>;
          })}
          {enrolled.length > 0 ? (
            <div className="learning-progress-layout">
              <div className="learning-status-list">
                {enrolled.map((path) => {
                  const routeProgress = progress.find((entry) => entry.enrollmentId === path.enrollment?.id);
                  const objectives = routeProgress?.units.flatMap((unit) => unit.objectives) ?? [];
                  return (
                    <article className="learning-status-card" key={path.id}>
                      <Link href={`/aprendizaje/rutas/${path.slug}`}>
                        <span className="learning-status-icon"><ChartLineUp aria-hidden="true" size={22} /></span>
                        <span className="learning-status-copy">
                          <small>{path.enrollment?.status === "paused" ? "Ruta en pausa" : "Avance de ruta"}</small>
                          <strong>{path.title}</strong>
                          {routeProgress ? <><span>{routeProgress.completedEssentialSteps} de {routeProgress.totalEssentialSteps} actividades · {routeProgress.percentage}%</span><progress aria-label={`Progreso de ${path.title}`} max={routeProgress.totalEssentialSteps} value={routeProgress.completedEssentialSteps} /></> : <span>El detalle del progreso no está disponible ahora.</span>}
                        </span>
                        <ArrowRight aria-hidden="true" size={20} />
                      </Link>
                      {objectives.length > 0 ? <ul className="learning-evidence-list">{objectives.slice(0, 4).map((objective) => <li data-state={objective.state} key={objective.id}><span>{objective.title}</span><small>{evidenceLabels[objective.state]}{objective.reviewRecommended ? " · repaso recomendado" : ""}</small></li>)}</ul> : null}
                    </article>
                  );
                })}
              </div>
              <aside className="learning-progress-signals" aria-label="Resumen de constancia y puntos">
                {homeAvailable && home ? <>
                  <div className="learning-progress-signal"><Sparkle aria-hidden="true" size={23} /><span><strong>{home.points}</strong><small>Puntos de aprendizaje</small></span></div>
                  <div className="learning-progress-signal"><CalendarCheck aria-hidden="true" size={23} /><span><strong>{home.constancy.activeDaysThisWeek}{home.constancy.weeklyGoalDays ? ` de ${home.constancy.weeklyGoalDays}` : ""}</strong><small>{home.constancy.weeklyGoalDays ? "Días esta semana" : "Días activos esta semana"}</small></span></div>
                  <section className="learning-progress-milestones"><h3><Medal aria-hidden="true" size={20} /> Hitos permanentes</h3>{home.milestones.length > 0 ? <ul>{home.milestones.map((milestone) => <li key={milestone.awardKey}>{milestone.title}</li>)}</ul> : <p>Tu primer hito aparecerá al completar una actividad.</p>}</section>
                </> : <p role="status">No pudimos cargar puntos y constancia. El avance de tus rutas se mantiene arriba.</p>}
              </aside>
            </div>
          ) : enrolledV2.length === 0 ? (
            <section className="learning-empty"><span className="learning-empty-icon"><ChartLineUp aria-hidden="true" size={30} /></span><div><h2>Todavía no hay avance que mostrar</h2><p>El progreso aparecerá después de completar actividades guardadas; abrir una pantalla no suma.</p></div><Link className="learning-primary-button" href="/aprendizaje?tab=rutas">Elegir una ruta</Link></section>
          ) : null}
        </section>
      ) : (
        <section aria-labelledby="learning-today-title" className="learning-section">
          <div className="learning-section-heading"><div><span>Tu sesión</span><h2 id="learning-today-title">Para hoy</h2></div></div>
          {!homeAvailable ? <section className="learning-empty" role="alert"><div><h2>No pudimos cargar tu Inicio</h2><p>No mostraremos contadores en cero ni recomendaciones inventadas. Tu avance guardado no cambió.</p></div><Link className="learning-secondary-button" href="/aprendizaje?tab=hoy">Reintentar</Link></section> : null}
          <LearningTodayPanel home={home} paths={paths.filter((path): path is LearningPathCardData => !isV2Card(path))} v2Home={v2Home} v2States={v2States} />
        </section>
      )}
    </main>
  );
}
