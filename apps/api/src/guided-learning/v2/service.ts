import {
  RoutePackageSchema,
  V2BindingsSchema,
  V2PolicySnapshotSchema,
  validateRoutePackage,
  type RoutePackage,
  type RouteValidationIssue,
} from "@cediah/contracts";
import { hashRoutePackage } from "./validation.js";

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
