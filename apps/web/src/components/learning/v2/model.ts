import type { z } from "zod";
import type { LearningPathCard, V2PublicPathSchema, V2PathCardSchema, V2RouteStateSchema, V2HomeSnapshotSchema, V2AttemptManifestSchema } from "@cediah/contracts";
import { safeMapReturnHref } from "../map/map-route";

export type V2Path = z.infer<typeof V2PublicPathSchema>;
export type V2Card = z.infer<typeof V2PathCardSchema>;
export type V2State = z.infer<typeof V2RouteStateSchema>;
export type V2Home = z.infer<typeof V2HomeSnapshotSchema>;
export type V2Attempt = z.infer<typeof V2AttemptManifestSchema>;
export type RouteCard = LearningPathCard | V2Card;
export const objectiveLabels = { new: "Por comprobar", learning: "En práctica", mastered: "Dominado", reinforce: "Necesita refuerzo" } as const;
export const covers = {
  "back-muscles": "/anatomy/back-muscles.png", heart: "/anatomy/heart.png", intestines: "/anatomy/intestines.png", lungs: "/anatomy/lungs.png",
  "neck-muscles": "/anatomy/neck-muscles.png", pelvis: "/anatomy/pelvis.png", skull: "/anatomy/skull.png", thigh: "/anatomy/thigh.png",
} as const;
export function isV2Card(card: RouteCard): card is V2Card { return "engineVersion" in card && card.engineVersion === "guided-v2"; }
/** An existing v1 enrollment stays on its adopted engine until explicit upgrade. */
export function mergeCards(v1: LearningPathCard[], v2: V2Card[]): RouteCard[] {
  const cards: RouteCard[] = [...v1];
  for (const card of v2) {
    const index = cards.findIndex(item => item.id === card.id);
    if (index < 0) cards.push(card);
    else if (card.enrollmentId || isV2Card(cards[index]!) || !(cards[index] as LearningPathCard).enrollment) cards[index] = card;
  }
  return cards;
}
export function routeHref(slug: string, unit?: string, returnTo?: string | null) {
  const query = new URLSearchParams();
  if (unit) query.set("leccion", unit);
  const safe = safeMapReturnHref(returnTo);
  if (safe) query.set("returnTo", safe);
  return `/aprendizaje/rutas/${encodeURIComponent(slug)}${query.size ? `?${query}` : ""}`;
}
export function stateMatches(path: Pick<V2Path, "enrollmentId" | "pathVersionId">, state: V2State | null): state is V2State {
  return !!state && state.enrollmentId === path.enrollmentId && state.pathVersionId === path.pathVersionId;
}
export function routeSignals(state: V2State) {
  return {
    completion: state.completedAt ? "Recorrido completado" : "Recorrido en curso",
    mastery: state.masteredAt ? "Dominio alcanzado" : "Dominio por comprobar",
    consolidation: state.consolidatedAt ? "Consolidación alcanzada" : "Consolidación pendiente",
    reinforcement: state.objectives.filter(objective => objective.label === "reinforce" || objective.criticalErrorOpen).length,
    review: state.dueReviews,
  };
}
export function actionLabel(action: V2State["nextAction"] | null) {
  if (!action || action.kind === "none") return "Ver ruta";
  if (action.kind === "review" || action.kind === "retention") return "Repasar";
  if (action.kind === "remediate") return "Reforzar";
  return "Continuar";
}
export function actionTarget(action: V2State["nextAction"]) {
  if (!action.key || action.kind === "none" || action.kind === "resume") return null;
  return { kind: action.kind === "gate" || action.kind === "retention" ? "assessment" as const : action.kind === "review" ? "review" as const : "activity" as const, key: action.key };
}
