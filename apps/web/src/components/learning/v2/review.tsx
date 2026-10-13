import Link from "next/link";
import { routeHref, stateMatches, type V2Path, type V2State } from "./model";
import { RouteAction } from "./route-action";
import { RouteSignals } from "./signals";
import { DiagnosticPanel } from "./diagnostic";
import { GatePanel } from "./gate";
import { RemediationPanel } from "./remediation";
import { MaintenancePanel, MaintenanceDate } from "./maintenance";
import styles from "./maintenance.module.css";
import routeStyles from "./path-screen.module.css";
import { ArrowLeft, ArrowsClockwise, CaretDown, SquaresFour } from "@phosphor-icons/react/dist/ssr";

export function V2ReviewScreen({ path, state }: { path: V2Path; state: V2State | null }) {
  const confirmed = stateMatches(path, state) && path.access === "enrolled" ? state : null;
  return <main className={`learning-main ${routeStyles.screen} ${styles.screen}`} data-engine-version="guided-v2">
    <Link className={routeStyles.back} href="/aprendizaje?tab=hoy"><ArrowLeft size={18} aria-hidden />Volver a mi aprendizaje</Link>
    <header className={styles.reviewHeader}><h1>Repaso y práctica</h1><span>{path.title}</span></header>
    {confirmed ? <>
      <section className={routeStyles.nextStep} aria-label="Práctica recomendada">
        <div className={routeStyles.nextStepHeading}><span className={routeStyles.actionIcon}><ArrowsClockwise size={22} aria-hidden /></span><h2>Tu siguiente paso</h2></div>
        <p>{confirmed.dueReviews ? `${confirmed.dueReviews} ${confirmed.dueReviews === 1 ? "objetivo pendiente" : "objetivos pendientes"} de repaso.` : "No hay repasos vencidos en el estado confirmado de esta ruta."}</p>
        <RouteAction path={path} state={confirmed} showReason={false} />
        <details className={styles.help}><summary>Ver recomendación</summary><p>{confirmed.nextAction.reason}</p><p>Puedes continuar aprendiendo sin vaciar todos los repasos. La próxima actividad se confirma al abrirla.</p></details>
        <div className={styles.actions}><Link href={routeHref(path.slug)}>Consultar esta ruta</Link><Link href="/aprendizaje?tab=rutas">Consultar otras rutas</Link></div>
      </section>
      <section className={routeStyles.progress} aria-label="Tu progreso"><h2>Tu progreso</h2><RouteSignals state={confirmed} appearance="overview" /></section>
      <DiagnosticPanel path={path} state={confirmed} />
      <GatePanel path={path} state={confirmed} />
      <RemediationPanel path={path} state={confirmed} />
      <ReviewQueuePanel path={path} state={confirmed} />
      <AvailableBranches path={path} state={confirmed} />
      <MaintenancePanel path={path} state={confirmed} />
    </> : <section className={styles.panel} role="alert"><h2>Estado por confirmar</h2><p>{path.access === "revoked" ? "El acceso a esta ruta no está disponible. Tu historial se conserva." : "No pudimos cargar el estado confirmado de esta ruta. Vuelve a abrirla para revisar las opciones disponibles."}</p><Link href={routeHref(path.slug)}>Volver a la ruta</Link></section>}
  </main>;
}

export function ReviewQueuePanel({ path, state }: { path: V2Path; state: V2State }) {
  const maintenance = state.maintenance;
  if (!maintenance) return null;
  const objectives = path.units.flatMap(unit => unit.objectives);
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Grupo de repaso" open={maintenance.reviewBatch.length > 0}>
    <summary><ArrowsClockwise size={20} aria-hidden /><h2>{maintenance.reviewBatch.length ? "Repasos pendientes" : "Repasos"}</h2>{maintenance.reviewBatch.length ? <span className={styles.badge} data-tone="review">{maintenance.reviewBatch.length}</span> : null}<CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}>
    {maintenance.reviewBatch.length ? <ol className={styles.reviewList}>{maintenance.reviewBatch.map((item) => {
      const title = objectives.find(objective => objective.key === item.objectiveKey)?.title ?? "Objetivo para repasar";
      return <li key={item.objectiveKey}><div><strong>{title}</strong><p>Pendiente desde <MaintenanceDate value={item.dueAt} timeZone={maintenance.timeZone} compact />.</p></div><RouteAction path={path} state={state} target={{ kind: "review", key: item.key }} label="Repasar" showReason={false} appearance="secondary" /></li>;
    })}</ol> : null}
    {state.nextAction.kind === "resume" ? <p>Termina o reanuda la sesión abierta antes de abrir otra práctica.</p> : null}
    <details className={styles.help}><summary>Cómo funcionan los repasos</summary><p>{maintenance.reviewBatch.length ? `${maintenance.reviewBatch.length} ${maintenance.reviewBatch.length === 1 ? "objetivo disponible" : "objetivos disponibles"} en este grupo, hasta diez a la vez.` : "No hay práctica de repaso disponible en este grupo. Consulta la próxima acción y las fechas confirmadas."}</p><p>Cada objetivo abre su propia práctica. Puedes parar después de cualquiera o continuar en otra rama disponible; no necesitas vaciar la cola.</p></details>
    </div>
  </details>;
}

export function AvailableBranches({ path, state }: { path: V2Path; state: V2State }) {
  const activities = state.maintenance?.activities;
  if (!activities?.length) return null;
  const objectives = path.units.flatMap(unit => unit.objectives);
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Otras ramas disponibles"><summary><SquaresFour size={20} aria-hidden /><h2>Otras actividades</h2><CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}><ul className={styles.reviewList}>{activities.map(item => <li key={item.key}><div><strong>{objectives.find(objective => objective.key === item.objectiveKey)?.title ?? "Objetivo disponible"}</strong><p>{item.reason}</p></div><RouteAction path={path} state={state} target={{ kind: "activity", key: item.key }} label={item.reason.startsWith("Ir a comprobar") ? "Ir a comprobar" : "Practicar este objetivo"} showReason={false} appearance="secondary" /></li>)}</ul>
    {state.nextAction.kind === "resume" ? <p>Hay una sesión abierta. Reanúdala antes de comenzar otra.</p> : null}
    </div>
  </details>;
}

export function RouteMaintenance({ path, state }: { path: V2Path; state: V2State }) {
  if (!stateMatches(path, state) || path.access !== "enrolled") return null;
  return <div className={styles.screen}>
    <ReviewQueuePanel path={path} state={state} />
    <RemediationPanel path={path} state={state} />
    <AvailableBranches path={path} state={state} />
    <MaintenancePanel path={path} state={state} />
    <GatePanel path={path} state={state} />
    <DiagnosticPanel path={path} state={state} />
  </div>;
}
