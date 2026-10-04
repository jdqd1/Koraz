import { RoutePackageSchema, type RoutePackage, type RouteActivity } from "../../../../../packages/contracts/src/index.js";
import { editorV2FixtureRoute } from "../../../../../apps/web/src/components/learning/editor/v2/editor-fixtures.js";
const digest = "a".repeat(64);
const rationale = "Umbral editorial para verificar el flujo con contenido sintético.";function packageFixture(number: number): RoutePackage {
  const base = (key: string, phase: RouteActivity["phase"], use: RouteActivity["use"], representation: RouteActivity["representation"] = "text") => ({
    key, objectiveKey: "objective", relatedObjectiveKeys: [], phase, kind: "single_choice" as const,
    required: true, sourceKeys: ["guide"], representation, equivalenceKey: key, hints: [], use,
    prompt: `Pregunta ${key}`, payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "Revisa" } },
    feedback: { explanation: "Explicación", commonError: "", sourceKeys: ["guide"] },
    misconceptionMappings: [], alternativeActivityKey: null,
  });
  const activities: RouteActivity[] = [
    { ...base("explain", "learn", "learning"), kind: "study", payload: { body: "Explicación sintética", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } },
    { ...base("elaborate", "elaborate", "learning"), kind: "constructed_response", payload: { rubric: [{ key: "criterion", criterion: "Relaciona", example: "Ejemplo" }], modelAnswer: "Respuesta modelo", verificationActivityKey: "recall-one" } },
    base("recall-one", "retrieve", "learning"),
    { ...base("recall-two", "retrieve", "learning"), kind: "short_answer", payload: { acceptedAnswers: ["respuesta"], maxChars: 100, modelAnswer: "respuesta", normalization: "nfkc-lower-space" } },
    base("apply-one", "apply", "learning", "case"),
    base("recall-three", "retrieve", "gate"),
    { ...base("apply-two", "apply", "gate", "diagram"), kind: "sequence", payload: { items: [{ key: "one", text: "Uno" }, { key: "two", text: "Dos" }, { key: "three", text: "Tres" }], acceptedOrders: [["one", "two", "three"]], whyActivityKey: null } },
    base("diagnostic-one", "activate", "diagnostic"), base("final-one", "retrieve", "final"),
    base("retention-seven", "retrieve", "retention7"), base("retention-thirty", "retrieve", "retention30"),
  ];
  const assessment = (key: string, kind: RoutePackage["assessments"][number]["kind"], candidateActivityKeys: string[], afterUnitKey: string | null = null) =>
    ({ key, kind, afterUnitKey, objectiveKeys: ["objective"], candidateActivityKeys, thresholdPercent: 80, thresholdRationale: rationale });
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: `workflow-${number}`, revision: 1, locale: "es",
    route: { slug: `workflow-${number}`, title: "Ruta sintética", summary: "Sin contenido clínico real", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0",
    sources: [{ key: "guide", kind: "guide", title: "Guía sintética", citation: "Guía de prueba (2026)", locator: { heading: "Sección", sectionPath: ["Unidad"], page: 1 }, documentSha256: digest, excerpt: "Texto sintético verificable", url: null, verification: "verified", checkedAt: "2026-09-26" }],
    assets: [],
    objectives: [{ key: "objective", title: "Aplicar un concepto", unitKey: "unit", verb: "apply", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: ["guide"], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["objective"], activityKeys: activities.map((activity) => activity.key), support: "standard", estimatedMinutes: null }],
    activities,
    assessments: [
      assessment("diagnostic", "diagnostic", ["diagnostic-one"]),
      assessment("gate", "unit_gate", ["recall-one", "recall-two", "apply-one", "recall-three", "apply-two"], "unit"),
      assessment("final", "final", ["final-one"]), assessment("retention7", "retention7", ["retention-seven"]),
      assessment("retention30", "retention30", ["retention-thirty"]),
    ],
    reviewPlan: { objectiveKeys: ["objective"] }, editorial: { notes: "Revisión sintética", unresolvedIssues: [] },
  });
}

export function publishableFixture() {
  const route = editorV2FixtureRoute();
  route.definition = packageFixture(27);
  route.bindings.sources[0].key = "guide";
  route.bindings.assets = [];
  return route;
}

