import { validateRoutePackage, type RouteActivity, type RoutePackage } from "@cediah/contracts";
import { nextLocalKeyV2 } from "./editor-model";
import { addVisualPresetV2, isVisualPresetV2, syncCaseOrderV2, visualPresetsV2 } from "./visual-presets";

export const activityTypesV2 = {
  study: "Estudio", single_choice: "Elección única", short_answer: "Respuesta breve",
  constructed_response: "Respuesta construida", card: "Tarjeta de recuperación",
  ...visualPresetsV2,
} as const;
export type ActivityPresetV2 = keyof typeof activityTypesV2;
export type EditableActivityV2 = RouteActivity;
export function editableActivityV2(activity: RouteActivity): activity is EditableActivityV2 {
  return activity.kind in activityTypesV2;
}
export function addActivityV2(pkg: RoutePackage, preset: ActivityPresetV2, objectiveKey: string): RoutePackage {
  if (isVisualPresetV2(preset)) return addVisualPresetV2(pkg, preset, objectiveKey);
  const objective = pkg.objectives.find((item) => item.key === objectiveKey);
  if (!objective || !pkg.units.some((item) => item.key === objective.unitKey) || pkg.activities.length >= 2000) return pkg;
  const key = nextLocalKeyV2("actividad", pkg.activities.map((item) => item.key));
  const base = { key, objectiveKey, relatedObjectiveKeys: [], phase: preset === "study" ? "learn" as const : preset === "constructed_response" ? "elaborate" as const : "retrieve" as const,
    required: true, sourceKeys: [...objective.sourceKeys], representation: "text" as const,
    equivalenceKey: nextLocalKeyV2("familia", pkg.activities.map((item) => item.equivalenceKey)), hints: [], use: "learning" as const,
    prompt: "", feedback: { explanation: "", commonError: "", sourceKeys: [...objective.sourceKeys] }, misconceptionMappings: [], alternativeActivityKey: null };
  let activity: EditableActivityV2;
  switch (preset) {
    case "study": activity = { ...base, kind: "study", payload: { body: "", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } }; break;
    case "single_choice": activity = { ...base, kind: "single_choice", payload: { options: [{ key: "opcion-1", text: "" }, { key: "opcion-2", text: "" }], correctKey: "opcion-1", distractorFeedback: { "opcion-2": "" } } }; break;
    case "short_answer": activity = { ...base, kind: "short_answer", payload: { acceptedAnswers: [""], maxChars: 500, modelAnswer: "", normalization: "nfkc-lower-space" } }; break;
    default: activity = { ...base, kind: "constructed_response", payload: { rubric: [{ key: "criterio-1", criterion: "", example: "" }], modelAnswer: "", verificationActivityKey: null } };
  }
  return { ...pkg, activities: [...pkg.activities, activity], units: pkg.units.map((unit) => unit.key === objective.unitKey ? { ...unit, activityKeys: [...unit.activityKeys, key] } : unit) };
}
export function replaceActivityV2(pkg: RoutePackage, activity: RouteActivity): RoutePackage {
  const previous = pkg.activities.find((item) => item.key === activity.key);
  const objective = pkg.objectives.find((item) => item.key === activity.objectiveKey);
  if (!previous || !objective) return pkg;
  return syncCaseOrderV2({ ...pkg, activities: pkg.activities.map((item) => item.key === activity.key ? activity : item),
    units: previous.objectiveKey === activity.objectiveKey ? pkg.units : pkg.units.map((unit) => ({ ...unit, activityKeys: [...unit.activityKeys.filter((key) => key !== activity.key), ...(unit.key === objective.unitKey ? [activity.key] : [])] })) }, activity);
}
export function choiceCorrectV2(activity: Extract<RouteActivity, { kind: "single_choice" }>, correctKey: string) {
  if (!activity.payload.options.some((option) => option.key === correctKey)) return activity;
  return { ...activity, payload: { ...activity.payload, correctKey, distractorFeedback: Object.fromEntries(activity.payload.options.filter((option) => option.key !== correctKey).map((option) => [option.key, activity.payload.distractorFeedback[option.key] ?? ""])) } };
}
export function activityDeletionBlockV2(pkg: RoutePackage, key: string) {
  if (pkg.assessments.some((item) => item.candidateActivityKeys.includes(key))) return "Esta actividad está reservada en una evaluación. Retírala de ella antes de eliminarla.";
  if (pkg.objectives.some((item) => item.misconceptions.some((error) => error.remediationActivityKey === key || error.verificationActivityKeys.includes(key)))) return "Esta actividad está vinculada a un error del objetivo. Reasigna su remediación o verificación primero.";
  if (pkg.activities.some((item) => item.key !== key && (item.alternativeActivityKey === key
    || item.kind === "constructed_response" && item.payload.verificationActivityKey === key
    || item.kind === "image_target" && item.payload.accessibleAlternativeKey === key
    || item.kind === "sequence" && item.payload.whyActivityKey === key
    || item.kind === "case" && item.payload.stages.some((stage) => stage.childActivityKey === key)))) return "Otra actividad utiliza esta actividad como verificación, alternativa o etapa. Reasigna ese vínculo primero.";
  return null;
}
export function deleteActivityV2(pkg: RoutePackage, key: string): RoutePackage {
  if (activityDeletionBlockV2(pkg, key)) return pkg;
  return { ...pkg, activities: pkg.activities.filter((item) => item.key !== key), units: pkg.units.map((unit) => ({ ...unit, activityKeys: unit.activityKeys.filter((value) => value !== key) })) };
}
export function objectiveVerificationOptionsV2(pkg: RoutePackage, activity: RouteActivity) {
  return pkg.activities.filter((item) => item.key !== activity.key && item.objectiveKey === activity.objectiveKey && ["single_choice", "short_answer", "match", "image_target", "sequence"].includes(item.kind) && (item.kind !== "image_target" || item.payload.masking === "no_labels") && ["learning", "gate"].includes(item.use));
}
export function activityValidationV2(pkg: RoutePackage) {
  const result = validateRoutePackage(pkg);
  const grouped = new Map<string, typeof result.issues>();
  for (const issue of result.issues) {
    const owner = /^\/(objectives|activities)\/(\d+)(?:\/|$)/.exec(issue.path);
    if (!owner) continue;
    const key = owner[1] === "objectives" ? pkg.objectives[Number(owner[2])]?.key : pkg.activities[Number(owner[2])]?.objectiveKey;
    if (key) grouped.set(key, [...(grouped.get(key) ?? []), issue]);
  }
  return { ...result, objectives: pkg.objectives.map((objective) => ({ objective, issues: grouped.get(objective.key) ?? [] })) };
}
export function activitySaveIssuesV2(pkg: RoutePackage) {
  return validateRoutePackage(pkg).issues.filter((issue) => issue.path.startsWith("/activities/") && ["SCHEMA_INVALID", "DUPLICATE_KEY"].includes(issue.code));
}
