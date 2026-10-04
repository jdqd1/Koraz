import { RoutePackageSchema, V2BoundRouteDefinitionSchema, type RoutePackage } from "@cediah/contracts";

export const fixtureV2Id = (index: number) => `fa000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
export function editorV2FixturePackage(): RoutePackage {
  const base = { objectiveKey: "objective", relatedObjectiveKeys: [], phase: "retrieve", required: true, sourceKeys: ["source"], representation: "text", hints: [], use: "learning", prompt: "Pregunta sintética", feedback: { explanation: "Explicación sintética", commonError: "", sourceKeys: ["source"] }, misconceptionMappings: [], alternativeActivityKey: null };
  const activity = (key: string, kind: string, payload: unknown) => ({ ...base, key, equivalenceKey: `family-${key}`, kind, payload });
  const activities = [
    activity("study", "study", { body: "Texto de ejemplo", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null }),
    activity("choice", "single_choice", { options: [{ key: "a", text: "A" }, { key: "b", text: "B" }], correctKey: "a", distractorFeedback: { b: "Explicación" } }),
    activity("short", "short_answer", { acceptedAnswers: ["respuesta"], maxChars: 100, modelAnswer: "respuesta", normalization: "nfkc-lower-space" }),
    activity("constructed", "constructed_response", { rubric: [{ key: "criterion", criterion: "Criterio", example: "Ejemplo" }], modelAnswer: "Ejemplo", verificationActivityKey: "choice" }),
    activity("match", "match", { presentation: "causal_map", prompts: [{ key: "p", text: "P" }], choices: [{ key: "c", text: "C" }], correctByPrompt: { p: "c" }, allowReuse: false, edges: [] }),
    activity("image", "image_target", { assetKey: "image", mode: "hotspot", targets: [{ key: "target", prompt: "Señala", polygon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], label: "" }], labels: [], correctLabelByTarget: {}, accessibleAlternativeKey: "choice", masking: "no_labels" }),
    activity("sequence", "sequence", { items: [{ key: "one", text: "1" }, { key: "two", text: "2" }, { key: "three", text: "3" }], acceptedOrders: [["one", "two", "three"]], whyActivityKey: null }),
    activity("case", "case", { stages: [{ key: "first", narrative: "Etapa 1", childActivityKey: "choice" }, { key: "second", narrative: "Etapa 2", childActivityKey: "short" }] }),
  ];
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: "editor-synthetic", revision: 1, locale: "es", policyVersion: "guided-v2.0",
    route: { slug: "editor-synthetic", title: "Ruta de práctica sintética", summary: "Ejemplo para verificar guardado y recuperación del editor.", topicLabel: "Tema sintético", audience: "Estudiantes", discipline: "general", coverKey: "heart" },
    sources: [{ key: "source", kind: "guide", title: "Guía sintética", citation: "Fixture de software", locator: { heading: "Sección", sectionPath: [], page: null }, documentSha256: "a".repeat(64), excerpt: "Contenido de ejemplo", url: null, verification: "provided", checkedAt: null }],
    assets: [{ key: "image", mediaType: "image", originalFileName: "image.png", sha256: null, alt: "Diagrama de prueba", caption: "", sourceKeys: ["source"], rightsStatus: "owned", credit: "Fixture", width: 100, height: 100 }],
    objectives: [{ key: "objective", title: "Relacionar los ejemplos", unitKey: "unit", verb: "relate", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: ["source"], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad de ejemplo", objectiveKeys: ["objective"], activityKeys: activities.map((item) => item.key), support: "full", estimatedMinutes: 5 }], activities,
    assessments: [{ key: "final", kind: "final", afterUnitKey: null, objectiveKeys: ["objective"], candidateActivityKeys: [], thresholdPercent: 80, thresholdRationale: "Umbral sintético para comprobar la preservación de la configuración." }],
    reviewPlan: { objectiveKeys: ["objective"] }, editorial: { notes: "Borrador sintético. No acredita contenido clínico ni cobertura de publicación.", unresolvedIssues: [] },
  });
}
export function editorV2FixtureRoute() {
  return V2BoundRouteDefinitionSchema.parse({
    engineVersion: "guided-v2", pathId: fixtureV2Id(2), pathVersionId: fixtureV2Id(4), editVersion: 1,
    status: "draft", contentHash: "a".repeat(64), reviewedContentHash: "a".repeat(64), approvedBy: fixtureV2Id(1),
    bindings: { topicContentId: fixtureV2Id(3), sources: [{ key: "source", sourceContentId: fixtureV2Id(5), resourceRevisionId: fixtureV2Id(6) }], assets: [{ key: "image", assetId: fixtureV2Id(7) }] },
    definition: editorV2FixturePackage(), policyVersion: "guided-v2.0", schedulerVersion: "scheduler-v2.0",
    policySnapshot: {
      policyVersion: "guided-v2.0", schedulerVersion: "scheduler-v2.0", coverage: { requiredObjectiveItems: 5, minRecallItems: 2, minApplicationItems: 1, finalReserves: 1, retention7Reserves: 1, retention30Reserves: 1 },
      defaultGateThresholdPercent: 80, diagnostic: { minItems: 4, maxItems: 8 }, mastery: { window: 5, minFamilies: 3, minRecallFamilies: 2, minApplications: 1, familyReuseHours: 24 },
      review: { intervalsDays: [1, 3, 7, 14, 30], batchLimit: 10, retryMinutes: 10, immediateRetryLimit: 2 }, retention: { firstDays: 7, secondDays: 30, minSeparationDays: 7 }, checkpointItemLimit: 10, consecutiveFailuresBeforeSupport: 2, xp: { firstRecall: 5, firstMastery: 10, firstConsolidation: 15 },
    },
  });
}
