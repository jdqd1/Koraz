import styles from "./maintenance.module.css";
import type { V2Path, V2State } from "./model";
import { RouteAction } from "./route-action";
import { CaretDown, Compass } from "@phosphor-icons/react/dist/ssr";
import { MaintenanceDate } from "./maintenance";

export function DiagnosticPanel({ path, state }: { path: V2Path; state: V2State }) {
  const diagnostic = state.maintenance?.diagnostic;
  if (diagnostic?.status === "unavailable") return null;
  const activity = state.maintenance?.activities[0];
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Diagnóstico inicial" open={diagnostic?.status === "pending"}>
    <summary><Compass size={20} aria-hidden /><h2>Diagnóstico inicial</h2><span className={styles.badge}>Opcional</span><CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}>
    <p>El diagnóstico orienta tu recorrido y no reduce tu progreso. Puedes continuar aprendiendo sin hacerlo.</p>
    {diagnostic?.status === "completed" ? <p>Diagnóstico realizado. Sus respuestas orientan el apoyo; el dominio se acredita con la práctica y las comprobaciones independientes.</p>
      : diagnostic?.assessmentKey ? <div className={styles.actions}>
          {diagnostic.status === "omitted" ? <p>Puedes hacer el diagnóstico aunque ya hayas comenzado. Tu progreso se conserva.</p> : null}
          <RouteAction path={path} state={state} target={{ kind: "assessment", key: diagnostic.assessmentKey }} label="Comenzar diagnóstico" showReason={false} />
          {activity ? <RouteAction path={path} state={state} target={{ kind: "activity", key: activity.key }} label="Aprender sin diagnóstico" showReason={false} /> : null}
          {state.nextAction.kind === "resume" ? <p>Reanuda o termina la sesión abierta antes de comenzar otra.</p> : null}
        </div> : <p>Actualiza la ruta para consultar las opciones del diagnóstico.</p>}
    </div>
  </details>;
}

export function ObjectivePlacement({ path, state, objectiveKey, returnTo }: { path: V2Path; state: V2State; objectiveKey: string; returnTo?: string | null }) {
  const offer = state.maintenance?.placements?.find(item => item.objectiveKey === objectiveKey);
  if (!offer || path.availability === "maintenance" || state.availability === "maintenance") return null;
  return <section className={styles.panel} aria-label="Avanzar con diagnóstico">
    {offer.status === "passed" ? <p>Conocimientos previos comprobados. Puedes comenzar este objetivo y seguir aprendiendo a tu ritmo.</p>
      : <><strong>¿Ya conoces los temas anteriores?</strong><p>Responde un diagnóstico de los conocimientos previos para entrar aquí. Debes acertar en cada tema evaluado. Tu progreso se conserva; las unidades anteriores siguen disponibles para practicar y repasar.</p>
        {offer.status === "xp_required" ? <p>Te faltan {offer.remainingXp} XP para habilitar este diagnóstico. Repite actividades o corrige errores para ganarlos.</p>
          : offer.status === "available" && offer.assessmentKey ? <RouteAction path={path} state={state} returnTo={returnTo}
          target={{ kind: "assessment", key: offer.assessmentKey, objectiveKey }} label="Hacer diagnóstico para avanzar" showReason={false} appearance="secondary" />
          : offer.prerequisiteKeys.some(key => state.objectives.some(item => item.objectiveKey === key && item.criticalErrorOpen)) ? <p>Completa el refuerzo de los temas anteriores antes de hacer el diagnóstico.</p>
            : offer.availableAfter ? <p>Podrás volver a intentarlo <MaintenanceDate value={offer.availableAfter} timeZone={state.maintenance?.timeZone} relativeTo={state.maintenance?.generatedAt} friendly />. Mientras tanto, practica los temas anteriores.</p>
            : <p>Esta ruta aún no tiene preguntas suficientes para comprobar todos los conocimientos previos. Puedes avanzar completando los temas anteriores.</p>}
        {state.nextAction.kind === "resume" ? <p>Termina o retoma la sesión abierta para comenzar el diagnóstico.</p> : null}
      </>}
  </section>;
}
