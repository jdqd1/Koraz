import { z } from "zod";
import { LearningPathStatusSchema, LearningRewardSchema } from "./guided-learning.js";
import {
  RouteActivitySchema,
  RouteKeySchema,
  RoutePackageSchema,
  RouteSourceSchema,
  type RouteActivity,
} from "./learning-route-package.js";

const Id = z.uuid();
export const V2PathIdSchema = Id.brand<"V2PathId">();
export const V2PathVersionIdSchema = Id.brand<"V2PathVersionId">();
export const V2EnrollmentIdSchema = Id.brand<"V2EnrollmentId">();
export const V2AttemptIdSchema = Id.brand<"V2AttemptId">();
export const V2ImportIdSchema = Id.brand<"V2ImportId">();
export const V2ResponseIdSchema = Id.brand<"V2ResponseId">();
export type V2PathId = z.infer<typeof V2PathIdSchema>;
export type V2PathVersionId = z.infer<typeof V2PathVersionIdSchema>;
export type V2EnrollmentId = z.infer<typeof V2EnrollmentIdSchema>;
export type V2AttemptId = z.infer<typeof V2AttemptIdSchema>;

export const V2EngineVersionSchema = z.literal("guided-v2");
export const V2PolicyVersionSchema = z.literal("guided-v2.0");
export const V2SchedulerVersionSchema = z.literal("scheduler-v2.0");
const Timestamp = z.iso.datetime({ offset: true });
const Hash = z.string().regex(/^[a-fA-F0-9]{64}$/);
const Version = z.number().int().positive();
const NullableVersion = Version.nullable();
const MaybeText = z.string().max(4000);
const Keys = z.array(RouteKeySchema);
const Empty = z.strictObject({});

export const V2BindingsSchema = z.strictObject({
  topicContentId: Id,
  sources: z.array(z.strictObject({ key: RouteKeySchema, sourceContentId: Id.nullable(), resourceRevisionId: Id.nullable() })),
  assets: z.array(z.strictObject({ key: RouteKeySchema, assetId: Id })),
});

/** Editorial metadata only. A null revision cannot be used as a source binding. */
export const V2EditorSourceCatalogSchema = z.strictObject({
  topics: z.array(z.strictObject({ id: Id, title: z.string().min(1).max(500) })).max(500),
  items: z.array(z.strictObject({
    sourceContentId: Id, title: z.string().min(1).max(500), sourceVersion: Version,
    revision: z.strictObject({ resourceRevisionId: Id, revisionNumber: Version, documentSha256: Hash }).nullable(),
  })).max(100),
  nextCursor: Id.nullable(),
});

export const V2PolicySnapshotSchema = z.strictObject({
  policyVersion: V2PolicyVersionSchema,
  schedulerVersion: V2SchedulerVersionSchema,
  coverage: z.strictObject({ requiredObjectiveItems: z.literal(5), minRecallItems: z.literal(2), minApplicationItems: z.literal(1), finalReserves: z.literal(1), retention7Reserves: z.literal(1), retention30Reserves: z.literal(1) }),
  defaultGateThresholdPercent: z.literal(80),
  diagnostic: z.strictObject({ minItems: z.literal(4), maxItems: z.literal(8) }),
  mastery: z.strictObject({ window: z.literal(5), minFamilies: z.literal(3), minRecallFamilies: z.literal(2), minApplications: z.literal(1), familyReuseHours: z.literal(24) }),
  review: z.strictObject({ intervalsDays: z.tuple([z.literal(1), z.literal(3), z.literal(7), z.literal(14), z.literal(30)]), batchLimit: z.literal(10), retryMinutes: z.literal(10), immediateRetryLimit: z.literal(2) }),
  retention: z.strictObject({ firstDays: z.literal(7), secondDays: z.literal(30), minSeparationDays: z.literal(7) }),
  checkpointItemLimit: z.literal(10),
  consecutiveFailuresBeforeSupport: z.literal(2),
  xp: z.strictObject({ firstRecall: z.literal(5), firstMastery: z.literal(10), firstConsolidation: z.literal(15) }),
});

export const V2BoundRouteDefinitionSchema = z.strictObject({
  engineVersion: V2EngineVersionSchema,
  pathId: V2PathIdSchema,
  pathVersionId: V2PathVersionIdSchema,
  editVersion: Version,
  status: LearningPathStatusSchema,
  contentHash: Hash,
  bindings: V2BindingsSchema,
  definition: RoutePackageSchema,
  policyVersion: V2PolicyVersionSchema,
  schedulerVersion: V2SchedulerVersionSchema,
  policySnapshot: V2PolicySnapshotSchema,
  reviewedContentHash: Hash.nullable(),
  approvedBy: Id.nullable(),
});
export type V2BoundRouteDefinition = z.infer<typeof V2BoundRouteDefinitionSchema>;

export const V2IssueSchema = z.strictObject({
  code: z.enum([
    "SCHEMA_UNSUPPORTED", "SCHEMA_INVALID", "DUPLICATE_KEY", "REFERENCE_MISSING", "DAG_CYCLE",
    "OBJECTIVE_COVERAGE", "BANK_TOO_SMALL", "RESERVE_LEAK", "CRITICAL_GATE_MISSING",
    "SOURCE_UNRESOLVED", "SOURCE_CHANGED", "ASSET_REQUIRED", "ASSET_RIGHTS", "ANSWER_INVALID",
    "REVIEW_STALE", "VERSION_CONFLICT", "IDEMPOTENCY_CONFLICT", "ACCESS_REVOKED",
    "ENGINE_VERSION_MISMATCH", "engine_version_mismatch", "VALIDATION_PENDING",
    "CONVERSION_REVIEW", "CONVERSION_DEPENDENCIES", "CONVERSION_PEDAGOGY", "CONVERSION_RESERVES",
    "CONVERSION_OBJECTIVE_MISSING", "CONVERSION_RESOURCE_MISSING", "CONVERSION_SOURCES",
  ]),
  severity: z.enum(["error", "warning"]),
  path: z.string(),
  message: z.string().min(1),
  suggestedFix: z.string().min(1),
});
export const V2ErrorResponseSchema = z.strictObject({
  error: z.strictObject({ code: V2IssueSchema.shape.code, message: z.string().min(1), path: z.string().nullable(), action: z.string().min(1) }),
});

const PublicBase = z.strictObject({
  key: RouteKeySchema,
  objectiveKey: RouteKeySchema,
  phase: RouteActivitySchema.options[0].shape.phase,
  representation: RouteActivitySchema.options[0].shape.representation,
  prompt: z.string().min(1),
});
const PublicStudy = PublicBase.extend({ kind: z.literal("study"), payload: z.strictObject({ body: z.string(), focusSpans: z.array(z.strictObject({ start: z.number().int(), end: z.number().int() })), assetKey: RouteKeySchema.nullable(), scaffold: z.enum(["explanation", "worked_example", "partial_example"]), videoRange: z.strictObject({ startSeconds: z.number(), endSeconds: z.number() }).nullable() }) }).strict();
const PublicChoice = PublicBase.extend({ kind: z.literal("single_choice"), payload: z.strictObject({ options: z.array(z.strictObject({ key: RouteKeySchema, text: z.string() })) }) }).strict();
const PublicShort = PublicBase.extend({ kind: z.literal("short_answer"), payload: z.strictObject({ maxChars: z.number().int().positive() }) }).strict();
const PublicConstructed = PublicBase.extend({ kind: z.literal("constructed_response"), payload: z.strictObject({ maxChars: z.literal(4000) }) }).strict();
const PublicMatch = PublicBase.extend({ kind: z.literal("match"), payload: z.strictObject({ presentation: z.enum(["pairs", "comparison_table", "causal_map"]), prompts: z.array(z.strictObject({ key: RouteKeySchema, text: z.string() })), choices: z.array(z.strictObject({ key: RouteKeySchema, text: z.string() })), allowReuse: z.boolean() }) }).strict();
const PublicImage = PublicBase.extend({ kind: z.literal("image_target"), payload: z.strictObject({ assetKey: RouteKeySchema, mode: z.enum(["hotspot", "labeling"]), targets: z.array(z.strictObject({ key: RouteKeySchema, prompt: z.string(), marker: z.strictObject({ x: z.number(), y: z.number() }).nullable() })), labels: z.array(z.strictObject({ key: RouteKeySchema, text: z.string() })), masking: z.enum(["all_labels", "partial_labels", "no_labels"]), accessibleAlternativeKey: RouteKeySchema.nullable().optional() }) }).strict();
const PublicSequence = PublicBase.extend({ kind: z.literal("sequence"), payload: z.strictObject({ items: z.array(z.strictObject({ key: RouteKeySchema, text: z.string() })) }) }).strict();
const PublicCase = PublicBase.extend({ kind: z.literal("case"), payload: z.strictObject({ activeStage: z.strictObject({ key: RouteKeySchema, narrative: z.string(), childActivityKey: RouteKeySchema }) }) }).strict();
export const V2PublicActivitySchema = z.discriminatedUnion("kind", [PublicStudy, PublicChoice, PublicShort, PublicConstructed, PublicMatch, PublicImage, PublicSequence, PublicCase]);
export type V2PublicActivity = z.infer<typeof V2PublicActivitySchema>;

/** Explicit construction prevents private payload fields from entering a student manifest. */
export function toV2PublicActivity(activity: RouteActivity, activeStageIndex = 0): V2PublicActivity {
  const base = {
    key: activity.key, objectiveKey: activity.objectiveKey, phase: activity.phase,
    representation: activity.representation, prompt: activity.prompt,
  };
  switch (activity.kind) {
    case "study": {
      const { body, focusSpans, assetKey, scaffold, videoRange } = activity.payload;
      return { ...base, kind: "study", payload: { body, focusSpans: focusSpans.map(({ start, end }) => ({ start, end })), assetKey, scaffold, videoRange: videoRange && { startSeconds: videoRange.startSeconds, endSeconds: videoRange.endSeconds } } };
    }
    case "single_choice": return { ...base, kind: "single_choice", payload: { options: activity.payload.options.map(({ key, text }) => ({ key, text })) } };
    case "short_answer": return { ...base, kind: "short_answer", payload: { maxChars: activity.payload.maxChars } };
    case "constructed_response": return { ...base, kind: "constructed_response", payload: { maxChars: 4000 } };
    case "match": {
      const { presentation, prompts, choices, allowReuse } = activity.payload;
      return { ...base, kind: "match", payload: { presentation, prompts: prompts.map(({ key, text }) => ({ key, text })), choices: choices.map(({ key, text }) => ({ key, text })), allowReuse } };
    }
    case "image_target": {
      const { assetKey, mode, targets, labels, masking } = activity.payload;
      return { ...base, kind: "image_target", payload: {
        assetKey, mode,
        targets: targets.map(({ key, prompt, polygon }) => ({ key, prompt: mode === "labeling" ? prompt : activity.prompt, marker: mode === "labeling" ? {
          x: polygon.reduce((sum, point) => sum + point.x, 0) / polygon.length,
          y: polygon.reduce((sum, point) => sum + point.y, 0) / polygon.length,
        } : null })),
        labels: mode === "labeling" ? labels.map(({ key, text }) => ({ key, text })) : [],
        masking,
      } };
    }
    case "sequence": return { ...base, kind: "sequence", payload: { items: activity.payload.items.map(({ key, text }) => ({ key, text })) } };
    case "case": {
      const stage = activity.payload.stages[activeStageIndex];
      if (!stage) throw new RangeError("Etapa de caso inexistente");
      return { ...base, kind: "case", payload: { activeStage: { key: stage.key, narrative: stage.narrative, childActivityKey: stage.childActivityKey } } };
    }
  }
}

export const V2PublicPathSchema = z.strictObject({
  engineVersion: V2EngineVersionSchema, policyVersion: V2PolicyVersionSchema,
  pathId: V2PathIdSchema, pathVersionId: V2PathVersionIdSchema,
  slug: z.string(), title: z.string(), summary: z.string(), coverKey: RoutePackageSchema.shape.route.shape.coverKey,
  topicLabel: z.string(), access: z.enum(["available", "enrolled", "revoked"]),
  enrollmentId: V2EnrollmentIdSchema.nullable(),
  availability: z.enum(["active", "maintenance"]).optional(),
  units: z.array(z.strictObject({ key: RouteKeySchema, title: z.string(), objectives: z.array(z.strictObject({ key: RouteKeySchema, title: z.string(), criticality: RoutePackageSchema.shape.objectives.element.shape.criticality })) })),
});
export function toV2PublicPath(bound: V2BoundRouteDefinition, access: z.infer<typeof V2PublicPathSchema>["access"], enrollmentId: V2EnrollmentId | null): z.infer<typeof V2PublicPathSchema> {
  const { definition, pathId, pathVersionId, engineVersion, policyVersion } = bound;
  return {
    engineVersion, policyVersion, pathId, pathVersionId,
    slug: definition.route.slug, title: definition.route.title, summary: definition.route.summary,
    coverKey: definition.route.coverKey, topicLabel: definition.route.topicLabel, access, enrollmentId,
    units: definition.units.map((unit) => ({ key: unit.key, title: unit.title, objectives: unit.objectiveKeys.flatMap((key) => {
      const objective = definition.objectives.find((item) => item.key === key);
      return objective ? [{ key: objective.key, title: objective.title, criticality: objective.criticality }] : [];
    }) })),
  };
}

export const V2AnswerSchema = z.union([
  z.strictObject({ kind: z.literal("study"), acknowledged: z.literal(true) }),
  z.strictObject({ kind: z.literal("single_choice"), optionKey: RouteKeySchema }),
  z.strictObject({ kind: z.literal("short_answer"), text: z.string().min(1).max(500) }),
  z.strictObject({ kind: z.literal("constructed_response"), text: z.string().min(1).max(4000), selfRating: z.enum(["again", "hard", "good"]).nullable() }),
  z.strictObject({ kind: z.literal("match"), pairs: z.record(RouteKeySchema, RouteKeySchema) }),
  z.strictObject({ kind: z.literal("image_target"), mode: z.literal("hotspot"), targetKey: RouteKeySchema, point: z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }) }),
  z.strictObject({ kind: z.literal("image_target"), mode: z.literal("labeling"), labelsByTarget: z.record(RouteKeySchema, RouteKeySchema) }),
  z.strictObject({ kind: z.literal("sequence"), orderedKeys: Keys }),
]);
export const V2PersistedResponseSchema = z.strictObject({
  id: V2ResponseIdSchema, attemptId: V2AttemptIdSchema,
  activityKey: RouteKeySchema, objectiveKey: RouteKeySchema, equivalenceKey: RouteKeySchema,
  itemRevisionHash: Hash, modality: z.enum(["text", "image", "table", "diagram", "case", "video"]),
  answer: V2AnswerSchema, score01: z.number().min(0).max(1).nullable(),
  gradingSource: z.enum(["server", "self", "none"]), assisted: z.boolean(), novelAtPresentation: z.boolean(),
  confidence: z.enum(["sure", "unsure", "guessed"]).nullable(), serverAcceptedAt: Timestamp,
  purpose: z.enum(["learning", "diagnostic", "gate", "final", "retention7", "retention30", "review"]),
  policyVersion: V2PolicyVersionSchema,
});

export const V2ObjectiveStateSchema = z.strictObject({
  objectiveKey: RouteKeySchema, label: z.enum(["new", "learning", "mastered", "reinforce"]),
  objectiveScore: z.number().min(0).max(100).nullable(), criticalErrorOpen: z.boolean(),
  assisted: z.boolean(), applicationDemonstrated: z.boolean(), reviewDue: z.boolean(),
  firstMasteredAt: Timestamp.nullable(), firstConsolidatedAt: Timestamp.nullable(),
});
const MaintenanceMeasurement = z.strictObject({ dueAt: Timestamp.nullable(), acceptedAt: Timestamp.nullable(), elapsedDays: z.number().nonnegative().nullable() });
export const V2MaintenanceSchema = z.strictObject({
  generatedAt: Timestamp,
  timeZone: z.string().refine(value => { try { new Intl.DateTimeFormat("es", { timeZone: value }); return true; } catch { return false; } }, "Zona IANA inválida"),
  diagnostic: z.strictObject({ status: z.enum(["pending", "completed", "omitted", "unavailable"]), assessmentKey: RouteKeySchema.nullable() }),
  activities: z.array(z.strictObject({ key: RouteKeySchema, objectiveKey: RouteKeySchema, reason: z.string().min(1) })),
  reviewBatch: z.array(z.strictObject({ key: RouteKeySchema, objectiveKey: RouteKeySchema, dueAt: Timestamp })).max(10),
  agenda: z.array(z.strictObject({ objectiveKey: RouteKeySchema, dueAt: Timestamp, retention7: MaintenanceMeasurement, retention30: MaintenanceMeasurement })),
  gates: z.array(z.strictObject({ unitKey: RouteKeySchema, passed: z.boolean(), score: z.number().min(0).max(100).nullable(), thresholdPercent: z.number().min(0).max(100), missingCoreKeys: Keys, criticalErrorKeys: Keys })),
  blockers: z.array(z.strictObject({ objectiveKey: RouteKeySchema, blockedBy: Keys })),
  remediation: z.array(z.strictObject({ objectiveKey: RouteKeySchema, confusion: z.string(), message: z.string(), activityKey: RouteKeySchema.nullable(), bankExhausted: z.boolean(), availableAfter: Timestamp.nullable(), pauseOffered: z.boolean() })),
  exhaustedBanks: z.array(z.strictObject({ objectiveKey: RouteKeySchema, availableAfter: Timestamp })),
});
export const V2RouteStateSchema = z.strictObject({
  engineVersion: V2EngineVersionSchema, enrollmentId: V2EnrollmentIdSchema,
  pathVersionId: V2PathVersionIdSchema, rowVersion: Version,
  completedActivities: z.number().int().nonnegative(), dispensedActivities: z.number().int().nonnegative(),
  plannedRequiredActivities: z.number().int().nonnegative(), completedAt: Timestamp.nullable(),
  masteredAt: Timestamp.nullable(), consolidatedAt: Timestamp.nullable(),
  objectives: z.array(V2ObjectiveStateSchema),
  dueReviews: z.number().int().nonnegative(),
  nextAction: z.strictObject({ kind: z.enum(["resume", "remediate", "retention", "review", "gate", "activity", "none"]), key: RouteKeySchema.nullable(), reason: z.string().min(1) }),
  // Additive projection; historical idempotency receipts remain valid without it.
  maintenance: V2MaintenanceSchema.optional(),
  availability: z.enum(["active", "maintenance"]).optional(),
  versionHistory: z.array(z.strictObject({ versionNumber: z.number().int().positive(), engineVersion: z.enum(["guided-v1", "guided-v2"]), adoptedAt: Timestamp, completedAt: Timestamp.nullable(), consumedActivities: z.array(z.string()) })).optional(),
});

/** Authorized feedback excerpt only; no bindings, editorial flags or resource payloads. */
export const V2FeedbackSourceSchema = RouteSourceSchema.pick({ key: true, title: true, citation: true, locator: true, excerpt: true, url: true }).strict();
export type V2FeedbackSource = z.infer<typeof V2FeedbackSourceSchema>;
export const V2FeedbackSchema = z.strictObject({
  explanation: z.string(), commonError: z.string(),
  // Additive transport fields allow historical receipts and existing v2 clients.
  sources: z.array(V2FeedbackSourceSchema).max(200).optional(),
  partialScore01: z.number().min(0).max(1).optional(),
});
const ConstructedResumeBase = { activityKey: RouteKeySchema, text: z.string().min(1).max(4000) };
export const V2ConstructedResumeSchema = z.discriminatedUnion("stage", [
  z.strictObject({ ...ConstructedResumeBase, stage: z.literal("submitted") }),
  z.strictObject({ ...ConstructedResumeBase, stage: z.literal("revealed"), modelAnswer: z.string(),
    rubric: z.array(z.strictObject({ key: RouteKeySchema, criterion: z.string(), example: z.string() })).min(1).max(8) }),
]);

export const V2AttemptManifestSchema = z.strictObject({
  engineVersion: V2EngineVersionSchema, attemptId: V2AttemptIdSchema, enrollmentId: V2EnrollmentIdSchema,
  pathVersionId: V2PathVersionIdSchema, policyVersion: V2PolicyVersionSchema,
  purpose: z.enum(["activity", "assessment", "review"]), rowVersion: Version,
  status: z.enum(["open", "completed", "abandoned", "paused"]),
  activeActivity: V2PublicActivitySchema.nullable(),
  constructedResponse: V2ConstructedResumeSchema.nullable().optional(),
  accessiblePractice: z.strictObject({ sourceActivityKey: RouteKeySchema }).nullable().optional(),
  acceptedResponses: z.array(z.strictObject({ activityKey: RouteKeySchema, answer: V2AnswerSchema, serverAcceptedAt: Timestamp, score01: z.number().min(0).max(1).nullable(), feedback: V2FeedbackSchema })),
}).superRefine((value, context) => {
  if (value.accessiblePractice && (value.status !== "open" || !value.activeActivity
    || value.activeActivity.key === value.accessiblePractice.sourceActivityKey
    || !["text", "table"].includes(value.activeActivity.representation) || ["image_target", "case", "study"].includes(value.activeActivity.kind))) {
    context.addIssue({ code: "custom", path: ["accessiblePractice"], message: "La variante formativa debe ser la actividad accesible activa." });
  }
  const pending = value.constructedResponse;
  if (pending && (value.status !== "open" || value.activeActivity?.kind !== "constructed_response"
    || value.activeActivity.key !== pending.activityKey || value.acceptedResponses.some(item => item.activityKey === pending.activityKey))) {
    context.addIssue({ code: "custom", path: ["constructedResponse"], message: "La comparación debe pertenecer a la respuesta activa pendiente." });
  }
});

export const V2MetricsSchema = z.strictObject({
  pathVersionId: V2PathVersionIdSchema, cohortStart: Timestamp, cohortEnd: Timestamp,
  enrolled: z.number().int().nonnegative(), evaluated: z.number().int().nonnegative(),
  immediate: z.number().min(0).max(100).nullable(),
  retention7: z.strictObject({ eligible: z.number().int().nonnegative(), responded: z.number().int().nonnegative(),
    eligibleObjectives: z.number().int().nonnegative(), respondedObjectives: z.number().int().nonnegative(),
    inWindowObjectives: z.number().int().nonnegative(), lateObjectives: z.number().int().nonnegative(),
    daysElapsed: z.array(z.number().nonnegative()), mean: z.number().min(0).max(100).nullable() }),
  retention30: z.strictObject({ eligible: z.number().int().nonnegative(), responded: z.number().int().nonnegative(),
    eligibleObjectives: z.number().int().nonnegative(), respondedObjectives: z.number().int().nonnegative(),
    inWindowObjectives: z.number().int().nonnegative(), lateObjectives: z.number().int().nonnegative(),
    daysElapsed: z.array(z.number().nonnegative()), mean: z.number().min(0).max(100).nullable() }),
  transfer: z.strictObject({ eligibleItems: z.number().int().nonnegative(), correctItems: z.number().int().nonnegative(),
    modalities: z.array(z.strictObject({ modality: RouteActivitySchema.options[0].shape.representation,
      eligibleItems: z.number().int().nonnegative(), correctItems: z.number().int().nonnegative() })) }),
  efficiency: z.number().nullable(), efficiencyEvaluated: z.number().int().nonnegative(), activeMinutes: z.number().nonnegative(),
  completed: z.number().int().nonnegative(),
  mastered: z.number().int().nonnegative(), consolidated: z.number().int().nonnegative(),
  missingness: z.strictObject({ diagnosticOmitted: z.number().int().nonnegative(), zeroActiveMinutes: z.number().int().nonnegative(), retention7Missing: z.number().int().nonnegative(), retention30Missing: z.number().int().nonnegative() }),
});

export const V2ObjectiveRewardKindSchema = z.enum(["v2_objective_recalled", "v2_objective_mastered", "v2_objective_consolidated"]);
export const V2ObjectiveRewardSchema = LearningRewardSchema.extend({ kind: V2ObjectiveRewardKindSchema }).strict();
export const V2RewardSchema = z.union([LearningRewardSchema, V2ObjectiveRewardSchema]);
export type V2ObjectiveRewardKind = z.infer<typeof V2ObjectiveRewardKindSchema>;
export const V2HeartbeatSchema = z.strictObject({ deviceKey: Id, tickKey: Id, visible: z.boolean() });

// v2 catalog/home shapes are separate from strict v1 DTOs. Consumers dispatch on engineVersion.
export const V2PathCardSchema = z.strictObject({
  engineVersion: V2EngineVersionSchema, policyVersion: V2PolicyVersionSchema,
  id: V2PathIdSchema, pathVersionId: V2PathVersionIdSchema, enrollmentId: V2EnrollmentIdSchema.nullable(),
  slug: RoutePackageSchema.shape.route.shape.slug, title: z.string(), summary: z.string(),
  coverKey: RoutePackageSchema.shape.route.shape.coverKey, topicLabel: z.string(), unitCount: z.number().int().positive(),
  completed: z.boolean(), mastered: z.boolean(), consolidated: z.boolean(),
});
export const V2CatalogResponseSchema = z.strictObject({ items: z.array(V2PathCardSchema), nextCursor: Id.nullable() });
export const V2HomeSnapshotSchema = z.strictObject({
  engineVersion: V2EngineVersionSchema, generatedAt: Timestamp,
  activePath: V2PathCardSchema.nullable(), dueReviews: z.number().int().nonnegative(),
  nextAction: V2RouteStateSchema.shape.nextAction.nullable(),
});

const PathParams = z.strictObject({ id: V2PathIdSchema });
const EnrollmentParams = z.strictObject({ id: V2EnrollmentIdSchema });
const AttemptParams = z.strictObject({ id: V2AttemptIdSchema });
const ImportParams = z.strictObject({ id: V2ImportIdSchema });
const SlugParams = z.strictObject({ slug: RoutePackageSchema.shape.route.shape.slug });
const ExpectedVersion = z.strictObject({ expectedVersion: Version });
const PackageAndBindings = z.strictObject({ package: RoutePackageSchema, bindings: V2BindingsSchema });
const BoundResponse = z.strictObject({ route: V2BoundRouteDefinitionSchema });
const DraftResponse = z.strictObject({ pathId: V2PathIdSchema, pathVersionId: V2PathVersionIdSchema, editVersion: Version, status: z.literal("draft") });
const IssuesResponse = z.strictObject({ issues: z.array(V2IssueSchema), validatedEditVersion: Version.nullable(), ready: z.boolean() });
const AttemptResponse = z.strictObject({ attempt: V2AttemptManifestSchema });
export const V2ImageResourceSchema = z.strictObject({ activityKey: RouteKeySchema, attemptVersion: Version,
  image: z.strictObject({ assetKey: RouteKeySchema, url: z.url().refine(value => new URL(value).protocol === "https:"), alt: z.string(), expiresAt: Timestamp }) });
const PreviewResponse = z.strictObject({ previewId: Id, activeActivity: V2PublicActivitySchema.nullable(), issues: z.array(V2IssueSchema), expiresAt: Timestamp });
const StateResponse = z.strictObject({ state: V2RouteStateSchema });
const Ack = z.strictObject({ accepted: z.boolean(), rowVersion: Version });
const MutationHeaders = z.strictObject({ idempotencyKey: Id });
const NoHeaders = Empty;

type Endpoint<M extends "GET" | "POST" | "PATCH", P extends z.ZodType, Q extends z.ZodType, B extends z.ZodType, R extends z.ZodType, H extends z.ZodType> = {
  method: M;
  path: string;
  params: P;
  query: Q;
  body: B;
  headers: H;
  response: R;
};
const route = <M extends "GET" | "POST" | "PATCH", P extends z.ZodType, Q extends z.ZodType, B extends z.ZodType, R extends z.ZodType>(method: M, path: string, params: P, query: Q, body: B, response: R): Endpoint<M, P, Q, B, R, M extends "GET" ? typeof NoHeaders : typeof MutationHeaders> => ({ method, path, params, query, body, headers: (method === "GET" ? NoHeaders : MutationHeaders) as M extends "GET" ? typeof NoHeaders : typeof MutationHeaders, response });

/** One entry per HTTP route in §8.10; request parts and response remain separately typed. */
export const V2HttpContracts = {
  editorSourceCatalog: route("GET", "/v2/editor/learning-paths/source-catalog", Empty, z.strictObject({ q: z.string().max(120).optional(), cursor: Id.optional(), limit: z.coerce.number().int().min(1).max(100).default(24) }), Empty, V2EditorSourceCatalogSchema),
  importValidate: route("POST", "/v2/editor/learning-paths/imports/validate", Empty, Empty, PackageAndBindings.extend({ targetPathId: V2PathIdSchema.nullable(), expectedVersion: NullableVersion }).strict(), z.strictObject({ importId: V2ImportIdSchema, hash: Hash, expiresAt: Timestamp, issues: z.array(V2IssueSchema), diff: z.array(z.strictObject({ path: z.string(), before: z.unknown(), after: z.unknown() })), readyToImport: z.boolean() })),
  importCommit: route("POST", "/v2/editor/learning-paths/imports/:id/commit", ImportParams, Empty, z.strictObject({ hash: Hash, expectedVersion: NullableVersion }), DraftResponse),
  editorCreate: route("POST", "/v2/editor/learning-paths", Empty, Empty, PackageAndBindings, DraftResponse),
  editorGet: route("GET", "/v2/editor/learning-paths/:id", PathParams, Empty, Empty, BoundResponse),
  editorPatch: route("PATCH", "/v2/editor/learning-paths/:id", PathParams, Empty, PackageAndBindings.extend({ expectedVersion: Version }).strict(), BoundResponse),
  editorValidate: route("POST", "/v2/editor/learning-paths/:id/validate", PathParams, Empty, ExpectedVersion, IssuesResponse),
  editorTransition: route("POST", "/v2/editor/learning-paths/:id/transition", PathParams, Empty, z.strictObject({ status: LearningPathStatusSchema, expectedVersion: Version, reviewNote: MaybeText }), BoundResponse),
  editorVersion: route("POST", "/v2/editor/learning-paths/:id/versions", PathParams, Empty, z.strictObject({ expectedVersion: Version, releaseNotes: MaybeText }), DraftResponse),
  editorExport: route("GET", "/v2/editor/learning-paths/:id/export", PathParams, Empty, Empty, z.strictObject({ package: RoutePackageSchema, bindings: V2BindingsSchema })),
  editorPreview: route("POST", "/v2/editor/learning-paths/:id/preview", PathParams, Empty, PackageAndBindings, PreviewResponse),
  publicPath: route("GET", "/v2/guided-learning/paths/:slug", SlugParams, Empty, Empty, z.strictObject({ path: V2PublicPathSchema })),
  enrollmentCreate: route("POST", "/v2/guided-learning/enrollments", Empty, Empty, z.strictObject({ pathId: V2PathIdSchema }), StateResponse),
  enrollmentState: route("GET", "/v2/guided-learning/enrollments/:id/state", EnrollmentParams, Empty, Empty, StateResponse),
  attemptCreate: route("POST", "/v2/guided-learning/attempts", Empty, Empty, z.strictObject({ clientAttemptId: Id, enrollmentId: V2EnrollmentIdSchema, target: z.strictObject({ kind: z.enum(["activity", "assessment", "review"]), key: RouteKeySchema }), expectedEnrollmentVersion: Version }), AttemptResponse),
  attemptGet: route("GET", "/v2/guided-learning/attempts/:id", AttemptParams, Empty, Empty, AttemptResponse),
  attemptImage: route("GET", "/v2/guided-learning/attempts/:id/image", AttemptParams, z.strictObject({ activityKey: RouteKeySchema, expectedVersion: z.coerce.number().int().positive() }), Empty, V2ImageResourceSchema),
  attemptAlternative: route("POST", "/v2/guided-learning/attempts/:id/alternative", AttemptParams, Empty, z.strictObject({ activityKey: RouteKeySchema, expectedVersion: Version }), AttemptResponse.extend({ state: V2RouteStateSchema })),
  attemptHelp: route("POST", "/v2/guided-learning/attempts/:id/help", AttemptParams, Empty, z.strictObject({ activityKey: RouteKeySchema, kind: z.enum(["hint", "source", "reveal"]), expectedVersion: Version }), z.strictObject({ help: z.strictObject({ kind: z.enum(["hint", "source", "reveal"]), text: z.string() }), attempt: V2AttemptManifestSchema })),
  attemptResponse: route("POST", "/v2/guided-learning/attempts/:id/responses", AttemptParams, Empty, z.strictObject({ activityKey: RouteKeySchema, answer: V2AnswerSchema, confidence: z.enum(["sure", "unsure", "guessed"]).nullable(), expectedVersion: Version }), z.strictObject({ accepted: z.boolean(), feedback: V2FeedbackSchema.extend({ score01: z.number().min(0).max(1).nullable() }), nextStep: V2PublicActivitySchema.nullable(), attempt: V2AttemptManifestSchema, state: V2RouteStateSchema })),
  attemptComplete: route("POST", "/v2/guided-learning/attempts/:id/complete", AttemptParams, Empty, ExpectedVersion, z.strictObject({ attempt: V2AttemptManifestSchema, state: V2RouteStateSchema })),
  attemptHeartbeat: route("POST", "/v2/guided-learning/attempts/:id/heartbeat", AttemptParams, Empty, z.strictObject({ clientEventId: Id, visible: z.boolean(), interactionAgeMs: z.number().int().nonnegative().max(600000) }), Ack),
  convertV1: route("POST", "/v2/editor/learning-paths/:id/convert-v1", PathParams, Empty, ExpectedVersion, z.strictObject({ draft: DraftResponse, issues: z.array(V2IssueSchema) })),
  upgradePreview: route("GET", "/v2/guided-learning/enrollments/:id/upgrade", EnrollmentParams, Empty, Empty, z.strictObject({ targetVersionId: V2PathVersionIdSchema, expectedVersion: Version.optional(), engineChange: z.boolean().optional(), availability: z.enum(["active", "maintenance"]).optional(), objectiveImpact: z.array(z.strictObject({ objectiveKey: RouteKeySchema, title: z.string().optional(), willResetEvidence: z.boolean() })), openAttempt: z.boolean(), consumedActivities: z.array(z.strictObject({ title: z.string(), previousActivityKey: z.string(), consumptionOnly: z.literal(true) })).optional() })),
  upgradeCommit: route("POST", "/v2/guided-learning/enrollments/:id/upgrade", EnrollmentParams, Empty, z.strictObject({ targetVersionId: V2PathVersionIdSchema, expectedVersion: Version, acknowledgedReset: z.literal(true) }), StateResponse),
  editorMetrics: route("GET", "/v2/editor/learning-paths/:id/metrics", PathParams, z.strictObject({ pathVersionId: V2PathVersionIdSchema, cohortStart: Timestamp, cohortEnd: Timestamp }), Empty, z.strictObject({ metrics: V2MetricsSchema })),
} as const;

export type V2HttpContractName = keyof typeof V2HttpContracts;
/** Editorial simulation is a separate capability; none of these routes accepts
 * an enrollment or persists learner facts. */
export const V2EditorPreviewProfileSchema = z.enum(["beginner", "diagnostic_correct", "core_error"]);
export const V2EditorPreviewActionSchema = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("response"), body: V2HttpContracts.attemptResponse.body }),
  z.strictObject({ operation: z.literal("help"), body: V2HttpContracts.attemptHelp.body }),
  z.strictObject({ operation: z.literal("alternative"), body: V2HttpContracts.attemptAlternative.body }),
  z.strictObject({ operation: z.literal("complete"), body: V2HttpContracts.attemptComplete.body }),
  z.strictObject({ operation: z.literal("start"), body: ExpectedVersion.extend({ target: z.strictObject({ kind: z.enum(["activity", "assessment", "review"]), key: RouteKeySchema }) }).strict() }),
  z.strictObject({ operation: z.literal("clock"), body: ExpectedVersion.extend({ now: Timestamp }).strict() }),
  z.strictObject({ operation: z.literal("omit_diagnostic"), body: ExpectedVersion }),
]);
export const V2EditorPreviewSnapshotSchema = z.strictObject({
  state: V2RouteStateSchema, attempt: V2AttemptManifestSchema.nullable(), now: Timestamp,
  profile: V2EditorPreviewProfileSchema,
  targets: z.array(z.strictObject({ kind: z.enum(["activity", "assessment"]), key: RouteKeySchema, title: z.string() })),
  profileWarning: z.string().nullable(),
});
const PreviewSessionParams = PathParams.extend({ previewId: Id }).strict();
export const V2EditorPreviewHttpContracts = {
  create: route("POST", "/v2/editor/learning-paths/:id/preview-sessions", PathParams, Empty,
    PackageAndBindings.extend({ profile: V2EditorPreviewProfileSchema, now: Timestamp }).strict(),
    V2EditorPreviewSnapshotSchema.extend({ previewId: Id, expiresAt: Timestamp }).strict()),
  action: route("POST", "/v2/editor/learning-paths/:id/preview-sessions/:previewId/actions", PreviewSessionParams, Empty,
    V2EditorPreviewActionSchema, z.union([V2EditorPreviewSnapshotSchema, V2HttpContracts.attemptResponse.response, V2HttpContracts.attemptHelp.response, V2HttpContracts.attemptAlternative.response, V2HttpContracts.attemptComplete.response])),
  image: route("POST", "/v2/editor/learning-paths/:id/preview-sessions/:previewId/image", PreviewSessionParams, Empty,
    z.strictObject({ activityKey: RouteKeySchema, expectedVersion: Version }), V2ImageResourceSchema),
} as const;

export type V2HttpRequest<K extends V2HttpContractName> = {
  params: z.input<(typeof V2HttpContracts)[K]["params"]>;
  query: z.input<(typeof V2HttpContracts)[K]["query"]>;
  body: z.input<(typeof V2HttpContracts)[K]["body"]>;
  headers: z.input<(typeof V2HttpContracts)[K]["headers"]>;
};
export type V2HttpResponse<K extends V2HttpContractName> = z.output<(typeof V2HttpContracts)[K]["response"]>;
export type V2PublicPath = z.infer<typeof V2PublicPathSchema>;
export type V2RouteState = z.infer<typeof V2RouteStateSchema>;
export type V2AttemptManifest = z.infer<typeof V2AttemptManifestSchema>;
export type V2PersistedResponse = z.infer<typeof V2PersistedResponseSchema>;

// Compile-time distinction: a v1 plain UUID string cannot be used as a v2 ID.
export const V2IdSchemas = { path: V2PathIdSchema, pathVersion: V2PathVersionIdSchema, enrollment: V2EnrollmentIdSchema, attempt: V2AttemptIdSchema } as const;
