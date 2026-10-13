import { objectiveLabels, routeSignals, type V2Path, type V2State } from "./model";
import styles from "./styles.module.css";
import { CheckCircle, Circle, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";

export function RouteSignals({ state, appearance }: { state: V2State; appearance?: "overview" }) {
  const signals = routeSignals(state);
  if (appearance === "overview") return <div className={styles.progressOverview} aria-label="Estado confirmado de la ruta">
    <div className={styles.activityProgress}><span>{state.completedActivities} actividades completadas de {state.plannedRequiredActivities}</span>
      {state.plannedRequiredActivities > 0 ? <progress aria-label="Actividades completadas" value={state.completedActivities} max={state.plannedRequiredActivities} /> : null}
    </div>
    <ul className={styles.milestones}>{[
      { label: signals.completion, reached: !!state.completedAt },
      { label: signals.mastery, reached: !!state.masteredAt },
      { label: signals.consolidation, reached: !!state.consolidatedAt },
    ].map(item => <li key={item.label} data-reached={item.reached}>{item.reached ? <CheckCircle size={17} weight="fill" aria-hidden /> : <Circle size={17} aria-hidden />}<span>{item.label}</span></li>)}</ul>
    {signals.review > 0 || signals.reinforcement > 0 || state.dispensedActivities > 0 ? <div className={styles.progressNotes}>
      {signals.review > 0 ? <span className={styles.reviewBadge}><ArrowsClockwise size={14} aria-hidden />{signals.review} {signals.review === 1 ? "repaso pendiente" : "repasos pendientes"}</span> : null}
      {signals.reinforcement > 0 ? <span className={styles.reinforceBadge}>{signals.reinforcement} {signals.reinforcement === 1 ? "objetivo" : "objetivos"} por reforzar</span> : null}
      {state.dispensedActivities > 0 ? <span>{state.dispensedActivities} actividades dispensadas por el servidor</span> : null}
    </div> : null}
  </div>;
  return <div className={styles.signals} aria-label="Estado confirmado de la ruta">
    <span>{signals.completion}</span><span>{signals.mastery}</span><span>{signals.consolidation}</span>
    <span>{signals.review} {signals.review === 1 ? "repaso pendiente" : "repasos pendientes"}</span>
    {signals.reinforcement > 0 ? <span>{signals.reinforcement} {signals.reinforcement === 1 ? "objetivo" : "objetivos"} por reforzar</span> : null}
    <span>{state.completedActivities} actividades completadas de {state.plannedRequiredActivities}</span>
    {state.dispensedActivities > 0 ? <span>{state.dispensedActivities} actividades dispensadas por el servidor</span> : null}
  </div>;
}
export function ObjectiveList({ objectives, state }: { objectives: V2Path["units"][number]["objectives"]; state: V2State | null }) {
  return <ul className={styles.objectives}>{objectives.map(objective => {
    const confirmed = state?.objectives.find(item => item.objectiveKey === objective.key);
    return <li key={objective.key}><strong>{objective.title}</strong>
      <span className={styles.objectiveLabel} data-label={confirmed?.label}>{confirmed ? objectiveLabels[confirmed.label] : state ? "Por comprobar" : "Estado por cargar"}{objective.criticality === "core" ? " · objetivo esencial" : ""}</span>
      {confirmed?.criticalErrorOpen ? <span>Un error esencial mantiene bloqueadas las actividades que dependen de este objetivo. Requiere refuerzo.</span> : null}
      {confirmed?.reviewDue ? <span>Repaso pendiente</span> : null}
      {confirmed?.firstMasteredAt && confirmed.label !== "mastered" ? <span>Dominio previo conservado; la evidencia actual requiere refuerzo.</span> : null}
      {confirmed?.firstConsolidatedAt ? <span>Consolidación alcanzada</span> : null}
    </li>;
  })}</ul>;
}

export function UnitObjectiveStatus({ objectives, state }: { objectives: V2Path["units"][number]["objectives"]; state: V2State | null }) {
  if (!state || !objectives.length) return null;
  const entries = objectives.map(objective => state.objectives.find(item => item.objectiveKey === objective.key));
  const single = objectives.length === 1 ? entries[0] : null;
  const mastered = entries.filter(entry => entry?.label === "mastered").length;
  return <span className={styles.unitStatus} data-label={single?.label}>{objectives.length === 1 ? single ? objectiveLabels[single.label] : "Por comprobar" : `${mastered} de ${objectives.length} objetivos dominados`}</span>;
}
