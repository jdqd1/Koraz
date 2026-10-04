import type { LearningMapLevelResponse, MapItem, MapProgress, MapRoute } from "@cediah/contracts";
import { createV2Reader, V2RequestError } from "../v2/client";
import { stateMatches, type V2Card, type V2Path, type V2State } from "../v2/model";
import { mapClient, type MapClient } from "./map-client";
import { ROOT_MAP_ROUTE } from "./map-route";

export type V2MapMeta = { card: V2Card; state: V2State | null; path?: V2Path; unitKey?: string };
type V2Item = MapItem & { guidedV2: V2MapMeta };
type V2Level = LearningMapLevelResponse & { guidedV2: V2MapMeta; stateUnavailable?: boolean };
type MixedItem = MapItem & { guidedV2Group?: V2MapMeta[] };
export function v2MapItem(item: MapItem): V2MapMeta | null { return "guidedV2" in item ? (item as V2Item).guidedV2 : null; }
export function v2MapGroup(item: MapItem): V2MapMeta[] | null { return (item as MixedItem).guidedV2Group ?? null; }
export function v2MapLevel(level: LearningMapLevelResponse | null): V2MapMeta | null { return level && "guidedV2" in level ? (level as V2Level).guidedV2 : null; }
export function v2MapSummary(meta: V2MapMeta) {
  if (!meta.card.enrollmentId) return "Ruta por comenzar · dominio por comprobar";
  if (meta.unitKey) {
    const objectives = meta.path?.units.find(unit => unit.key === meta.unitKey)?.objectives ?? [];
    if (!meta.state) return "Estado por cargar";
    const mastered = objectives.filter(objective => meta.state!.objectives.some(state => state.objectiveKey === objective.key && state.label === "mastered")).length;
    const reinforcement = objectives.some(objective => meta.state!.objectives.some(state => state.objectiveKey === objective.key && (state.label === "reinforce" || state.criticalErrorOpen)));
    return `${mastered}/${objectives.length} objetivos dominados${reinforcement ? " · refuerzo pendiente" : ""}`;
  }
  if (!meta.state && meta.card.enrollmentId) return "Estado por cargar";
  const completed = meta.state ? !!meta.state.completedAt : meta.card.completed;
  const mastered = meta.state ? !!meta.state.masteredAt : meta.card.mastered;
  const consolidated = meta.state ? !!meta.state.consolidatedAt : meta.card.consolidated;
  const reviews = meta.state?.dueReviews;
  return `${completed ? "Recorrido completado" : "Recorrido en curso"} · ${mastered ? "dominio alcanzado" : "dominio por comprobar"} · ${consolidated ? "consolidación alcanzada" : "consolidación pendiente"}${reviews === undefined ? "" : ` · ${reviews} repasos`}`;
}
const unavailable: MapProgress = { status: "unavailable", percentage: null, completedEssentialSteps: null, totalEssentialSteps: null, started: false };
export function v2MapProgress(meta: V2MapMeta): MapProgress {
  // The public DTO has no per-unit consumption; never copy whole-route completion to a unit.
  if (!meta.state || meta.unitKey) return { ...unavailable, started: !!meta.card.enrollmentId };
  const { completedActivities: completed, plannedRequiredActivities: total, completedAt } = meta.state;
  return { status: completedAt ? "completed" : completed || meta.state.nextAction.kind === "resume" ? "in_progress" : "not_started", percentage: total ? Math.min(100, Math.floor(completed * 100 / total)) : null, completedEssentialSteps: completed, totalEssentialSteps: total, started: !!meta.card.enrollmentId };
}
function cardItem(meta: V2MapMeta, previous?: MapItem): V2Item {
  const unit = meta.path?.units.find(unit => unit.key === meta.unitKey);
  return { occurrenceId: unit ? `lesson:${unit.key}` : meta.card.id, canonicalKey: unit ? `${meta.card.id}:${unit.key}` : meta.card.id, kind: unit ? "lesson" : "block", title: unit?.title ?? meta.card.title,
    iconKey: previous?.iconKey ?? "folder", progress: v2MapProgress(meta), childCount: unit?.objectives.length ?? meta.card.unitCount, childCountLabel: unit ? `${unit.objectives.length} ${unit.objectives.length === 1 ? "objetivo" : "objetivos"}` : `${meta.card.unitCount} unidades`, availability: "available", enrollmentState: meta.card.enrollmentId ? "active" : "none", pathId: meta.card.id, pathVersionId: meta.card.pathVersionId, unitStableKey: unit?.key ?? null, guidedV2: meta };
}
/** Read-only projection over the existing map. Its layout transport stays unchanged. */
export function createV2MapClient(base: MapClient = mapClient, reader = createV2Reader()): MapClient {
  async function catalog(signal?: AbortSignal) {
    try { return await reader.cards(signal); }
    catch (error) { if (error instanceof V2RequestError && [403, 404].includes(error.status)) return []; throw error; }
  }
  async function meta(card: V2Card, signal?: AbortSignal): Promise<V2MapMeta> {
    const state = card.enrollmentId ? await reader.state(card.enrollmentId, signal).catch(error => { if (signal?.aborted) throw error; return null; }) : null;
    return { card, state: stateMatches(card, state) ? state : null };
  }
  async function level(route: MapRoute, signal?: AbortSignal): Promise<LearningMapLevelResponse> {
    const cards = await catalog(signal);
    const card = cards.find(card => card.id === route.entryId || card.id === route.nodeId);
    if (card) {
      const path = await reader.path(card.slug, signal);
      // A v1 enrollment takes precedence over a newer published v2 card in the map.
      if (path.access !== "enrolled" && !card.enrollmentId) {
        const legacy = await base.level({ ...route, unitStableKey: null }, signal).catch(() => null);
        if (legacy?.items.some(item => item.enrollmentState !== "none" && item.pathVersionId !== path.pathVersionId)) return base.level(route, signal);
      }
      if (path.pathId !== card.id || path.pathVersionId !== card.pathVersionId || path.enrollmentId !== card.enrollmentId) throw new Error("La versión de la ruta cambió. Actualiza el mapa.");
      if (route.unitStableKey && !path.units.some(unit => unit.key === route.unitStableKey)) throw new Error("Esta unidad no existe en tu versión de la ruta.");
      const root = await base.level(ROOT_MAP_ROUTE, signal);
      const parentRoute = { nodeId: route.nodeId, entryId: null, unitStableKey: null };
      const parent = route.nodeId && route.nodeId !== card.id ? await base.level(parentRoute, signal) : null;
      const confirmed = { ...await meta(card, signal), path };
      const key = `block:${card.id}`;
      const routeWithoutUnit = { ...route, unitStableKey: null };
      const projected: V2Level = { ...root, route, levelKey: key, layout: { schemaVersion: 1, levelKey: key, rowVersion: 0, positions: {} },
        ancestry: [{ title: "Rutas de aprendizaje", route: ROOT_MAP_ROUTE }, ...(parent ? [{ title: parent.containerSummary.title, route: parentRoute }] : []), { title: path.title, route: routeWithoutUnit }],
        items: path.units.map(unit => cardItem({ ...confirmed, unitKey: unit.key })), edges: [], selectedLesson: null, nextActivity: null,
        containerSummary: { title: path.title, description: path.summary, progress: v2MapProgress(confirmed) }, resolvedVersionIds: [path.pathVersionId], guidedV2: { ...confirmed, unitKey: route.unitStableKey ?? undefined } };
      return projected;
    }
    const original = await base.level(route, signal);
    if (!cards.length) return original;
    const metas = await Promise.all(cards.map(card => meta(card, signal)));
    const byId = new Map<string, V2MapMeta>(metas.map(meta => [meta.card.id, meta]));
    const seen = new Set<string>();
    const items = await Promise.all(original.items.map(async item => {
      const direct = item.pathId && byId.get(item.pathId);
      if (direct && !(item.enrollmentState !== "none" && item.pathVersionId !== direct.card.pathVersionId && !direct.card.enrollmentId)) { seen.add(direct.card.id); return cardItem(direct, item); }
      // Preserve topic IDs supplied by the map; never infer identity from a topic label.
      if (original.levelKey === "root" && item.kind === "node") {
        const children = await base.level({ nodeId: item.occurrenceId, entryId: null, unitStableKey: null }, signal);
        const group = children.items.flatMap(child => child.pathId && byId.has(child.pathId) && !(child.enrollmentState !== "none" && child.pathVersionId !== byId.get(child.pathId)!.card.pathVersionId && !byId.get(child.pathId)!.card.enrollmentId) ? [byId.get(child.pathId)!] : []);
        group.forEach(meta => seen.add(meta.card.id));
        if (group.length) return { ...item, progress: unavailable, guidedV2Group: group } satisfies MixedItem;
      }
      return item;
    }));
    if (original.levelKey === "root") for (const meta of metas) if (!seen.has(meta.card.id)) items.push(cardItem(meta));
    return { ...original, items, containerSummary: items.some(item => v2MapItem(item) || v2MapGroup(item)) ? { ...original.containerSummary, progress: unavailable } : original.containerSummary };
  }
  return { ...base, level, async mutate(operation, body, key) {
    if (operation === "complete-block" && body && typeof body === "object") {
      const cards = await catalog();
      const identifiers = Object.values(body).filter((value): value is string => typeof value === "string");
      if (cards.some(card => identifiers.includes(card.id))) throw new Error("El mapa no acredita progreso de práctica por objetivos. Abre la actividad disponible.");
    }
    return base.mutate(operation, body, key);
  } };
}
export const guidedMapClient = createV2MapClient();
