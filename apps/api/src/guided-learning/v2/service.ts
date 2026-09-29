import {
  RoutePackageSchema,
  V2BindingsSchema,
  V2PolicySnapshotSchema,
  validateRoutePackage,
  type RoutePackage,
  type RouteActivity,
  type RouteValidationIssue,
} from "@cediah/contracts";
import { hashRoutePackage } from "./validation.js";
import { hashLearningSnapshot } from "../snapshot-hash.js";

export type GuidedV2Bindings = typeof V2BindingsSchema._output;

export const guidedV2PolicySnapshot = V2PolicySnapshotSchema.parse({
  policyVersion: "guided-v2.0",
  schedulerVersion: "scheduler-v2.0",
  coverage: {
    requiredObjectiveItems: 5,
    minRecallItems: 2,
    minApplicationItems: 1,
    finalReserves: 1,
    retention7Reserves: 1,
    retention30Reserves: 1,
  },
  defaultGateThresholdPercent: 80,
  diagnostic: { minItems: 4, maxItems: 8 },
  mastery: {
    window: 5,
    minFamilies: 3,
    minRecallFamilies: 2,
    minApplications: 1,
    familyReuseHours: 24,
  },
  review: {
    intervalsDays: [1, 3, 7, 14, 30],
    batchLimit: 10,
    retryMinutes: 10,
    immediateRetryLimit: 2,
  },
  retention: { firstDays: 7, secondDays: 30, minSeparationDays: 7 },
  checkpointItemLimit: 10,
  consecutiveFailuresBeforeSupport: 2,
  xp: { firstRecall: 5, firstMastery: 10, firstConsolidation: 15 },
});

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new TypeError("El paquete contiene un valor no JSON");
  return encoded;
}

export type PreparedGuidedV2Draft = {
  definition: RoutePackage;
  bindings: GuidedV2Bindings;
  canonicalJson: string;
  contentHash: string;
};

export type PreparedGuidedV2DraftResult =
  | { status: "success"; value: PreparedGuidedV2Draft }
  | { status: "invalid"; issues: RouteValidationIssue[] };

export function prepareGuidedV2Draft(packageInput: unknown, bindingsInput: unknown): PreparedGuidedV2DraftResult {
  const validation = validateRoutePackage(packageInput);
  const definition = RoutePackageSchema.safeParse(packageInput);
  const bindings = V2BindingsSchema.safeParse(bindingsInput);
  const issues: RouteValidationIssue[] = [...validation.issues];
  if (!bindings.success) for (const issue of bindings.error.issues) {
    issues.push({
      code: "SCHEMA_INVALID",
      severity: "error",
      path: `/bindings/${issue.path.join("/")}`,
      message: `Binding inválido: ${issue.message}`,
      suggestedFix: "Corrige el binding de acuerdo con el contrato v2.",
    });
  }
  if (!validation.valid || !definition.success || !bindings.success) {
    return { status: "invalid", issues };
  }

  const sourceKeys = new Set(definition.data.sources.map((source) => source.key));
  const assetKeys = new Set(definition.data.assets.map((asset) => asset.key));
  const bindingIssues: RouteValidationIssue[] = [];
  const seenSources = new Set<string>();
  const seenAssets = new Set<string>();
  for (const [index, source] of bindings.data.sources.entries()) {
    if (!sourceKeys.has(source.key) || seenSources.has(source.key)) bindingIssues.push({
      code: "REFERENCE_MISSING", severity: "error", path: `/bindings/sources/${index}/key`,
      message: `Binding de fuente ajeno o repetido: ${source.key}.`,
      suggestedFix: "Usa una clave de fuente única del paquete.",
    });
    seenSources.add(source.key);
  }
  for (const [index, asset] of bindings.data.assets.entries()) {
    if (!assetKeys.has(asset.key) || seenAssets.has(asset.key)) bindingIssues.push({
      code: "REFERENCE_MISSING", severity: "error", path: `/bindings/assets/${index}/key`,
      message: `Binding de asset ajeno o repetido: ${asset.key}.`,
      suggestedFix: "Usa una clave de asset única del paquete.",
    });
    seenAssets.add(asset.key);
  }
  if (bindingIssues.length > 0) return { status: "invalid", issues: [...issues, ...bindingIssues] };

  return { status: "success", value: {
    definition: definition.data,
    bindings: bindings.data,
    canonicalJson: canonicalJson(definition.data),
    contentHash: hashRoutePackage(definition.data),
  } };
}

export type GuidedV2AttemptTarget = { kind: "activity" | "assessment" | "review"; key: string };
export type GuidedV2AttemptSnapshot = {
  target: GuidedV2AttemptTarget;
  pathVersionId: string;
  contentHash: string;
  activities: RouteActivity[];
  orderedKeys: string[];
};
export type GuidedV2AttemptResume = {
  activeIndex: number;
  assistedKeys: string[];
  revealedKeys: string[];
  submittedTextByActivity: Record<string, string>;
};

/** A private immutable copy of the selected questions; selection never depends on a later publication. */
export function prepareGuidedV2AttemptSnapshot(
  definition: RoutePackage, pathVersionId: string, target: GuidedV2AttemptTarget,
): GuidedV2AttemptSnapshot | null {
  const byKey = new Map(definition.activities.map((activity) => [activity.key, activity]));
  let selected: RouteActivity[];
  if (target.kind === "assessment") {
    const assessment = definition.assessments.find((item) => item.key === target.key);
    if (!assessment || assessment.candidateActivityKeys.length === 0) return null;
    selected = assessment.candidateActivityKeys.map((key) => byKey.get(key)).filter((item): item is RouteActivity => Boolean(item));
    if (selected.length !== assessment.candidateActivityKeys.length) return null;
  } else {
    const activity = byKey.get(target.key);
    if (!activity) return null;
    selected = [activity];
  }
  const activities: RouteActivity[] = [];
  const orderedKeys: string[] = [];
  for (const activity of selected) {
    activities.push(activity);
    if (activity.kind === "case") {
      const children = activity.payload.stages.map((stage) => byKey.get(stage.childActivityKey));
      if (children.some((child) => !child || child.kind === "case")
        || new Set(children.map((child) => child!.key)).size !== children.length) return null;
      for (const child of children as RouteActivity[]) {
        activities.push(child);
        orderedKeys.push(child.key);
      }
    } else orderedKeys.push(activity.key);
  }
  if (new Set(activities.map((activity) => activity.key)).size !== activities.length
    || new Set(orderedKeys).size !== orderedKeys.length) return null;
  return { target, pathVersionId, contentHash: hashRoutePackage(definition), activities, orderedKeys };
}

export function parseGuidedV2AttemptSnapshot(input: unknown): GuidedV2AttemptSnapshot | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const target = value.target as GuidedV2AttemptTarget | undefined;
  if (!target || !["activity", "assessment", "review"].includes(target.kind)
    || typeof target.key !== "string" || typeof value.pathVersionId !== "string"
    || typeof value.contentHash !== "string" || !Array.isArray(value.activities)
    || !Array.isArray(value.orderedKeys) || !value.orderedKeys.every((key) => typeof key === "string")) return null;
  const activities = RoutePackageSchema.shape.activities.safeParse(value.activities);
  if (!activities.success) return null;
  const keys = new Set(activities.data.map((activity) => activity.key));
  if (value.orderedKeys.length === 0 || new Set(value.orderedKeys).size !== value.orderedKeys.length
    || value.orderedKeys.some((key) => !keys.has(key))) return null;
  return { target, pathVersionId: value.pathVersionId, contentHash: value.contentHash,
    activities: activities.data, orderedKeys: value.orderedKeys as string[] };
}

export function initialGuidedV2AttemptResume(): GuidedV2AttemptResume {
  return { activeIndex: 0, assistedKeys: [], revealedKeys: [], submittedTextByActivity: {} };
}

export function parseGuidedV2AttemptResume(input: unknown, snapshot: GuidedV2AttemptSnapshot): GuidedV2AttemptResume | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (!Number.isInteger(value.activeIndex) || (value.activeIndex as number) < 0
    || (value.activeIndex as number) > snapshot.orderedKeys.length
    || !Array.isArray(value.assistedKeys) || !Array.isArray(value.revealedKeys)
    || !value.assistedKeys.every((key) => typeof key === "string" && snapshot.orderedKeys.includes(key))
    || !value.revealedKeys.every((key) => typeof key === "string" && snapshot.orderedKeys.includes(key))
    || !value.submittedTextByActivity || typeof value.submittedTextByActivity !== "object"
    || Array.isArray(value.submittedTextByActivity)) return null;
  const submittedTextByActivity = value.submittedTextByActivity as Record<string, unknown>;
  if (Object.entries(submittedTextByActivity).some(([key, text]) => !snapshot.orderedKeys.includes(key) || typeof text !== "string")) return null;
  return { activeIndex: value.activeIndex as number, assistedKeys: value.assistedKeys as string[],
    revealedKeys: value.revealedKeys as string[], submittedTextByActivity: submittedTextByActivity as Record<string, string> };
}

export function guidedV2ItemRevisionHash(activity: RouteActivity): string {
  return hashLearningSnapshot(activity);
}
