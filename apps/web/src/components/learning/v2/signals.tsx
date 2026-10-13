import { objectiveLabels, routeSignals, type V2Path, type V2State } from "./model";
import styles from "./styles.module.css";
import { CheckCircle, Circle, ArrowsClockwise, BookOpen, ShieldCheck, Clock } from "@phosphor-icons/react/dist/ssr";

export function RouteSignals({ state, appearance }: { state: V2State; appearance?: "overview" }) {
  const signals = routeSignals(state);
  if (appearance === "overview") return <div className={styles.progressOverview} aria-label="Estado confirmado de la ruta">
    <div className={styles.activityProgress}><span>{state.completedActivities} actividades completadas de {state.plannedRequiredActivities}</span>
      {state.plannedRequiredActivities > 0 ? <progress aria-label="Actividades completadas" value={state.completedActivities} max={state.plannedRequiredActivities} /> : null}
    </div>
    <ul className={styles.milestones}>{[
      { title: "Actividades", label: state.completedAt ? "Completadas" : "En curso", reached: !!state.completedAt, Icon: BookOpen, description: signals.completion },
      { title: "Lo aprendido", label: state.masteredAt ? "Comprobado" : "Por comprobar", reached: !!state.masteredAt, Icon: ShieldCheck, description: signals.mastery },
      { title: "Repaso con el tiempo", label: state.consolidatedAt ? "Comprobado" : "Pendiente", reached: !!state.consolidatedAt, Icon: Clock, description: signals.consolidation },
    ].map(item => <li key={item.title} data-reached={item.reached} aria-label={item.description}><span className={styles.milestoneIcon}><item.Icon size={18} aria-hidden /></span><strong>{item.title}</strong><span className={styles.milestoneState}>{item.reached ? <CheckCircle size={14} weight="fill" aria-hidden /> : <Circle size={14} aria-hidden />}{item.label}</span></li>)}</ul>
    {signals.review > 0 || signals.reinforcement > 0 || state.dispensedActivities > 0 ? <div className={styles.progressNotes}>
      {signals.review > 0 ? <span className={styles.reviewBadge}><ArrowsClockwise size={14} aria-hidden />{signals.review} {signals.review === 1 ? "repaso pendiente" : "repasos pendientes"}</span> : null}
      {signals.reinforcement > 0 ? <span className={styles.reinforceBadge}>{signals.reinforcement} {signals.reinforcement === 1 ? "objetivo" : "objetivos"} por reforzar</span> : null}
      {state.dispensedActivities > 0 ? <span>{state.dispensedActivities} actividades ya cubiertas por tu aprendizaje previo</span> : null}
    </div> : null}
    <details className={styles.progressHelp}><summary>Qué significa mi progreso</summary><p>Completar actividades indica que recorriste el contenido. Comprobar lo aprendido requiere responder las evaluaciones. Los repasos posteriores comprueban qué recuerdas con el tiempo.</p></details>
  </div>;
  return <div className={styles.signals} aria-label="Estado confirmado de la ruta">
    <span className={styles.signalBadge} data-reached={!!state.completedAt}><BookOpen size={14} aria-hidden />{signals.completion}</span><span className={styles.signalBadge} data-reached={!!state.masteredAt}><ShieldCheck size={14} aria-hidden />{signals.mastery}</span><span className={styles.signalBadge} data-reached={!!state.consolidatedAt}><Clock size={14} aria-hidden />{signals.consolidation}</span>
    {signals.review > 0 ? <span className={styles.reviewBadge}><ArrowsClockwise size={14} aria-hidden />{signals.review} {signals.review === 1 ? "repaso pendiente" : "repasos pendientes"}</span> : null}
    {signals.reinforcement > 0 ? <span>{signals.reinforcement} {signals.reinforcement === 1 ? "objetivo" : "objetivos"} por reforzar</span> : null}
    <span>{state.completedActivities} actividades completadas de {state.plannedRequiredActivities}</span>
    {state.dispensedActivities > 0 ? <span>{state.dispensedActivities} actividades ya cubiertas por tu aprendizaje previo</span> : null}
  </div>;
}
export function ObjectiveList({ objectives, state }: { objectives: V2Path["units"][number]["objectives"]; state: V2State | null }) {
  return <ul className={styles.objectives}>{objectives.map(objective => {
    const confirmed = state?.objectives.find(item => item.objectiveKey === objective.key);
    return <li key={objective.key}><strong>{objective.title}</strong>
      <span className={styles.objectiveLabel} data-label={confirmed?.label}>{confirmed ? objectiveLabels[confirmed.label] : state ? "Por comprobar" : "Estado por cargar"}{objective.criticality === "core" ? " · objetivo esencial" : ""}</span>
      {confirmed?.criticalErrorOpen ? <span>Un error esencial mantiene bloqueadas las actividades que dependen de este objetivo. Requiere refuerzo.</span> : null}
      {confirmed?.reviewDue ? <span>Repaso pendiente</span> : null}
      {confirmed?.firstMasteredAt && confirmed.label !== "mastered" ? <span>Tu aprendizaje anterior se conserva. Ahora toca reforzarlo.</span> : null}
      {confirmed?.firstConsolidatedAt ? <span>Recordado en los repasos</span> : null}
    </li>;
  })}</ul>;
}

export function UnitObjectiveStatus({ objectives, state }: { objectives: V2Path["units"][number]["objectives"]; state: V2State | null }) {
  if (!state || !objectives.length) return null;
  const entries = objectives.map(objective => state.objectives.find(item => item.objectiveKey === objective.key));
  const single = objectives.length === 1 ? entries[0] : null;
  const mastered = entries.filter(entry => entry?.label === "mastered").length;
  return <span className={styles.unitStatus} data-label={single?.label}>{objectives.length === 1 ? single ? objectiveLabels[single.label] : "Por comprobar" : `${mastered} de ${objectives.length} objetivos comprobados`}</span>;
}
