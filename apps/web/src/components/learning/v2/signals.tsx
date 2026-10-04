import { objectiveLabels, routeSignals, type V2Path, type V2State } from "./model";
import styles from "./styles.module.css";

export function RouteSignals({ state }: { state: V2State }) {
  const signals = routeSignals(state);
  return <div className={styles.signals} aria-label="Estado confirmado de la ruta">
    <span>{signals.completion}</span><span>{signals.mastery}</span><span>{signals.consolidation}</span>
    <span>{signals.review} repasos pendientes</span>
    {signals.reinforcement > 0 ? <span>{signals.reinforcement} {signals.reinforcement === 1 ? "objetivo" : "objetivos"} por reforzar</span> : null}
    <span>{state.completedActivities} actividades completadas de {state.plannedRequiredActivities}</span>
    {state.dispensedActivities > 0 ? <span>{state.dispensedActivities} actividades dispensadas por el servidor</span> : null}
  </div>;
}
export function ObjectiveList({ objectives, state }: { objectives: V2Path["units"][number]["objectives"]; state: V2State | null }) {
  return <ul className={styles.objectives}>{objectives.map(objective => {
    const confirmed = state?.objectives.find(item => item.objectiveKey === objective.key);
    return <li key={objective.key}><strong>{objective.title}</strong>
      <span>{confirmed ? objectiveLabels[confirmed.label] : state ? "Por comprobar" : "Estado por cargar"}{objective.criticality === "core" ? " · objetivo esencial" : ""}</span>
      {confirmed?.criticalErrorOpen ? <span>Un error esencial mantiene bloqueadas las actividades que dependen de este objetivo. Requiere refuerzo.</span> : null}
      {confirmed?.reviewDue ? <span>Repaso pendiente</span> : null}
      {confirmed?.firstMasteredAt && confirmed.label !== "mastered" ? <span>Dominio previo conservado; la evidencia actual requiere refuerzo.</span> : null}
      {confirmed?.firstConsolidatedAt ? <span>Consolidación alcanzada</span> : null}
    </li>;
  })}</ul>;
}
