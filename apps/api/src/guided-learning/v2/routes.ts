import type { FastifyInstance } from "fastify";
import type { S3ObjectStorage } from "../../providers/s3-object-storage.js";
import { z } from "zod";
import { sql, type Transaction } from "kysely";
import {
  RoutePackageSchema, V2HttpContracts, V2RouteStateSchema, V2PublicPathSchema, V2AttemptManifestSchema,
  V2CatalogResponseSchema, V2HomeSnapshotSchema, V2PathCardSchema,
  type IdentityProvider, type RoutePackage,
} from "@cediah/contracts";
import type { DatabaseClient, CediahDatabase } from "../../db/database.js";
import { resolveGuidedUser, sendGuidedUserError } from "../http.js";
import { createPostgresGuidedV2AttemptService, createPostgresGuidedV2MetricsService,
  v2ContentAvailable, v2RebuildEvidence, v2Receipt, v2LockActor, createGuidedV2DefinitionReader, prepareCachedGuidedV2ActivitySnapshot, readGuidedV2SourceFacts, createGuidedV2SnapshotReader,
  type GuidedV2DefinitionReader, type GuidedV2EvidenceReadFacts, type GuidedV2SnapshotReader } from "../../providers/postgres-guided-learning-v2.js";
import { parseGuidedV2AttemptSnapshot } from "./service.js";
import { selectGuidedV2NextAction, selectGuidedV2Diagnostic } from "./selection.js";
import { selectAssessmentV2, type AssessmentExposureV2, type AssessmentPlanV2 } from "./assessments.js";
import { reviewDueV2, type ReviewStateV2 } from "./scheduler.js";
import { hashRoutePackage } from "./validation.js";
import type { GuidedV2EvidenceEvent } from "./evidence.js";
import { hashLearningSnapshot } from "../snapshot-hash.js";
import { guidedV2FeedbackSources } from "./manifests.js";
import { planGuidedV2Upgrade, adoptGuidedV2Upgrade, acceptsUpgradeFact, readGuidedV2VersionHistory } from "./upgrade.js";

type Tx = Transaction<CediahDatabase>;
type Failure = { status: string };
type Success = { status: "success"; value: unknown };
export type GuidedV2HttpProvider = {
  invoke(name: string, userId: string, params: Record<string, unknown>, body: Record<string, unknown>, key: string): Promise<Failure | Success>;
};
export type GuidedV2Flags = { enabled: boolean; newEnrollments: boolean; allowlist?: ReadonlySet<string> };
type HttpEndpoint = { name: string; method: "GET" | "POST"; path: string;
  params: z.ZodType<Record<string, unknown>>; query: z.ZodType<Record<string, unknown>>;
  body: z.ZodType<Record<string, unknown>>; headers: z.ZodType<Record<string, unknown>>; response: z.ZodType };

const empty = z.strictObject({});
const learnerNames = ["publicPath", "enrollmentCreate", "enrollmentState", "attemptCreate", "attemptGet",
  "attemptHelp", "attemptImage", "attemptAlternative", "attemptResponse", "attemptComplete", "attemptHeartbeat", "upgradePreview", "upgradeCommit"] as const;

/** Every endpoint validates its versioned request/response, including failure and flag paths. */
export async function registerGuidedV2Routes(app: FastifyInstance, dependencies: {
  identityProvider?: IdentityProvider; provider?: GuidedV2HttpProvider; flags: GuidedV2Flags;
}) {
  app.addHook("onError", async (request, reply, error) => {
    if (!request.url.startsWith("/v2/guided-learning/")) return;
    reply.header("Cache-Control", "private, no-store");
    // Preserve the existing origin rejection while giving v2 its specified status.
    if (error.message === "Origin not allowed") error.statusCode = 403;
  });
  const endpoints: HttpEndpoint[] = [...learnerNames.map((name) => ({ name, ...V2HttpContracts[name] })),
    { name: "catalog", method: "GET" as const, path: "/v2/guided-learning/paths", params: empty,
      query: z.strictObject({ limit: z.coerce.number().int().min(1).max(100).default(20), cursor: z.string().uuid().optional() }),
      body: empty, headers: empty, response: V2CatalogResponseSchema },
    { name: "home", method: "GET" as const, path: "/v2/guided-learning/home", params: empty,
      query: empty, body: empty, headers: empty, response: V2HomeSnapshotSchema }];
  endpoints.push({ name: "feedbackViewed", method: "POST", path: "/v2/guided-learning/attempts/:id/feedback-viewed",
    params: V2HttpContracts.attemptGet.params, query: empty,
    body: z.strictObject({ activityKey: V2HttpContracts.attemptResponse.body.shape.activityKey, acknowledged: z.literal(true) }),
    headers: V2HttpContracts.attemptHeartbeat.headers, response: V2HttpContracts.attemptHeartbeat.response });
  for (const endpoint of endpoints) app.route({ method: endpoint.method, url: endpoint.path,
    handler: async (request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      const maintenance = !dependencies.flags.enabled;
      const actor = await resolveGuidedUser(request, dependencies.identityProvider);
      if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
      if (dependencies.flags.allowlist?.size && !dependencies.flags.allowlist.has(actor.user.id)) return reply.status(403).send({ error: "forbidden" });
      const params = endpoint.params.safeParse(request.params), query = endpoint.query.safeParse(request.query);
      const body = endpoint.body.safeParse(request.body ?? {});
      const headers = endpoint.headers.safeParse(endpoint.method === "GET" ? {} : { idempotencyKey: request.headers["idempotency-key"] });
      if (!params.success || !query.success || !body.success || !headers.success) return reply.status(400).send({ error: "invalid_request" });
      if (maintenance && (endpoint.method !== "GET" || endpoint.name === "attemptImage")) return reply.status(503).send({ error: "guided_v2_maintenance" });
      if (endpoint.name === "enrollmentCreate" && !dependencies.flags.newEnrollments) return reply.status(403).send({ error: "new_enrollments_disabled" });
      if (!dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
      try {
        const result = await dependencies.provider.invoke(endpoint.name, actor.user.id,
          { ...params.data, ...query.data, maintenance }, body.data, endpoint.method === "GET" ? "" : String(request.headers["idempotency-key"]));
        if (result.status !== "success" || !("value" in result)) {
          const status = result.status === "rate_limited" ? 429 : result.status === "not_found" ? 404 : ["forbidden", "access_revoked"].includes(result.status) ? 403
            : ["invalid", "invalid_answer"].includes(result.status) ? 400 : 409;
          return reply.status(status).send({ error: result.status });
        }
        return reply.send(endpoint.response.parse(result.value));
      } catch {
        // Never log request bodies or provider error details containing learner text.
        request.log.error("Guided v2 request failed");
        return reply.status(503).send({ error: "learning_unavailable" });
      }
    } });
}

/** Construct policy input from the enrolled version and server receipts, never browser counters. */
async function loadContext(transaction: Tx, userId: string, enrollmentId: string, at: Date, readOnly = false, award = true,
  loaded?: { pathVersionId: string; definition: RoutePackage }, readDefinition?: GuidedV2DefinitionReader, readSnapshot?: GuidedV2SnapshotReader) {
  const joined = await transaction.selectFrom("learning_enrollments as enrollment")
    .innerJoin("learning_path_versions as version", "version.id", "enrollment.path_version_id")
    .selectAll("enrollment").select(["version.id as versionId", "version.policy_version as versionPolicy",
      "version.status as versionStatus", "version.edit_version as versionEdit"])
    .select(sql<string>`version.updated_at::text`.as("versionUpdatedAt"))
    .where("enrollment.id", "=", enrollmentId).where("enrollment.user_id", "=", userId)
    .where("version.policy_version", "=", "guided-v2.0").executeTakeFirst();
  if (!joined) return null;
  const { versionId, versionPolicy, versionStatus, versionEdit, versionUpdatedAt, ...enrollment } = joined;
  const reuse = loaded?.pathVersionId === enrollment.path_version_id;
  const version = { id: versionId };
  if (enrollment.status !== "active") return null;
  const parsed = reuse ? { success: true as const, data: loaded.definition }
    : readDefinition ? { success: true as const, data: await readDefinition(transaction, version.id,
      { id: versionId, policy_version: versionPolicy, status: versionStatus, edit_version: versionEdit, updatedAt: versionUpdatedAt }) }
      : RoutePackageSchema.safeParse((await transaction.selectFrom("learning_path_versions").select("definition_v2_json")
        .where("id", "=", versionId).executeTakeFirst())?.definition_v2_json);
  if (!parsed.success || !parsed.data || !(await v2ContentAvailable(transaction, version.id, { pathVersionId: version.id, definition: parsed.data }))) return null;
  const definition = parsed.data;
  const facts = await readGuidedV2SourceFacts(transaction, userId, enrollmentId, version.id);
  const readFacts: { value?: GuidedV2EvidenceReadFacts } = {};
  const evidence = await v2RebuildEvidence(transaction, userId, enrollmentId, version.id, at, { persist: !readOnly, award, readSnapshot,
    loaded: { userId, enrollmentId, pathVersionId: version.id, definition, facts }, onReadFacts: value => { readFacts.value = value; } });
  const { attempts, responses, versions } = facts;
  const snapshots = readFacts.value!.snapshots;
  const snapshotActivities = new Map([...snapshots].map(([key, snapshot]) => [key, new Map(snapshot?.activities.map((item) => [item.key, item]) ?? [])]));
  const evidenceByKey = new Map(evidence.objectives.map((item) => [item.objectiveKey, item]));
  // Reuse this operation's fresh source facts. Rebuild writes only reward,
  // schedule and route metrics; none changes presentation/help exposures.
  const events = readFacts.value!.events.filter(event => event.occurred_at <= at);
  const exposures: AssessmentExposureV2[] = [];
  const policyEvents: GuidedV2EvidenceEvent[] = [];
  for (const response of responses) exposures.push({ semanticKey: `response:${response.id}`, at: response.accepted_at.toISOString(),
    objectiveKey: response.objective_key, equivalenceKey: response.equivalence_key, modality: response.modality, audience: "student", kind: "response" });
  for (const response of responses) {
    const activity = snapshotActivities.get(response.attempt_id)?.get(response.activity_key);
    if (!activity) continue;
    const grading = response.grading_json;
    policyEvents.push({ kind: "response", id: response.id, semanticKey: `response:${response.id}`, at: response.accepted_at.toISOString(),
      attemptId: response.attempt_id, activityKey: response.activity_key, objectiveKey: response.objective_key,
      equivalenceKey: response.equivalence_key, phase: activity.phase, modality: response.modality, purpose: response.purpose,
      gradingSource: response.grading_source, score01: response.score01, assisted: response.assisted, valid: true,
      responseKey: grading && typeof grading === "object" && !Array.isArray(grading) && typeof grading.responseKey === "string" ? grading.responseKey : null });
  }
  for (const event of events) {
    const payload = event.payload_json;
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || typeof payload.v2AttemptId !== "string") continue;
    const snapshot = snapshots.get(payload.v2AttemptId);
    const key = typeof payload.activityKey === "string" ? payload.activityKey : snapshot?.orderedKeys[0];
    const activity = key ? snapshotActivities.get(payload.v2AttemptId)?.get(key) : undefined;
    if (activity && snapshot && !acceptsUpgradeFact(versions, snapshot.pathVersionId, activity.objectiveKey)) continue;
    if (activity && ["activity_presented", "help_requested"].includes(event.event_type)) exposures.push({ semanticKey: event.semantic_key,
      at: event.occurred_at.toISOString(), objectiveKey: activity.objectiveKey, equivalenceKey: activity.equivalenceKey,
      modality: activity.representation, audience: "student", kind: payload.kind === "reveal" ? "reveal" : "presentation" });
    if (activity && ["activity_presented", "help_requested"].includes(event.event_type)) policyEvents.push({ id: event.id,
      semanticKey: event.semantic_key, at: event.occurred_at.toISOString(), activityKey: activity.key,
      ...(payload.kind === "reveal" ? { kind: "reveal" as const } : { kind: "interaction" as const, assisted: event.event_type === "help_requested" }) });
  }
  const reviews = readFacts.value!.reviews.filter(row => row.user_id === userId && row.enrollment_id === enrollmentId && row.path_version_id === version.id);
  const reviewStates = reviews.map((row) => ({ objectiveKey: row.objective_key,
    firstMasteredAt: evidenceByKey.get(row.objective_key)?.firstMasteredAt ?? "",
    state: { stage: row.stage, lapses: row.lapses, dueAt: row.due_at.toISOString(), lastAppliedResponseId: row.last_applied_response_id,
      lastExtendedAt: row.last_extended_at?.toISOString() ?? null, retention7DueAt: row.retention7_due_at?.toISOString() ?? null,
      retention7AcceptedAt: row.retention7_accepted_at?.toISOString() ?? null, retention30DueAt: row.retention30_due_at?.toISOString() ?? null,
      retention30AcceptedAt: row.retention30_accepted_at?.toISOString() ?? null } as ReviewStateV2 }));
  const due = reviewStates.map((row) => ({ ...row, due: reviewDueV2(row.state, at) })).filter((row) => row.due.kind !== null);
  const completedAssessmentKeys = attempts.filter((item) => item.path_version_id === version.id && item.status === "completed").flatMap((item) => {
    const snapshot = snapshots.get(item.id); return snapshot?.target.kind === "assessment" ? [snapshot.target.key] : [];
  });
  const diagnosticStatus = definition.assessments.some((item) => item.kind === "diagnostic" && completedAssessmentKeys.includes(item.key))
    ? "completed" as const : attempts.some((item) => item.purpose === "activity") ? "omitted" as const : "pending" as const;
  const completedCaseKeys = attempts.filter((item) => item.path_version_id === version.id && item.status === "completed").flatMap((item) => {
    const snapshot = snapshots.get(item.id);
    return snapshot?.target.kind === "activity"
      && snapshot.activities.some((activity) => activity.kind === "case" && activity.key === snapshot.target.key)
      ? [snapshot.target.key] : [];
  });
  const sessionAttempts = new Set(responses.filter((response) => at.getTime() - response.accepted_at.getTime() < 86400000).map((response) => response.attempt_id));
  const selection = selectGuidedV2NextAction({ definition, evidence,
    events: policyEvents, sessionAttemptIds: attempts.filter((item) => sessionAttempts.has(item.id)).map((item) => item.id), diagnosticStatus,
    completedActivityKeys: [...responses.filter((item) => ["learning", "gate"].includes(item.purpose)).map((item) => item.activity_key),
      ...completedCaseKeys],
    dispensedActivityKeys: [], completedAssessmentKeys,
    openAttempts: attempts.filter((item) => item.path_version_id === version.id && item.status === "in_progress").map((item) => ({ key: item.id,
      openedAt: events.find((event) => event.semantic_key === `v2-presented:${item.id}`)?.occurred_at.toISOString() ?? item.started_at.toISOString() })),
    retentionDue: due.flatMap((row) => definition.assessments.filter((item) => item.kind === row.due.kind).map((item) => ({ key: item.key, dueAt: row.due.dueAt! }))),
    reviewDue: due.filter((row) => row.due!.kind === "review").flatMap((row) => {
      const activity = definition.activities.find((item) => item.objectiveKey === row.objectiveKey && item.phase === "retrieve" && ["learning", "gate"].includes(item.use));
      return activity ? [{ key: activity.key, objectiveKey: row.objectiveKey, dueAt: row.due.dueAt! }] : [];
    }) }, at.toISOString());
  const final = definition.assessments.find((item) => item.kind === "final" && !completedAssessmentKeys.includes(item.key));
  if (selection.nextAction.kind === "none" && final && evidence.route.plannedRequiredActivities > 0
    && evidence.route.completedActivities + evidence.route.dispensedActivities === evidence.route.plannedRequiredActivities) {
    selection.nextAction = { kind: "gate", key: final.key, reason: "Evaluación final disponible; las actividades completadas no implican dominio acreditado" };
  }
  const preferences = await transaction.selectFrom("learning_preferences").select("timezone").where("user_id", "=", userId).executeTakeFirst();
  let timeZone = preferences?.timezone ?? "UTC";
  try { new Intl.DateTimeFormat("es", { timeZone }); } catch { timeZone = "UTC"; }
  const measurement = (firstMasteredAt: string, dueAt: string | null, acceptedAt: string | null) => ({ dueAt, acceptedAt,
    elapsedDays: acceptedAt && firstMasteredAt ? Math.max(0, (Date.parse(acceptedAt) - Date.parse(firstMasteredAt)) / 86400000) : null });
  // Explicit public allowlist: no activity payloads, reserves, sources, mappings or solutions.
  const maintenance = {
    generatedAt: at.toISOString(), timeZone,
    diagnostic: { status: selection.diagnostic.assessmentKey && selection.diagnostic.activityKeys.length ? diagnosticStatus : "unavailable",
      assessmentKey: diagnosticStatus === "pending" && selection.diagnostic.activityKeys.length ? selection.diagnostic.assessmentKey : null },
    activities: selection.availableActivities.map(({ key, objectiveKey, reason }) => ({ key, objectiveKey, reason })),
    reviewBatch: selection.reviewBatch.map(({ key, objectiveKey, dueAt }) => ({ key, objectiveKey, dueAt })),
    agenda: reviewStates.map(({ objectiveKey, firstMasteredAt, state: review }) => ({ objectiveKey, dueAt: review.dueAt,
      retention7: measurement(firstMasteredAt, review.retention7DueAt, review.retention7AcceptedAt),
      retention30: measurement(firstMasteredAt, review.retention30DueAt, review.retention30AcceptedAt) })),
    gates: evidence.gates.map(({ unitKey, passed, score, thresholdPercent, missingCoreKeys, criticalErrorKeys }) => ({ unitKey, passed, score, thresholdPercent, missingCoreKeys, criticalErrorKeys })),
    blockers: evidence.availability.filter(item => !item.available).map(({ objectiveKey, blockedBy }) => ({ objectiveKey, blockedBy })),
    remediation: selection.remediationOffers.map(({ objectiveKey, confusion, message, activityKey, bankExhausted, availableAfter, pauseOffered }) => ({ objectiveKey, confusion, message,
      activityKey: activityKey && (selection.nextAction.key === activityKey || selection.availableActivities.some(item => item.key === activityKey)) ? activityKey : null,
      bankExhausted, availableAfter, pauseOffered })),
    exhaustedBanks: selection.exhaustedBanks.map(({ objectiveKey, availableAfter }) => ({ objectiveKey, availableAfter })),
  };
  const state = V2RouteStateSchema.parse({ engineVersion: "guided-v2", enrollmentId, pathVersionId: version.id, rowVersion: enrollment.row_version,
    completedActivities: evidence.route.completedActivities, dispensedActivities: evidence.route.dispensedActivities,
    plannedRequiredActivities: evidence.route.plannedRequiredActivities, completedAt: evidence.route.completedAt,
    masteredAt: evidence.route.masteredAt, consolidatedAt: evidence.route.consolidatedAt,
    objectives: evidence.objectives.map(({ objectiveKey, label, objectiveScore, criticalErrorOpen, assisted, applicationDemonstrated, reviewDue,
      firstMasteredAt, firstConsolidatedAt }) => ({ objectiveKey, label, objectiveScore, criticalErrorOpen, assisted, applicationDemonstrated,
    reviewDue, firstMasteredAt, firstConsolidatedAt })), dueReviews: due.length,
    availability: readOnly ? "maintenance" : "active", versionHistory: await readGuidedV2VersionHistory(transaction, enrollmentId),
    nextAction: readOnly ? { kind: "none", key: null, reason: "Ruta en mantenimiento; tu versión y tu historial se conservan." } : selection.nextAction, maintenance });
  return { enrollment, version, definition, evidence, attempts, responses, exposures, reviewStates, selection, state, diagnosticStatus };
}

export function createGuidedV2HttpProvider(database: DatabaseClient, options: { now?: () => Date; assetStorage?: Pick<S3ObjectStorage, "bucket" | "createDownloadUrl"> } = {}): GuidedV2HttpProvider {
  const now = () => options.now?.() ?? new Date();
  const readDefinition = createGuidedV2DefinitionReader(database);
  const context = (transaction: Tx, userId: string, enrollmentId: string, at: Date, readOnly = false, award = true,
    loaded?: { pathVersionId: string; definition: RoutePackage }, readSnapshot?: GuidedV2SnapshotReader) => loadContext(transaction, userId, enrollmentId, at, readOnly, award, loaded, readDefinition, readSnapshot);
  const locked = <T>(userId: string, read: (transaction: Tx) => Promise<T>) => database.transaction().execute(async (transaction) => {
    if (!(await v2LockActor(transaction, userId))) throw new Error("Guided v2 actor not found");
    return read(transaction);
  });
  // Separate receipts reserve the request budget under the same durable actor lock.
  // They carry no learner text and do not interfere with the mutation's receipt.
  const reserveResponse = (userId: string, attemptId: string, body: Record<string, unknown>, key: string) => locked(userId, async (transaction) => {
    const requestHash = hashLearningSnapshot({ attemptId, body });
    const digest = hashLearningSnapshot({ scope: "v2-response-limit", key, requestHash });
    const rateKey = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
    const previous = await transaction.selectFrom("learning_mutation_receipts").select("request_hash")
      .where("user_id", "=", userId).where("idempotency_key", "=", rateKey).executeTakeFirst();
    if (previous?.request_hash === requestHash) return true;
    const cutoff = new Date(now().getTime() - 60000);
    const recent = await transaction.selectFrom("learning_mutation_receipts")
      .select(({ fn }) => fn.countAll<number>().as("count")).where("user_id", "=", userId)
      .where("created_at", ">", cutoff).where(sql<string>`response_json->>'rateLimitV2'`, "=", "response").executeTakeFirstOrThrow();
    if (Number(recent.count) >= 120) return false;
    // A different body consumes budget and retains provider conflict handling.
    if (!previous) await transaction.insertInto("learning_mutation_receipts").values({
      user_id: userId, idempotency_key: rateKey, request_hash: requestHash, created_at: now(),
      response_json: { rateLimitV2: "response" }, http_status: 200,
    }).execute();
    return true;
  });
  const attempts = createPostgresGuidedV2AttemptService(database, { now, assetStorage: options.assetStorage, prepareSnapshot: async (transaction, input) => {
    const current = await context(transaction, input.userId, input.enrollmentId, input.at, false, true,
      { pathVersionId: input.pathVersionId, definition: input.definition });
    if (!current || current.attempts.some((item) => item.status === "in_progress")) return null;
    // Only assessment candidate lists are adapted. Activity/review selection
    // reads the pinned definition without cloning the entire bank.
    const definition: RoutePackage = input.target.kind === "assessment"
      ? { ...input.definition, assessments: input.definition.assessments.map((item) => item.key === input.target.key ? { ...item } : item) }
      : input.definition;
    let novelKeys: string[] = [];
    let assessmentSelection: AssessmentPlanV2 | null = null;
    if (input.target.kind === "assessment") {
      const assessment = definition.assessments.find((item) => item.key === input.target.key);
      if (!assessment) return null;
      if (assessment.kind === "diagnostic") {
        if (current.diagnosticStatus !== "pending") return null;
        assessment.candidateActivityKeys = selectGuidedV2Diagnostic(definition).activityKeys;
      } else if (assessment.kind === "unit_gate") {
        if (current.selection.nextAction.key !== assessment.key) return null;
      } else {
        if (["checkpoint", "unit_gate"].includes(assessment.kind) && current.selection.nextAction.key !== assessment.key) return null;
        if (assessment.kind === "final" && current.state.completedActivities + current.state.dispensedActivities < current.state.plannedRequiredActivities) return null;
        const selected = selectAssessmentV2({ definition, pathVersionId: input.pathVersionId, assessmentKey: assessment.key, nowUtc: input.at.toISOString(),
          introducedObjectiveKeys: current.evidence.objectives.filter((item) => item.label !== "new").map((item) => item.objectiveKey),
          objectiveStates: current.evidence.objectives, exposures: current.exposures, retentionStates: current.reviewStates.filter((item) => item.firstMasteredAt) });
        if (selected.status !== "success") return null;
        assessmentSelection = selected.plan;
        const items = selected.plan.segments.flatMap((segment) => segment.items);
        assessment.candidateActivityKeys = items.map((item) => item.activity.key);
        novelKeys = items.filter((item) => item.novelAtPresentation).map((item) => item.activity.key);
      }
    } else {
      const key = input.target.key;
      const activity = definition.activities.find((item) => item.key === key);
      if (!activity || !["learning", "gate"].includes(activity.use)) return null;
      if (input.target.kind === "review" ? !current.selection.reviewBatch.some((item) => item.key === key)
        : !current.selection.availableActivities.some((item) => item.key === key) && current.selection.nextAction.key !== key) return null;
    }
    const snapshot = prepareCachedGuidedV2ActivitySnapshot(definition, input.pathVersionId, input.target);
    return snapshot ? { ...snapshot, contentHash: definition === input.definition ? snapshot.contentHash : hashRoutePackage(input.definition), novelKeys,
      ...(assessmentSelection ? { assessmentSelection } : {}) } : null;
  } });
  const metrics = createPostgresGuidedV2MetricsService(database, { now });
  const projectAttempt = async (manifest: z.infer<typeof V2AttemptManifestSchema>, userId: string) => {
    if (manifest.purpose !== "assessment") return manifest;
    const row = await database.selectFrom("learning_v2_attempts").select(["snapshot_json", "resume_json"])
      .where("id", "=", manifest.attemptId).where("user_id", "=", userId).executeTakeFirst();
    const snapshot = parseGuidedV2AttemptSnapshot(row?.snapshot_json);
    if (!snapshot) return manifest;
    const version = await database.selectFrom("learning_path_versions").select("definition_v2_json")
      .where("id", "=", manifest.pathVersionId).executeTakeFirst();
    const definition = RoutePackageSchema.safeParse(version?.definition_v2_json);
    const responses = await database.selectFrom("learning_v2_responses").select(["activity_key", "score01", "grading_json"])
      .where("attempt_id", "=", manifest.attemptId).execute();
    const acceptedKeys = new Set(manifest.acceptedResponses.map((item) => item.activityKey));
    return V2AttemptManifestSchema.parse({ ...manifest, acceptedResponses: [...manifest.acceptedResponses]
      .sort((a, b) => snapshot.orderedKeys.indexOf(a.activityKey) - snapshot.orderedKeys.indexOf(b.activityKey)).map((item) => {
      const index = snapshot.orderedKeys.indexOf(item.activityKey);
      const boundary = Math.min(Math.ceil((index + 1) / 10) * 10, snapshot.orderedKeys.length);
      const submitted = snapshot.orderedKeys.slice(Math.floor(index / 10) * 10, boundary).every((key) => acceptedKeys.has(key));
      if (!submitted) return item;
      const response = responses.find((answer) => answer.activity_key === item.activityKey);
      const grading = response?.grading_json;
      const feedback = grading && typeof grading === "object" && !Array.isArray(grading) ? grading.feedback : null;
      return { ...item, score01: response?.score01 ?? null, feedback: feedback && typeof feedback === "object" && !Array.isArray(feedback)
        ? { explanation: typeof feedback.explanation === "string" ? feedback.explanation : "", commonError: typeof feedback.commonError === "string" ? feedback.commonError : "",
          ...(typeof feedback.partialScore01 === "number" ? { partialScore01: feedback.partialScore01 } : {}),
          sources: guidedV2FeedbackSources(snapshot.activities, definition.success ? definition.data.sources : [], item.activityKey) }
        : { explanation: "", commonError: "", sources: [] } };
    }) });
  };
  const state = (userId: string, id: string, maintenance = false, loaded?: { pathVersionId: string; definition: RoutePackage }, readSnapshot?: GuidedV2SnapshotReader) => locked(userId, async (transaction) => {
    const current = await context(transaction, userId, id, now(), maintenance, true, loaded, readSnapshot);
    return current ? { status: "success", value: { state: current.state } } : { status: "not_found" };
  });
  const path = (userId: string, slug: string, maintenance = false) => locked(userId, async (transaction) => {
    const row = await transaction.selectFrom("learning_paths").selectAll().where("slug", "=", slug).executeTakeFirst();
    if (!row) return { status: "not_found" };
    const enrollment = await transaction.selectFrom("learning_enrollments").selectAll().where("path_id", "=", row.id).where("user_id", "=", userId).executeTakeFirst();
    if (maintenance && !enrollment) return { status: "not_found" };
    const version = await transaction.selectFrom("learning_path_versions").selectAll().where("id", "=", enrollment?.path_version_id ?? row.published_version_id ?? "00000000-0000-4000-8000-000000000000").executeTakeFirst();
    if (!version || version.policy_version !== "guided-v2.0" || (!enrollment && row.archived_at)
      || !(await v2ContentAvailable(transaction, version.id))) return { status: "not_found" };
    const definition = RoutePackageSchema.parse(version.definition_v2_json);
    return { status: "success", value: { path: V2PublicPathSchema.parse({ engineVersion: "guided-v2", policyVersion: "guided-v2.0",
      pathId: row.id, pathVersionId: version.id, slug: row.slug, title: definition.route.title, summary: definition.route.summary,
      coverKey: definition.route.coverKey, topicLabel: definition.route.topicLabel, access: enrollment ? enrollment.status === "active" ? "enrolled" : "revoked" : "available",
      enrollmentId: enrollment?.id ?? null, availability: maintenance ? "maintenance" : "active", units: definition.units.map((unit) => ({ key: unit.key, title: unit.title,
        objectives: unit.objectiveKeys.map((key) => definition.objectives.find((item) => item.key === key)!).map(({ key, title, criticality }) => ({ key, title, criticality })) })) }) } };
  });
  return { async invoke(name, userId, params, body, key) {
    const maintenance = params.maintenance === true;
    if (name === "publicPath") return path(userId, String(params.slug), maintenance);
    if (name === "enrollmentState") return state(userId, String(params.id), maintenance);
    if (name === "enrollmentCreate") {
      return locked(userId, async (transaction) => v2Receipt(transaction, userId, key,
        { method: "POST", route: "/v2/guided-learning/enrollments", body }, async () => {
        const pathId = String(body.pathId);
        const existing = await transaction.selectFrom("learning_enrollments").selectAll().where("user_id", "=", userId).where("path_id", "=", pathId).executeTakeFirst();
        if (existing) {
          const current = await context(transaction, userId, existing.id, now());
          return current ? { status: "success", value: { state: current.state } } : { status: "conflict" };
        }
        const row = await transaction.selectFrom("learning_paths").selectAll().where("id", "=", pathId).where("archived_at", "is", null).executeTakeFirst();
        if (!row?.published_version_id) return { status: "not_found" };
        const version = await transaction.selectFrom("learning_path_versions").selectAll().where("id", "=", row.published_version_id).where("status", "=", "published").where("policy_version", "=", "guided-v2.0").executeTakeFirst();
        if (!version || !(await v2ContentAvailable(transaction, version.id))) return { status: "not_found" };
        const enrollment = await transaction.insertInto("learning_enrollments").values({ user_id: userId, path_id: pathId, path_version_id: version.id }).returning("id").executeTakeFirstOrThrow();
        await transaction.insertInto("learning_enrollment_versions").values({ enrollment_id: enrollment.id, path_id: pathId, path_version_id: version.id }).execute();
        const current = await context(transaction, userId, enrollment.id, now());
        return current ? { status: "success", value: { state: current.state } } : { status: "conflict" };
      }));
    }
    if (name === "catalog" || name === "home") {
      const rows = await database.selectFrom("learning_paths").select(["id", "slug"]).where("archived_at", "is", null).orderBy("id").execute();
      const cards = [];
      const states = new Map<string, z.infer<typeof V2RouteStateSchema>>();
      let dueReviews = 0;
      for (const row of rows) {
        if (params.cursor && row.id <= String(params.cursor)) continue;
        const result = await path(userId, row.slug, maintenance);
        if (result.status !== "success" || !("value" in result) || !result.value) continue;
        const publicPath = V2PublicPathSchema.parse(result.value.path);
        const enrolled = publicPath.enrollmentId ? await state(userId, publicPath.enrollmentId, maintenance) : null;
        const routeState = enrolled && "value" in enrolled && enrolled.value ? V2RouteStateSchema.parse(enrolled.value.state) : null;
        if (routeState && publicPath.enrollmentId) { states.set(publicPath.enrollmentId, routeState); dueReviews += routeState.dueReviews; }
        cards.push(V2PathCardSchema.parse({ engineVersion: "guided-v2", policyVersion: "guided-v2.0", id: row.id, pathVersionId: publicPath.pathVersionId,
          enrollmentId: publicPath.enrollmentId, slug: publicPath.slug, title: publicPath.title, summary: publicPath.summary, coverKey: publicPath.coverKey,
          topicLabel: publicPath.topicLabel, unitCount: publicPath.units.length, completed: routeState?.completedAt !== null && !!routeState,
          mastered: routeState?.masteredAt !== null && !!routeState, consolidated: routeState?.consolidatedAt !== null && !!routeState }));
      }
      if (name === "catalog") {
        const limit = Number(params.limit ?? 20);
        return { status: "success", value: { items: cards.slice(0, limit), nextCursor: cards.length > limit ? cards[limit - 1]!.id : null } };
      }
      const activePath = cards.find((item) => item.enrollmentId) ?? null;
      const routeState = activePath?.enrollmentId ? states.get(activePath.enrollmentId) : null;
      return { status: "success", value: { engineVersion: "guided-v2", generatedAt: now().toISOString(), activePath,
        dueReviews, nextAction: routeState?.nextAction ?? null } };
    }
    if (name === "attemptCreate") {
      const input = V2HttpContracts.attemptCreate.body.parse(body);
      const result = await attempts.create({ ...input, userId, idempotencyKey: key });
      return result.status === "success" ? { status: "success", value: { attempt: await projectAttempt(result.value, userId) } } : result;
    }
    if (name === "upgradePreview" || name === "upgradeCommit") {
      return locked(userId, async transaction => {
        const id = String(params.id);
        if (name === "upgradePreview") {
          const plan = await planGuidedV2Upgrade(transaction, userId, id);
          if (plan.status !== "success") return plan;
          if (!(await v2ContentAvailable(transaction, plan.target.id))) return { status: "access_revoked" };
          return { status: "success", value: { ...plan.preview, availability: maintenance ? "maintenance" : "active" } };
        }
        const input = V2HttpContracts.upgradeCommit.body.parse(body);
        return v2Receipt(transaction, userId, key, { operation: "upgrade", enrollmentId: id, body: input }, async () => {
          const plan = await planGuidedV2Upgrade(transaction, userId, id, input.targetVersionId);
          if (plan.status !== "success") return plan;
          if (plan.enrollment.row_version !== input.expectedVersion) return { status: "version_conflict" };
          if (plan.enrollment.status !== "active") return { status: "conflict" };
          if (plan.preview.openAttempt) return { status: "active_attempt" };
          if (!(await v2ContentAvailable(transaction, plan.target.id))) return { status: "access_revoked" };
          await adoptGuidedV2Upgrade(transaction, plan, now());
          const current = await context(transaction, userId, id, now(), false, false);
          if (!current) throw new Error("Adopted state unavailable");
          return { status: "success", value: { state: current.state } };
        }, async () => {
          const enrollment = await transaction.selectFrom("learning_enrollments").selectAll().where("id", "=", id).where("user_id", "=", userId).executeTakeFirst();
          return !enrollment ? "not_found" : enrollment.path_version_id !== input.targetVersionId ? "conflict"
            : !(await v2ContentAvailable(transaction, input.targetVersionId)) ? "access_revoked" : null;
        });
      });
    }
    const attemptId = String(params.id);
    let loadedDefinition: { pathVersionId: string; definition: RoutePackage } | undefined;
    const owned = await attempts.read({ userId, attemptId, onDefinition: (loaded) => { loadedDefinition = loaded; } });
    if (owned.status !== "success") return owned;
    if (name === "attemptGet") return { status: "success", value: { attempt: await projectAttempt(owned.value, userId) } };
    if (name === "attemptImage") return attempts.image({ userId, attemptId, activityKey: String(params.activityKey), expectedVersion: Number(params.expectedVersion) });
    if (name === "attemptAlternative") {
      const result = await attempts.alternative({ ...V2HttpContracts.attemptAlternative.body.parse(body), userId, attemptId, idempotencyKey: key });
      if (result.status !== "success") return result;
      const current = await state(userId, result.value.enrollmentId);
      return "value" in current ? { status: "success", value: { attempt: await projectAttempt(result.value, userId), ...current.value } } : current;
    }
    if (name === "attemptHelp") {
      const input = V2HttpContracts.attemptHelp.body.parse(body);
      if (input.kind === "reveal") {
        if (owned.value.purpose === "assessment" && owned.value.status !== "completed") return { status: "conflict" };
        const row = await database.selectFrom("learning_v2_attempts").select("resume_json")
          .where("id", "=", attemptId).where("user_id", "=", userId).executeTakeFirst();
        const resume = row?.resume_json;
        const submitted = resume && typeof resume === "object" && !Array.isArray(resume) ? resume.submittedTextByActivity : null;
        const submittedText = submitted && typeof submitted === "object" && !Array.isArray(submitted) ? submitted[input.activityKey] : null;
        const hasSubmittedText = typeof submittedText === "string" && submittedText.trim().length > 0;
        if (!hasSubmittedText && !owned.value.acceptedResponses.some((item) => item.activityKey === input.activityKey)
          && owned.value.status !== "abandoned") return { status: "conflict" };
      }
      const result = await attempts.help({ ...input, userId, attemptId, idempotencyKey: key });
      return result.status === "success" ? { status: "success", value: { ...result.value, attempt: await projectAttempt(result.value.attempt, userId) } } : result;
    }
    if (name === "attemptResponse" || name === "attemptComplete") {
      if (name === "attemptResponse" && !(await reserveResponse(userId, attemptId, body, key))) return { status: "rate_limited" };
      const readSnapshot = createGuidedV2SnapshotReader();
      const result = name === "attemptResponse" ? await attempts.respond({ ...V2HttpContracts.attemptResponse.body.parse(body), userId, attemptId, idempotencyKey: key, definition: loadedDefinition, readSnapshot })
        : await attempts.complete({ ...V2HttpContracts.attemptComplete.body.parse(body), userId, attemptId, idempotencyKey: key, definition: loadedDefinition, readSnapshot });
      if (result.status !== "success") return result;
      const manifest = await projectAttempt("attempt" in result.value ? result.value.attempt : result.value, userId);
      const current = await state(userId, manifest.enrollmentId, false, loadedDefinition, readSnapshot);
      if (!("value" in current)) return current;
      const feedback = "feedback" in result.value ? result.value.feedback : null;
      return { status: "success", value: name === "attemptComplete" ? { attempt: manifest, ...current.value }
        : { accepted: "accepted" in result.value && result.value.accepted, attempt: manifest, ...current.value, nextStep: manifest.activeActivity,
          feedback: manifest.purpose === "assessment" ? (() => {
            const response = manifest.acceptedResponses.find((item) => item.activityKey === body.activityKey);
            return response ? { ...response.feedback, score01: response.score01 } : { explanation: "", commonError: "", score01: null };
          })() : feedback ? { ...feedback, sources: manifest.acceptedResponses.find(item => item.activityKey === body.activityKey)?.feedback.sources ?? [] } : feedback } };
    }
    if (name === "attemptHeartbeat") {
      const input = V2HttpContracts.attemptHeartbeat.body.parse(body);
      const result = await metrics.heartbeat({ userId, enrollmentId: owned.value.enrollmentId, deviceKey: attemptId,
        tickKey: input.clientEventId, visible: input.visible && input.interactionAgeMs < 60000 });
      return result.status === "success" ? { status: "success", value: { accepted: true, rowVersion: owned.value.rowVersion } } : result;
    }
    if (name === "feedbackViewed") {
      const result = await metrics.feedbackViewed({ userId, attemptId, activityKey: String(body.activityKey) });
      return result.status === "success" ? { status: "success", value: { accepted: true, rowVersion: owned.value.rowVersion } } : result;
    }
    return { status: "conflict" };
  } };
}
