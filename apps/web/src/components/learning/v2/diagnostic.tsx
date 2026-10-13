import styles from "./maintenance.module.css";
import type { V2Path, V2State } from "./model";
import { RouteAction } from "./route-action";
import { CaretDown, Compass } from "@phosphor-icons/react/dist/ssr";

export function DiagnosticPanel({ path, state }: { path: V2Path; state: V2State }) {
  const diagnostic = state.maintenance?.diagnostic;
  if (diagnostic?.status === "unavailable") return null;
  const activity = state.maintenance?.activities[0];
  return <details className={`${styles.panel} ${styles.disclosure}`} aria-label="Diagnóstico inicial" open={diagnostic?.status === "pending"}>
    <summary><Compass size={20} aria-hidden /><h2>Diagnóstico inicial</h2><span className={styles.badge}>Opcional</span><CaretDown className={styles.caret} size={18} aria-hidden /></summary>
    <div className={styles.panelBody}>
    <p>El diagnóstico orienta tu recorrido y no reduce tu progreso. Puedes continuar aprendiendo sin hacerlo.</p>
    {diagnostic?.status === "completed" ? <p>Diagnóstico realizado. Sus respuestas orientan el apoyo; el dominio se acredita con la práctica y las comprobaciones independientes.</p>
      : diagnostic?.status === "omitted" ? <p>Continuaste sin diagnóstico. Tu progreso se conserva.</p>
        : diagnostic?.assessmentKey ? <div className={styles.actions}>
          <RouteAction path={path} state={state} target={{ kind: "assessment", key: diagnostic.assessmentKey }} label="Comenzar diagnóstico" showReason={false} />
          {activity ? <RouteAction path={path} state={state} target={{ kind: "activity", key: activity.key }} label="Aprender sin diagnóstico" showReason={false} /> : null}
          {state.nextAction.kind === "resume" ? <p>Reanuda o termina la sesión abierta antes de comenzar otra.</p> : null}
        </div> : <p>Actualiza la ruta para consultar las opciones del diagnóstico.</p>}
    </div>
  </details>;
}
