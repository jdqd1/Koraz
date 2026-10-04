import type { RouteActivity, RoutePackage } from "@cediah/contracts";
import { nextLocalKeyV2 } from "./editor-model";

export const visualPresetsV2 = {
  match: "Relaciones", image_target: "Imagen: señalar o etiquetar", sequence: "Secuencia", case: "Caso progresivo",
  comparison: "Tabla de comparación", causal_map: "Micro-mapa de relaciones", mechanism: "Mecanismo y explicación", error: "Detección y corrección de errores",
} as const;
export type VisualPresetV2 = keyof typeof visualPresetsV2;
export function isVisualPresetV2(preset: string): preset is VisualPresetV2 { return preset in visualPresetsV2; }

// Presets only compose the existing eight families. Content and solutions remain empty.
export function addVisualPresetV2(pkg: RoutePackage, preset: VisualPresetV2, objectiveKey: string): RoutePackage {
  const objective = pkg.objectives.find((item) => item.key === objectiveKey);
  const count = preset === "mechanism" ? 2 : preset === "error" ? 3 : 1;
  if (!objective || !pkg.units.some((unit) => unit.key === objective.unitKey) || pkg.activities.length + count > 2000) return pkg;
  const usedKeys = pkg.activities.map((item) => item.key);
  const usedFamilies = pkg.activities.map((item) => item.equivalenceKey);
  function base(phase: RouteActivity["phase"], representation: RouteActivity["representation"]) {
    const key = nextLocalKeyV2("actividad", usedKeys); usedKeys.push(key);
    const equivalenceKey = nextLocalKeyV2("familia", usedFamilies); usedFamilies.push(equivalenceKey);
    return { key, objectiveKey, relatedObjectiveKeys: [], phase, required: true, sourceKeys: [...objective!.sourceKeys], representation,
      equivalenceKey, hints: [], use: "learning" as const, prompt: "", feedback: { explanation: "", commonError: "", sourceKeys: [...objective!.sourceKeys] }, misconceptionMappings: [], alternativeActivityKey: null };
  }
  const relation = (presentation: "pairs" | "comparison_table" | "causal_map"): RouteActivity => ({ ...base("elaborate", presentation === "causal_map" ? "diagram" : "table"), kind: "match", payload: {
    presentation, prompts: [{ key: "enunciado-1", text: "" }], choices: [{ key: "opcion-1", text: "" }], correctByPrompt: {}, allowReuse: false, edges: [],
  } });
  const sequence = (): RouteActivity => ({ ...base("apply", "diagram"), kind: "sequence", payload: { items: [1, 2, 3].map((i) => ({ key: `paso-${i}`, text: "" })), acceptedOrders: [["paso-1", "paso-2", "paso-3"]], whyActivityKey: null } });
  const constructed = (): Extract<RouteActivity, {kind: "constructed_response"}> => ({ ...base("elaborate", "text"), kind: "constructed_response", payload: { modelAnswer: "", rubric: [{ key: "criterio-1", criterion: "", example: "" }], verificationActivityKey: null } });
  let created: RouteActivity[];
  switch (preset) {
    case "match": created = [relation("pairs")]; break;
    case "comparison": created = [relation("comparison_table")]; break;
    case "causal_map": created = [relation("causal_map")]; break;
    case "image_target": created = [{ ...base("apply", "image"), kind: "image_target", payload: { assetKey: "", mode: "hotspot", targets: [{ key: "zona-1", prompt: "", polygon: [], label: "" }], labels: [], correctLabelByTarget: {}, accessibleAlternativeKey: "", masking: "no_labels" } }]; break;
    case "sequence": created = [sequence()]; break;
    case "case": created = [{ ...base("apply", "case"), kind: "case", payload: { stages: [1, 2].map((i) => ({ key: `etapa-${i}`, narrative: "", childActivityKey: "" })) } }]; break;
    case "mechanism": { const first = sequence(); const why = constructed(); if (first.kind === "sequence") first.payload.whyActivityKey = why.key; created = [first, why]; break; }
    case "error": {
      const wrapper: Extract<RouteActivity, { kind: "case" }> = { ...base("apply", "case"), kind: "case", payload: { stages: [] } };
      const detect: RouteActivity = { ...base("retrieve", "case"), kind: "single_choice", payload: { options: [1, 2].map((i) => ({ key: `opcion-${i}`, text: "" })), correctKey: "opcion-1", distractorFeedback: { "opcion-2": "" } } };
      const correct = constructed(); correct.payload.verificationActivityKey = detect.key;
      wrapper.payload.stages = [{ key: "deteccion", narrative: "", childActivityKey: detect.key }, { key: "correccion", narrative: "", childActivityKey: correct.key }];
      created = [wrapper, detect, correct]; break;
    }
  }
  return { ...pkg, activities: [...pkg.activities, ...created], units: pkg.units.map((unit) => unit.key === objective.unitKey ? { ...unit, activityKeys: [...unit.activityKeys, ...created.map((item) => item.key)] } : unit) };
}

export function moveEntryV2<T>(entries: T[], index: number, offset: number): T[] {
  const target = index + offset;
  if (index < 0 || target < 0 || index >= entries.length || target >= entries.length) return entries;
  const next = [...entries]; [next[index], next[target]] = [next[target]!, next[index]!]; return next;
}

// Changes to a case reorder its existing children in the unit, without creating copies.
export function syncCaseOrderV2(pkg: RoutePackage, activity: RouteActivity): RoutePackage {
  if (activity.kind !== "case") return pkg;
  const children = activity.payload.stages.map((stage) => pkg.activities.find((item) => item.key === stage.childActivityKey))
    .filter((item): item is RouteActivity => Boolean(item && item.kind !== "case" && item.objectiveKey === activity.objectiveKey));
  const keys = [...new Set(children.map((item) => item.key))];
  return { ...pkg, units: pkg.units.map((unit) => {
    if (!unit.activityKeys.includes(activity.key)) return unit;
    const remaining = unit.activityKeys.filter((key) => !keys.includes(key));
    const index = remaining.indexOf(activity.key);
    return { ...unit, activityKeys: [...remaining.slice(0, index + 1), ...keys, ...remaining.slice(index + 1)] };
  }) };
}
