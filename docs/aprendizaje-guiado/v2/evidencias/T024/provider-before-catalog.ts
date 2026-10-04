import { randomUUID } from "node:crypto";
import { sql, type Insertable, type Selectable, type Transaction } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/node_modules/.pnpm/kysely@0.29.5/node_modules/kysely/dist/index.js";
import {
  RoutePackageSchema,
  validateRoutePackage,
  V2BoundRouteDefinitionSchema,
  V2BindingsSchema,
  V2IssueSchema,
  V2PolicySnapshotSchema,
  V2AnswerSchema,
  toV2PublicActivity,
  V2HeartbeatSchema,
  type RoutePackage,
  type RouteActivity,
  type RouteValidationIssue,
  type V2AttemptManifest,
  type V2BoundRouteDefinition,
} from "D:/Jose (Datos)/Medicina/CEDIAH/Web/packages/contracts/dist/public.js";
import type {
  CediahDatabase,
  DatabaseClient,
  JsonValue,
  LearningPathTable,
  LearningPathVersionTable,
  LearningV2BindingTable,
} from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/db/database.js";
import {
  guidedV2PolicySnapshot,
  prepareGuidedV2Draft,
  type GuidedV2Bindings,
  type PreparedGuidedV2Draft,
  guidedV2ItemRevisionHash,
  initialGuidedV2AttemptResume,
  parseGuidedV2AttemptResume,
  parseGuidedV2AttemptSnapshot,
  prepareGuidedV2AttemptSnapshot,
  type GuidedV2AttemptResume,
  type GuidedV2AttemptSnapshot,
  type GuidedV2AttemptTarget,
} from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/service.js";
import { guidedV2AttemptManifest } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/manifests.js";
import { awardObjectiveV2 } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/rewards.js";
import { calculateMetricsV2, heartbeatIntervalV2, type MetricLearnerV2, type MetricAssessmentV2, type MetricHeartbeatV2 } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/metrics.js";
import { rebuildGuidedV2Evidence, type GuidedV2EvidenceEvent, type GuidedV2EvidenceState } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/evidence.js";
import { scheduleReviewV2, type ReviewResponseV2, type ReviewStateV2 } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/scheduler.js";
import { gradeBasicActivity, type BasicGradingResult } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/grading.js";
import { hashRoutePackage } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/validation.js";
import { validateBoundRoutePackage } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/validation.js";
import { canTransitionLearningPath } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/service.js";
import { hashLearningSnapshot } from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/snapshot-hash.js";
import {
  ROUTE_IMPORT_TTL_MS, diffRoutePackages, hashImportBindings, importIssue, parseRouteImport,
  type RouteImportDiff,
} from "D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/import.js";

type Tx = Transaction<CediahDatabase>;
type Path = Selectable<LearningPathTable>;
type Version = Selectable<LearningPathVersionTable>;
type Binding = Selectable<LearningV2BindingTable>;

function v2Audit(transaction: Tx) {
  return transaction.withTables<{ guided_v2_audit: CediahDatabase["audit_log"] }>().withSchema("private");
}

/** Narrow definer function preserves the original actor row lock without identity writes. */
export async function v2LockActor(transaction: Tx, userId: string) {
  const result = await sql<{ id: string | null }>`select private.lock_guided_v2_actor(${userId}::uuid) as id`.execute(transaction);
  const id = result.rows[0]?.id;
  return id ? { id } : undefined;
}

async function v2LockCatalog(transaction: Tx, kind: "topic" | "source" | "asset", id: string) {
  await sql`select private.lock_guided_v2_catalog(${kind}::text, ${id}::uuid)`.execute(transaction);
}


async function v2MetricEvent(transaction: Tx, input: {
  userId: string; enrollmentId: string; pathVersionId: string; kind: string; semanticKey: string; at: Date;
  interval?: { start: string; end: string };
  objective?: { objectiveKey: string; dueAt: string };
}) {
  await transaction.insertInto("learning_events").values({ user_id: input.userId,
    enrollment_id: input.enrollmentId, attempt_id: null, event_type: input.kind, semantic_key: input.semanticKey,
    payload_json: { pathVersionId: input.pathVersionId, ...(input.interval ?? {}), ...(input.objective ?? {}) },
    policy_version: "guided-v2.0", occurred_at: input.at,
  }).onConflict((conflict) => conflict.columns(["user_id", "semantic_key"]).doNothing()).execute();
}

export type GuidedV2StorageResult<T> =
  | { status: "success"; value: T }
  | { status: "invalid"; issues: RouteValidationIssue[] }
  | { status: "forbidden" | "not_found" | "conflict" | "version_conflict" | "rate_limited" };

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
  const row = await v2Audit(transaction).selectFrom("guided_v2_audit").select("metadata")
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
  await v2LockCatalog(transaction, "topic", bindings.topicContentId);
  const topic = await transaction.selectFrom("content_items").selectAll()
    .where("id", "=", bindings.topicContentId).executeTakeFirst();
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
    await v2LockCatalog(transaction, "source", binding.resourceRevisionId);
    const revision = await transaction.selectFrom("learning_resource_revisions")
      .innerJoin("learning_resources", "learning_resources.id", "learning_resource_revisions.resource_id")
      .innerJoin("content_items", "content_items.id", "learning_resources.source_content_id")
      .select([
        "learning_resource_revisions.payload_hash", "learning_resource_revisions.payload_json",
        "learning_resource_revisions.source_version", "learning_resources.projection",
        "learning_resources.retired_at", "learning_resources.source_content_id",
        "content_items.kind", "content_items.status", "content_items.author_user_id",
        "content_items.version", "content_items.catalog_visibility",
      ]).where("learning_resource_revisions.id", "=", binding.resourceRevisionId).executeTakeFirst();
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
    await v2LockCatalog(transaction, "asset", binding.assetId);
    const row = await transaction.selectFrom("content_assets")
      .innerJoin("content_items", "content_items.id", "content_assets.content_item_id")
      .select(["content_assets.status as asset_status", "content_assets.owner_user_id", "content_assets.kind", "content_assets.original_file_name",
        "content_items.author_user_id", "content_items.status as content_status", "content_items.catalog_visibility"])
      .where("content_assets.id", "=", binding.assetId).executeTakeFirst();
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
    ? await v2Audit(transaction).selectFrom("guided_v2_audit").select(["actor_user_id", "metadata"])
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


async function insertEditorDraft(transaction: Tx, prepared: PreparedGuidedV2Draft, actorUserId: string): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
  const topic = await transaction.selectFrom("content_items").select("id").where("id", "=", prepared.bindings.topicContentId).where("kind", "=", "topic").executeTakeFirst();
  if (!topic) return { status: "not_found" };
  const route = prepared.definition.route;
  const path = await transaction.insertInto("learning_paths").values({
    topic_content_id: topic.id,
    slug: route.slug,
    title: route.title,
    summary: route.summary,
    cover_asset_id: null,
    cover_key: route.coverKey,
    created_by: actorUserId,
  }).returningAll().executeTakeFirstOrThrow();
  const version = await transaction.insertInto("learning_path_versions").values({
    path_id: path.id,
    version_number: 1,
    policy_version: "guided-v2.0",
    policy_json: guidedV2PolicySnapshot as JsonValue,
    definition_v2_json: JSON.parse(prepared.canonicalJson) as JsonValue,
    release_notes: "",
  }).returningAll().executeTakeFirstOrThrow();
  await insertBindings(transaction, version.id, prepared);
  await v2Audit(transaction).insertInto("guided_v2_audit").values({
    action: "learning_path_v2_created",
    actor_user_id: actorUserId,
    target_type: "learning_path",
    target_id: path.id,
    metadata: { versionId: version.id, contentHash: prepared.contentHash },
  }).execute();
  return { status: "success" as const, value: await boundDefinition(transaction, path, version) };
}

async function editorReceipt<T>(transaction: Tx, actorUserId: string, key: string | undefined, request: unknown, mutate: () => Promise<GuidedV2StorageResult<T>>): Promise<GuidedV2StorageResult<T>> {
  if (!key) return mutate();
  const hash = hashLearningSnapshot(request);
  const previous = await transaction.selectFrom("learning_mutation_receipts").select(["request_hash", "response_json"]).where("user_id", "=", actorUserId).where("idempotency_key", "=", key).executeTakeFirst();
  if (previous) {
    if (previous.request_hash !== hash || !previous.response_json) return { status: "conflict" };
    return previous.response_json as GuidedV2StorageResult<T>;
  }
  const result = await mutate();
  await transaction.insertInto("learning_mutation_receipts").values({ user_id: actorUserId, idempotency_key: key, request_hash: hash, response_json: result as JsonValue, http_status: result.status === "success" ? 200 : 409 }).execute();
  return result;
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
          const actor = await v2LockActor(transaction, input.actorUserId);
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
          const actor = await v2LockActor(transaction, input.actorUserId);
          if (!actor) return { status: "forbidden" as const };
          const session = await transaction.selectFrom("learning_v2_imports").selectAll()
            .where("id", "=", input.importId).forUpdate().executeTakeFirst();
          if (!session || session.actor_user_id !== input.actorUserId) return { status: "not_found" as const };
          const reusedKey = await v2Audit(transaction).selectFrom("guided_v2_audit").select("metadata")
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
          await v2Audit(transaction).insertInto("guided_v2_audit").values({
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
      const read = await this.getEditorPath({ ...input, enforceAccess: true });
      if (read.status !== "success") return read;
      return { status: "success", value: { package: read.value.definition, bindings: read.value.bindings } };
    },
    async createDraft(input: {
      actorUserId: string;
      canCreate: boolean; canEditAll?: boolean; idempotencyKey?: string; enforceAccess?: boolean;
      package: unknown;
      bindings: unknown;
    }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canCreate) return { status: "forbidden" };
      const prepared = prepareGuidedV2Draft(input.package, input.bindings);
      if (prepared.status === "invalid") return prepared;
      try {
        return await database.transaction().execute(async (transaction) => {
          if (input.idempotencyKey && !(await v2LockActor(transaction, input.actorUserId))) return { status: "not_found" };
          if (input.enforceAccess) {
            const issues = await validateImportCatalog(transaction, prepared.value.definition, prepared.value.bindings, input.actorUserId, input.canEditAll === true);
            if (issues.length) return { status: "invalid", issues };
          }
          return editorReceipt(transaction, input.actorUserId, input.idempotencyKey, { operation: "editorCreate", input }, async () => {
          const topic = await transaction.selectFrom("content_items").select("id")
            .where("id", "=", prepared.value.bindings.topicContentId)
            .where("kind", "=", "topic").executeTakeFirst();
          if (!topic) return { status: "not_found" as const };
          return insertEditorDraft(transaction, prepared.value, input.actorUserId);
          });
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },

    async getEditorPath(input: EditorIdentity & { pathId: string; enforceAccess?: boolean }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canEdit) return { status: "forbidden" };
      return database.transaction().execute(async (transaction) => {
        const path = await transaction.selectFrom("learning_paths").selectAll()
          .where("id", "=", input.pathId).forShare().executeTakeFirst();
        if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" };
        const version = await transaction.selectFrom("learning_path_versions").selectAll()
          .where("path_id", "=", path.id).orderBy("version_number", "desc")
          .forShare().executeTakeFirst();
        if (!version || version.policy_version !== "guided-v2.0") return { status: "not_found" };
        const value = await boundDefinition(transaction, path, version);
        if (input.enforceAccess) {
          const issues = await validateImportCatalog(transaction, value.definition, value.bindings, input.actorUserId, input.canEditAll);
          if (issues.length) return { status: "invalid", issues };
        }
        return { status: "success", value };
      });
    },

    async saveDraft(input: EditorIdentity & {
      pathId: string; idempotencyKey?: string; enforceAccess?: boolean;
      expectedVersion: number;
      package: unknown;
      bindings: unknown;
    }): Promise<GuidedV2StorageResult<V2BoundRouteDefinition>> {
      if (!input.canEdit) return { status: "forbidden" };
      const prepared = prepareGuidedV2Draft(input.package, input.bindings);
      if (prepared.status === "invalid") return prepared;
      try {
        return await database.transaction().execute(async (transaction) => {
          if (input.idempotencyKey && !(await v2LockActor(transaction, input.actorUserId))) return { status: "not_found" };
          const path = await transaction.selectFrom("learning_paths").selectAll()
            .where("id", "=", input.pathId).forUpdate().executeTakeFirst();
          if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" as const };
          if (input.enforceAccess) {
            const issues = await validateImportCatalog(transaction, prepared.value.definition, prepared.value.bindings, input.actorUserId, input.canEditAll);
            if (issues.length) return { status: "invalid", issues };
          }
          return editorReceipt<V2BoundRouteDefinition>(transaction, input.actorUserId, input.idempotencyKey, { operation: "editorPatch", input }, async () => {
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
            await v2Audit(transaction).insertInto("guided_v2_audit").values({
              action: "learning_path_v2_updated",
              actor_user_id: input.actorUserId,
              target_type: "learning_path",
              target_id: path.id,
              metadata: { versionId: version.id, editVersion: nextVersion.edit_version, contentHash: prepared.value.contentHash },
            }).execute();
            return { status: "success" as const, value: await boundDefinition(transaction, nextPath, nextVersion) };
          });
        });
      } catch (error) {
        if (sqlConflict(error)) return { status: "conflict" };
        throw error;
      }
    },

    async previewPath(input: EditorIdentity & { pathId: string; package: unknown; bindings: unknown; idempotencyKey: string }): Promise<GuidedV2StorageResult<unknown>> {
      if (!input.canEdit) return { status: "forbidden" };
      const parsed = parseRouteImport(input.package);
      if (parsed.status !== "success") return { status: "invalid", issues: parsed.status === "invalid" ? parsed.issues : [] };
      const prepared = prepareGuidedV2Draft(parsed.definition, input.bindings);
      if (prepared.status === "invalid") return prepared;
      return database.transaction().execute(async (transaction) => {
        if (!(await v2LockActor(transaction, input.actorUserId))) return { status: "not_found" };
        const path = await transaction.selectFrom("learning_paths").selectAll().where("id", "=", input.pathId).forShare().executeTakeFirst();
        if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" };
        const version = await transaction.selectFrom("learning_path_versions").select("policy_version").where("path_id", "=", path.id).orderBy("version_number", "desc").executeTakeFirst();
        if (version?.policy_version !== "guided-v2.0") return { status: "not_found" };
        const issues = await validateImportCatalog(transaction, prepared.value.definition, prepared.value.bindings, input.actorUserId, input.canEditAll);
        if (issues.length) return { status: "invalid", issues };
        const prior = await transaction.selectFrom("learning_mutation_receipts").select("idempotency_key").where("user_id", "=", input.actorUserId).where("idempotency_key", "=", input.idempotencyKey).executeTakeFirst();
        if (!prior) {
          const count = await sql<{ n: string }>`select count(*)::text as n from public.learning_mutation_receipts where user_id = ${input.actorUserId}::uuid and created_at > now() - interval '10 minutes' and response_json->'value'->>'editorPreviewV2' = 'true'`.execute(transaction);
          if (Number(count.rows[0]?.n ?? 0) >= 30) return { status: "rate_limited" };
        }
        return editorReceipt(transaction, input.actorUserId, input.idempotencyKey, { operation: "editorPreview", input }, async () => {
          const reserved = new Set(prepared.value.definition.assessments.filter((a) => a.kind !== "checkpoint" && a.kind !== "diagnostic").flatMap((a) => a.candidateActivityKeys));
          const activity = prepared.value.definition.activities.find((a) => !reserved.has(a.key) && a.kind !== "case");
          return { status: "success", value: { editorPreviewV2: true, previewId: randomUUID(), activeActivity: activity ? toV2PublicActivity(activity) : null, issues: parsed.issues, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } };
        });
      });
    },

    async convertV1(input: EditorIdentity & { pathId: string; expectedVersion: number; idempotencyKey: string }): Promise<GuidedV2StorageResult<unknown>> {
      if (!input.canEdit) return { status: "forbidden" };
      return database.transaction().execute(async (transaction) => {
        if (!(await v2LockActor(transaction, input.actorUserId))) return { status: "not_found" };
        const path = await transaction.selectFrom("learning_paths").selectAll().where("id", "=", input.pathId).forUpdate().executeTakeFirst();
        if (!path || (!input.canEditAll && path.created_by !== input.actorUserId)) return { status: "not_found" };
        return editorReceipt(transaction, input.actorUserId, input.idempotencyKey, { operation: "convertV1", input }, async () => {
          const version = await latestVersion(transaction, path.id);
          if (!version || version.policy_version === "guided-v2.0") return { status: "conflict" };
          if (version.edit_version !== input.expectedVersion) return { status: "version_conflict" };
          // Conversion/adoption is implemented by T034; this endpoint stays closed.
          return { status: "conflict" };
        });
      });
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
            await v2Audit(transaction).insertInto("guided_v2_audit").values({
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
          await v2Audit(transaction).insertInto("guided_v2_audit").values({
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
          await v2Audit(transaction).insertInto("guided_v2_audit").values({
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

export type GuidedV2AttemptResult<T> = { status: "success"; value: T }
  | { status: "forbidden" | "not_found" | "conflict" | "version_conflict" | "access_revoked" | "idempotency_conflict" | "invalid_answer" };

type AttemptRow = Selectable<CediahDatabase["learning_v2_attempts"]>;

export async function v2Receipt<T>(transaction: Tx, userId: string, idempotencyKey: string, request: unknown,
  mutate: () => Promise<GuidedV2AttemptResult<T>>,
  replayGuard?: (value: T) => Promise<"access_revoked" | "not_found" | "conflict" | null>,
): Promise<GuidedV2AttemptResult<T>> {
  const requestHash = hashLearningSnapshot(request);
  const inserted = await transaction.insertInto("learning_mutation_receipts").values({
    user_id: userId, idempotency_key: idempotencyKey, request_hash: requestHash,
    response_json: null, http_status: null,
  }).onConflict((conflict) => conflict.columns(["user_id", "idempotency_key"]).doNothing())
    .returning("idempotency_key").executeTakeFirst();
  if (!inserted) {
    const receipt = await transaction.selectFrom("learning_mutation_receipts")
      .select(["request_hash", "response_json"]).where("user_id", "=", userId)
      .where("idempotency_key", "=", idempotencyKey).forUpdate().executeTakeFirstOrThrow();
    if (receipt.request_hash !== requestHash) return { status: "idempotency_conflict" };
    if (!receipt.response_json || typeof receipt.response_json !== "object" || Array.isArray(receipt.response_json)) {
      return { status: "conflict" };
    }
    const stored = receipt.response_json as GuidedV2AttemptResult<T>;
    if (stored.status === "success" && replayGuard) {
      const blocked = await replayGuard(stored.value);
      if (blocked) return { status: blocked };
    }
    await transaction.updateTable("learning_mutation_receipts").set({
      replay_count: sql<number>`replay_count + 1`, last_replayed_at: sql<Date>`now()`,
    }).where("user_id", "=", userId).where("idempotency_key", "=", idempotencyKey).execute();
    return stored;
  }
  const result = await mutate();
  const httpStatus = result.status === "success" ? 200 : result.status === "not_found" ? 404
    : result.status === "forbidden" ? 403 : result.status === "invalid_answer" ? 400 : 409;
  await transaction.updateTable("learning_mutation_receipts").set({
    response_json: result as JsonValue, http_status: httpStatus,
  }).where("user_id", "=", userId).where("idempotency_key", "=", idempotencyKey).executeTakeFirstOrThrow();
  return result;
}

export async function v2ContentAvailable(transaction: Tx, pathVersionId: string): Promise<boolean> {
  const version = await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
    .where("id", "=", pathVersionId).executeTakeFirst();
  const definition = RoutePackageSchema.safeParse(version?.definition_v2_json);
  if (!definition.success) return false;
  const bindings = await transaction.selectFrom("learning_v2_bindings").selectAll()
    .where("path_version_id", "=", pathVersionId).orderBy("kind").orderBy("local_key").execute();
  if (!bindings.some((binding) => binding.kind === "topic" && binding.local_key === "topic")
    || definition.data.sources.some((source) => source.kind === "guide"
      && !bindings.some((binding) => binding.kind === "source" && binding.local_key === source.key && binding.resource_revision_id))
    || definition.data.assets.some((asset) => !bindings.some((binding) =>
      binding.kind === "asset" && binding.local_key === asset.key && binding.asset_id))) return false;
  for (const binding of bindings) {
    if (binding.kind === "topic") {
      if (!binding.topic_content_id) return false;
      await v2LockCatalog(transaction, "topic", binding.topic_content_id);
      const topic = await transaction.selectFrom("content_items").select(["kind", "status", "catalog_visibility"])
        .where("id", "=", binding.topic_content_id).executeTakeFirst();
      if (!topic || topic.kind !== "topic" || topic.status !== "published"
        || topic.catalog_visibility !== "catalog") return false;
    } else if (binding.kind === "source" && binding.resource_revision_id) {
      await v2LockCatalog(transaction, "source", binding.resource_revision_id);
      const source = await transaction.selectFrom("learning_resource_revisions")
        .innerJoin("learning_resources", "learning_resources.id", "learning_resource_revisions.resource_id")
        .innerJoin("content_items", "content_items.id", "learning_resources.source_content_id")
        .select(["learning_resources.retired_at", "content_items.status", "content_items.catalog_visibility"])
        .where("learning_resource_revisions.id", "=", binding.resource_revision_id).executeTakeFirst();
      if (!source || source.retired_at || source.status !== "published" || source.catalog_visibility !== "catalog") return false;
    } else if (binding.kind === "asset") {
      if (!binding.asset_id) return false;
      await v2LockCatalog(transaction, "asset", binding.asset_id);
      const asset = await transaction.selectFrom("content_assets")
        .innerJoin("content_items", "content_items.id", "content_assets.content_item_id")
        .select(["content_assets.status as asset_status", "content_items.status as content_status",
          "content_items.catalog_visibility"])
        .where("content_assets.id", "=", binding.asset_id).executeTakeFirst();
      if (!asset || asset.asset_status !== "ready" || asset.content_status !== "published"
        || asset.catalog_visibility !== "catalog") return false;
    }
  }
  return true;
}

async function v2AttemptManifestFromRow(transaction: Tx, row: AttemptRow): Promise<V2AttemptManifest | null> {
  const snapshot = parseGuidedV2AttemptSnapshot(row.snapshot_json);
  if (!snapshot || snapshot.pathVersionId !== row.path_version_id) return null;
  const resume = parseGuidedV2AttemptResume(row.resume_json, snapshot);
  if (!resume) return null;
  const rows = await transaction.selectFrom("learning_v2_responses").selectAll()
    .where("attempt_id", "=", row.id).orderBy("accepted_at").orderBy("id").execute();
  const responses = rows.map((response) => {
    const grading = response.grading_json as Partial<BasicGradingResult>;
    const feedback = grading && "feedback" in grading && grading.feedback && typeof grading.feedback === "object"
      ? grading.feedback : null;
    return { activityKey: response.activity_key, answer: response.answer_json, acceptedAt: response.accepted_at,
      score01: response.score01, explanation: feedback?.explanation ?? "", commonError: feedback?.commonError ?? "" };
  });
  return guidedV2AttemptManifest({ attemptId: row.id, enrollmentId: row.enrollment_id,
    pathVersionId: row.path_version_id, purpose: row.purpose, rowVersion: row.row_version,
    status: row.status, snapshot, resume, responses });
}

async function v2AuthorizedAttempt(transaction: Tx, userId: string, attemptId: string, lock: boolean): Promise<
  | { status: "success"; row: AttemptRow; snapshot: GuidedV2AttemptSnapshot; resume: GuidedV2AttemptResume }
  | { status: "not_found" | "access_revoked" | "conflict" }
> {
  const query = transaction.selectFrom("learning_v2_attempts").selectAll()
    .where("id", "=", attemptId).where("user_id", "=", userId);
  const row = await (lock ? query.forUpdate() : query).executeTakeFirst();
  if (!row) return { status: "not_found" };
  const enrollment = await transaction.selectFrom("learning_enrollments")
    .select(["status", "path_version_id"]).where("id", "=", row.enrollment_id)
    .where("user_id", "=", userId).executeTakeFirst();
  if (!enrollment || enrollment.status !== "active" || enrollment.path_version_id !== row.path_version_id
    || !(await v2ContentAvailable(transaction, row.path_version_id))) {
    if (lock) await v2PauseRevoked(transaction, userId, attemptId);
    return { status: "access_revoked" };
  }
  const snapshot = parseGuidedV2AttemptSnapshot(row.snapshot_json);
  const resume = snapshot && parseGuidedV2AttemptResume(row.resume_json, snapshot);
  if (!snapshot || !resume || snapshot.pathVersionId !== row.path_version_id) return { status: "conflict" };
  return { status: "success", row, snapshot, resume };
}

async function v2PauseRevoked(transaction: Tx, userId: string, attemptId: string): Promise<void> {
  await transaction.updateTable("learning_v2_attempts").set({
    status: "paused", row_version: sql<number>`row_version + 1`, updated_at: sql<Date>`now()`,
  }).where("id", "=", attemptId).where("user_id", "=", userId).where("status", "=", "in_progress").execute();
}

async function v2ReplayAvailability(transaction: Tx, userId: string, attemptId: string): Promise<"access_revoked" | "not_found" | "conflict" | null> {
  const authorized = await v2AuthorizedAttempt(transaction, userId, attemptId, true);
  if (authorized.status === "access_revoked") await v2PauseRevoked(transaction, userId, attemptId);
  return authorized.status === "success" ? null : authorized.status;
}

function v2HelpText(activity: RouteActivity, kind: "hint" | "source" | "reveal", definition: RoutePackage): string {
  if (kind === "hint") return activity.hints[0] ?? "Revisa el enunciado y las relaciones clave.";
  if (kind === "source") {
    const source = definition.sources.find((item) => activity.sourceKeys.includes(item.key));
    return source?.excerpt ?? "La fuente vinculada no tiene un fragmento disponible.";
  }
  if (activity.kind === "constructed_response" || activity.kind === "short_answer") return activity.payload.modelAnswer;
  return activity.feedback.explanation;
}

export type GuidedV2ResponseReceipt = {
  accepted: boolean;
  feedback: { explanation: string; commonError: string; score01: number | null };
  attempt: V2AttemptManifest;
};

/** Source facts are append-only responses and semantic events, never the derived cache. */
export async function v2RebuildEvidence(transaction: Tx, userId: string, enrollmentId: string, pathVersionId: string, now: Date): Promise<GuidedV2EvidenceState> {
  const version = await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
    .where("id", "=", pathVersionId).executeTakeFirstOrThrow();
  const definition = RoutePackageSchema.parse(version.definition_v2_json);
  const attempts = await transaction.selectFrom("learning_v2_attempts").selectAll()
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId)
    .where("path_version_id", "=", pathVersionId).execute();
  const responses = await transaction.selectFrom("learning_v2_responses").selectAll()
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId)
    .where("path_version_id", "=", pathVersionId).execute();
  const events = await transaction.selectFrom("learning_events").selectAll()
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId)
    .where("policy_version", "=", "guided-v2.0").orderBy("occurred_at").orderBy("id").execute();
  const snapshots = new Map(attempts.map((attempt) => [attempt.id, parseGuidedV2AttemptSnapshot(attempt.snapshot_json)]));
  const responseEvents = new Map<string, typeof events[number]>();
  const timeline: GuidedV2EvidenceEvent[] = [];
  for (const event of events) {
    const payload = event.payload_json;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
    if (event.event_type === "response_accepted" && typeof payload.responseId === "string") responseEvents.set(payload.responseId, event);
    if (event.event_type === "activity_completed" && payload.state === "dispensed"
      && payload.pathVersionId === pathVersionId && typeof payload.activityKey === "string" && typeof payload.reason === "string") {
      timeline.push({ kind: "dispense", id: event.id, semanticKey: event.semantic_key,
        at: event.occurred_at.toISOString(), activityKey: payload.activityKey, reason: payload.reason });
    }
    const snapshot = typeof payload.v2AttemptId === "string" ? snapshots.get(payload.v2AttemptId) : null;
    if (!snapshot || snapshot.pathVersionId !== pathVersionId) continue;
    const activityKey = typeof payload.activityKey === "string" ? payload.activityKey : snapshot.orderedKeys[0];
    if (!activityKey || !snapshot.activities.some((activity) => activity.key === activityKey)) continue;
    if (event.event_type === "activity_presented" || event.event_type === "help_requested") {
      timeline.push({ id: event.id, semanticKey: event.semantic_key, at: event.occurred_at.toISOString(), activityKey,
        ...(event.event_type === "help_requested" && payload.kind === "reveal"
          ? { kind: "reveal" as const } : { kind: "interaction" as const, assisted: event.event_type === "help_requested" }) });
    }
  }
  for (const response of responses) {
    const snapshot = snapshots.get(response.attempt_id);
    const activity = snapshot?.activities.find((item) => item.key === response.activity_key);
    if (!snapshot || !activity) continue;
    const assessment = snapshot.target.kind === "assessment"
      ? definition.assessments.find((item) => item.key === snapshot.target.key) : null;
    const authorizedUse = snapshot.target.kind === "review"
      ? ["learning", "gate"].includes(activity.use)
      : snapshot.target.kind === "assessment" ? Boolean(assessment)
        : ["learning", "gate"].includes(activity.use);
    const grading = response.grading_json;
    const responseKey = grading && typeof grading === "object" && !Array.isArray(grading)
      && typeof grading.responseKey === "string" ? grading.responseKey : null;
    const event = responseEvents.get(response.id);
    timeline.push({ kind: "response", id: event?.id ?? response.id,
      semanticKey: `v2-response:${response.attempt_id}:${response.activity_key}`, at: response.accepted_at.toISOString(),
      attemptId: response.attempt_id, activityKey: response.activity_key, objectiveKey: response.objective_key,
      equivalenceKey: response.equivalence_key, phase: activity.phase, modality: response.modality,
      purpose: assessment?.kind === "diagnostic" ? "diagnostic" : response.purpose,
      gradingSource: response.grading_source, score01: response.score01, responseKey, assisted: response.assisted,
      valid: authorizedUse && snapshot.pathVersionId === pathVersionId
        && snapshot.orderedKeys.includes(response.activity_key)
        && response.item_revision_hash === guidedV2ItemRevisionHash(activity) });
  }
  for (const attempt of attempts.filter((item) => item.status === "completed" && item.submitted_at)) {
    const snapshot = snapshots.get(attempt.id);
    if (!snapshot || snapshot.target.kind !== "assessment") continue;
    const assessment = definition.assessments.find((item) => item.key === snapshot.target.key && item.kind === "final");
    if (!assessment) continue;
    const answers = responses.filter((response) => response.attempt_id === attempt.id);
    timeline.push({ kind: "final", id: events.find((event) => event.semantic_key === `v2-complete:${attempt.id}`)?.id ?? attempt.id,
      semanticKey: `v2-complete:${attempt.id}`, at: attempt.submitted_at!.toISOString(),
      assessmentKey: assessment.key, attemptId: attempt.id,
      valid: snapshot.pathVersionId === pathVersionId && snapshot.orderedKeys.every((key) => answers.some((response) => response.activity_key === key)),
      answers: answers.map((response) => ({ objectiveKey: response.objective_key, score01: response.score01,
        gradingSource: response.grading_source, assisted: response.assisted })) });
  }
  // Rebuild the agenda inside the same actor-locked transaction as the response
  // receipt. The append-only answers recover session retries without extra columns.
  const achievements = rebuildGuidedV2Evidence(definition, timeline);
  const reviewRows = await transaction.selectFrom("learning_v2_review_state").selectAll()
    .where("user_id", "=", userId).where("path_version_id", "=", pathVersionId)
    .orderBy("objective_key").forUpdate().execute();
  for (const objective of achievements.objectives) {
    let agenda: ReviewStateV2 | null = null;
    const history: ReviewResponseV2[] = [];
    const facts = timeline.filter((event) => event.kind === "response" && event.objectiveKey === objective.objectiveKey)
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id));
    for (const event of facts) {
      if (event.kind !== "response") continue;
      const stored = responses.find((item) => item.attempt_id === event.attemptId && item.activity_key === event.activityKey)!;
      const answer = V2AnswerSchema.safeParse(stored.answer_json);
      const grading = stored.grading_json as BasicGradingResult;
      const partial = "feedback" in grading ? grading.feedback?.partialScore01 : undefined;
      const receipt: ReviewResponseV2 = { responseId: stored.id, sessionId: stored.attempt_id, acceptedAt: event.at,
        gradingSource: event.gradingSource,
        score01: event.gradingSource === "server" && partial !== undefined && partial > 0 && partial < 1 ? partial : event.score01,
        assisted: event.assisted || grading.status === "practice",
        selfRating: answer.success && answer.data.kind === "constructed_response" ? answer.data.selfRating : null,
        purpose: event.purpose, phase: event.phase, valid: event.valid };
      const next = scheduleReviewV2(agenda, receipt, history, objective.firstMasteredAt);
      if (next !== agenda) history.push(receipt);
      agenda = next;
    }
    if (!agenda) continue;
    const values = {
      stage: agenda.stage, lapses: agenda.lapses, due_at: new Date(agenda.dueAt),
      last_applied_response_id: agenda.lastAppliedResponseId,
      last_extended_at: agenda.lastExtendedAt ? new Date(agenda.lastExtendedAt) : null,
      retention7_due_at: agenda.retention7DueAt ? new Date(agenda.retention7DueAt) : null,
      retention7_accepted_at: agenda.retention7AcceptedAt ? new Date(agenda.retention7AcceptedAt) : null,
      retention30_due_at: agenda.retention30DueAt ? new Date(agenda.retention30DueAt) : null,
      retention30_accepted_at: agenda.retention30AcceptedAt ? new Date(agenda.retention30AcceptedAt) : null,
    };
    const existing = reviewRows.find((item) => item.objective_key === objective.objectiveKey);
    if (existing && Object.entries(values).every(([key, value]) => {
      const current = existing[key as keyof typeof existing];
      return current instanceof Date && value instanceof Date ? current.getTime() === value.getTime() : current === value;
    })) continue;
    await transaction.insertInto("learning_v2_review_state").values({
      user_id: userId, enrollment_id: enrollmentId, path_version_id: pathVersionId,
      objective_key: objective.objectiveKey, ...values, updated_at: now,
    }).onConflict((conflict) => conflict.columns(["user_id", "path_version_id", "objective_key"]).doUpdateSet({
      ...values, row_version: sql<number>`learning_v2_review_state.row_version + 1`, updated_at: now,
    })).execute();
    if (agenda.dueAt && agenda.lastAppliedResponseId) await v2MetricEvent(transaction, {
      userId, enrollmentId, pathVersionId, kind: "review_scheduled",
      semanticKey: `v2-schedule:${pathVersionId}:${objective.objectiveKey}:${agenda.lastAppliedResponseId}`,
      at: now, objective: { objectiveKey: objective.objectiveKey, dueAt: agenda.dueAt },
    });
  }
  const due = await transaction.selectFrom("learning_v2_review_state").select("objective_key")
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId)
    .where("path_version_id", "=", pathVersionId).where("due_at", "<=", now).execute();
  const state = rebuildGuidedV2Evidence(definition, timeline, { dueObjectiveKeys: due.map((row) => row.objective_key) });
  const cached = await transaction.selectFrom("learning_v2_objective_state").selectAll()
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId)
    .where("path_version_id", "=", pathVersionId).orderBy("objective_key").forUpdate().execute();
  for (const objective of [...state.objectives].sort((a, b) => a.objectiveKey.localeCompare(b.objectiveKey))) {
    const existing = cached.find((row) => row.objective_key === objective.objectiveKey);
    const error = { open: objective.openCriticalErrors };
    if (existing && hashLearningSnapshot(existing.evidence_json) === hashLearningSnapshot(objective)
      && hashLearningSnapshot(existing.error_json) === hashLearningSnapshot(error)
      && (existing.first_mastered_at?.toISOString() ?? null) === objective.firstMasteredAt
      && (existing.first_consolidated_at?.toISOString() ?? null) === objective.firstConsolidatedAt) continue;
    await transaction.insertInto("learning_v2_objective_state").values({
      user_id: userId, enrollment_id: enrollmentId, path_version_id: pathVersionId, objective_key: objective.objectiveKey,
      evidence_json: objective as JsonValue, error_json: error as JsonValue,
      first_mastered_at: objective.firstMasteredAt ? new Date(objective.firstMasteredAt) : null,
      first_consolidated_at: objective.firstConsolidatedAt ? new Date(objective.firstConsolidatedAt) : null,
      updated_at: now,
    }).onConflict((conflict) => conflict.columns(["enrollment_id", "path_version_id", "objective_key"]).doUpdateSet({
      evidence_json: objective as JsonValue, error_json: error as JsonValue,
      first_mastered_at: objective.firstMasteredAt ? new Date(objective.firstMasteredAt) : null,
      first_consolidated_at: objective.firstConsolidatedAt ? new Date(objective.firstConsolidatedAt) : null,
      row_version: sql<number>`learning_v2_objective_state.row_version + 1`, updated_at: now,
    })).execute();
  }
  for (const objective of state.objectives) {
    const firstRecall = timeline.filter((event) => event.kind === "response" && event.objectiveKey === objective.objectiveKey
      && event.valid && !event.assisted && event.gradingSource === "server" && event.score01 === 1
      && event.phase === "retrieve" && event.purpose !== "diagnostic" && event.purpose !== "preview")
      .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))[0];
    for (const [kind, acceptedAt] of [
      ["v2_objective_recalled", firstRecall?.at],
      ["v2_objective_mastered", objective.firstMasteredAt],
      ["v2_objective_consolidated", objective.firstConsolidatedAt],
    ] as const) if (acceptedAt) await awardObjectiveV2(transaction, {
      userId, enrollmentId, pathVersionId, objectiveKey: objective.objectiveKey, kind, acceptedAt: new Date(acceptedAt),
    });
  }
  for (const kind of ["completed", "mastered", "consolidated"] as const) {
    const at = state.route[`${kind}At`];
    if (at) await v2MetricEvent(transaction, { userId, enrollmentId, pathVersionId,
      kind: `route_${kind}`, semanticKey: `v2-route:${pathVersionId}:${kind}`, at: new Date(at) });
  }
  return state;
}

/** Runtime mutations are deliberately separate from editorial storage. */
export function createPostgresGuidedV2AttemptService(database: DatabaseClient, options: {
  now?: () => Date;
  prepareSnapshot?: (transaction: Tx, input: { userId: string; enrollmentId: string; pathVersionId: string;
    target: GuidedV2AttemptTarget; definition: RoutePackage; at: Date }) => Promise<GuidedV2AttemptSnapshot | null>;
} = {}) {
  const now = () => options.now?.() ?? new Date();
  return {
    async readEvidence(input: { userId: string; enrollmentId: string }): Promise<GuidedV2AttemptResult<GuidedV2EvidenceState>> {
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" };
        const enrollment = await transaction.selectFrom("learning_enrollments").selectAll()
          .where("id", "=", input.enrollmentId).where("user_id", "=", input.userId).forUpdate().executeTakeFirst();
        if (!enrollment) return { status: "not_found" };
        if (enrollment.status !== "active") return { status: "access_revoked" };
        const version = await transaction.selectFrom("learning_path_versions").select("policy_version")
          .where("id", "=", enrollment.path_version_id).executeTakeFirst();
        if (version?.policy_version !== "guided-v2.0") return { status: "conflict" };
        return { status: "success", value: await v2RebuildEvidence(transaction, input.userId, enrollment.id, enrollment.path_version_id, now()) };
      });
    },
    async create(input: { userId: string; idempotencyKey: string; clientAttemptId: string;
      enrollmentId: string; target: GuidedV2AttemptTarget; expectedEnrollmentVersion: number;
    }): Promise<GuidedV2AttemptResult<V2AttemptManifest>> {
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" };
        return v2Receipt<V2AttemptManifest>(transaction, input.userId, input.idempotencyKey,
          { method: "POST", route: "/v2/guided-learning/attempts", body: {
            clientAttemptId: input.clientAttemptId, enrollmentId: input.enrollmentId,
            target: input.target, expectedEnrollmentVersion: input.expectedEnrollmentVersion,
          } }, async () => {
            const enrollment = await transaction.selectFrom("learning_enrollments").selectAll()
              .where("id", "=", input.enrollmentId).where("user_id", "=", input.userId)
              .forUpdate().executeTakeFirst();
            if (!enrollment) return { status: "not_found" };
            if (enrollment.status !== "active") return { status: "access_revoked" };
            if (enrollment.row_version !== input.expectedEnrollmentVersion) return { status: "version_conflict" };
            const version = await transaction.selectFrom("learning_path_versions").selectAll()
              .where("id", "=", enrollment.path_version_id).executeTakeFirst();
            if (!version || version.policy_version !== "guided-v2.0" || version.status !== "published") return { status: "conflict" };
            if (!(await v2ContentAvailable(transaction, version.id))) return { status: "access_revoked" };
            const definition = RoutePackageSchema.safeParse(version.definition_v2_json);
            if (!definition.success) return { status: "conflict" };
            const existing = await transaction.selectFrom("learning_v2_attempts").selectAll()
              .where("user_id", "=", input.userId).where("client_attempt_id", "=", input.clientAttemptId).executeTakeFirst();
            if (existing) {
              const prior = parseGuidedV2AttemptSnapshot(existing.snapshot_json);
              if (existing.enrollment_id !== enrollment.id || !prior
                || hashLearningSnapshot(prior.target) !== hashLearningSnapshot(input.target)) return { status: "conflict" };
              const manifest = await v2AttemptManifestFromRow(transaction, existing);
              return manifest ? { status: "success", value: manifest } : { status: "conflict" };
            }
            const snapshot = options.prepareSnapshot
              ? await options.prepareSnapshot(transaction, { userId: input.userId, enrollmentId: enrollment.id,
                pathVersionId: version.id, target: input.target, definition: definition.data, at: now() })
              : prepareGuidedV2AttemptSnapshot(definition.data, version.id, input.target);
            if (!snapshot) return { status: options.prepareSnapshot ? "conflict" : "not_found" };
            const created = await transaction.insertInto("learning_v2_attempts").values({
              user_id: input.userId, enrollment_id: enrollment.id, path_version_id: version.id,
              client_attempt_id: input.clientAttemptId, purpose: input.target.kind,
              snapshot_json: snapshot as JsonValue, resume_json: initialGuidedV2AttemptResume() as JsonValue,
            }).returningAll().executeTakeFirstOrThrow();
            await transaction.insertInto("learning_events").values({
              user_id: input.userId, enrollment_id: enrollment.id, attempt_id: null,
              event_type: "activity_presented", semantic_key: `v2-presented:${created.id}`,
              payload_json: { v2AttemptId: created.id, targetKey: input.target.key }, policy_version: "guided-v2.0",
              occurred_at: now(),
            }).execute();
            await v2MetricEvent(transaction, { userId: input.userId, enrollmentId: enrollment.id, pathVersionId: version.id,
              kind: "route_started", semanticKey: `v2-route-started:${enrollment.id}:${version.id}`, at: now() });
            if (snapshot.activities.some((item) => item.key === input.target.key && item.phase === "remediate")) {
              await v2MetricEvent(transaction, { userId: input.userId, enrollmentId: enrollment.id, pathVersionId: version.id,
                kind: "remediation_started", semanticKey: `v2-remediation:${created.id}`, at: now() });
            }
            await v2RebuildEvidence(transaction, input.userId, enrollment.id, version.id, now());
            const manifest = await v2AttemptManifestFromRow(transaction, created);
            return manifest ? { status: "success", value: manifest } : { status: "conflict" };
          }, (value) => v2ReplayAvailability(transaction, input.userId, value.attemptId));
      });
    },

    async read(input: { userId: string; attemptId: string }): Promise<GuidedV2AttemptResult<V2AttemptManifest>> {
      return database.transaction().execute(async (transaction) => {
        const authorized = await v2AuthorizedAttempt(transaction, input.userId, input.attemptId, true);
        if (authorized.status === "access_revoked") {
          await v2PauseRevoked(transaction, input.userId, input.attemptId);
          return { status: "access_revoked" };
        }
        if (authorized.status !== "success") return { status: authorized.status };
        let row = authorized.row;
        if (row.status === "paused") row = await transaction.updateTable("learning_v2_attempts")
          .set({ status: "in_progress", row_version: sql<number>`row_version + 1`, updated_at: now() })
          .where("id", "=", row.id).returningAll().executeTakeFirstOrThrow();
        const manifest = await v2AttemptManifestFromRow(transaction, row);
        return manifest ? { status: "success", value: manifest } : { status: "conflict" };
      });
    },

    async help(input: { userId: string; attemptId: string; idempotencyKey: string; activityKey: string;
      kind: "hint" | "source" | "reveal"; expectedVersion: number;
    }): Promise<GuidedV2AttemptResult<{ help: { kind: "hint" | "source" | "reveal"; text: string }; attempt: V2AttemptManifest }>> {
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" };
        return v2Receipt<{ help: { kind: "hint" | "source" | "reveal"; text: string }; attempt: V2AttemptManifest }>(transaction, input.userId, input.idempotencyKey,
          { method: "POST", route: `/v2/guided-learning/attempts/${input.attemptId}/help`, body: {
            activityKey: input.activityKey, kind: input.kind, expectedVersion: input.expectedVersion,
          } }, async () => {
            const authorized = await v2AuthorizedAttempt(transaction, input.userId, input.attemptId, true);
            if (authorized.status !== "success") return { status: authorized.status };
            const { row, snapshot, resume } = authorized;
            if (row.status !== "in_progress" || snapshot.orderedKeys[resume.activeIndex] !== input.activityKey) return { status: "conflict" };
            if (row.row_version !== input.expectedVersion) return { status: "version_conflict" };
            const activity = snapshot.activities.find((item) => item.key === input.activityKey)!;
            const version = await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
              .where("id", "=", row.path_version_id).executeTakeFirstOrThrow();
            const definition = RoutePackageSchema.safeParse(version.definition_v2_json);
            if (!definition.success) return { status: "conflict" };
            const text = v2HelpText(activity, input.kind, definition.data);
            const nextResume = { ...resume, assistedKeys: [...new Set([...resume.assistedKeys, activity.key])],
              revealedKeys: input.kind === "reveal" ? [...new Set([...resume.revealedKeys, activity.key])] : resume.revealedKeys };
            const updated = await transaction.updateTable("learning_v2_attempts").set({
              resume_json: nextResume as JsonValue, row_version: sql<number>`row_version + 1`, updated_at: now(),
            }).where("id", "=", row.id).where("row_version", "=", input.expectedVersion)
              .returningAll().executeTakeFirst();
            if (!updated) return { status: "version_conflict" };
            await transaction.insertInto("learning_events").values({
              user_id: input.userId, enrollment_id: row.enrollment_id, attempt_id: null,
              event_type: "help_requested", semantic_key: `v2-help:${row.id}:${activity.key}:${input.kind}`,
              payload_json: { v2AttemptId: row.id, activityKey: activity.key, kind: input.kind }, policy_version: "guided-v2.0",
              occurred_at: now(),
            }).onConflict((conflict) => conflict.columns(["user_id", "semantic_key"]).doNothing()).execute();
            await v2RebuildEvidence(transaction, input.userId, row.enrollment_id, row.path_version_id, now());
            const manifest = await v2AttemptManifestFromRow(transaction, updated);
            return manifest ? { status: "success", value: { help: { kind: input.kind, text }, attempt: manifest } } : { status: "conflict" };
          }, (value) => v2ReplayAvailability(transaction, input.userId, value.attempt.attemptId));
      });
    },

    async respond(input: { userId: string; attemptId: string; idempotencyKey: string; activityKey: string;
      answer: unknown; confidence: "sure" | "unsure" | "guessed" | null; expectedVersion: number;
    }): Promise<GuidedV2AttemptResult<GuidedV2ResponseReceipt>> {
      const answer = V2AnswerSchema.safeParse(input.answer);
      if (!answer.success) return { status: "invalid_answer" };
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" };
        return v2Receipt<GuidedV2ResponseReceipt>(transaction, input.userId, input.idempotencyKey,
          { method: "POST", route: `/v2/guided-learning/attempts/${input.attemptId}/responses`, body: {
            activityKey: input.activityKey, answer: answer.data, confidence: input.confidence,
            expectedVersion: input.expectedVersion,
          } }, async () => {
            const authorized = await v2AuthorizedAttempt(transaction, input.userId, input.attemptId, true);
            if (authorized.status !== "success") return { status: authorized.status };
            const { row, snapshot, resume } = authorized;
            const existing = await transaction.selectFrom("learning_v2_responses").selectAll()
              .where("attempt_id", "=", row.id).where("activity_key", "=", input.activityKey).executeTakeFirst();
            if (existing) {
              if (hashLearningSnapshot(existing.answer_json) !== hashLearningSnapshot(answer.data)) return { status: "conflict" };
              const grading = existing.grading_json as BasicGradingResult;
              const feedback = "feedback" in grading && grading.feedback ? grading.feedback : null;
              const manifest = await v2AttemptManifestFromRow(transaction, row);
              return manifest ? { status: "success", value: { accepted: true, attempt: manifest,
                feedback: { explanation: feedback?.explanation ?? "", commonError: feedback?.commonError ?? "",
                  score01: existing.score01 } } } : { status: "conflict" };
            }
            if (row.status !== "in_progress" || snapshot.orderedKeys[resume.activeIndex] !== input.activityKey) return { status: "conflict" };
            if (row.row_version !== input.expectedVersion) return { status: "version_conflict" };
            const activity = snapshot.activities.find((item) => item.key === input.activityKey)!;
            const graded = gradeBasicActivity(activity, answer.data, {
              revealed: resume.revealedKeys.includes(activity.key),
              submittedText: resume.submittedTextByActivity[activity.key],
              confidence: input.confidence,
            });
            if (graded.status === "invalid") return { status: "invalid_answer" };
            if (graded.status === "awaiting_reveal" || graded.status === "awaiting_self_rating") {
              const nextResume: GuidedV2AttemptResume = {
                ...resume, submittedTextByActivity: { ...resume.submittedTextByActivity,
                  [activity.key]: graded.submittedText },
              };
              const updated = await transaction.updateTable("learning_v2_attempts").set({
                resume_json: nextResume as JsonValue, row_version: sql<number>`row_version + 1`, updated_at: now(),
              }).where("id", "=", row.id).where("row_version", "=", input.expectedVersion)
                .returningAll().executeTakeFirst();
              if (!updated) return { status: "version_conflict" };
              const manifest = await v2AttemptManifestFromRow(transaction, updated);
              return manifest ? { status: "success", value: { accepted: false, attempt: manifest,
                feedback: { explanation: "", commonError: "", score01: null } } } : { status: "conflict" };
            }
            const serverTime = now();
            const response = await transaction.insertInto("learning_v2_responses").values({
              attempt_id: row.id, user_id: input.userId, enrollment_id: row.enrollment_id,
              path_version_id: row.path_version_id, activity_key: activity.key,
              objective_key: activity.objectiveKey, equivalence_key: activity.equivalenceKey,
              item_revision_hash: guidedV2ItemRevisionHash(activity), modality: activity.representation,
              purpose: row.purpose === "review" ? "review" : activity.use,
              answer_json: answer.data as JsonValue, grading_json: graded as JsonValue,
              grading_source: graded.gradingSource, confidence: input.confidence,
              assisted: resume.assistedKeys.includes(activity.key), novel_at_presentation: Boolean(
                row.snapshot_json && typeof row.snapshot_json === "object" && !Array.isArray(row.snapshot_json)
                && Array.isArray(row.snapshot_json.novelKeys) && row.snapshot_json.novelKeys.includes(activity.key)),
              score01: graded.score01, accepted_at: serverTime,
            }).returning("id").executeTakeFirstOrThrow();
            const nextResume: GuidedV2AttemptResume = { ...resume, activeIndex: resume.activeIndex + 1 };
            const updated = await transaction.updateTable("learning_v2_attempts").set({
              resume_json: nextResume as JsonValue, row_version: sql<number>`row_version + 1`, updated_at: serverTime,
            }).where("id", "=", row.id).where("row_version", "=", input.expectedVersion)
              .returningAll().executeTakeFirst();
            if (!updated) return { status: "version_conflict" };
            await transaction.insertInto("learning_v2_activity_state").values({
              enrollment_id: row.enrollment_id, user_id: input.userId, path_version_id: row.path_version_id,
              activity_key: activity.key, state: "completed", evidence_attempt_id: row.id,
            }).onConflict((conflict) => conflict.columns(["enrollment_id", "path_version_id", "activity_key"])
              .doUpdateSet({ state: "completed", evidence_attempt_id: row.id,
                row_version: sql<number>`learning_v2_activity_state.row_version + 1`, updated_at: serverTime })).execute();
            const completedCase = snapshot.activities.find((item) => item.kind === "case"
              && item.payload.stages.at(-1)?.childActivityKey === activity.key);
            if (completedCase) {
              await transaction.insertInto("learning_v2_activity_state").values({
                enrollment_id: row.enrollment_id, user_id: input.userId, path_version_id: row.path_version_id,
                activity_key: completedCase.key, state: "completed", evidence_attempt_id: row.id,
              }).onConflict((conflict) => conflict.columns(["enrollment_id", "path_version_id", "activity_key"])
                .doUpdateSet({ state: "completed", evidence_attempt_id: row.id,
                  row_version: sql<number>`learning_v2_activity_state.row_version + 1`, updated_at: serverTime })).execute();
            }
            await transaction.insertInto("learning_events").values({
              user_id: input.userId, enrollment_id: row.enrollment_id, attempt_id: null,
              event_type: "response_accepted", semantic_key: `v2-response:${row.id}:${activity.key}`,
              payload_json: { v2AttemptId: row.id, responseId: response.id, activityKey: activity.key },
              policy_version: "guided-v2.0", occurred_at: serverTime,
            }).execute();
            await v2RebuildEvidence(transaction, input.userId, row.enrollment_id, row.path_version_id, serverTime);
            const manifest = await v2AttemptManifestFromRow(transaction, updated);
            const feedback = graded.feedback;
            return manifest ? { status: "success", value: { accepted: true, attempt: manifest,
              feedback: { explanation: feedback.explanation, commonError: feedback.commonError,
                score01: graded.score01 } } } : { status: "conflict" };
          }, (value) => v2ReplayAvailability(transaction, input.userId, value.attempt.attemptId));
      });
    },

    async complete(input: { userId: string; attemptId: string; idempotencyKey: string; expectedVersion: number;
    }): Promise<GuidedV2AttemptResult<V2AttemptManifest>> {
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" };
        return v2Receipt<V2AttemptManifest>(transaction, input.userId, input.idempotencyKey,
          { method: "POST", route: `/v2/guided-learning/attempts/${input.attemptId}/complete`,
            body: { expectedVersion: input.expectedVersion } }, async () => {
            const authorized = await v2AuthorizedAttempt(transaction, input.userId, input.attemptId, true);
            if (authorized.status !== "success") return { status: authorized.status };
            const { row, snapshot, resume } = authorized;
            if (row.status !== "in_progress" || resume.activeIndex !== snapshot.orderedKeys.length) return { status: "conflict" };
            if (row.row_version !== input.expectedVersion) return { status: "version_conflict" };
            const count = await transaction.selectFrom("learning_v2_responses")
              .select(sql<number>`count(*)::int`.as("count")).where("attempt_id", "=", row.id)
              .executeTakeFirstOrThrow();
            if (count.count !== snapshot.orderedKeys.length) return { status: "conflict" };
            const serverTime = now();
            const updated = await transaction.updateTable("learning_v2_attempts").set({
              status: "completed", submitted_at: serverTime, updated_at: serverTime,
              row_version: sql<number>`row_version + 1`, outcome_json: { responsesCount: count.count },
            }).where("id", "=", row.id).where("row_version", "=", input.expectedVersion)
              .returningAll().executeTakeFirst();
            if (!updated) return { status: "version_conflict" };
            await transaction.insertInto("learning_events").values({
              user_id: input.userId, enrollment_id: row.enrollment_id, attempt_id: null,
              event_type: row.purpose === "assessment" ? "assessment_submitted"
                : row.purpose === "review" ? "review_completed" : "activity_completed",
              semantic_key: `v2-complete:${row.id}`,
              payload_json: { v2AttemptId: row.id, responsesCount: count.count },
              policy_version: "guided-v2.0", occurred_at: serverTime,
            }).execute();
            if (snapshot.target.kind === "assessment") {
              const version = await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
                .where("id", "=", row.path_version_id).executeTakeFirstOrThrow();
              const kind = RoutePackageSchema.parse(version.definition_v2_json).assessments.find((item) => item.key === snapshot.target.key)?.kind;
              if (kind) await v2MetricEvent(transaction, { userId: input.userId, enrollmentId: row.enrollment_id,
                pathVersionId: row.path_version_id, kind: kind.startsWith("retention") ? "retention_submitted" : `${kind}_submitted`,
                semanticKey: `v2-assessment-submitted:${row.id}`, at: serverTime });
            }
            const state = await v2RebuildEvidence(transaction, input.userId, row.enrollment_id, row.path_version_id, serverTime);
            if (snapshot.target.kind === "assessment") {
              const version = await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
                .where("id", "=", row.path_version_id).executeTakeFirstOrThrow();
              const gate = RoutePackageSchema.parse(version.definition_v2_json).assessments.find((item) => item.key === snapshot.target.key && item.kind === "unit_gate");
              if (gate && state.gates.some((item) => item.unitKey === gate.afterUnitKey && item.passed)) {
                await v2MetricEvent(transaction, { userId: input.userId, enrollmentId: row.enrollment_id,
                  pathVersionId: row.path_version_id, kind: "gate_passed", semanticKey: `v2-gate:${row.id}`, at: serverTime });
              }
            }
            const manifest = await v2AttemptManifestFromRow(transaction, updated);
            return manifest ? { status: "success", value: manifest } : { status: "conflict" };
          }, (value) => v2ReplayAvailability(transaction, input.userId, value.attemptId));
      });
    },
  };
}

/** Aggregate adapter. Its HTTP caller enforces coordinator/administrator roles. */
export function createPostgresGuidedV2MetricsService(database: DatabaseClient, options: { now?: () => Date } = {}) {
  const now = () => options.now?.() ?? new Date();
  return {
    async feedbackViewed(input: { userId: string; attemptId: string; activityKey: string }) {
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" as const };
        const authorized = await v2AuthorizedAttempt(transaction, input.userId, input.attemptId, true);
        if (authorized.status !== "success") return authorized;
        const response = await transaction.selectFrom("learning_v2_responses").select("id")
          .where("attempt_id", "=", input.attemptId).where("activity_key", "=", input.activityKey).executeTakeFirst();
        if (!response || (authorized.row.purpose === "assessment" && authorized.row.status !== "completed")) return { status: "conflict" as const };
        await v2MetricEvent(transaction, { userId: input.userId, enrollmentId: authorized.row.enrollment_id,
          pathVersionId: authorized.row.path_version_id, kind: "feedback_viewed", semanticKey: `v2-feedback:${response.id}`, at: now() });
        return { status: "success" as const };
      });
    },
    async heartbeat(input: { userId: string; enrollmentId: string; deviceKey: string; tickKey: string; visible: boolean }) {
      const parsed = V2HeartbeatSchema.safeParse({ deviceKey: input.deviceKey, tickKey: input.tickKey, visible: input.visible });
      if (!parsed.success) return { status: "invalid" as const };
      return database.transaction().execute(async (transaction) => {
        const actor = await v2LockActor(transaction, input.userId);
        if (!actor) return { status: "forbidden" as const };
        const enrollment = await transaction.selectFrom("learning_enrollments").selectAll()
          .where("id", "=", input.enrollmentId).where("user_id", "=", input.userId).forUpdate().executeTakeFirst();
        if (!enrollment) return { status: "not_found" as const };
        const version = await transaction.selectFrom("learning_path_versions").select("policy_version").where("id", "=", enrollment.path_version_id).executeTakeFirst();
        if (enrollment.status !== "active" || version?.policy_version !== "guided-v2.0"
          || !(await v2ContentAvailable(transaction, enrollment.path_version_id))) return { status: "access_revoked" as const };
        const at = now(), semanticKey = `v2-heartbeat:${enrollment.path_version_id}:${enrollment.id}:${input.deviceKey}:${input.tickKey}`;
        const existing = await transaction.selectFrom("learning_events").select("payload_json")
          .where("user_id", "=", input.userId).where("semantic_key", "=", semanticKey).executeTakeFirst();
        if (existing) return { status: "success" as const };
        const interaction = await transaction.selectFrom("learning_events").select("occurred_at")
          .where("user_id", "=", input.userId).where("enrollment_id", "=", enrollment.id)
          .where("policy_version", "=", "guided-v2.0").where("event_type", "in", ["activity_presented", "response_accepted", "help_requested"])
          .where("occurred_at", "<=", at).orderBy("occurred_at", "desc").executeTakeFirst();
        const interval = heartbeatIntervalV2(at, interaction?.occurred_at ?? null, input.visible);
        // Persist empty ticks too: replay after becoming visible cannot rewrite the original tick.
        await v2MetricEvent(transaction, { userId: input.userId, enrollmentId: enrollment.id,
          pathVersionId: enrollment.path_version_id, kind: "heartbeat", semanticKey, at, interval: interval ?? undefined });
        return { status: "success" as const };
      });
    },
    async metrics(input: { pathId: string; pathVersionId: string; cohortStart: string; cohortEnd: string }) {
      return database.transaction().execute(async (transaction) => {
        const at = now();
        const version = await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
          .where("id", "=", input.pathVersionId).where("path_id", "=", input.pathId).where("policy_version", "=", "guided-v2.0").executeTakeFirst();
        if (!version) return { status: "not_found" as const };
        const definition = RoutePackageSchema.parse(version.definition_v2_json);
        const enrollments = await transaction.selectFrom("learning_enrollments").selectAll()
          .where("path_id", "=", input.pathId).where("path_version_id", "=", input.pathVersionId)
          .where("created_at", ">=", new Date(input.cohortStart)).where("created_at", "<", new Date(input.cohortEnd))
          .where("created_at", "<=", at).orderBy("user_id").execute();
        const learners: MetricLearnerV2[] = [], assessments: MetricAssessmentV2[] = [], heartbeats: MetricHeartbeatV2[] = [];
        for (const enrollment of enrollments) {
          // Deterministic actor lock order also protects cache/reward reconstruction.
          if (!(await v2LockActor(transaction, enrollment.user_id))) throw new Error("Guided v2 actor not found");
          const state = await v2RebuildEvidence(transaction, enrollment.user_id, enrollment.id, input.pathVersionId, at);
          learners.push({ enrollmentId: enrollment.id, activatedAt: enrollment.created_at.toISOString(),
            requiredObjectiveKeys: definition.objectives.filter((item) => item.required).map((item) => item.key),
            firstMasteredAt: Object.fromEntries(state.objectives.filter((item) => item.firstMasteredAt).map((item) => [item.objectiveKey, item.firstMasteredAt!])),
            completedAt: state.route.completedAt, masteredAt: state.route.masteredAt, consolidatedAt: state.route.consolidatedAt });
          const attempts = await transaction.selectFrom("learning_v2_attempts").selectAll()
            .where("enrollment_id", "=", enrollment.id).where("path_version_id", "=", input.pathVersionId).execute();
          const responses = await transaction.selectFrom("learning_v2_responses").selectAll()
            .where("enrollment_id", "=", enrollment.id).where("path_version_id", "=", input.pathVersionId).execute();
          const events = await transaction.selectFrom("learning_events").selectAll()
            .where("enrollment_id", "=", enrollment.id).where("policy_version", "=", "guided-v2.0").where("occurred_at", "<=", at).execute();
          for (const event of events) {
            const payload = event.payload_json;
            if (event.event_type === "heartbeat" && payload && typeof payload === "object" && !Array.isArray(payload)
              && payload.pathVersionId === input.pathVersionId && typeof payload.start === "string" && typeof payload.end === "string") {
              heartbeats.push({ enrollmentId: enrollment.id, semanticKey: event.semantic_key, start: payload.start, end: payload.end });
            }
          }
          for (const attempt of attempts) {
            if (attempt.status !== "completed" || !attempt.submitted_at || attempt.submitted_at > at) continue;
            const snapshot = parseGuidedV2AttemptSnapshot(attempt.snapshot_json);
            if (!snapshot || snapshot.target.kind !== "assessment") continue;
            const assessment = definition.assessments.find((item) => item.key === snapshot.target.key);
            if (!assessment || !["diagnostic", "final", "retention7", "retention30"].includes(assessment.kind)) continue;
            const presented = events.find((event) => event.semantic_key === `v2-presented:${attempt.id}`)?.occurred_at ?? attempt.started_at;
            const prior = responses.filter((response) => response.accepted_at < presented);
            const priorPresentations: RouteActivity[] = [];
            for (const event of events.filter((item) => item.occurred_at < presented
              && ["activity_presented", "help_requested"].includes(item.event_type))) {
              const payload = event.payload_json;
              if (!payload || typeof payload !== "object" || Array.isArray(payload) || typeof payload.v2AttemptId !== "string") continue;
              const previous = attempts.find((item) => item.id === payload.v2AttemptId);
              const previousSnapshot = previous && parseGuidedV2AttemptSnapshot(previous.snapshot_json);
              const key = typeof payload.activityKey === "string" ? payload.activityKey : previousSnapshot?.orderedKeys[0];
              const activity = previousSnapshot?.activities.find((item) => item.key === key);
              if (activity) priorPresentations.push(activity);
            }
            assessments.push({ enrollmentId: enrollment.id, attemptId: attempt.id, kind: assessment.kind as MetricAssessmentV2["kind"],
              acceptedAt: attempt.submitted_at.toISOString(), objectiveKeys: [...new Set(snapshot.orderedKeys.map((key) => snapshot.activities.find((item) => item.key === key)!.objectiveKey))],
              answers: responses.filter((response) => response.attempt_id === attempt.id).map((response) => {
                const modalities = [...prior.filter((item) => item.objective_key === response.objective_key).map((item) => item.modality),
                  ...priorPresentations.filter((item) => item.objectiveKey === response.objective_key).map((item) => item.representation)];
                return { objectiveKey: response.objective_key, equivalenceKey: response.equivalence_key,
                  modality: response.modality, score01: response.score01, gradingSource: response.grading_source, assisted: response.assisted,
                  novelAtPresentation: response.novel_at_presentation && !prior.some((item) => item.equivalence_key === response.equivalence_key)
                    && !priorPresentations.some((item) => item.equivalenceKey === response.equivalence_key),
                  newModality: modalities.length > 0 && !modalities.includes(response.modality) };
              }) });
          }
        }
        return { status: "success" as const, value: calculateMetricsV2({ ...input, nowUtc: at.toISOString(), learners, assessments, heartbeats }) };
      });
    },
  };
}

