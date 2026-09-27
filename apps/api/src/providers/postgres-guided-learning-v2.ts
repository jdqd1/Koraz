import { sql, type Insertable, type Selectable, type Transaction } from "kysely";
import {
  RoutePackageSchema,
  validateRoutePackage,
  V2BoundRouteDefinitionSchema,
  V2BindingsSchema,
  V2IssueSchema,
  V2PolicySnapshotSchema,
  type RoutePackage,
  type RouteValidationIssue,
  type V2BoundRouteDefinition,
} from "@cediah/contracts";
import type {
  CediahDatabase,
  DatabaseClient,
  JsonValue,
  LearningPathTable,
  LearningPathVersionTable,
  LearningV2BindingTable,
} from "../db/database.js";
import {
  guidedV2PolicySnapshot,
  prepareGuidedV2Draft,
  type GuidedV2Bindings,
  type PreparedGuidedV2Draft,
} from "../guided-learning/v2/service.js";
import { hashRoutePackage } from "../guided-learning/v2/validation.js";
import { validateBoundRoutePackage } from "../guided-learning/v2/validation.js";
import { canTransitionLearningPath } from "../guided-learning/service.js";
import { hashLearningSnapshot } from "../guided-learning/snapshot-hash.js";
import {
  ROUTE_IMPORT_TTL_MS, diffRoutePackages, hashImportBindings, importIssue, parseRouteImport,
  type RouteImportDiff,
} from "../guided-learning/v2/import.js";

type Tx = Transaction<CediahDatabase>;
type Path = Selectable<LearningPathTable>;
type Version = Selectable<LearningPathVersionTable>;
type Binding = Selectable<LearningV2BindingTable>;

export type GuidedV2StorageResult<T> =
  | { status: "success"; value: T }
  | { status: "invalid"; issues: RouteValidationIssue[] }
  | { status: "forbidden" | "not_found" | "conflict" | "version_conflict" };

export type GuidedV2ImportResult =
  | { status: "success"; value: {
    importId: string; hash: string; expiresAt: string; issues: RouteValidationIssue[];
    diff: RouteImportDiff[]; readyToImport: boolean;
  } }
  | { status: "invalid"; issues: RouteValidationIssue[] }
  | { status: "forbidden" | "not_found" | "conflict" | "version_conflict" | "too_large" | "rate_limited" };

export type GuidedV2DraftReceipt = { pathId: string; pathVersionId: string; editVersion: number; status: "draft" };

async function storedImportReceipt(transaction: Tx, importId: string, pathId: string | null, versionId: string | null): Promise<GuidedV2DraftReceipt | null> {
  if (!pathId || !versionId) return null;
  const row = await transaction.selectFrom("audit_log").select("metadata")
    .where("action", "=", "learning_path_v2_imported")
    .where("target_id", "=", pathId)
    .where(sql<boolean>`metadata->>'importId' = ${importId}`)
    .orderBy("occurred_at", "desc").executeTakeFirst();
  const metadata = row?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)
    || metadata.versionId !== versionId || typeof metadata.editVersion !== "number") return null;
  return { pathId, pathVersionId: versionId, editVersion: metadata.editVersion, status: "draft" };
}

type EditorIdentity = { actorUserId: string; canEdit: boolean; canEditAll: boolean };

function sqlConflict(error: unknown): boolean {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  return code === "23503" || code === "23505" || code === "23514" || code === "P0001";
}

async function latestVersion(transaction: Tx, pathId: string): Promise<Version | undefined> {
  return transaction.selectFrom("learning_path_versions").selectAll()
    .where("path_id", "=", pathId).orderBy("version_number", "desc")
    .forUpdate().executeTakeFirst();
}

function bindingRow(pathVersionId: string, key: string, kind: Binding["kind"]): Insertable<LearningV2BindingTable> {
  return {
    path_version_id: pathVersionId,
    local_key: key,
    kind,
    topic_content_id: null,
    source_content_id: null,
    resource_revision_id: null,
    asset_id: null,
    document_sha256: null,
    asset_sha256: null,
    rights_status: null,
    rights_credit: null,
  };
}

async function insertBindings(transaction: Tx, pathVersionId: string, prepared: PreparedGuidedV2Draft): Promise<void> {
  const rows: Insertable<LearningV2BindingTable>[] = [{
    ...bindingRow(pathVersionId, "topic", "topic"),
    topic_content_id: prepared.bindings.topicContentId,
  }];
  const sources = new Map(prepared.definition.sources.map((source) => [source.key, source]));
  for (const source of prepared.bindings.sources) {
    rows.push({
      ...bindingRow(pathVersionId, source.key, "source"),
      source_content_id: source.sourceContentId,
      resource_revision_id: source.resourceRevisionId,
      document_sha256: sources.get(source.key)!.documentSha256,
    });
  }
  const assets = new Map(prepared.definition.assets.map((asset) => [asset.key, asset]));
  for (const asset of prepared.bindings.assets) {
    const definition = assets.get(asset.key)!;
    rows.push({
      ...bindingRow(pathVersionId, asset.key, "asset"),
      asset_id: asset.assetId,
      asset_sha256: definition.sha256,
      rights_status: definition.rightsStatus,
      rights_credit: definition.credit,
    });
  }
  await transaction.insertInto("learning_v2_bindings").values(rows).execute();
}

async function validateImportCatalog(
  transaction: Tx, definition: RoutePackage, bindings: GuidedV2Bindings,
  actorUserId: string, canEditAll: boolean,
): Promise<RouteValidationIssue[]> {
  const blockers: RouteValidationIssue[] = [];
  const topic = await transaction.selectFrom("content_items").selectAll()
    .where("id", "=", bindings.topicContentId).forShare().executeTakeFirst();
  if (!topic || topic.kind !== "topic" || (topic.status !== "published" && topic.author_user_id !== actorUserId && !canEditAll)) blockers.push(
    importIssue("SOURCE_UNRESOLVED", "/bindings/topicContentId", "El tema no está disponible para este editor.", "Selecciona un tema autorizado del catálogo."),
  );
  const sourceBindings = new Map(bindings.sources.map((item) => [item.key, item]));
  for (const [index, source] of definition.sources.entries()) {
    const binding = sourceBindings.get(source.key);
    if (!binding && source.kind === "reference" && source.url && source.verification === "verified") continue;
    if (!binding?.sourceContentId || !binding.resourceRevisionId) {
      blockers.push(importIssue("SOURCE_UNRESOLVED", `/sources/${index}`, `Falta vincular la fuente ${source.key} a una revisión de guía.`, "Selecciona una guía y revisión explícitas."));
      continue;
    }
    const revision = await transaction.selectFrom("learning_resource_revisions")
      .innerJoin("learning_resources", "learning_resources.id", "learning_resource_revisions.resource_id")
      .innerJoin("content_items", "content_items.id", "learning_resources.source_content_id")
      .select([
        "learning_resource_revisions.payload_hash", "learning_resource_revisions.payload_json",
        "learning_resource_revisions.source_version", "learning_resources.projection",
        "learning_resources.retired_at", "learning_resources.source_content_id",
        "content_items.kind", "content_items.status", "content_items.author_user_id",
        "content_items.version", "content_items.catalog_visibility",
      ]).where("learning_resource_revisions.id", "=", binding.resourceRevisionId).forShare().executeTakeFirst();
    if (!revision || revision.source_content_id !== binding.sourceContentId || revision.projection !== "guide"
      || revision.retired_at || !["guide", "video"].includes(revision.kind)
      || (revision.status !== "published" && revision.author_user_id !== actorUserId && !canEditAll)
      || (revision.catalog_visibility !== "catalog" && revision.author_user_id !== actorUserId && !canEditAll)) {
      blockers.push(importIssue("SOURCE_UNRESOLVED", `/sources/${index}`, `La guía ${source.key} no coincide con el binding o no es accesible.`, "Elige la guía y revisión autorizadas por ID."));
      continue;
    }
    if (revision.source_version !== revision.version || hashLearningSnapshot(revision.payload_json) !== revision.payload_hash
      || revision.payload_hash.toLowerCase() !== source.documentSha256.toLowerCase()) blockers.push(
      importIssue("SOURCE_CHANGED", `/sources/${index}/documentSha256`, `El hash de la guía ${source.key} no coincide con la revisión vigente.`, "Actualiza el paquete desde la revisión actual y repite el dry-run."),
    );
  }
  for (const [index, asset] of definition.assets.entries()) {
    const binding = bindings.assets.find((item) => item.key === asset.key);
    if (!binding) {
      blockers.push(importIssue("ASSET_REQUIRED", `/assets/${index}`, `Falta el binding del asset ${asset.key}.`, "Selecciona un asset del catálogo."));
      continue;
    }
    const row = await transaction.selectFrom("content_assets")
      .innerJoin("content_items", "content_items.id", "content_assets.content_item_id")
      .select(["content_assets.status as asset_status", "content_assets.owner_user_id", "content_assets.kind", "content_assets.original_file_name",
        "content_items.author_user_id", "content_items.status as content_status", "content_items.catalog_visibility"])
      .where("content_assets.id", "=", binding.assetId).forShare().executeTakeFirst();
    if (!row || row.asset_status !== "ready" || row.kind !== asset.mediaType || row.original_file_name !== asset.originalFileName
      || (row.owner_user_id !== actorUserId && row.content_status !== "published" && !canEditAll)
      || (row.catalog_visibility !== "catalog" && row.owner_user_id !== actorUserId && !canEditAll)) {
      blockers.push(importIssue("ASSET_REQUIRED", `/assets/${index}`, `El asset ${asset.key} no está disponible para este editor.`, "Selecciona un asset accesible y listo."));
      continue;
    }
    if (asset.rightsStatus !== "owned" || row.owner_user_id !== actorUserId) blockers.push(
      importIssue("ASSET_RIGHTS", `/assets/${index}/rightsStatus`, `No hay prueba de derechos para el asset ${asset.key}.`, "Confirma los derechos del archivo con su propietario antes de importar."),
    );
    if (asset.sha256) blockers.push(importIssue("VALIDATION_PENDING", `/assets/${index}/sha256`,
      `El catálogo no conserva un digest verificable del archivo ${asset.key}.`, "Aporta una comprobación de hash del archivo en el catálogo antes del commit."));
  }
  return blockers;
}

async function boundDefinition(transaction: Tx, path: Path, version: Version): Promise<V2BoundRouteDefinition> {
  const definition = RoutePackageSchema.parse(version.definition_v2_json);
  const rows = await transaction.selectFrom("learning_v2_bindings").selectAll()
    .where("path_version_id", "=", version.id).execute();
  const byKindAndKey = new Map(rows.map((row) => [`${row.kind}:${row.local_key}`, row]));
  const topic = byKindAndKey.get("topic:topic");
  if (!topic?.topic_content_id || topic.topic_content_id !== path.topic_content_id) {
    throw new Error("Missing or inconsistent v2 topic binding");
  }
  const bindings: GuidedV2Bindings = {
    topicContentId: topic.topic_content_id,
    sources: definition.sources.flatMap((source) => {
      const row = byKindAndKey.get(`source:${source.key}`);
      return row ? [{
        key: source.key,
        sourceContentId: row.source_content_id,
        resourceRevisionId: row.resource_revision_id,
      }] : [];
    }),
    assets: definition.assets.flatMap((asset) => {
      const row = byKindAndKey.get(`asset:${asset.key}`);
      return row?.asset_id ? [{ key: asset.key, assetId: row.asset_id }] : [];
    }),
  };
  const contentHash = hashRoutePackage(definition);
  const approval = version.status === "approved" || version.status === "published"
    ? await transaction.selectFrom("audit_log").select(["actor_user_id", "metadata"])
      .where("action", "=", "learning_path_v2_approved")
      .where("target_id", "=", path.id)
      .where(sql<boolean>`metadata->>'versionId' = ${version.id}`)
      .orderBy("occurred_at", "desc").executeTakeFirst()
    : undefined;
  const approvedHash = approval?.metadata && typeof approval.metadata === "object" && !Array.isArray(approval.metadata)
    && approval.metadata.contentHash === contentHash ? contentHash : null;
  return V2BoundRouteDefinitionSchema.parse({
    engineVersion: "guided-v2",
    pathId: path.id,
    pathVersionId: version.id,
    editVersion: version.edit_version,
    status: version.status,
    contentHash,
    bindings,
    definition,
    policyVersion: version.policy_version,
    schedulerVersion: "scheduler-v2.0",
    policySnapshot: V2PolicySnapshotSchema.parse(version.policy_json),
    reviewedContentHash: approvedHash,
    approvedBy: approvedHash ? approval?.actor_user_id : null,
  });
}

async function publicationIssues(transaction: Tx, route: V2BoundRouteDefinition, actorUserId: string, canEditAll: boolean, canPublish: boolean) {
  const catalog = await validateImportCatalog(transaction, route.definition, route.bindings, actorUserId, canEditAll);
  const bound = validateBoundRoutePackage(route.definition, route.bindings, {
    actorCanPublish: canPublish,
    topicAvailable: !catalog.some((issue) => issue.path === "/bindings/topicContentId"),
    contentHash: route.contentHash,
    reviewedContentHash: route.reviewedContentHash,
    reviewActorId: route.approvedBy,
    sources: route.definition.sources.flatMap((source) => {
      const binding = route.bindings.sources.find((item) => item.key === source.key);
      return binding?.sourceContentId && binding.resourceRevisionId ? [{
        key: source.key, sourceContentId: binding.sourceContentId, resourceRevisionId: binding.resourceRevisionId,
        documentSha256: source.documentSha256, available: true,
      }] : [];
    }),
    assets: route.definition.assets.flatMap((asset) => {
      const binding = route.bindings.assets.find((item) => item.key === asset.key);
      return binding ? [{ key: asset.key, assetId: binding.assetId, sha256: asset.sha256,
        rightsStatus: asset.rightsStatus, available: true }] : [];
    }),
  });
  return [...bound.issues, ...catalog];
}

export function createPostgresGuidedLearningV2Provider(database: DatabaseClient, options: { now?: () => Date } = {}) {
  return {
    async validateImport(input: {
      actorUserId: string; canCreate: boolean; canEditAll: boolean; idempotencyKey: string;
      package: unknown; bindings: unknown; targetPathId: string | null; expectedVersion: number | null;
    }): Promise<GuidedV2ImportResult> {
      if (!input.canCreate) return { status: "forbidden" };
      const parsed = parseRouteImport(input.package);
      if (parsed.status !== "success") return parsed;
      const bindings = V2BindingsSchema.safeParse(input.bindings);
      const prepared = prepareGuidedV2Draft(parsed.definition, input.bindings);
      if (!bindings.success || prepared.status !== "success") return {
        status: "invalid", issues: prepared.status === "invalid" ? prepared.issues : [
          importIssue("SCHEMA_INVALID", "/bindings", "Bindings inválidos.", "Corrige las claves e identificadores de catálogo."),
        ],
      };
      if ((input.targetPathId === null) !== (input.expectedVersion === null)) return {
        status: "invalid", issues: [importIssue("SCHEMA_INVALID", "/expectedVersion", "Destino y versión esperada deben enviarse juntos.", "Usa ambos campos para actualizar o ambos null para crear.")],
      };
      const now = options.now?.() ?? new Date();
      const hash = prepared.value.contentHash;
      const bindingsHash = hashImportBindings(bindings.data);
      try {
        return await database.transaction().execute(async (transaction) => {
          const actor = await transaction.selectFrom("auth_users").select("id")
            .where("id", "=", input.actorUserId).forUpdate().executeTakeFirst();
          if (!actor) return { status: "forbidden" as const };
          const existing = await transaction.selectFrom("learning_v2_imports").selectAll()
            .where("actor_user_id", "=", input.actorUserId)
            .where("idempotency_key", "=", input.idempotencyKey).executeTakeFirst();
          if (existing && (existing.content_hash !== hash || existing.bindings_hash !== bindingsHash
            || existing.target_path_id !== input.targetPathId || existing.expected_version !== input.expectedVersion
            || existing.expires_at <= now)) return { status: "conflict" as const };
          const recent = await transaction.selectFrom("learning_v2_imports")
            .select(sql<number>`count(*)::int`.as("count"))
            .where("actor_user_id", "=", input.actorUserId)
            .where("created_at", ">=", new Date(now.getTime() - 10 * 60 * 1000)).executeTakeFirstOrThrow();
          if (!existing && recent.count >= 10) return { status: "rate_limited" as const };

          let before: typeof parsed.definition | null = null;
          let targetVersionId: string | null = null;
          if (input.targetPathId) {
            const path = await transaction.selectFrom("learning_paths").selectAll()
              .where("id", "=", input.targetPathId).executeTakeFirst();
            if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" as const };
            const version = await transaction.selectFrom("learning_path_versions").selectAll()
              .where("path_id", "=", path.id).orderBy("version_number", "desc").executeTakeFirst();
            if (!version || version.policy_version !== "guided-v2.0") return { status: "not_found" as const };
            if (version.status !== "draft" && version.status !== "changes_requested") return { status: "conflict" as const };
            if (version.edit_version !== input.expectedVersion) return { status: "version_conflict" as const };
            before = RoutePackageSchema.parse(version.definition_v2_json);
            targetVersionId = version.id;
          }
          const diff = diffRoutePackages(before, parsed.definition);
          if (existing) return { status: "success" as const, value: {
            importId: existing.id, hash, expiresAt: existing.expires_at.toISOString(),
            issues: V2IssueSchema.array().parse(existing.issues_json), diff,
            readyToImport: !V2IssueSchema.array().parse(existing.issues_json).some((issue) =>
              ["SOURCE_UNRESOLVED", "SOURCE_CHANGED", "ASSET_REQUIRED", "ASSET_RIGHTS", "ACCESS_REVOKED", "VALIDATION_PENDING"].includes(issue.code)),
          } };

          const blockers = await validateImportCatalog(transaction, parsed.definition, bindings.data, input.actorUserId, input.canEditAll);
          const issues = [...parsed.issues, ...blockers];
          const expiresAt = new Date(now.getTime() + ROUTE_IMPORT_TTL_MS);
          const session = await transaction.insertInto("learning_v2_imports").values({
            actor_user_id: input.actorUserId, idempotency_key: input.idempotencyKey,
            package_key: parsed.definition.packageKey, revision: parsed.definition.revision,
            content_hash: hash, bindings_hash: bindingsHash,
            normalized_json: JSON.parse(prepared.value.canonicalJson) as JsonValue,
            bindings_json: bindings.data as JsonValue, issues_json: issues as JsonValue,
            target_path_id: input.targetPathId, target_version_id: targetVersionId,
            expected_version: input.expectedVersion, expires_at: expiresAt,
          }).returning("id").executeTakeFirstOrThrow();
          return { status: "success" as const, value: {
            importId: session.id, hash, expiresAt: expiresAt.toISOString(), issues, diff,
            readyToImport: blockers.length === 0,
          } };
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },
    async commitImport(input: {
      actorUserId: string; canCreate: boolean; canEditAll: boolean; importId: string;
      idempotencyKey: string; hash: string; expectedVersion: number | null;
    }): Promise<GuidedV2StorageResult<GuidedV2DraftReceipt>> {
      if (!input.canCreate) return { status: "forbidden" };
      const now = options.now?.() ?? new Date();
      try {
        return await database.transaction().execute(async (transaction) => {
          const actor = await transaction.selectFrom("auth_users").select("id")
            .where("id", "=", input.actorUserId).forUpdate().executeTakeFirst();
          if (!actor) return { status: "forbidden" as const };
          const session = await transaction.selectFrom("learning_v2_imports").selectAll()
            .where("id", "=", input.importId).forUpdate().executeTakeFirst();
          if (!session || session.actor_user_id !== input.actorUserId) return { status: "not_found" as const };
          const reusedKey = await transaction.selectFrom("audit_log").select("metadata")
            .where("action", "=", "learning_path_v2_imported")
            .where("actor_user_id", "=", input.actorUserId)
            .where(sql<boolean>`metadata->>'idempotencyKey' = ${input.idempotencyKey}`)
            .executeTakeFirst();
          if (reusedKey && (typeof reusedKey.metadata !== "object" || reusedKey.metadata === null
            || Array.isArray(reusedKey.metadata) || reusedKey.metadata.importId !== session.id)) return { status: "conflict" as const };
          if (session.content_hash !== input.hash || session.expected_version !== input.expectedVersion) return { status: "conflict" as const };
          if (session.state === "committed") {
            const receipt = await storedImportReceipt(transaction, session.id, session.committed_path_id, session.committed_version_id);
            return receipt ? { status: "success" as const, value: receipt } : { status: "conflict" as const };
          }
          if (session.state !== "validated") return { status: "conflict" as const };
          if (session.expires_at <= now) {
            await transaction.updateTable("learning_v2_imports").set({ state: "expired" })
              .where("id", "=", session.id).execute();
            return { status: "conflict" as const };
          }
          const parsed = parseRouteImport(session.normalized_json);
          const bindings = V2BindingsSchema.safeParse(session.bindings_json);
          const prepared = prepareGuidedV2Draft(session.normalized_json, session.bindings_json);
          if (parsed.status !== "success" || !bindings.success || prepared.status !== "success") return { status: "conflict" as const };
          if (prepared.value.contentHash !== session.content_hash || hashImportBindings(bindings.data) !== session.bindings_hash
            || parsed.definition.packageKey !== session.package_key || parsed.definition.revision !== session.revision) return { status: "conflict" as const };
          const blockers = await validateImportCatalog(transaction, parsed.definition, bindings.data, input.actorUserId, input.canEditAll);
          if (blockers.length > 0) return { status: "invalid" as const, issues: blockers };

          const priorQuery = transaction.selectFrom("learning_v2_imports").selectAll()
            .where("actor_user_id", "=", input.actorUserId)
            .where("package_key", "=", session.package_key)
            .where("revision", "=", session.revision)
            .where("state", "=", "committed")
            .where("target_path_id", session.target_path_id === null ? "is" : "=", session.target_path_id);
          const prior = await priorQuery.executeTakeFirst();
          if (prior && (prior.content_hash !== session.content_hash || prior.bindings_hash !== session.bindings_hash)) return { status: "conflict" as const };

          let path: Path;
          let version: Version;
          let priorReceipt: GuidedV2DraftReceipt | null = null;
          if (session.target_path_id) {
            const target = await transaction.selectFrom("learning_paths").selectAll()
              .where("id", "=", session.target_path_id).forUpdate().executeTakeFirst();
            if (!target || (!input.canEditAll && target.created_by !== input.actorUserId)) return { status: "not_found" as const };
            const current = await latestVersion(transaction, target.id);
            if (!current || current.id !== session.target_version_id || current.policy_version !== "guided-v2.0") return { status: "version_conflict" as const };
            if (current.status !== "draft" && current.status !== "changes_requested") return { status: "conflict" as const };
            if (current.edit_version !== session.expected_version) return { status: "version_conflict" as const };
            const previous = RoutePackageSchema.parse(current.definition_v2_json);
            if (previous.packageKey !== parsed.definition.packageKey || parsed.definition.revision < previous.revision) return { status: "conflict" as const };
            if (parsed.definition.revision > previous.revision
              && !diffRoutePackages(previous, parsed.definition).some((change) => change.path !== "/revision")) return { status: "conflict" as const };
            const currentHash = hashRoutePackage(previous);
            if (parsed.definition.revision === previous.revision && currentHash !== session.content_hash) return { status: "conflict" as const };
            if (currentHash === session.content_hash) {
              path = target;
              version = current;
            } else {
              const updated = await transaction.updateTable("learning_path_versions").set({
                edit_version: sql<number>`edit_version + 1`, definition_v2_json: JSON.parse(prepared.value.canonicalJson) as JsonValue,
                status: "draft",
              }).where("id", "=", current.id).where("edit_version", "=", session.expected_version!)
                .returningAll().executeTakeFirst();
              if (!updated) return { status: "version_conflict" as const };
              version = updated;
              const route = prepared.value.definition.route;
              path = await transaction.updateTable("learning_paths").set({
                topic_content_id: bindings.data.topicContentId, slug: route.slug, title: route.title,
                summary: route.summary, cover_asset_id: null, cover_key: route.coverKey,
              }).where("id", "=", target.id).returningAll().executeTakeFirstOrThrow();
              await transaction.deleteFrom("learning_v2_bindings").where("path_version_id", "=", version.id).execute();
              await insertBindings(transaction, version.id, prepared.value);
            }
          } else if (prior?.committed_path_id && prior.committed_version_id) {
            priorReceipt = await storedImportReceipt(transaction, prior.id, prior.committed_path_id, prior.committed_version_id);
            if (!priorReceipt) return { status: "conflict" as const };
            const priorPath = await transaction.selectFrom("learning_paths").selectAll()
              .where("id", "=", prior.committed_path_id).executeTakeFirst();
            const priorVersion = await transaction.selectFrom("learning_path_versions").selectAll()
              .where("id", "=", prior.committed_version_id).executeTakeFirst();
            if (!priorPath || !priorVersion) return { status: "conflict" as const };
            path = priorPath;
            version = priorVersion;
          } else {
            const route = prepared.value.definition.route;
            path = await transaction.insertInto("learning_paths").values({
              topic_content_id: bindings.data.topicContentId, slug: route.slug, title: route.title,
              summary: route.summary, cover_asset_id: null, cover_key: route.coverKey,
              created_by: input.actorUserId,
            }).returningAll().executeTakeFirstOrThrow();
            version = await transaction.insertInto("learning_path_versions").values({
              path_id: path.id, version_number: 1, policy_version: "guided-v2.0",
              policy_json: guidedV2PolicySnapshot as JsonValue,
              definition_v2_json: JSON.parse(prepared.value.canonicalJson) as JsonValue,
              release_notes: "",
            }).returningAll().executeTakeFirstOrThrow();
            await insertBindings(transaction, version.id, prepared.value);
          }
          await transaction.updateTable("learning_v2_imports").set({
            state: "committed", committed_path_id: path.id, committed_version_id: version.id,
          }).where("id", "=", session.id).execute();
          await transaction.insertInto("audit_log").values({
            action: "learning_path_v2_imported", actor_user_id: input.actorUserId,
            target_type: "learning_path", target_id: path.id,
            metadata: { importId: session.id, versionId: version.id, editVersion: priorReceipt?.editVersion ?? version.edit_version,
              contentHash: session.content_hash, idempotencyKey: input.idempotencyKey },
          }).execute();
          return { status: "success" as const, value: priorReceipt ?? {
            pathId: path.id, pathVersionId: version.id, editVersion: version.edit_version, status: "draft" as const,
          } };
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },
    async exportPath(input: EditorIdentity & { pathId: string }): Promise<GuidedV2StorageResult<{ package: RoutePackage; bindings: GuidedV2Bindings }>> {
      const read = await this.getEditorPath(input);
      if (read.status !== "success") return read;
      return { status: "success", value: { package: read.value.definition, bindings: read.value.bindings } };
    },
    async createDraft(input: {
      actorUserId: string;
      canCreate: boolean;
      package: unknown;
      bindings: unknown;
    }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canCreate) return { status: "forbidden" };
      const prepared = prepareGuidedV2Draft(input.package, input.bindings);
      if (prepared.status === "invalid") return prepared;
      try {
        return await database.transaction().execute(async (transaction) => {
          const topic = await transaction.selectFrom("content_items").select("id")
            .where("id", "=", prepared.value.bindings.topicContentId)
            .where("kind", "=", "topic").executeTakeFirst();
          if (!topic) return { status: "not_found" as const };
          const route = prepared.value.definition.route;
          const path = await transaction.insertInto("learning_paths").values({
            topic_content_id: topic.id,
            slug: route.slug,
            title: route.title,
            summary: route.summary,
            cover_asset_id: null,
            cover_key: route.coverKey,
            created_by: input.actorUserId,
          }).returningAll().executeTakeFirstOrThrow();
          const version = await transaction.insertInto("learning_path_versions").values({
            path_id: path.id,
            version_number: 1,
            policy_version: "guided-v2.0",
            policy_json: guidedV2PolicySnapshot as JsonValue,
            definition_v2_json: JSON.parse(prepared.value.canonicalJson) as JsonValue,
            release_notes: "",
          }).returningAll().executeTakeFirstOrThrow();
          await insertBindings(transaction, version.id, prepared.value);
          await transaction.insertInto("audit_log").values({
            action: "learning_path_v2_created",
            actor_user_id: input.actorUserId,
            target_type: "learning_path",
            target_id: path.id,
            metadata: { versionId: version.id, contentHash: prepared.value.contentHash },
          }).execute();
          return { status: "success" as const, value: await boundDefinition(transaction, path, version) };
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },

    async getEditorPath(input: EditorIdentity & { pathId: string }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canEdit) return { status: "forbidden" };
      return database.transaction().execute(async (transaction) => {
        const path = await transaction.selectFrom("learning_paths").selectAll()
          .where("id", "=", input.pathId).forShare().executeTakeFirst();
        if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" };
        const version = await transaction.selectFrom("learning_path_versions").selectAll()
          .where("path_id", "=", path.id).orderBy("version_number", "desc")
          .forShare().executeTakeFirst();
        if (!version || version.policy_version !== "guided-v2.0") return { status: "not_found" };
        return { status: "success", value: await boundDefinition(transaction, path, version) };
      });
    },

    async saveDraft(input: EditorIdentity & {
      pathId: string;
      expectedVersion: number;
      package: unknown;
      bindings: unknown;
    }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canEdit) return { status: "forbidden" };
      const prepared = prepareGuidedV2Draft(input.package, input.bindings);
      if (prepared.status === "invalid") return prepared;
      try {
        return await database.transaction().execute(async (transaction) => {
          const path = await transaction.selectFrom("learning_paths").selectAll()
            .where("id", "=", input.pathId).forUpdate().executeTakeFirst();
          if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" as const };
          const version = await latestVersion(transaction, path.id);
          if (!version || version.policy_version !== "guided-v2.0") return { status: "not_found" as const };
          if (version.status !== "draft" && version.status !== "changes_requested") return { status: "conflict" as const };
          if (version.edit_version !== input.expectedVersion) return { status: "version_conflict" as const };
          const topic = await transaction.selectFrom("content_items").select("id")
            .where("id", "=", prepared.value.bindings.topicContentId)
            .where("kind", "=", "topic").executeTakeFirst();
          if (!topic) return { status: "not_found" as const };
          const nextVersion = await transaction.updateTable("learning_path_versions").set({
            edit_version: sql<number>`edit_version + 1`,
            definition_v2_json: JSON.parse(prepared.value.canonicalJson) as JsonValue,
            status: "draft",
          }).where("id", "=", version.id).where("edit_version", "=", input.expectedVersion)
            .returningAll().executeTakeFirst();
          if (!nextVersion) return { status: "version_conflict" as const };
          const route = prepared.value.definition.route;
          const nextPath = await transaction.updateTable("learning_paths").set({
            topic_content_id: topic.id,
            slug: route.slug,
            title: route.title,
            summary: route.summary,
            cover_asset_id: null,
            cover_key: route.coverKey,
          }).where("id", "=", path.id).returningAll().executeTakeFirstOrThrow();
          await transaction.deleteFrom("learning_v2_bindings")
            .where("path_version_id", "=", version.id).execute();
          await insertBindings(transaction, version.id, prepared.value);
          await transaction.insertInto("audit_log").values({
            action: "learning_path_v2_updated",
            actor_user_id: input.actorUserId,
            target_type: "learning_path",
            target_id: path.id,
            metadata: { versionId: version.id, editVersion: nextVersion.edit_version, contentHash: prepared.value.contentHash },
          }).execute();
          return { status: "success" as const, value: await boundDefinition(transaction, nextPath, nextVersion) };
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },

    async validatePath(input: EditorIdentity & { pathId: string; expectedVersion: number; canPublish: boolean }) {
      if (!input.canEdit) return { status: "forbidden" as const };
      return database.transaction().execute(async (transaction) => {
        const path = await transaction.selectFrom("learning_paths").selectAll()
          .where("id", "=", input.pathId).forShare().executeTakeFirst();
        if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" as const };
        const version = await transaction.selectFrom("learning_path_versions").selectAll()
          .where("path_id", "=", path.id).orderBy("version_number", "desc").forShare().executeTakeFirst();
        if (!version || version.policy_version !== "guided-v2.0") return { status: "not_found" as const };
        if (version.edit_version !== input.expectedVersion) return { status: "version_conflict" as const };
        const route = await boundDefinition(transaction, path, version);
        const issues = await publicationIssues(transaction, route, input.actorUserId, input.canEditAll, input.canPublish);
        return { status: "success" as const, value: {
          issues, validatedEditVersion: version.edit_version,
          ready: !issues.some((issue) => issue.severity === "error"),
        } };
      });
    },

    async transitionPath(input: EditorIdentity & {
      pathId: string; expectedVersion: number; status: "in_review" | "changes_requested" | "approved" | "published" | "archived";
      canReview: boolean; canPublish: boolean; reviewNote: string | null;
    }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canEdit) return { status: "forbidden" };
      try {
        return await database.transaction().execute(async (transaction) => {
          const path = await transaction.selectFrom("learning_paths").selectAll()
            .where("id", "=", input.pathId).forUpdate().executeTakeFirst();
          if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" as const };
          const version = await latestVersion(transaction, path.id);
          if (!version || version.policy_version !== "guided-v2.0") return { status: "not_found" as const };
          if (version.edit_version !== input.expectedVersion) return { status: "version_conflict" as const };
          if (path.archived_at) return { status: "conflict" as const };
          if (!canTransitionLearningPath({
            actorUserId: input.actorUserId, canPublish: input.canPublish, canReview: input.canReview,
            createdBy: path.created_by, currentStatus: version.status,
            hasPublishedVersion: Boolean(path.published_version_id), targetStatus: input.status,
          })) return { status: "forbidden" as const };
          if (input.status === "archived") {
            const archived = await transaction.updateTable("learning_paths").set({ archived_at: options.now?.() ?? new Date() })
              .where("id", "=", path.id).returningAll().executeTakeFirstOrThrow();
            await transaction.insertInto("audit_log").values({
              action: "learning_path_v2_archived", actor_user_id: input.actorUserId,
              target_type: "learning_path", target_id: path.id,
              metadata: { versionId: version.id, reviewNote: input.reviewNote },
            }).execute();
            return { status: "success" as const, value: await boundDefinition(transaction, archived, version) };
          }
          const route = await boundDefinition(transaction, path, version);
          if (input.status === "in_review" || input.status === "approved") {
            const issues = [...validateRoutePackage(route.definition).issues,
              ...await validateImportCatalog(transaction, route.definition, route.bindings, input.actorUserId, input.canEditAll)];
            if (issues.some((issue) => issue.severity === "error")) return { status: "invalid" as const, issues };
          }
          if (input.status === "published") {
            const issues = await publicationIssues(transaction, route, input.actorUserId, input.canEditAll, input.canPublish);
            if (issues.some((issue) => issue.severity === "error")) return { status: "invalid" as const, issues };
          }
          const now = options.now?.() ?? new Date();
          const nextVersion = await transaction.updateTable("learning_path_versions").set({
            edit_version: version.edit_version + 1, status: input.status,
            published_at: input.status === "published" ? now : version.published_at,
            published_by: input.status === "published" ? input.actorUserId : version.published_by,
          }).where("id", "=", version.id).where("edit_version", "=", input.expectedVersion)
            .returningAll().executeTakeFirst();
          if (!nextVersion) return { status: "version_conflict" as const };
          const nextPath = input.status === "published"
            ? await transaction.updateTable("learning_paths").set({ published_version_id: version.id })
              .where("id", "=", path.id).returningAll().executeTakeFirstOrThrow()
            : path;
          await transaction.insertInto("audit_log").values({
            action: `learning_path_v2_${input.status}`, actor_user_id: input.actorUserId,
            target_type: "learning_path", target_id: path.id,
            metadata: { versionId: version.id, editVersion: nextVersion.edit_version,
              contentHash: route.contentHash, reviewNote: input.reviewNote },
          }).execute();
          return { status: "success" as const, value: await boundDefinition(transaction, nextPath, nextVersion) };
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },

    async createVersion(input: EditorIdentity & { pathId: string; expectedVersion: number; releaseNotes: string | null }): Promise<GuidedV2StorageResult<GuidedV2DraftReceipt>> {
      if (!input.canEdit) return { status: "forbidden" };
      try {
        return await database.transaction().execute(async (transaction) => {
          const path = await transaction.selectFrom("learning_paths").selectAll()
            .where("id", "=", input.pathId).forUpdate().executeTakeFirst();
          if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" as const };
          const source = await latestVersion(transaction, path.id);
          if (!source || source.policy_version !== "guided-v2.0") return { status: "not_found" as const };
          if (source.edit_version !== input.expectedVersion) return { status: "version_conflict" as const };
          if (source.status !== "published" || path.archived_at || path.published_version_id !== source.id) return { status: "conflict" as const };
          const created = await transaction.insertInto("learning_path_versions").values({
            path_id: path.id, version_number: source.version_number + 1, policy_version: source.policy_version,
            policy_json: source.policy_json, definition_v2_json: source.definition_v2_json,
            release_notes: input.releaseNotes ?? "",
          }).returningAll().executeTakeFirstOrThrow();
          const bindings = await transaction.selectFrom("learning_v2_bindings").selectAll()
            .where("path_version_id", "=", source.id).execute();
          if (bindings.length) await transaction.insertInto("learning_v2_bindings").values(bindings.map((binding) => ({
            path_version_id: created.id, local_key: binding.local_key, kind: binding.kind,
            topic_content_id: binding.topic_content_id, source_content_id: binding.source_content_id,
            resource_revision_id: binding.resource_revision_id, asset_id: binding.asset_id,
            document_sha256: binding.document_sha256, asset_sha256: binding.asset_sha256,
            rights_status: binding.rights_status, rights_credit: binding.rights_credit,
          }))).execute();
          await transaction.insertInto("audit_log").values({
            action: "learning_path_v2_version_created", actor_user_id: input.actorUserId,
            target_type: "learning_path", target_id: path.id,
            metadata: { sourceVersionId: source.id, versionId: created.id, releaseNotes: input.releaseNotes },
          }).execute();
          return { status: "success" as const, value: {
            pathId: path.id, pathVersionId: created.id, editVersion: created.edit_version, status: "draft" as const,
          } };
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },
  };
}

