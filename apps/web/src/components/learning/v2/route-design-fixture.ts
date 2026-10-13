import { V2PathCardSchema, V2PublicPathSchema, V2RouteStateSchema } from "@cediah/contracts";
import { studentFixture } from "./fixtures";

/** Development-only example matching the route shown in the design brief. */
export function routeDesignFixture() {
  const fixture = studentFixture();
  const units = [
    { key: "arteries", title: "Territorios y trayectos arteriales", objective: "Entender los trayectos y territorios arteriales" },
    { key: "vena-cava", title: "Retorno sistémico y VCI", objective: "Relacionar la VCI con sus trayectos y tributarias" },
    { key: "portal", title: "Sistema porta hepático", objective: "Ordenar el flujo portal y relacionar su topografía" },
    { key: "communications", title: "Comunicaciones venosas", objective: "Diferenciar comunicaciones intercavas y portosistémicas por sus extremos" },
  ];
  const path = V2PublicPathSchema.parse({ ...fixture.path, title: "Abdomen", slug: "abdomen", coverKey: "intestines", topicLabel: "Vascularización del abdomen",
    summary: "Relaciones y trayectos de los territorios arteriales, VCI, sistema porta y comunicaciones venosas. Candidato editorial con revisión humana pendiente.",
    units: units.map((unit, unitIndex) => ({ key: unit.key, title: unit.title, objectives: [{ key: unit.key, title: unit.objective, criticality: "core" }],
      activities: [
        { key: `${unit.key}-learn`, kind: "study", phase: "learn", scaffold: "explanation" },
        { key: `${unit.key}-example`, kind: "study", phase: "learn", scaffold: "worked_example" },
        { key: `${unit.key}-relate`, kind: "match", phase: "elaborate" },
        { key: unit.key === "portal" ? "practice-portal" : `${unit.key}-recall`, kind: "single_choice", phase: "retrieve" },
        { key: `${unit.key}-image`, kind: "image_target", phase: "retrieve" },
        { key: `${unit.key}-answer`, kind: "short_answer", phase: "retrieve" },
        { key: `${unit.key}-sequence`, kind: "sequence", phase: "apply" },
        { key: `${unit.key}-case`, kind: "case", phase: "apply" },
        ...(unitIndex > 1 ? [{ key: `${unit.key}-explain`, kind: "constructed_response", phase: "apply" }] : []),
      ].map(activity => ({ ...activity, objectiveKey: unit.key, required: true })),
      resources: [{ key: `${unit.key}-guide`, title: "Guía de vascularización abdominal", citation: "", url: null, locator: { heading: unit.title, sectionPath: [], page: unitIndex + 1 } }],
    })),
  });
  const state = V2RouteStateSchema.parse({ ...fixture.state, completedActivities: 16, plannedRequiredActivities: 34, dueReviews: 1,
    objectives: units.map((unit, index) => ({ ...fixture.state.objectives[0], objectiveKey: unit.key, label: index === 0 ? "mastered" : index < 3 ? "learning" : "new", objectiveScore: index === 0 ? 90 : index === 1 ? 50 : null,
      reviewDue: index === 1, firstMasteredAt: index === 0 ? "2026-10-13T00:20:00Z" : null, applicationDemonstrated: index === 0,
    })),
    nextAction: { kind: "review", key: "review-vci", reason: "Repasa el retorno sistémico o continúa en otra unidad disponible." },
    nextActionContext: { unitKey: "vena-cava", objectiveKey: "vena-cava" },
    activityProgress: path.units.flatMap((unit, index) => (unit.activities ?? []).map((activity, activityIndex) => ({ key: activity.key, status: activityIndex < [8, 5, 3, 0][index]! ? "completed" : "pending" }))),
    maintenance: {
      generatedAt: "2026-10-13T01:00:00Z", timeZone: "America/Caracas", diagnostic: { status: "unavailable", assessmentKey: null },
      reviewBatch: [{ key: "review-vci", objectiveKey: "vena-cava", dueAt: "2026-10-13T00:36:00Z" }],
      activities: [{ key: "practice-portal", objectiveKey: "portal", reason: "Explora el sistema porta hepático." }],
      agenda: [{ objectiveKey: "arteries", dueAt: "2026-10-14T00:09:00Z", retention7: { dueAt: "2026-10-20T00:20:00Z", acceptedAt: null, elapsedDays: null }, retention30: { dueAt: "2026-11-12T00:20:00Z", acceptedAt: null, elapsedDays: null } },
        { objectiveKey: "vena-cava", dueAt: "2026-10-13T00:36:00Z", retention7: { dueAt: null, acceptedAt: null, elapsedDays: null }, retention30: { dueAt: null, acceptedAt: null, elapsedDays: null } }],
      gates: units.map((unit, index) => ({ unitKey: unit.key, passed: index === 0, score: index === 0 ? 90 : null, thresholdPercent: 80, missingCoreKeys: index === 0 ? [] : [unit.key], criticalErrorKeys: [] })),
      blockers: [], remediation: [], exhaustedBanks: [],
    },
    versionHistory: [{ versionNumber: 1, engineVersion: "guided-v2", adoptedAt: "2026-10-12T23:00:00Z", completedAt: null, consumedActivities: ["Territorios arteriales", "Retorno venoso"] }],
  });
  const card = V2PathCardSchema.parse({ ...fixture.card, title: path.title, slug: path.slug, coverKey: path.coverKey, topicLabel: path.topicLabel, unitCount: path.units.length });
  return { ...fixture, path, state, card, home: { ...fixture.home, activePath: card } };
}
