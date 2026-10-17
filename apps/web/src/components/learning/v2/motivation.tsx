import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { V2Path, V2State } from "./model";
import { RouteAction } from "./route-action";
import { MaintenanceDate } from "./maintenance";
import styles from "./motivation.module.css";

export function LearningPoints({ path, state, unitKey, returnTo }: { path: V2Path; state: V2State; unitKey?: string; returnTo?: string | null }) {
  const motivation = state.motivation;
  if (!motivation) return null;
  const unit = path.units.find(item => item.key === unitKey);
  const placements = state.maintenance?.placements;
  const destination = placements?.find(item => item.status !== "passed" && unit?.objectives.some(objective => objective.key === item.objectiveKey))
    ?? placements?.find(item => item.status === "xp_required" || item.status === "available");
  const target = path.units.flatMap(item => item.objectives).find(item => item.key === destination?.objectiveKey);
  const repeats = motivation.practiceOffers.filter(item => !unit || unit.objectives.some(objective => objective.key === item.objectiveKey));
  const rules = motivation.rules;
  return <section className={styles.points} aria-label="Puntos de aprendizaje">
    <div className={styles.balance}><Sparkle size={22} weight="fill" aria-hidden /><strong>{motivation.totalXp} XP</strong><span>{motivation.routeXp} en esta ruta</span></div>
    {target && destination?.requiredXp !== undefined ? <div className={styles.goal}>
      <strong>{target.title}</strong><progress aria-label="XP para habilitar el diagnóstico" value={Math.min(motivation.totalXp, destination.requiredXp)} max={destination.requiredXp} />
      <p>{destination.remainingXp ? `Te faltan ${destination.remainingXp} XP para habilitar su diagnóstico.` : "Ya tienes los XP necesarios para hacer el diagnóstico."} Aprobarlo permite entrar a este objetivo.</p>
    </div> : null}
    <details><summary>Cómo ganar más XP</summary>
      <p>Ganas {rules.firstRecall} XP al recordar correctamente por primera vez un objetivo, {rules.mastery} al demostrar su dominio y {rules.consolidation} al recordarlo en los repasos posteriores.</p>
      <p>Al volver a practicar, corregir un error da hasta {rules.recovery} XP y mantener un acierto da hasta {rules.practice} XP. Cada pregunta y sus variantes dan XP extra una vez al día, tras al menos 10 minutos. Los XP extra requieren responder correctamente sin ayuda.</p>
      <p>{motivation.extraToday} de {rules.dailyLimit} XP extra ganados hoy. Los puntos se acumulan y no se gastan al hacer un diagnóstico.</p>
      <p>Cada objetivo previo pendiente requiere 20 XP para habilitar su diagnóstico de acceso.</p>
      <p>Los XP te permiten intentar el diagnóstico. El aprendizaje y el dominio se comprueban con tus respuestas.</p>
      {repeats.length ? <ul className={styles.repeats}>{repeats.slice(0, 3).map(item => <li key={item.key}>
        <strong>{item.reason === "correct_error" ? "Corregir un error" : "Mantener lo aprendido"}</strong>
        <span>{path.units.flatMap(unit => unit.objectives).find(objective => objective.key === item.objectiveKey)?.title}</span>
        {item.available ? <RouteAction path={path} state={state} target={{ kind: "activity", key: item.key }} returnTo={returnTo}
          label={item.xp ? `Practicar por hasta ${item.xp} XP` : "Practicar sin XP nuevos"} showReason={false} appearance="secondary" />
          : item.availableAfter ? <p>Disponible <MaintenanceDate value={item.availableAfter} timeZone={state.maintenance?.timeZone} relativeTo={state.maintenance?.generatedAt} friendly />.</p>
            : <p>Completa primero el refuerzo de los conocimientos previos.</p>}
      </li>)}</ul> : <p>Al completar una pregunta podrás volver a practicarla. Prioriza las actividades recomendadas y los repasos.</p>}
    </details>
  </section>;
}
