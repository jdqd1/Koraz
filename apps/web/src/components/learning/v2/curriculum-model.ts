import { type V2Path, type V2State } from "./model";

export type V2Unit = V2Path["units"][number];
export type CurriculumActivity = NonNullable<V2Unit["activities"]>[number];
export const activityFormats = { study: "Lectura", single_choice: "Pregunta de opción múltiple", short_answer: "Respuesta breve", constructed_response: "Explicación escrita", match: "Relaciones", image_target: "Práctica visual", sequence: "Ordenar elementos", case: "Caso práctico" } as const;
export function activityTitle(activity: CurriculumActivity) {
  if (activity.kind === "study") return activity.scaffold === "worked_example" ? "Revisar un ejemplo resuelto" : activity.scaffold === "partial_example" ? "Completar un ejemplo guiado" : "Leer y comprender";
  return { single_choice: "Elegir la respuesta correcta", short_answer: "Recordar sin mirar", constructed_response: "Explicar con tus palabras", match: "Relacionar conceptos", image_target: "Identificar en la imagen", sequence: "Ordenar la secuencia", case: "Resolver un caso" }[activity.kind];
}

/** Presentation joins only; eligibility and achievements come from the server. */
export function actionLocation(path: V2Path, state: V2State, key = state.nextAction.key) {
  const context = key === state.nextAction.key ? state.nextActionContext : null;
  const activityUnit = path.units.find(unit => unit.activities?.some(activity => activity.key === key));
  const activity = activityUnit?.activities?.find(activity => activity.key === key);
  const objectiveKey = context?.objectiveKey ?? activity?.objectiveKey
    ?? state.maintenance?.reviewBatch.find(item => item.key === key)?.objectiveKey
    ?? state.maintenance?.activities.find(item => item.key === key)?.objectiveKey
    ?? state.maintenance?.remediation.find(item => item.activityKey === key)?.objectiveKey;
  const unit = path.units.find(unit => unit.key === context?.unitKey) ?? activityUnit
    ?? path.units.find(unit => unit.objectives.some(objective => objective.key === objectiveKey));
  return { unit, activity, objective: unit?.objectives.find(objective => objective.key === objectiveKey) };
}
export function unitActivityProgress(unit: V2Unit, state: V2State | null) {
  if (!unit.activities || !state?.activityProgress) return null;
  const activities = unit.activities.filter(activity => activity.required && activity.phase !== "remediate");
  const progress = new Map(state.activityProgress.map(item => [item.key, item.status]));
  if (activities.some(activity => !progress.has(activity.key))) return null;
  return { total: activities.length, completed: activities.filter(activity => progress.get(activity.key) === "completed").length,
    covered: activities.filter(activity => progress.get(activity.key) === "dispensed").length };
}
export function unitRecommendation(path: V2Path, state: V2State | null, unit?: V2Unit) {
  if (!state) return null;
  const location = actionLocation(path, state);
  // Resume the open session before offering any other activity.
  if (!unit || state.nextAction.kind === "resume") {
    return state.nextAction.kind === "none" ? null : { ...location, target: undefined, kind: state.nextAction.kind, key: state.nextAction.key };
  }
  const objectives = new Set(unit.objectives.map(objective => objective.key));
  const activities = state.maintenance?.activities.filter(item => objectives.has(item.objectiveKey));
  const pending = activities?.find(item => state.activityProgress?.some(progress => progress.key === item.key && progress.status === "pending"));
  // The learner chose this unit: offer its confirmed new work before a routine review.
  // Open sessions, remediation and assessments keep the server's priority.
  if (pending && (location.unit?.key !== unit.key || ["review", "activity", "none"].includes(state.nextAction.kind))) {
    return { ...actionLocation(path, state, pending.key), target: { kind: "activity" as const, key: pending.key }, kind: "activity" as const, key: pending.key };
  }
  const placement = state.maintenance?.placements?.find(item => item.status === "available" && item.assessmentKey && objectives.has(item.objectiveKey));
  if (placement && (location.unit?.key !== unit.key || ["review", "activity", "none"].includes(state.nextAction.kind))) {
    return { unit, objective: unit.objectives.find(item => item.key === placement.objectiveKey), activity: undefined,
      target: { kind: "assessment" as const, key: placement.assessmentKey!, objectiveKey: placement.objectiveKey }, kind: "gate" as const, key: placement.assessmentKey };
  }
  if (location.unit?.key === unit.key) return state.nextAction.kind === "none" ? null : { ...location, target: undefined, kind: state.nextAction.kind, key: state.nextAction.key };
  const review = state.maintenance?.reviewBatch.find(item => objectives.has(item.objectiveKey));
  const activity = activities?.[0];
  const offered = review ?? activity;
  if (!offered) return null;
  return { ...actionLocation(path, state, offered.key), target: { kind: review ? "review" as const : "activity" as const, key: offered.key }, kind: review ? "review" as const : "activity" as const, key: offered.key };
}
export function recommendationTitle(path: V2Path, state: V2State, unit?: V2Unit) {
  const recommendation = unitRecommendation(path, state, unit);
  if (!recommendation) return null;
  const diagnostic = recommendation.kind === "gate" && Boolean(recommendation.target?.kind === "assessment" ? recommendation.target.objectiveKey : state.nextAction.objectiveKey);
  return { ...recommendation, diagnostic, title: recommendation.kind === "resume" ? "Retomar tu sesión" : recommendation.kind === "review" || recommendation.kind === "retention" ? "Repasar lo aprendido"
    : recommendation.kind === "gate" ? diagnostic ? "Diagnóstico para avanzar" : "Comprobar lo aprendido" : recommendation.kind === "remediate" ? "Reforzar este objetivo" : recommendation.activity ? activityTitle(recommendation.activity) : "Continuar la práctica" };
}
