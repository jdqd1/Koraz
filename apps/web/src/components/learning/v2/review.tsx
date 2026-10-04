import Link from "next/link";
import { routeHref, stateMatches, type V2Path, type V2State } from "./model";
import { RouteAction } from "./route-action";
import { RouteSignals } from "./signals";
import { DiagnosticPanel } from "./diagnostic";
import { GatePanel } from "./gate";
import { RemediationPanel } from "./remediation";
import { MaintenancePanel, MaintenanceDate } from "./maintenance";
import styles from "./maintenance.module.css";

export function V2ReviewScreen({ path, state }: { path: V2Path; state: V2State | null }) {
  const confirmed = stateMatches(path, state) && path.access === "enrolled" ? state : null;
  return <main className={`learning-main ${styles.screen}`} data-engine-version="guided-v2">
    <Link className="learning-back-link" href="/aprendizaje?tab=hoy">Volver a mi aprendizaje</Link>
    <header><span>{path.topicLabel}</span><h1>Práctica y mantenimiento</h1><p>{path.title}</p></header>
    {confirmed ? <>
      <section className={styles.panel} aria-label="Práctica recomendada">
        <h2>Tu siguiente paso</h2><RouteSignals state={confirmed} />
        <p>{confirmed.dueReviews ? `${confirmed.dueReviews} ${confirmed.dueReviews === 1 ? "objetivo pendiente" : "objetivos pendientes"} de repaso.` : "No hay repasos vencidos en el estado confirmado de esta ruta."}</p>
        <p>Puedes continuar aprendiendo sin vaciar todos los repasos. La próxima actividad se confirma al abrirla.</p>
        <RouteAction path={path} state={confirmed} />
        <div className={styles.actions}><Link href={routeHref(path.slug)}>Consultar esta ruta</Link><Link href="/aprendizaje?tab=rutas">Consultar otras rutas</Link></div>
      </section>
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
  return <section className={styles.panel} aria-label="Grupo de repaso">
    <h2>Un grupo acotado de repaso</h2>
    <p>{maintenance.reviewBatch.length ? `${maintenance.reviewBatch.length} ${maintenance.reviewBatch.length === 1 ? "objetivo disponible" : "objetivos disponibles"} en este grupo, hasta diez a la vez.` : "No hay práctica de repaso disponible en este grupo. Consulta la próxima acción y las fechas confirmadas."}</p>
    <p>Cada objetivo abre su propia práctica. Puedes parar después de cualquiera o continuar en otra rama disponible; no necesitas vaciar la cola.</p>
    {maintenance.reviewBatch.length ? <ol>{maintenance.reviewBatch.map((item, index) => {
      const title = objectives.find(objective => objective.key === item.objectiveKey)?.title ?? "Objetivo para repasar";
      return <li key={item.objectiveKey}><strong>{title}</strong><p>Pendiente desde <MaintenanceDate value={item.dueAt} timeZone={maintenance.timeZone} />.</p><RouteAction path={path} state={state} target={{ kind: "review", key: item.key }} label={`Repasar objetivo ${index + 1}`} showReason={false} /></li>;
    })}</ol> : null}
    {state.nextAction.kind === "resume" ? <p>Termina o reanuda la sesión abierta antes de abrir otra práctica.</p> : null}
  </section>;
}

export function AvailableBranches({ path, state }: { path: V2Path; state: V2State }) {
  const activities = state.maintenance?.activities;
  if (!activities?.length) return null;
  const objectives = path.units.flatMap(unit => unit.objectives);
  return <section className={styles.panel} aria-label="Otras ramas disponibles"><h2>Continuar aprendiendo</h2>
    <ul>{activities.map(item => <li key={item.key}><strong>{objectives.find(objective => objective.key === item.objectiveKey)?.title ?? "Objetivo disponible"}</strong><p>{item.reason}</p><RouteAction path={path} state={state} target={{ kind: "activity", key: item.key }} label={item.reason.startsWith("Ir a comprobar") ? "Ir a comprobar" : "Practicar este objetivo"} showReason={false} /></li>)}</ul>
    {state.nextAction.kind === "resume" ? <p>Hay una sesión abierta. Reanúdala antes de comenzar otra.</p> : null}
  </section>;
}

export function RouteMaintenance({ path, state }: { path: V2Path; state: V2State }) {
  if (!stateMatches(path, state) || path.access !== "enrolled") return null;
  return <div className={styles.screen}>
    <DiagnosticPanel path={path} state={state} />
    <details className={styles.panel} open={["remediate", "retention", "review", "none"].includes(state.nextAction.kind)}><summary>Refuerzo, repaso y mantenimiento</summary>
      <GatePanel path={path} state={state} /><RemediationPanel path={path} state={state} />
      <ReviewQueuePanel path={path} state={state} /><AvailableBranches path={path} state={state} /><MaintenancePanel path={path} state={state} />
    </details>
  </div>;
}
