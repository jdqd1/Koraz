import { V2PublicPathSchema, V2PathCardSchema, V2RouteStateSchema, V2HomeSnapshotSchema, V2AttemptManifestSchema } from "@cediah/contracts";
import type { LearningMapLevelResponse, MapRoute } from "@cediah/contracts";
import type { MapClient } from "../map/map-client";
import { ROOT_MAP_ROUTE } from "../map/map-route";
import { v2MapProgress } from "../map/v2-adapter";
export const fixtureId = (n: number) => `b2800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const time = "2026-10-03T12:00:00.000Z";
export function studentFixture(mode = "ready") {
  const unenrolled = mode === "available" || mode === "empty";
  const completed = ["completed", "mastered", "consolidated", "review", "critical"].includes(mode);
  const mastered = ["mastered", "consolidated", "review", "critical"].includes(mode);
  const consolidated = mode === "consolidated";
  const path = V2PublicPathSchema.parse({ engineVersion: "guided-v2", policyVersion: "guided-v2.0", pathId: fixtureId(1), pathVersionId: fixtureId(2), slug: "practica-por-objetivos", title: "Práctica por objetivos", summary: "Ruta sintética para comprobar navegación, evidencia y repaso.", topicLabel: "Fisiología", coverKey: "heart", access: mode === "revoked" ? "revoked" : unenrolled ? "available" : "enrolled", enrollmentId: unenrolled ? null : fixtureId(3),
    units: mode === "empty" ? [] : [{ key: "unit-a", title: "Comprender y recuperar", objectives: [{ key: "objective-a", title: "Explicar la relación entre los conceptos A y B", criticality: "core" }] }, { key: "unit-b", title: "Aplicar y comprobar", objectives: [{ key: "objective-b", title: "Comparar dos situaciones nuevas", criticality: "high_yield" }] }] });
  const state = V2RouteStateSchema.parse({ engineVersion: "guided-v2", enrollmentId: fixtureId(3), pathVersionId: fixtureId(2), rowVersion: 4, completedActivities: completed ? 6 : 2, dispensedActivities: 0, plannedRequiredActivities: 6, completedAt: completed ? time : null, masteredAt: mastered ? time : null, consolidatedAt: consolidated ? time : null, dueReviews: mode === "review" ? 2 : 0,
    objectives: [{ objectiveKey: "objective-a", label: mode === "critical" ? "reinforce" : mastered ? "mastered" : "learning", objectiveScore: mastered ? 90 : 50, criticalErrorOpen: mode === "critical", assisted: false, applicationDemonstrated: mastered, reviewDue: mode === "review", firstMasteredAt: mastered ? time : null, firstConsolidatedAt: consolidated ? time : null }, { objectiveKey: "objective-b", label: mastered ? "mastered" : "new", objectiveScore: mastered ? 90 : null, criticalErrorOpen: false, assisted: false, applicationDemonstrated: mastered, reviewDue: mode === "review", firstMasteredAt: mastered ? time : null, firstConsolidatedAt: consolidated ? time : null }],
    nextAction: mode === "review" ? { kind: "review", key: "review-a", reason: "Ofrecer hasta diez repasos; puedes continuar en otra rama" } : mode === "critical" ? { kind: "remediate", key: "practice-a", reason: "Refuerza el objetivo esencial antes de abrir sus actividades dependientes" } : mode === "none" ? { kind: "none", key: null, reason: "No hay una actividad elegible; puedes pausar o elegir otra rama" } : mode === "resume" ? { kind: "resume", key: fixtureId(4), reason: "Reanudar el intento abierto" } : { kind: "activity", key: "practice-a", reason: "Practica la relación entre los conceptos A y B" } });
  const card = V2PathCardSchema.parse({ engineVersion: "guided-v2", policyVersion: "guided-v2.0", id: path.pathId, pathVersionId: path.pathVersionId, enrollmentId: path.enrollmentId, slug: path.slug, title: path.title, summary: path.summary, coverKey: path.coverKey, topicLabel: path.topicLabel, unitCount: 2, completed, mastered, consolidated });
  const home = V2HomeSnapshotSchema.parse({ engineVersion: "guided-v2", generatedAt: time, activePath: unenrolled ? null : card, dueReviews: state.dueReviews, nextAction: unenrolled ? null : state.nextAction });
  const attempt = V2AttemptManifestSchema.parse({ engineVersion: "guided-v2", attemptId: fixtureId(4), enrollmentId: state.enrollmentId, pathVersionId: state.pathVersionId, policyVersion: "guided-v2.0", purpose: mode === "review" ? "review" : "activity", rowVersion: 1, status: "open", activeActivity: null, acceptedResponses: [] });
  return { path, state, card, home, attempt };
}
/** Typed display fixture; never installed as a fallback for a failed runtime request. */
export function fixtureMapBase(mode = "ready"): MapClient {
  const { card, state } = studentFixture(mode);
  const progress = v2MapProgress({ card, state });
  async function level(route: MapRoute): Promise<LearningMapLevelResponse> {
    const root = route.nodeId === null;
    const key = root ? "root" : `node:${fixtureId(8)}` as const;
    return { mapId: fixtureId(9), structuralVersion: 1, route, levelKey: key, layout: { schemaVersion: 1, levelKey: key, rowVersion: 0, positions: {} },
      items: mode === "empty" ? [] : [{ occurrenceId: root ? fixtureId(8) : card.id, canonicalKey: root ? fixtureId(8) : card.id, kind: root ? "node" : "block", title: root ? "Fisiología" : card.title, iconKey: "heart", progress, childCount: root ? 1 : 2, childCountLabel: root ? "1 ruta" : "2 unidades", availability: "available", enrollmentState: root ? "none" : card.enrollmentId ? "active" : "none", pathId: root ? null : card.id, pathVersionId: root ? null : card.pathVersionId, unitStableKey: null }],
      edges: [], selectedLesson: null, nextActivity: null, containerSummary: { title: root ? "Rutas de aprendizaje" : "Fisiología", description: "Fixture de navegación", progress }, ancestry: [{ title: "Rutas de aprendizaje", route: ROOT_MAP_ROUTE }], generatedAt: time, resolvedVersionIds: [card.pathVersionId] };
  }
  return { level, async summary() { return { map: { id: fixtureId(9) }, nodes: (await level(ROOT_MAP_ROUTE)).items, progress, structuralVersion: 1 }; }, async suggestions() { return { items: [], incompleteBlocks: [] }; }, async catalog() { return { items: [], nextCursor: null }; }, async mutate() { throw new Error("El fixture no guarda posiciones ni acredita progreso."); } };
}
