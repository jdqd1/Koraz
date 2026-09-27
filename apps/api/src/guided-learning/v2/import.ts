import { createHash } from "node:crypto";
import { RoutePackageSchema, validateRoutePackage, type RoutePackage, type RouteValidationIssue } from "@cediah/contracts";

export const MAX_ROUTE_IMPORT_BYTES = 10 * 1024 * 1024;
export const ROUTE_IMPORT_TTL_MS = 24 * 60 * 60 * 1000;

export function importIssue(code: RouteValidationIssue["code"], path: string, message: string, suggestedFix: string): RouteValidationIssue {
  return { code, severity: "error", path, message, suggestedFix };
}

export type ParsedRouteImport =
  | { status: "success"; definition: RoutePackage; issues: RouteValidationIssue[] }
  | { status: "invalid"; issues: RouteValidationIssue[] }
  | { status: "too_large" };

function executableField(value: unknown, path = ""): string | null {
  if (typeof value === "string") return /<\s*\/?\s*(?:script|iframe|object|embed|svg)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(value) ? path : null;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = executableField(item, `${path}/${index}`);
      if (found !== null) return found;
    }
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const found = executableField(item, `${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`);
      if (found !== null) return found;
    }
  }
  return null;
}

export function parseRouteImport(input: unknown): ParsedRouteImport {
  let raw: string;
  try { raw = typeof input === "string" ? input : JSON.stringify(input); }
  catch { return { status: "invalid", issues: [importIssue("SCHEMA_INVALID", "", "El paquete no es JSON válido.", "Envía un objeto JSON sin referencias circulares.")] }; }
  if (typeof raw !== "string") return { status: "invalid", issues: [importIssue("SCHEMA_INVALID", "", "Falta el paquete.", "Envía un objeto RoutePackage.")] };
  if (Buffer.byteLength(raw, "utf8") > MAX_ROUTE_IMPORT_BYTES) return { status: "too_large" };
  let value: unknown;
  try { value = typeof input === "string" ? JSON.parse(raw) : input; }
  catch { return { status: "invalid", issues: [importIssue("SCHEMA_INVALID", "", "El paquete no es JSON válido.", "Corrige la sintaxis JSON.")] }; }
  const executablePath = executableField(value);
  if (executablePath !== null) return { status: "invalid", issues: [importIssue("SCHEMA_INVALID", executablePath,
    "El paquete contiene marcado o código ejecutable.", "Elimina el código o conviértelo en texto plano sin marcado activo.")] };
  const validation = validateRoutePackage(value);
  const parsed = RoutePackageSchema.safeParse(value);
  if (!validation.valid || !parsed.success) return { status: "invalid", issues: validation.issues };
  return { status: "success", definition: parsed.data, issues: validation.issues };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new TypeError("Invalid JSON value");
  return encoded;
}

export function hashImportBindings(bindings: unknown): string {
  return createHash("sha256").update(canonicalJson(bindings), "utf8").digest("hex");
}

export type RouteImportDiff = { path: string; before: unknown; after: unknown };

export function diffRoutePackages(before: RoutePackage | null, after: RoutePackage): RouteImportDiff[] {
  const diff: RouteImportDiff[] = [];
  const compare = (path: string, previous: unknown, next: unknown) => {
    if (canonicalJson(previous ?? null) !== canonicalJson(next ?? null)) diff.push({ path, before: previous ?? null, after: next ?? null });
  };
  for (const field of ["slug", "title", "summary", "topicLabel", "audience", "discipline", "coverKey"] as const) {
    compare(`/route/${field}`, before?.route[field], after.route[field]);
  }
  for (const collection of ["sources", "assets", "objectives", "units", "activities", "assessments"] as const) {
    const previous = new Map(before?.[collection].map((item) => [item.key, item]));
    const next = new Map(after[collection].map((item) => [item.key, item]));
    for (const key of new Set([...previous.keys(), ...next.keys()])) compare(`/${collection}/${key}`, previous.get(key), next.get(key));
    compare(`/${collection}/@order`, before?.[collection].map((item) => item.key), after[collection].map((item) => item.key));
  }
  for (const field of ["schemaVersion", "packageKey", "revision", "locale", "policyVersion", "reviewPlan", "editorial"] as const) {
    compare(`/${field}`, before?.[field], after[field]);
  }
  return diff;
}
