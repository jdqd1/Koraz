import { describe, expect, it } from "vitest";
import {
  LearningPathOptionDraftSchema,
  LearningPathCardSchema,
  RouteActivitySchema,
  V2AnswerSchema,
  V2BoundRouteDefinitionSchema,
  V2ErrorResponseSchema,
  V2HttpContracts,
  V2IdSchemas,
  V2AttemptManifestSchema,
  V2FeedbackSourceSchema,
  V2PersistedResponseSchema,
  V2PublicActivitySchema,
  V2PublicPathSchema,
  V2PathCardSchema,
  toV2PublicActivity,
  toV2PublicPath,
  type V2HttpRequest,
  type V2PathId,
} from "@cediah/contracts";

const uuid = (last: number) => `10000000-0000-4000-8000-${String(last).padStart(12, "0")}`;
const root = {
  key: "example", objectiveKey: "objective", relatedObjectiveKeys: [], phase: "retrieve", required: true,
  sourceKeys: [], representation: "text", equivalenceKey: "family", hints: [], use: "learning",
  prompt: "Pregunta actual", feedback: { explanation: "PRIVATE_FEEDBACK", commonError: "PRIVATE_ERROR", sourceKeys: [] },
  misconceptionMappings: [], alternativeActivityKey: null,
};
const activity = (kind: string, payload: unknown) => RouteActivitySchema.parse({ ...root, kind, payload });
const secret = "PRIVATE_SOLUTION_SENTINEL";

describe("guided v2 contracts", () => {
  it("T029 keeps resume stages strict, ties them to the active activity and allowlists feedback sources", () => {
    const active = toV2PublicActivity(activity("constructed_response", { rubric: [{ key: "reason", criterion: "Critério", example: "Ejemplo" }], modelAnswer: secret, verificationActivityKey: null }));
    const manifest = { engineVersion: "guided-v2", attemptId: uuid(4), enrollmentId: uuid(5), pathVersionId: uuid(2), policyVersion: "guided-v2.0", purpose: "activity", rowVersion: 2, status: "open", activeActivity: active, acceptedResponses: [] };
    const submitted = { activityKey: active.key, stage: "submitted", text: "Mi respuesta" };
    expect(V2AttemptManifestSchema.safeParse({ ...manifest, constructedResponse: submitted }).success).toBe(true);
    for (const constructedResponse of [{ ...submitted, modelAnswer: secret }, { ...submitted, rubric: [] }, { ...submitted, activityKey: "foreign" }]) {
      expect(V2AttemptManifestSchema.safeParse({ ...manifest, constructedResponse }).success).toBe(false);
    }
    expect(V2AttemptManifestSchema.safeParse({ ...manifest, status: "completed", activeActivity: null, constructedResponse: submitted }).success).toBe(false);
    const source = { key: "source", title: "Referencia", citation: "Referencia sintética", locator: { heading: "Sección", sectionPath: [], page: 1 }, excerpt: "Fragmento autorizado", url: "https://example.test/source" };
    expect(V2FeedbackSourceSchema.parse(source)).toEqual(source);
    expect(V2FeedbackSourceSchema.safeParse({ ...source, url: "file:///private" }).success).toBe(false);
    expect(V2FeedbackSourceSchema.safeParse({ ...source, bindings: {} }).success).toBe(false);
    expect(V2HttpContracts.attemptResponse.body.safeParse({ activityKey: active.key, answer: { kind: "constructed_response", text: "Mi respuesta", selfRating: null }, confidence: null, expectedVersion: 1, constructedResponse: { ...submitted, stage: "revealed" } }).success).toBe(false);
  });
  it("projects each activity with an explicit allowlist", () => {
    const variants = [
      activity("study", { body: "Texto", focusSpans: [{ start: 0, end: 5 }], assetKey: null, scaffold: "explanation", videoRange: null }),
      activity("single_choice", { options: [{ key: "a", text: "A" }, { key: "b", text: "B" }], correctKey: "a", distractorFeedback: { b: secret } }),
      activity("short_answer", { acceptedAnswers: [secret], maxChars: 500, modelAnswer: secret, normalization: "nfkc-lower-space" }),
      activity("constructed_response", { rubric: [{ key: "rubric", criterion: secret, example: secret }], modelAnswer: secret, verificationActivityKey: "future" }),
      activity("match", { presentation: "causal_map", prompts: [{ key: "p", text: "P" }], choices: [{ key: "c", text: "C" }], correctByPrompt: { p: "c" }, allowReuse: false, edges: [{ from: "p", to: "c", label: secret }] }),
      activity("image_target", { assetKey: "image", mode: "hotspot", targets: [{ key: "target", prompt: secret, polygon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], label: secret }], labels: [{ key: "label", text: secret }], correctLabelByTarget: {}, accessibleAlternativeKey: "alternative", masking: "no_labels" }),
      activity("sequence", { items: [{ key: "a", text: "A" }, { key: "b", text: "B" }, { key: "c", text: "C" }], acceptedOrders: [["b", "a", "c"]], whyActivityKey: "future" }),
      activity("case", { stages: [{ key: "first", narrative: "Etapa actual", childActivityKey: "child-one" }, { key: "second", narrative: secret, childActivityKey: "child-two" }] }),
    ];
    expect(variants.map((item) => item.kind)).toHaveLength(8);
    for (const item of variants) {
      const publicItem = toV2PublicActivity(item);
      expect(V2PublicActivitySchema.parse(publicItem)).toEqual(publicItem);
      const serialized = JSON.stringify(publicItem);
      expect(serialized).not.toContain(secret);
      expect(serialized).not.toMatch(/correctKey|acceptedAnswers|modelAnswer|rubric|correctByPrompt|acceptedOrders|polygon|distractorFeedback|focusSpans.*PRIVATE/);
      expect(serialized).not.toContain("PRIVATE_FEEDBACK");
    }
    const leaked = { ...toV2PublicActivity(variants[1]!), payload: { options: [{ key: "a", text: "A" }], correctKey: "a" } };
    expect(V2PublicActivitySchema.safeParse(leaked).success).toBe(false);
    expect(V2AttemptManifestSchema.safeParse({
      engineVersion: "guided-v2", attemptId: uuid(4), enrollmentId: uuid(5), pathVersionId: uuid(2),
      policyVersion: "guided-v2.0", purpose: "activity", rowVersion: 1, status: "open",
      activeActivity: leaked, acceptedResponses: [],
    }).success).toBe(false);
    expect(() => toV2PublicActivity(variants[7]!, 2)).toThrow(RangeError);
  });

  it("exposes labeling markers without solution polygons", () => {
    const item = activity("image_target", { assetKey: "image", mode: "labeling", targets: [{ key: "target", prompt: "Zona", polygon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], label: secret }], labels: [{ key: "label", text: "Etiqueta" }], correctLabelByTarget: { target: "label" }, accessibleAlternativeKey: "alternative", masking: "no_labels" });
    const projected = toV2PublicActivity(item);
    expect(projected.kind).toBe("image_target");
    expect(JSON.stringify(projected)).not.toMatch(/polygon|correctLabelByTarget|PRIVATE/);
    if (projected.kind !== "image_target") throw new Error("Proyección de imagen incorrecta");
    expect(projected.payload.targets).toHaveLength(1);
  });

  it("keeps editorial definition and reserved questions out of the public path", () => {
    const bound = V2BoundRouteDefinitionSchema.parse({
      engineVersion: "guided-v2", pathId: uuid(1), pathVersionId: uuid(2), editVersion: 1,
      status: "draft", contentHash: "a".repeat(64), bindings: { topicContentId: uuid(3), sources: [], assets: [] },
      definition: {
        schemaVersion: "2.0", packageKey: "route", revision: 1, locale: "es",
        route: { slug: "route", title: "Ruta", summary: "Resumen", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
        policyVersion: "guided-v2.0", sources: [], assets: [],
        objectives: [{ key: "objective", title: "Objetivo", unitKey: "unit", verb: "recall", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
        units: [{ key: "unit", title: "Unidad", objectiveKeys: ["objective"], activityKeys: ["reserved"], support: "standard", estimatedMinutes: null }],
        activities: [{ ...root, key: "reserved", kind: "single_choice", use: "final", payload: { options: [{ key: "a", text: "A" }, { key: "b", text: "B" }], correctKey: "a", distractorFeedback: { b: secret } } }],
        assessments: [], reviewPlan: { objectiveKeys: ["objective"] }, editorial: { notes: secret, unresolvedIssues: [] },
      },
      policyVersion: "guided-v2.0", schedulerVersion: "scheduler-v2.0",
      policySnapshot: {
        policyVersion: "guided-v2.0", schedulerVersion: "scheduler-v2.0",
        coverage: { requiredObjectiveItems: 5, minRecallItems: 2, minApplicationItems: 1, finalReserves: 1, retention7Reserves: 1, retention30Reserves: 1 },
        defaultGateThresholdPercent: 80, diagnostic: { minItems: 4, maxItems: 8 },
        mastery: { window: 5, minFamilies: 3, minRecallFamilies: 2, minApplications: 1, familyReuseHours: 24 },
        review: { intervalsDays: [1, 3, 7, 14, 30], batchLimit: 10, retryMinutes: 10, immediateRetryLimit: 2 },
        retention: { firstDays: 7, secondDays: 30, minSeparationDays: 7 }, checkpointItemLimit: 10, consecutiveFailuresBeforeSupport: 2,
        xp: { firstRecall: 5, firstMastery: 10, firstConsolidation: 15 },
      },
      reviewedContentHash: null, approvedBy: null,
    });
    const publicPath = toV2PublicPath(bound, "available", null);
    expect(V2PublicPathSchema.parse(publicPath)).toEqual(publicPath);
    expect(JSON.stringify(publicPath)).not.toMatch(/reserved|correctKey|PRIVATE|definition|bindings|assessments/);
  });

  it("types all §8.10 routes and rejects client supplied scoring fields", () => {
    expect(Object.keys(V2HttpContracts)).toHaveLength(26);
    expect(V2HttpContracts.attemptImage).toMatchObject({ method: "GET", path: "/v2/guided-learning/attempts/:id/image" });
    expect(V2HttpContracts.attemptAlternative).toMatchObject({ method: "POST", path: "/v2/guided-learning/attempts/:id/alternative" });
    expect(V2HttpContracts.editorSourceCatalog).toMatchObject({ method: "GET", path: "/v2/editor/learning-paths/source-catalog" });
    for (const contract of Object.values(V2HttpContracts)) {
      expect(contract.path).toMatch(/^\/v2\//);
      expect(contract.params).toBeDefined();
      expect(contract.query).toBeDefined();
      expect(contract.body).toBeDefined();
      expect(contract.response).toBeDefined();
      expect(contract.headers).toBeDefined();
      if (contract.method !== "GET") expect(contract.headers.safeParse({ idempotencyKey: uuid(9) }).success).toBe(true);
    }
    expect(V2HttpContracts.attemptResponse.body.safeParse({ activityKey: "x", answer: { kind: "single_choice", optionKey: "a" }, confidence: null, expectedVersion: 1, score01: 1, assisted: false }).success).toBe(false);
    expect(V2HttpContracts.attemptResponse.body.safeParse({ activityKey: "x", answer: { kind: "single_choice", optionKey: "a" }, confidence: null, expectedVersion: 1 }).success).toBe(true);
    expect(V2HttpContracts.attemptResponse.headers.safeParse({}).success).toBe(false);
    expect(V2HttpContracts.publicPath.headers.safeParse({ idempotencyKey: uuid(9) }).success).toBe(false);
    // @ts-expect-error Mutating routes require the idempotency header in their typed request.
    const missingHeaders: V2HttpRequest<"attemptResponse">["headers"] = {};
    expect(missingHeaders).toEqual({});
    expect(V2HttpContracts.editorPreview.response.safeParse({ attempt: {} }).success).toBe(false);
  });

  it("separates private response, public error, and v1 validation", () => {
    expect(V2AnswerSchema.safeParse({ kind: "image_target", mode: "labeling", labelsByTarget: { target: "label" } }).success).toBe(true);
    expect(V2PersistedResponseSchema.safeParse({ activityKey: "x", score01: 1 }).success).toBe(false);
    expect(V2ErrorResponseSchema.safeParse({ error: { code: "ANSWER_INVALID", message: "Respuesta inválida", path: "/answer", action: "Corrige la respuesta" } }).success).toBe(true);
    expect(V2IdSchemas.path.parse(uuid(1))).toBe(uuid(1));
    // @ts-expect-error A plain v1 UUID is not a branded v2 path ID.
    const unbranded: V2PathId = uuid(1);
    expect(unbranded).toBe(uuid(1));
    expect(LearningPathOptionDraftSchema.safeParse({ unexpected: true }).success).toBe(false);
    const v2Card = {
      engineVersion: "guided-v2", policyVersion: "guided-v2.0", id: uuid(1), pathVersionId: uuid(2),
      enrollmentId: null, slug: "route", title: "Ruta", summary: "Resumen", coverKey: "heart",
      topicLabel: "Tema", unitCount: 1, completed: false, mastered: false, consolidated: false,
    };
    expect(V2PathCardSchema.safeParse(v2Card).success).toBe(true);
    expect(LearningPathCardSchema.safeParse(v2Card).success).toBe(false);
  });
});
