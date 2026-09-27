import { createHash } from "node:crypto";
import {
  RoutePackageSchema,
  V2BindingsSchema,
  validateRoutePackage,
  type RoutePackage,
  type RouteValidationIssue,
  type RouteValidationResult,
} from "@cediah/contracts";

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  const primitive = JSON.stringify(value);
  if (primitive === undefined) throw new TypeError("El paquete contiene un valor no JSON");
  return primitive;
}

export function hashRoutePackage(pkg: RoutePackage): string {
  return createHash("sha256").update(canonicalJson(pkg)).digest("hex");
}

export type BoundSource = {
  key: string;
  sourceContentId: string;
  resourceRevisionId: string;
  documentSha256: string;
  available: boolean;
};
export type BoundAsset = {
  key: string;
  assetId: string;
  sha256: string | null;
  rightsStatus: "owned" | "licensed" | "public_domain" | "unverified";
  available: boolean;
};
export type BoundValidationContext = {
  actorCanPublish: boolean;
  topicAvailable: boolean;
  contentHash: string;
  reviewedContentHash: string | null;
  reviewActorId: string | null;
  sources: BoundSource[];
  assets: BoundAsset[];
};

/** Inputs in context must come from the authorized server/catalog transaction. */
export function validateBoundRoutePackage(pkgInput: unknown, bindingsInput: unknown, context: BoundValidationContext): RouteValidationResult {
  const portable = validateRoutePackage(pkgInput);
  const pkg = RoutePackageSchema.safeParse(pkgInput);
  const bindings = V2BindingsSchema.safeParse(bindingsInput);
  const issues: RouteValidationIssue[] = [...portable.issues];
  const add = (code: string, path: string, message: string, suggestedFix: string) => issues.push({ code, severity: "error", path, message, suggestedFix });
  if (!bindings.success) {
    for (const issue of bindings.error.issues) add("SCHEMA_INVALID", `/bindings/${issue.path.join("/")}`, `Binding inválido: ${issue.message}`, "Corrige el binding según el contrato v2.");
  }
  if (!pkg.success || !bindings.success) return { scope: "bound", valid: false, publishable: false, issues };
  if (!context.actorCanPublish) add("ACCESS_REVOKED", "", "El actor no puede publicar esta ruta.", "Revalida permisos y titularidad en servidor.");
  if (!context.topicAvailable) add("SOURCE_UNRESOLVED", "/bindings/topicContentId", "El tema vinculado no está disponible.", "Selecciona un tema accesible del catálogo.");
  const actualHash = hashRoutePackage(pkg.data);
  if (context.contentHash !== actualHash)
    add("SOURCE_CHANGED", "", "El hash de la ruta cambió desde la validación anterior.", "Revalida el paquete exacto y sus bindings.");
  if (!context.reviewActorId || context.reviewedContentHash !== actualHash)
    add("REVIEW_STALE", "", "La revisión editorial no cubre el hash actual.", "Solicita revisión del borrador exacto después de los cambios.");

  const sourceBindings = new Map(bindings.data.sources.map((source) => [source.key, source]));
  const catalogSources = new Map(context.sources.map((source) => [source.key, source]));
  for (const [i, source] of pkg.data.sources.entries()) {
    const binding = sourceBindings.get(source.key);
    const catalog = catalogSources.get(source.key);
    if (source.kind === "reference" && source.url && source.verification === "verified" && !binding) continue;
    if (!binding || !binding.sourceContentId || !binding.resourceRevisionId || !catalog || !catalog.available)
      add("SOURCE_UNRESOLVED", `/sources/${i}`, `La fuente ${source.key} no está vinculada a una revisión disponible.`, "Resuelve la guía y su revisión de catálogo antes de publicar.");
    else if (catalog.sourceContentId !== binding.sourceContentId || catalog.resourceRevisionId !== binding.resourceRevisionId || catalog.documentSha256.toLowerCase() !== source.documentSha256.toLowerCase())
      add("SOURCE_CHANGED", `/sources/${i}/documentSha256`, `La fuente ${source.key} cambió después de validar.`, "Revalida el fragmento y actualiza el binding.");
  }
  const assetBindings = new Map(bindings.data.assets.map((asset) => [asset.key, asset]));
  const catalogAssets = new Map(context.assets.map((asset) => [asset.key, asset]));
  for (const [i, asset] of pkg.data.assets.entries()) {
    const binding = assetBindings.get(asset.key);
    const catalog = catalogAssets.get(asset.key);
    if (!binding || !catalog || !catalog.available || binding.assetId !== catalog.assetId)
      add("ASSET_REQUIRED", `/assets/${i}`, `El asset ${asset.key} no está disponible.`, "Vincula un asset accesible y revisado.");
    else {
      if (catalog.rightsStatus === "unverified" || catalog.rightsStatus !== asset.rightsStatus)
        add("ASSET_RIGHTS", `/assets/${i}/rightsStatus`, `Derechos de ${asset.key} sin verificar o distintos a los del catálogo.`, "Confirma la licencia en el catálogo y actualiza el paquete.");
      if (asset.sha256 && catalog.sha256?.toLowerCase() !== asset.sha256.toLowerCase())
        add("SOURCE_CHANGED", `/assets/${i}/sha256`, `El asset ${asset.key} cambió después de validar.`, "Actualiza el hash y revisa la nueva versión.");
    }
  }
  const sourceKeys = new Set(pkg.data.sources.map((source) => source.key));
  for (const [i, source] of bindings.data.sources.entries()) if (!sourceKeys.has(source.key))
    add("REFERENCE_MISSING", `/bindings/sources/${i}/key`, `Binding de fuente sobrante: ${source.key}.`, "Elimina el binding ajeno al paquete.");
  const assetKeys = new Set(pkg.data.assets.map((asset) => asset.key));
  for (const [i, asset] of bindings.data.assets.entries()) if (!assetKeys.has(asset.key))
    add("REFERENCE_MISSING", `/bindings/assets/${i}/key`, `Binding de asset sobrante: ${asset.key}.`, "Elimina el binding ajeno al paquete.");
  return { scope: "bound", valid: portable.valid, publishable: portable.publishable && !issues.some((issue) => issue.severity === "error"), issues };
}
