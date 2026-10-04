import type { V2Path, V2State } from "./model";
import styles from "./maintenance.module.css";

export function GatePanel({ path, state }: { path: V2Path; state: V2State }) {
  const objectives = path.units.flatMap(unit => unit.objectives);
  const errors = state.objectives.filter(item => item.criticalErrorOpen);
  const maintenance = state.maintenance;
  const title = (key: string) => objectives.find(objective => objective.key === key)?.title ?? "Objetivo por comprobar";
  return <section className={styles.panel} aria-label="Comprobaciones y requisitos">
    <h2>Qué falta por comprobar</h2>
    {maintenance ? <ul>{maintenance.gates.map(gate => <li key={gate.unitKey}>
      <strong>{path.units.find(unit => unit.key === gate.unitKey)?.title ?? "Unidad"}: {gate.passed ? "Comprobación alcanzada" : "Comprobación pendiente"}</strong>
      {!gate.passed ? <><p>{gate.score === null ? "Aún no hay evidencia evaluada." : `Resultado confirmado: ${Math.round(gate.score)} %. Umbral de esta comprobación: ${gate.thresholdPercent} %.`}</p>
        {gate.missingCoreKeys.length ? <p>Objetivos esenciales por demostrar: {gate.missingCoreKeys.map(title).join("; ")}.</p> : null}
        {gate.criticalErrorKeys.length ? <p>Errores esenciales por reforzar: {gate.criticalErrorKeys.map(title).join("; ")}.</p> : null}</> : null}
    </li>)}</ul> : errors.length ? <><p>Un error esencial mantiene pendientes las actividades que dependen de ese objetivo. Tu historial se conserva.</p>
      <ul>{errors.map(item => <li key={item.objectiveKey}>{objectives.find(objective => objective.key === item.objectiveKey)?.title ?? "Objetivo por reforzar"}: requiere refuerzo y una nueva comprobación.</li>)}</ul></>
      : <p>No hay errores esenciales abiertos en el estado confirmado. Las comprobaciones disponibles se indican en la acción recomendada.</p>}
    {maintenance?.blockers.length ? <ul>{maintenance.blockers.map(blocker => <li key={blocker.objectiveKey}>{title(blocker.objectiveKey)} depende de: {blocker.blockedBy.map(title).join("; ")}. Demuestra estos objetivos y sus comprobaciones para continuar en esta rama.</li>)}</ul> : null}
    <p>{state.nextAction.reason}</p>
  </section>;
}
