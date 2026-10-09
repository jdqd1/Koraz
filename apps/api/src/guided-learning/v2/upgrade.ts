import { z } from "zod";
import { sql, type Selectable, type Transaction } from "kysely";
import { LearningObjectiveSchema, RoutePackageSchema, type RoutePackage, type RouteActivity } from "@cediah/contracts";
import type { CediahDatabase, JsonValue, LearningPathTable, LearningPathVersionTable } from "../../db/database.js";
import { hashLearningSnapshot } from "../snapshot-hash.js";
import { guidedV2PolicySnapshot } from "./service.js";

type Tx = Transaction<CediahDatabase>;
const ordered = <T extends { key: string }>(values: T[]) => [...values].sort((a, b) => a.key.localeCompare(b.key));
const intersect = (left: Set<string> | null, right: Set<string>): Set<string> => left ? new Set([...left].filter(key => right.has(key))) : right;
const issue = (code: string, path: string, message: string) => ({ code, path, message, severity: "error" as const, suggestedFix: "Revisar y completar explícitamente en el editor antes de publicar." });

/** Full objective content/evaluation fingerprint, including modalities and referenced assets.
 * Editorial order and route labels alone do not invalidate evidence. */
export function objectiveUpgradeHash(definition: RoutePackage, key: string, policy: unknown) {
  const objective = definition.objectives.find(item => item.key === key);
  if (!objective) return null;
  const assessments = definition.assessments.filter(item => item.objectiveKeys.includes(key));
  const relevantKeys = new Set(assessments.flatMap(item => item.candidateActivityKeys));
  for (const item of definition.activities) if (item.objectiveKey === key || item.relatedObjectiveKeys.includes(key)) relevantKeys.add(item.key);
  // Include referenced child/verification/accessible activities, so a wrapper cannot hide changes.
  for (let count = -1; count !== relevantKeys.size;) {
    count = relevantKeys.size;
    for (const item of definition.activities.filter(item => relevantKeys.has(item.key))) {
      const linked = item.kind === "case" ? item.payload.stages.map(stage => stage.childActivityKey)
        : item.kind === "constructed_response" ? [item.payload.verificationActivityKey]
          : item.kind === "image_target" ? [item.payload.accessibleAlternativeKey]
            : item.kind === "sequence" ? [item.payload.whyActivityKey] : [];
      for (const value of [...linked, item.alternativeActivityKey]) if (value) relevantKeys.add(value);
    }
  }
  const activities = definition.activities.filter(item => relevantKeys.has(item.key));
  const sourceKeys = new Set([...objective.sourceKeys, ...activities.flatMap(item => [...item.sourceKeys, ...item.feedback.sourceKeys])]);
  const assetKeys = new Set(activities.flatMap(item => "assetKey" in item.payload && item.payload.assetKey ? [item.payload.assetKey] : []));
  return hashLearningSnapshot({ policy, policyVersion: definition.policyVersion, objective,
    activities: ordered(activities), assessments: ordered(assessments),
    sources: ordered(definition.sources.filter(item => sourceKeys.has(item.key))),
    assets: ordered(definition.assets.filter(item => assetKeys.has(item.key))),
    review: definition.reviewPlan.objectiveKeys.includes(key) });
}

export function transferableObjectiveKeys(current: RoutePackage | null, target: RoutePackage, currentPolicy: unknown, targetPolicy: unknown) {
  if (!current || hashLearningSnapshot(currentPolicy) !== hashLearningSnapshot(targetPolicy)) return [];
  const equivalent = new Set(target.objectives.filter(item => objectiveUpgradeHash(current, item.key, currentPolicy)
    === objectiveUpgradeHash(target, item.key, targetPolicy)).map(item => item.key));
  // A changed prerequisite also invalidates dependent evidence, including transitive changes.
  let removed = true;
  while (removed) {
    removed = false;
    for (const objective of target.objectives) if (equivalent.has(objective.key)
      && objective.prerequisiteKeys.some(key => !equivalent.has(key))) { equivalent.delete(objective.key); removed = true; }
  }
  return [...equivalent].sort();
}

/** Follow only adopted edges. Intersections prevent evidence resurrection after a reset. */
export async function upgradeEvidenceVersions(transaction: Tx, enrollmentId: string, pathVersionId: string) {
  const rows = await transaction.selectFrom("learning_enrollment_versions").selectAll().where("enrollment_id", "=", enrollmentId).execute();
  const result = new Map<string, Set<string> | null>([[pathVersionId, null]]);
  let cursor = pathVersionId, eligible: Set<string> | null = null;
  while (true) {
    const row = rows.find(item => item.path_version_id === cursor);
    const mapping = row?.mapping_json;
    if (!row?.previous_version_id || !mapping || typeof mapping !== "object" || Array.isArray(mapping)
      || mapping.kind !== "guided-v2-upgrade" || !Array.isArray(mapping.equivalentObjectiveKeys)) break;
    const keys = new Set(mapping.equivalentObjectiveKeys.filter((value): value is string => typeof value === "string"));
    eligible = intersect(eligible, keys);
    if (!eligible.size || result.has(row.previous_version_id)) break;
    result.set(row.previous_version_id, eligible);
    cursor = row.previous_version_id;
  }
  return result;
}

export function acceptsUpgradeFact(versions: Map<string, Set<string> | null>, versionId: string, objectiveKey: string) {
  return versions.has(versionId) && (versions.get(versionId) === null || versions.get(versionId)!.has(objectiveKey));
}

/** Read original immutable facts through authorized adoption history, without copying rows. */
export async function readUpgradeEvidence(transaction: Tx, userId: string, enrollmentId: string, pathVersionId: string) {
  const versions = await upgradeEvidenceVersions(transaction, enrollmentId, pathVersionId);
  const versionIds = [...versions.keys()];
  const attempts = await transaction.selectFrom("learning_v2_attempts").selectAll()
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId).where("path_version_id", "in", versionIds).orderBy("created_at").execute();
  const responses = (await transaction.selectFrom("learning_v2_responses").selectAll()
    .where("user_id", "=", userId).where("enrollment_id", "=", enrollmentId).where("path_version_id", "in", versionIds).execute())
    .filter(row => acceptsUpgradeFact(versions, row.path_version_id, row.objective_key));
  return { versions, attempts, responses };
}

export async function readGuidedV2VersionHistory(transaction: Tx, enrollmentId: string) {
  const rows = await transaction.selectFrom("learning_enrollment_versions").innerJoin("learning_path_versions", "learning_path_versions.id", "learning_enrollment_versions.path_version_id")
    .select(["learning_enrollment_versions.path_version_id", "learning_enrollment_versions.previous_version_id", "learning_enrollment_versions.adopted_at", "learning_enrollment_versions.mapping_json", "learning_path_versions.version_number", "learning_path_versions.policy_version"])
    .where("learning_enrollment_versions.enrollment_id", "=", enrollmentId).orderBy("learning_path_versions.version_number").execute();
  return rows.map(row => {
    const next = rows.find(item => item.previous_version_id === row.path_version_id);
    const value = next?.mapping_json;
    const mapping = value && typeof value === "object" && !Array.isArray(value) ? value : null;
    return { versionNumber: row.version_number, engineVersion: row.policy_version === "guided-v2.0" ? "guided-v2" as const : "guided-v1" as const,
      adoptedAt: row.adopted_at.toISOString(), completedAt: typeof mapping?.previousCompletedAt === "string" ? mapping.previousCompletedAt : null,
      consumedActivities: Array.isArray(mapping?.consumedActivities) ? mapping.consumedActivities.flatMap(item => item && typeof item === "object" && !Array.isArray(item) && typeof item.title === "string" ? [item.title] : []) : [] };
  });
}

/** Caller holds actor lock; commit additionally locks the enrollment and uses a durable receipt. */
export async function planGuidedV2Upgrade(transaction: Tx, userId: string, enrollmentId: string, targetId?: string) {
  const enrollment = await transaction.selectFrom("learning_enrollments").selectAll().where("id", "=", enrollmentId).where("user_id", "=", userId).forUpdate().executeTakeFirst();
  if (!enrollment) return { status: "not_found" as const };
  const path = await transaction.selectFrom("learning_paths").selectAll().where("id", "=", enrollment.path_id).forShare().executeTakeFirstOrThrow();
  if (path.archived_at || enrollment.status === "archived") return { status: "conflict" as const };
  const current = await transaction.selectFrom("learning_path_versions").selectAll().where("id", "=", enrollment.path_version_id).executeTakeFirstOrThrow();
  const target = await transaction.selectFrom("learning_path_versions").selectAll().where("id", "=", targetId ?? path.published_version_id ?? enrollment.path_version_id).where("path_id", "=", path.id).forShare().executeTakeFirst();
  if (!target || target.id === current.id || target.status !== "published" || !target.published_at || target.policy_version !== "guided-v2.0"
    || target.version_number <= current.version_number) return { status: "conflict" as const };
  const definition = RoutePackageSchema.parse(target.definition_v2_json);
  const old = current.policy_version === "guided-v2.0" ? RoutePackageSchema.parse(current.definition_v2_json) : null;
  const equivalent = transferableObjectiveKeys(old, definition, current.policy_json, target.policy_json);
  const [v1Open, v2Open] = await Promise.all([
    transaction.selectFrom("learning_attempts").select("id").where("enrollment_id", "=", enrollmentId).where("status", "=", "in_progress").executeTakeFirst(),
    transaction.selectFrom("learning_v2_attempts").select("id").where("enrollment_id", "=", enrollmentId).where("status", "in", ["in_progress", "paused"]).executeTakeFirst(),
  ]);
  const consumedActivities = old
    ? (await transaction.selectFrom("learning_v2_responses").select(["activity_key"]).where("enrollment_id", "=", enrollmentId).where("path_version_id", "=", current.id).execute())
      .flatMap(row => { const activity = old.activities.find(item => item.key === row.activity_key && item.kind === "study"); return activity ? [{ title: activity.prompt, previousActivityKey: activity.key, consumptionOnly: true as const }] : []; })
    : (await transaction.selectFrom("learning_step_progress").innerJoin("learning_path_steps", "learning_path_steps.id", "learning_step_progress.step_id")
      .select(["learning_path_steps.title", "learning_path_steps.stable_key"]).where("learning_step_progress.enrollment_id", "=", enrollmentId)
      .where("learning_step_progress.path_version_id", "=", current.id).where("learning_step_progress.state", "=", "completed").execute())
      .map(row => ({ title: row.title, previousActivityKey: row.stable_key, consumptionOnly: true as const }));
  return { status: "success" as const, enrollment, current, target, definition, equivalent,
    preview: { targetVersionId: target.id, expectedVersion: enrollment.row_version,
      objectiveImpact: definition.objectives.map(item => ({ objectiveKey: item.key, title: item.title, willResetEvidence: !equivalent.includes(item.key) })),
      consumedActivities, openAttempt: Boolean(v1Open || v2Open), engineChange: !old } };
}

export async function adoptGuidedV2Upgrade(transaction: Tx, plan: Extract<Awaited<ReturnType<typeof planGuidedV2Upgrade>>, { status: "success" }>, at: Date) {
  const mapping = { kind: "guided-v2-upgrade", fromPathVersionId: plan.current.id, toPathVersionId: plan.target.id,
    adoptedAt: at.toISOString(), equivalentObjectiveKeys: plan.equivalent, engineChange: plan.preview.engineChange,
    previousCompletedAt: plan.enrollment.completed_at?.toISOString() ?? null, consumedActivities: plan.preview.consumedActivities };
  await transaction.insertInto("learning_enrollment_versions").values({ enrollment_id: plan.enrollment.id, path_id: plan.enrollment.path_id,
    path_version_id: plan.target.id, previous_version_id: plan.current.id, mapping_json: mapping, adopted_at: at }).execute();
  await transaction.updateTable("learning_enrollments").set({ path_version_id: plan.target.id, row_version: sql<number>`row_version + 1`,
    completed_at: null, updated_at: at }).where("id", "=", plan.enrollment.id).execute();
  // No historical fact, attempt, reward or completion date is overwritten.
}

function guideBody(value: JsonValue): string {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) return value.map(guideBody).filter(Boolean).join("\n\n");
  return Object.entries(value).flatMap(([key, content]) => typeof content === "string" && ["text", "body"].includes(key)
    ? [content] : typeof content === "object" && content ? [guideBody(content)] : []).filter(Boolean).join("\n\n");
}

/** Structural proposals stay in a blocked draft. No dependency or mastery is inferred. */
export async function convertGuidedV1(transaction: Tx, path: Selectable<LearningPathTable>, version: Selectable<LearningPathVersionTable>, actorUserId: string, canEditAll = false) {
  const units = await transaction.selectFrom("learning_path_units").selectAll().where("path_version_id", "=", version.id).orderBy("position").execute();
  const steps = await transaction.selectFrom("learning_path_steps").selectAll().where("path_version_id", "=", version.id).orderBy("position").execute();
  const options = await transaction.selectFrom("learning_step_options").selectAll().where("path_version_id", "=", version.id).orderBy("position").execute();
  const key = (prefix: string, id: string) => `${prefix}-${id}`;
  const mapping: { kind: string; fromId: string; toKey: string }[] = [];
  const issues = [issue("CONVERSION_REVIEW", "/objectives", "Verbo y criticidad son propuestas: revisar importance 3→core, 2→high_yield, 1→supporting."),
    issue("CONVERSION_DEPENDENCIES", "/objectives", "Seleccionar prerrequisitos explícitos; recommendedAfter no crea dependencias."),
    issue("CONVERSION_PEDAGOGY", "/activities", "Completar fases de recuperación, elaboración, aplicación y ayuda."),
    issue("CONVERSION_RESERVES", "/assessments", "Crear gates y reservas de evaluación final y retención.")];
  const objectives: RoutePackage["objectives"] = [];
  const convertedUnits: RoutePackage["units"] = [];
  const sources: RoutePackage["sources"] = [];
  const activities: RouteActivity[] = [];
  const bindings: { key: string; sourceContentId: string; resourceRevisionId: string }[] = [];
  for (const unit of units) {
    const unitKey = key("unit", unit.id); mapping.push({ kind: "unit", fromId: unit.id, toKey: unitKey });
    const parsed = z.array(LearningObjectiveSchema).safeParse(unit.objectives_json);
    const unitObjectives = parsed.success ? parsed.data : [];
    for (const objective of unitObjectives) {
      const objectiveKey = key("objective", objective.id); mapping.push({ kind: "objective", fromId: objective.id, toKey: objectiveKey });
      objectives.push({ key: objectiveKey, title: objective.title, unitKey, verb: "recall", criticality: objective.importance === 3 ? "core" : objective.importance === 2 ? "high_yield" : "supporting",
        required: objective.importance === 3, prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] });
    }
    const unitActivities: string[] = [];
    for (const step of steps.filter(item => item.unit_id === unit.id)) {
      const objectiveIds = z.array(z.string().uuid()).safeParse(step.objective_ids_json);
      const targetObjectives = unitObjectives.filter(item => objectiveIds.success && objectiveIds.data.includes(item.id));
      if (!targetObjectives.length) { issues.push(issue("CONVERSION_OBJECTIVE_MISSING", "/activities", `La actividad «${step.title}» no tiene un objetivo resoluble.`)); continue; }
      for (const option of options.filter(item => item.step_id === step.id)) {
        const resource = await transaction.selectFrom("learning_resource_revisions").innerJoin("learning_resources", "learning_resources.id", "learning_resource_revisions.resource_id")
          .innerJoin("content_items", "content_items.id", "learning_resources.source_content_id")
          .select(["learning_resource_revisions.id", "learning_resource_revisions.payload_json", "learning_resource_revisions.payload_hash", "learning_resources.source_content_id", "learning_resources.projection", "learning_resources.retired_at", "content_items.title", "content_items.status", "content_items.author_user_id", "content_items.catalog_visibility"])
          .where("learning_resource_revisions.id", "=", option.resource_revision_id).executeTakeFirst();
        const body = resource ? guideBody(resource.payload_json) : "";
        if (!resource || resource.retired_at || resource.projection !== "guide" || !body || body.length > 10000
          || resource.source_content_id !== option.source_content_id
          || hashLearningSnapshot(resource.payload_json) !== resource.payload_hash
          || !(resource.status === "published" && resource.catalog_visibility === "catalog" || resource.author_user_id === actorUserId || canEditAll)) {
          issues.push(issue("CONVERSION_RESOURCE_MISSING", "/sources", `Revisar el recurso de «${step.title}»: ${body.length > 10000 ? "excede 10 000 caracteres; dividir explícitamente antes de convertir" : "no se convierte automáticamente"}.`)); continue;
        }
        const sourceKey = key("guide", resource.id), activityKey = key("activity", option.id);
        if (!sources.some(item => item.key === sourceKey)) {
          sources.push({ key: sourceKey, kind: "guide", title: resource.title, citation: "", locator: { heading: "", sectionPath: [], page: null }, documentSha256: resource.payload_hash,
            excerpt: "", url: null, verification: "unverified", checkedAt: null });
          bindings.push({ key: sourceKey, sourceContentId: resource.source_content_id, resourceRevisionId: resource.id });
          mapping.push({ kind: "source-revision", fromId: resource.id, toKey: sourceKey });
        }
        const objectiveKey = key("objective", targetObjectives[0]!.id);
        objectives.find(item => item.key === objectiveKey)!.sourceKeys.push(sourceKey);
        activities.push({ key: activityKey, objectiveKey, relatedObjectiveKeys: targetObjectives.slice(1).map(item => key("objective", item.id)), kind: "study", phase: "learn", required: step.is_essential,
          sourceKeys: [sourceKey], representation: "text", equivalenceKey: activityKey, use: "learning", hints: [], prompt: step.title,
          feedback: { explanation: "Revisar la explicación y su referencia antes de publicar.", commonError: "", sourceKeys: [sourceKey] }, misconceptionMappings: [], alternativeActivityKey: null,
          payload: { body, focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } });
        unitActivities.push(activityKey); mapping.push({ kind: "step", fromId: step.id, toKey: activityKey }, { kind: "step-option", fromId: option.id, toKey: activityKey });
      }
    }
    convertedUnits.push({ key: unitKey, title: unit.title, objectiveKeys: unitObjectives.map(item => key("objective", item.id)), activityKeys: unitActivities, support: "full", estimatedMinutes: null });
  }
  for (const objective of objectives) objective.sourceKeys = [...new Set(objective.sourceKeys)];
  issues.push(issue("CONVERSION_SOURCES", "/sources", "Completar y verificar citas y fragmentos de las fuentes copiadas."));
  const definition = RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: key("converted", path.id), revision: 1, locale: "es", policyVersion: "guided-v2.0",
    route: { slug: path.slug, title: path.title, summary: path.summary || path.title, topicLabel: path.title, audience: "Alumno", discipline: "general", coverKey: path.cover_key ?? "heart" },
    sources, assets: [], objectives, units: convertedUnits, activities, assessments: [], reviewPlan: { objectiveKeys: [] },
    editorial: { notes: "Conversión v1: borrador incompleto con propuestas pendientes de revisión editorial.", unresolvedIssues: issues } });
  const newVersion = await transaction.insertInto("learning_path_versions").values({ path_id: path.id, version_number: version.version_number + 1,
    status: "draft", policy_version: "guided-v2.0", release_notes: "", policy_json: guidedV2PolicySnapshot as JsonValue, definition_v2_json: definition as JsonValue }).returningAll().executeTakeFirstOrThrow();
  await transaction.insertInto("learning_v2_bindings").values({ path_version_id: newVersion.id, local_key: "topic", kind: "topic", topic_content_id: path.topic_content_id }).execute();
  for (const source of bindings) await transaction.insertInto("learning_v2_bindings").values({ path_version_id: newVersion.id, local_key: source.key, kind: "source",
    source_content_id: source.sourceContentId, resource_revision_id: source.resourceRevisionId, document_sha256: sources.find(item => item.key === source.key)!.documentSha256 }).execute();
  await transaction.withTables<{ guided_v2_audit: CediahDatabase["audit_log"] }>().withSchema("private").insertInto("guided_v2_audit").values({
    action: "learning_path_v2_created", actor_user_id: actorUserId, target_type: "learning_path", target_id: path.id,
    metadata: { operation: "convert-v1", fromVersionId: version.id, toVersionId: newVersion.id, identities: mapping } }).execute();
  return { status: "success" as const, value: { draft: { pathId: path.id, pathVersionId: newVersion.id, editVersion: newVersion.edit_version, status: "draft" as const }, issues } };
}

