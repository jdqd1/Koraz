import { z } from "zod";
import { LearningCoverKeySchema } from "./guided-learning.js";

export const RouteKeySchema = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const Text = (max: number) => z.string().min(1).max(max);
const Sha256 = z.string().regex(/^[a-fA-F0-9]{64}$/);
const HttpsUrl = z.url().refine((value) => new URL(value).protocol === "https:");
const IsoDate = z.iso.date();
const Keys = z.array(RouteKeySchema);
const Point = z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

export const RouteSourceSchema = z.strictObject({
  key: RouteKeySchema,
  kind: z.enum(["guide", "reference"]),
  title: Text(500),
  citation: z.string().max(2000),
  locator: z.strictObject({ heading: z.string().max(500), sectionPath: z.array(z.string().max(500)), page: z.number().int().positive().nullable() }),
  documentSha256: Sha256,
  excerpt: z.string().max(10000),
  url: HttpsUrl.nullable(),
  verification: z.enum(["provided", "verified", "unverified"]),
  checkedAt: IsoDate.nullable(),
});

export const RouteAssetSchema = z.strictObject({
  key: RouteKeySchema,
  mediaType: z.enum(["image", "video"]),
  originalFileName: z.string().min(1).max(255).refine((v) => !/[\\/\u0000-\u001f]/.test(v), "Debe ser un nombre de archivo simple"),
  sha256: Sha256.nullable(),
  alt: z.string().max(2000),
  caption: z.string().max(2000),
  sourceKeys: Keys,
  rightsStatus: z.enum(["owned", "licensed", "public_domain", "unverified"]),
  credit: z.string().max(1000),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

export const RouteObjectiveSchema = z.strictObject({
  key: RouteKeySchema,
  title: Text(240),
  unitKey: RouteKeySchema,
  verb: z.enum(["identify", "recall", "relate", "differentiate", "explain", "predict", "order", "apply", "integrate"]),
  criticality: z.enum(["core", "high_yield", "supporting", "detail"]),
  required: z.boolean(),
  prerequisiteKeys: Keys,
  sourceKeys: Keys,
  comparisonGroup: RouteKeySchema.nullable(),
  misconceptions: z.array(z.strictObject({
    key: RouteKeySchema,
    description: Text(2000),
    critical: z.boolean(),
    remediationActivityKey: RouteKeySchema,
    verificationActivityKeys: Keys,
  })),
}).refine((value) => value.criticality !== "core" || value.required, { path: ["required"], message: "Un objetivo core debe ser requerido" });

export const RouteUnitSchema = z.strictObject({
  key: RouteKeySchema,
  title: Text(240),
  objectiveKeys: Keys,
  activityKeys: Keys,
  support: z.enum(["full", "standard"]),
  estimatedMinutes: z.number().int().min(1).max(600).nullable(),
});

const BaseActivity = z.strictObject({
  key: RouteKeySchema,
  objectiveKey: RouteKeySchema,
  relatedObjectiveKeys: Keys,
  phase: z.enum(["activate", "learn", "retrieve", "elaborate", "apply", "remediate"]),
  required: z.boolean(),
  sourceKeys: Keys,
  representation: z.enum(["text", "image", "table", "diagram", "case", "video"]),
  equivalenceKey: RouteKeySchema,
  hints: z.array(z.string().min(1).max(2000)).max(3),
  use: z.enum(["learning", "diagnostic", "gate", "final", "retention7", "retention30"]),
  prompt: Text(4000),
  feedback: z.strictObject({ explanation: Text(4000), commonError: z.string().max(4000), sourceKeys: Keys }),
  misconceptionMappings: z.array(z.strictObject({ responseKey: RouteKeySchema, misconceptionKey: RouteKeySchema })),
  alternativeActivityKey: RouteKeySchema.nullable(),
});

const Study = BaseActivity.extend({ kind: z.literal("study"), payload: z.strictObject({
  body: Text(10000),
  focusSpans: z.array(z.strictObject({ start: z.number().int().nonnegative(), end: z.number().int().positive() })),
  assetKey: RouteKeySchema.nullable(),
  scaffold: z.enum(["explanation", "worked_example", "partial_example"]),
  videoRange: z.strictObject({ startSeconds: z.number().nonnegative(), endSeconds: z.number().positive() }).nullable(),
}) }).strict();
const SingleChoice = BaseActivity.extend({ kind: z.literal("single_choice"), payload: z.strictObject({
  options: z.array(z.strictObject({ key: RouteKeySchema, text: Text(2000) })).min(2).max(6),
  correctKey: RouteKeySchema,
  distractorFeedback: z.record(RouteKeySchema, Text(2000)),
}) }).strict();
const ShortAnswer = BaseActivity.extend({ kind: z.literal("short_answer"), payload: z.strictObject({
  acceptedAnswers: z.array(Text(500)).min(1).max(30), maxChars: z.number().int().min(1).max(500),
  modelAnswer: Text(2000), normalization: z.literal("nfkc-lower-space"),
}) }).strict();
const ConstructedResponse = BaseActivity.extend({ kind: z.literal("constructed_response"), payload: z.strictObject({
  rubric: z.array(z.strictObject({ key: RouteKeySchema, criterion: Text(2000), example: Text(2000) })).min(1).max(8),
  modelAnswer: Text(4000), verificationActivityKey: RouteKeySchema.nullable(),
}) }).strict();
const Match = BaseActivity.extend({ kind: z.literal("match"), payload: z.strictObject({
  presentation: z.enum(["pairs", "comparison_table", "causal_map"]),
  prompts: z.array(z.strictObject({ key: RouteKeySchema, text: Text(2000) })).min(1),
  choices: z.array(z.strictObject({ key: RouteKeySchema, text: Text(2000) })).min(1),
  correctByPrompt: z.record(RouteKeySchema, RouteKeySchema), allowReuse: z.boolean(),
  edges: z.array(z.strictObject({ from: RouteKeySchema, to: RouteKeySchema, label: z.string().max(500) })),
}) }).strict();
const ImageTarget = BaseActivity.extend({ kind: z.literal("image_target"), payload: z.strictObject({
  assetKey: RouteKeySchema, mode: z.enum(["hotspot", "labeling"]),
  targets: z.array(z.strictObject({ key: RouteKeySchema, prompt: Text(2000), polygon: z.array(Point).min(3), label: z.string().max(500) })).min(1),
  labels: z.array(z.strictObject({ key: RouteKeySchema, text: Text(500) })),
  correctLabelByTarget: z.record(RouteKeySchema, RouteKeySchema),
  accessibleAlternativeKey: RouteKeySchema, masking: z.enum(["all_labels", "partial_labels", "no_labels"]),
}) }).strict();
const Sequence = BaseActivity.extend({ kind: z.literal("sequence"), payload: z.strictObject({
  items: z.array(z.strictObject({ key: RouteKeySchema, text: Text(2000) })).min(3).max(12),
  acceptedOrders: z.array(Keys).min(1).max(5), whyActivityKey: RouteKeySchema.nullable(),
}) }).strict();
const Case = BaseActivity.extend({ kind: z.literal("case"), payload: z.strictObject({
  stages: z.array(z.strictObject({ key: RouteKeySchema, narrative: Text(4000), childActivityKey: RouteKeySchema })).min(2).max(6),
}) }).strict();

export const RouteActivitySchema = z.discriminatedUnion("kind", [Study, SingleChoice, ShortAnswer, ConstructedResponse, Match, ImageTarget, Sequence, Case]);
export const RouteAssessmentSchema = z.strictObject({
  key: RouteKeySchema,
  kind: z.enum(["diagnostic", "unit_gate", "checkpoint", "final", "retention7", "retention30"]),
  afterUnitKey: RouteKeySchema.nullable(), objectiveKeys: Keys, candidateActivityKeys: Keys,
  thresholdPercent: z.number().int().min(80).max(100), thresholdRationale: Text(2000).min(40),
});
export const RouteEditorialIssueSchema = z.strictObject({
  code: Text(120), severity: z.enum(["error", "warning"]), path: z.string().regex(/^(?:|\/(?:[^~/]|~[01])*)*$/),
  message: Text(2000), suggestedFix: Text(2000),
});

export const RoutePackageSchema = z.strictObject({
  schemaVersion: z.literal("2.0"), packageKey: RouteKeySchema, revision: z.number().int().min(1), locale: z.literal("es"),
  route: z.strictObject({
    slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: Text(200), summary: Text(2000), topicLabel: Text(240), audience: Text(240),
    discipline: z.enum(["anatomy", "histology", "embryology", "physiology", "biochemistry", "pharmacology", "pathology", "clinical", "general"]),
    coverKey: LearningCoverKeySchema,
  }),
  policyVersion: z.literal("guided-v2.0"),
  sources: z.array(RouteSourceSchema).max(200), assets: z.array(RouteAssetSchema).max(500),
  objectives: z.array(RouteObjectiveSchema).max(200), units: z.array(RouteUnitSchema).max(30),
  activities: z.array(RouteActivitySchema).max(2000), assessments: z.array(RouteAssessmentSchema).max(200),
  reviewPlan: z.strictObject({ objectiveKeys: Keys }),
  editorial: z.strictObject({ notes: z.string().max(10000), unresolvedIssues: z.array(RouteEditorialIssueSchema) }),
});

export type RoutePackage = z.infer<typeof RoutePackageSchema>;
export type RouteActivity = z.infer<typeof RouteActivitySchema>;
