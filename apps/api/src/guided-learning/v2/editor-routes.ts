import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { V2HttpContracts, type ContentProvider, type IdentityProvider } from "@cediah/contracts";
import { getContentCapabilities } from "../../content-authorization.js";
import { resolveGuidedUser, sendGuidedUserError } from "../http.js";
import type { createPostgresGuidedLearningV2Provider } from "../../providers/postgres-guided-learning-v2.js";
import { MAX_ROUTE_IMPORT_BYTES, parseRouteImport } from "./import.js";
import { randomUUID } from "node:crypto";
import { RoutePackageSchema, V2RouteStateSchema, V2EditorPreviewProfileSchema as EditorPreviewProfileSchema, V2EditorPreviewActionSchema as EditorPreviewActionSchema, V2EditorPreviewHttpContracts, type RoutePackage } from "@cediah/contracts";
import { gradeBasicActivity } from "./grading.js";
import { rebuildGuidedV2Evidence, type GuidedV2EvidenceEvent } from "./evidence.js";
import { selectGuidedV2NextAction, selectGuidedV2Diagnostic } from "./selection.js";
import { scheduleReviewV2, reviewDueV2, type ReviewResponseV2, type ReviewStateV2 } from "./scheduler.js";
import { guidedV2AttemptManifest, guidedV2FeedbackSources, type GuidedV2ManifestResponse } from "./manifests.js";
import { accessibleVariant, activeGuidedV2ActivityKey, initialGuidedV2AttemptResume, prepareGuidedV2AttemptSnapshot, type GuidedV2AttemptSnapshot } from "./service.js";

/** Private simulator memory only. The real evidence/selection/grading functions are
 * replayed against simulated learner facts; no database or learner provider is held. */
export function createEditorPreviewSimulator(packageInput: unknown, profile: z.infer<typeof EditorPreviewProfileSchema>, nowUtc: string) {
  const definition = RoutePackageSchema.parse(structuredClone(packageInput));
  let now = z.iso.datetime().parse(nowUtc), version = 1;
  const enrollmentId = randomUUID(), pathVersionId = randomUUID();
  const events: GuidedV2EvidenceEvent[] = [];
  const completed: string[] = [], completedAssessments: string[] = [], attempts: string[] = [];
  const reviews = new Map<string, ReviewStateV2>();
  const reviewHistory = new Map<string, ReviewResponseV2[]>();
  let diagnosticStatus: "pending" | "completed" | "omitted" = "pending";
  let current: { id: string; snapshot: GuidedV2AttemptSnapshot; resume: ReturnType<typeof initialGuidedV2AttemptResume>; responses: GuidedV2ManifestResponse[]; status: "in_progress" | "completed" } | null = null;
  const receipts = new Map<string, { fingerprint: string; value: unknown }>();
  function responseEvent(activity: RoutePackage["activities"][number], score01: number | null, gradingSource: "server" | "self" | "none", responseKey: string | null, assisted: boolean, purpose: "learning" | "diagnostic" | "gate" | "final" | "retention7" | "retention30" | "review") {
    const id = randomUUID();
    const event: GuidedV2EvidenceEvent = { id, semanticKey: id, at: now, kind: "response", attemptId: current?.id ?? enrollmentId, activityKey: activity.key, objectiveKey: activity.objectiveKey, equivalenceKey: activity.equivalenceKey, phase: activity.phase, modality: activity.representation, purpose, gradingSource, score01, responseKey, assisted, valid: true };
    events.push(event); return event;
  }
  if (profile === "diagnostic_correct") {
    diagnosticStatus = "completed";
    const diagnosticKeys = new Set(selectGuidedV2Diagnostic(definition).activityKeys);
    for (const activity of definition.activities.filter(item => diagnosticKeys.has(item.key))) responseEvent(activity, 1, "server", null, false, "diagnostic");
  } else if (profile === "core_error") {
    const activity = definition.activities.find(item => definition.objectives.some(objective => objective.key === item.objectiveKey && objective.criticality === "core") && ["learning", "gate"].includes(item.use) && item.misconceptionMappings.some(mapping => definition.objectives.find(objective => objective.key === item.objectiveKey)?.misconceptions.some(misconception => misconception.key === mapping.misconceptionKey && misconception.critical)));
    if (activity) responseEvent(activity, 0, "server", activity.misconceptionMappings.find(mapping => definition.objectives.find(objective => objective.key === activity.objectiveKey)?.misconceptions.some(misconception => misconception.key === mapping.misconceptionKey && misconception.critical))!.responseKey, false, "learning");
  }
  function state() {
    const due = [...reviews].flatMap(([objectiveKey, review]) => { const item = reviewDueV2(review, new Date(now)); return item.kind ? [{ key: objectiveKey, objectiveKey, dueAt: item.dueAt! }] : []; });
    const evidence = rebuildGuidedV2Evidence(definition, events, { dueObjectiveKeys: due.map(item => item.objectiveKey) });
    const retentionDue = definition.assessments.flatMap(item => {
      if (item.kind !== "retention7" && item.kind !== "retention30") return [];
      const dates = item.objectiveKeys.map(key => reviews.get(key)?.[item.kind === "retention7" ? "retention7DueAt" : "retention30DueAt"]);
      return dates.length && dates.every(Boolean) ? [{ key: item.key, dueAt: new Date(Math.max(...dates.map(value => Date.parse(value!)))).toISOString() }] : [];
    });
    const selection = selectGuidedV2NextAction({ definition, evidence, events, sessionAttemptIds: attempts, diagnosticStatus, completedActivityKeys: completed, dispensedActivityKeys: [], completedAssessmentKeys: completedAssessments, openAttempts: [], retentionDue, reviewDue: due }, now);
    const value = V2RouteStateSchema.parse({ engineVersion: "guided-v2", enrollmentId, pathVersionId, rowVersion: version, ...Object.fromEntries(["completedActivities", "dispensedActivities", "plannedRequiredActivities", "completedAt", "masteredAt", "consolidatedAt"].map(key => [key, evidence.route[key as keyof typeof evidence.route]])), objectives: evidence.objectives.map(({ objectiveKey, label, objectiveScore, criticalErrorOpen, assisted, applicationDemonstrated, reviewDue, firstMasteredAt, firstConsolidatedAt }) => ({ objectiveKey, label, objectiveScore, criticalErrorOpen, assisted, applicationDemonstrated, reviewDue, firstMasteredAt, firstConsolidatedAt })), dueReviews: due.length, nextAction: selection.nextAction,
      maintenance: { generatedAt: now, timeZone: "America/Caracas", diagnostic: { status: selection.diagnostic.activityKeys.length ? diagnosticStatus : "unavailable", assessmentKey: selection.diagnostic.assessmentKey }, activities: selection.availableActivities.map(({ key, objectiveKey, reason }) => ({ key, objectiveKey, reason })), reviewBatch: selection.reviewBatch, agenda: [...reviews].map(([objectiveKey, review]) => { const masteredAt = evidence.objectives.find(item => item.objectiveKey === objectiveKey)?.firstMasteredAt; const measurement = (dueAt: string | null, acceptedAt: string | null) => ({ dueAt, acceptedAt, elapsedDays: acceptedAt && masteredAt ? Math.max(0, (Date.parse(acceptedAt) - Date.parse(masteredAt)) / 86400000) : null }); return { objectiveKey, dueAt: review.dueAt, retention7: measurement(review.retention7DueAt, review.retention7AcceptedAt), retention30: measurement(review.retention30DueAt, review.retention30AcceptedAt) }; }), gates: evidence.gates, blockers: evidence.availability.filter(item => !item.available).map(({ objectiveKey, blockedBy }) => ({ objectiveKey, blockedBy })), remediation: selection.remediationOffers.map(item => ({ objectiveKey: item.objectiveKey, confusion: definition.objectives.find(objective => objective.key === item.objectiveKey)?.misconceptions.find(misconception => misconception.key === item.misconceptionKey)?.description ?? "Revisar este concepto", message: item.message, activityKey: item.activityKey, bankExhausted: item.bankExhausted, availableAfter: item.availableAfter, pauseOffered: item.pauseOffered })), exhaustedBanks: selection.exhaustedBanks }
    });
    return value;
  }
  function manifest() { return current ? guidedV2AttemptManifest({ attemptId: current.id, enrollmentId, pathVersionId, purpose: current.snapshot.target.kind, rowVersion: version, status: current.status, snapshot: current.snapshot, resume: current.resume, responses: current.responses, sources: definition.sources }) : null; }
  function read() { return { state: state(), attempt: manifest(), now, profile, targets: [...definition.units.flatMap(unit => unit.activityKeys).filter(key => definition.activities.some(item => item.key === key && ["learning", "gate"].includes(item.use)) && !definition.activities.some(item => item.kind === "case" && item.payload.stages.some(stage => stage.childActivityKey === key))).map(key => ({ kind: "activity" as const, key, title: definition.activities.find(item => item.key === key)?.prompt ?? key })), ...definition.assessments.map(item => ({ kind: "assessment" as const, key: item.key, title: `${item.kind}: ${item.key}` }))], profileWarning: profile === "core_error" && !events.some(item => item.kind === "response") ? "Falta una confusión CORE crítica en este borrador." : null }; }
  function execute(input: unknown, key: string) {
    const action = EditorPreviewActionSchema.parse(input), fingerprint = JSON.stringify(action);
    const prior = receipts.get(key);
    if (prior) { if (prior.fingerprint !== fingerprint) throw new Error("conflict"); return structuredClone(prior.value); }
    if (receipts.size >= 1000) throw new Error("rate_limited");
    if (action.body.expectedVersion !== version) throw new Error("version_conflict");
    let result: unknown;
    if (action.operation === "clock") {
      if (Date.parse(action.body.now) < Date.parse(now)) throw new Error("invalid_clock");
      now = action.body.now; version++; result = read();
    } else if (action.operation === "omit_diagnostic") {
      if (current?.status === "in_progress") throw new Error("conflict");
      diagnosticStatus = "omitted"; version++; result = read();
    } else if (action.operation === "start") {
      if (current?.status === "in_progress") throw new Error("conflict");
      const target = action.body.target;
      if (target.kind === "review") {
        const activity = definition.activities.find(item => item.objectiveKey === target.key && item.use === "learning" && !["study", "case", "constructed_response"].includes(item.kind));
        if (!activity) throw new Error("bank_exhausted");
        target.key = activity.key;
      }
      const snapshot = prepareGuidedV2AttemptSnapshot(definition, pathVersionId, target);
      if (!snapshot) throw new Error("bank_exhausted");
      current = { id: randomUUID(), snapshot, resume: initialGuidedV2AttemptResume(), responses: [], status: "in_progress" }; attempts.push(current.id); version++; result = read();
    } else {
      if (!current || current.status !== "in_progress") throw new Error("conflict");
      const activity = current.snapshot.activities.find(item => item.key === activeGuidedV2ActivityKey(current!.snapshot, current!.resume));
      if (action.operation === "complete") {
        if (activity) throw new Error("conflict");
        current.status = "completed";
        for (const wrapper of current.snapshot.activities.filter(item => item.kind === "case")) completed.push(wrapper.key);
        const assessment = definition.assessments.find(item => current!.snapshot.target.kind === "assessment" && item.key === current!.snapshot.target.key);
        if (assessment) {
          completedAssessments.push(assessment.key);
          if (assessment.kind === "diagnostic") diagnosticStatus = "completed";
          if (assessment.kind === "final") { const id = randomUUID(); events.push({ id, semanticKey: id, at: now, kind: "final", assessmentKey: assessment.key, attemptId: current.id, valid: true, answers: current.responses.map(item => ({ objectiveKey: definition.activities.find(activity => activity.key === item.activityKey)!.objectiveKey, score01: item.score01, gradingSource: "server", assisted: current!.resume.assistedKeys.includes(item.activityKey) })) }); }
        }
        version++; result = { attempt: manifest(), state: state() };
      } else {
        if (!activity || activity.key !== action.body.activityKey) throw new Error("conflict");
        if (action.operation === "alternative") {
          const variant = accessibleVariant(current.snapshot, activity.key);
          if (!variant || current.responses.some(item => item.activityKey === variant.key)) throw new Error("conflict");
          current.resume.accessiblePractice = { sourceActivityKey: activity.key, activityKey: variant.key };
          version++; result = { attempt: manifest(), state: state() };
        } else if (action.operation === "help") {
          if (current.snapshot.target.kind === "assessment" || action.body.kind === "reveal" && activity.kind === "constructed_response" && !current.resume.submittedTextByActivity[activity.key]) throw new Error("conflict");
          if (!current.resume.assistedKeys.includes(activity.key)) current.resume.assistedKeys.push(activity.key);
          if (action.body.kind === "reveal" && !current.resume.revealedKeys.includes(activity.key)) current.resume.revealedKeys.push(activity.key);
          const id = randomUUID(); events.push(action.body.kind === "reveal" ? { id, semanticKey: id, at: now, kind: "reveal", activityKey: activity.key } : { id, semanticKey: id, at: now, kind: "interaction", activityKey: activity.key, assisted: true });
          const text = action.body.kind === "hint" ? activity.hints[0] ?? "Revisa el enunciado y las relaciones clave." : action.body.kind === "source" ? definition.sources.find(item => activity.sourceKeys.includes(item.key))?.excerpt ?? "La fuente vinculada no tiene un fragmento disponible." : activity.kind === "constructed_response" || activity.kind === "short_answer" ? activity.payload.modelAnswer : activity.feedback.explanation;
          version++; result = { attempt: manifest(), help: { kind: action.body.kind, text } };
        } else {
          const grade = gradeBasicActivity(activity, action.body.answer, { revealed: current.resume.revealedKeys.includes(activity.key), submittedText: current.resume.submittedTextByActivity[activity.key] });
          if (grade.status === "invalid") throw new Error("invalid_answer");
          const accepted = !["awaiting_reveal", "awaiting_self_rating"].includes(grade.status);
          if ("submittedText" in grade) current.resume.submittedTextByActivity[activity.key] = grade.submittedText;
          const feedback = { explanation: grade.feedback?.explanation ?? "", commonError: grade.feedback?.commonError ?? "", score01: grade.score01, ...(grade.feedback?.partialScore01 !== undefined ? { partialScore01: grade.feedback.partialScore01 } : {}), sources: accepted ? guidedV2FeedbackSources(current.snapshot.activities, definition.sources, activity.key) : [] };
          if (accepted) {
            const detour = Boolean(current.resume.accessiblePractice);
            const assisted = detour || current.resume.assistedKeys.includes(activity.key);
            const assessment = definition.assessments.find(item => current!.snapshot.target.kind === "assessment" && item.key === current!.snapshot.target.key);
            const purpose = assessment?.kind === "checkpoint" ? "gate" : assessment?.kind === "unit_gate" ? "gate" : assessment?.kind ?? (current.snapshot.target.kind === "review" ? "review" : "learning");
            const event = responseEvent(activity, grade.score01, grade.gradingSource, "responseKey" in grade ? grade.responseKey : null, assisted, purpose);
            current.responses.push({ activityKey: activity.key, answer: action.body.answer, acceptedAt: new Date(now), score01: grade.score01, explanation: feedback.explanation, commonError: feedback.commonError, ...(feedback.partialScore01 !== undefined ? { partialScore01: feedback.partialScore01 } : {}) });
            if (detour) current.resume.accessiblePractice = null;
            else { current.resume.activeIndex++; completed.push(activity.key); }
            const history = reviewHistory.get(activity.objectiveKey) ?? [];
            const reviewResponse: ReviewResponseV2 = { responseId: event.id, sessionId: current.id, acceptedAt: now, gradingSource: grade.gradingSource, score01: grade.score01, assisted, selfRating: action.body.answer.kind === "constructed_response" ? action.body.answer.selfRating : null, purpose, phase: activity.phase, valid: true };
            const nextReview = scheduleReviewV2(reviews.get(activity.objectiveKey) ?? null, reviewResponse, history, rebuildGuidedV2Evidence(definition, events).objectives.find(item => item.objectiveKey === activity.objectiveKey)?.firstMasteredAt ?? null);
            if (nextReview) reviews.set(activity.objectiveKey, nextReview);
            history.push(reviewResponse); reviewHistory.set(activity.objectiveKey, history);
          }
          version++;
          const attempt = manifest()!;
          const deferred = current.snapshot.target.kind === "assessment" && current.snapshot.activities.some(item => ["final", "retention7", "retention30"].includes(item.use));
          result = { accepted, feedback: deferred ? { explanation: "", commonError: "", score01: null, sources: [] } : feedback, attempt, state: state(), nextStep: attempt.activeActivity };
        }
      }
    }
    // Cap retries to this expiring session; no persistent receipt, event or reward.
    receipts.set(key, { fingerprint, value: structuredClone(result) });
    return result;
  }
  return { read, execute };
}

type ImportProvider = Pick<ReturnType<typeof createPostgresGuidedLearningV2Provider>,
  "validateImport" | "commitImport" | "exportPath" | "validatePath" | "transitionPath" | "createVersion"> & Partial<Pick<ReturnType<typeof createPostgresGuidedLearningV2Provider>, "createDraft" | "getEditorPath" | "saveDraft" | "previewPath" | "previewImage" | "convertV1" | "listEditorSourceCatalog">>;
export type GuidedV2EditorProvider = ImportProvider;

/** Exported separately so the v2 registration can be connected without changing v1 routes. */
export async function registerGuidedV2EditorImportRoutes(app: FastifyInstance, dependencies: {
  contentProvider?: ContentProvider;
  identityProvider?: IdentityProvider;
  provider?: ImportProvider;
}) {
  const sessions = new Map<string, { actorUserId: string; pathId: string; expiresAt: number; fingerprint: string; package: unknown; bindings: unknown; simulator: ReturnType<typeof createEditorPreviewSimulator> }>();
  const prune = () => { for (const [key, value] of sessions) if (value.expiresAt <= Date.now()) sessions.delete(key); };
  app.addHook("onClose", async () => { sessions.clear(); });
  for (const operation of ["create", "action", "image"] as const) {
    app.post(V2EditorPreviewHttpContracts[operation].path, { bodyLimit: MAX_ROUTE_IMPORT_BYTES + 64 * 1024 }, async (request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      const actor = await resolveGuidedUser(request, dependencies.identityProvider);
      if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
      const provider = dependencies.provider;
      if (!dependencies.contentProvider || !provider?.getEditorPath || !provider.previewPath) return reply.status(503).send({ error: "learning_unavailable" });
      try {
        const capabilities = getContentCapabilities(await dependencies.contentProvider.getRoles(actor.user.id));
        if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
        const params = V2EditorPreviewHttpContracts[operation].params.safeParse(request.params);
        const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
        const body = V2EditorPreviewHttpContracts[operation].body.safeParse(request.body);
        if (!params.success || !key.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
        const authorized = await provider.getEditorPath({ pathId: params.data.id, actorUserId: actor.user.id, canEdit: true, canEditAll: capabilities.canEditAll, enforceAccess: true });
        if (authorized.status !== "success") return reply.status(authorized.status === "forbidden" ? 403 : authorized.status === "not_found" ? 404 : 409).send({ error: authorized.status });
        prune();
        if (operation === "create" && "package" in body.data) {
          // Existing preview validation applies catalog authorization, rate limit and
          // idempotency. Only its editorial receipt is persistent.
          const validation = await provider.previewPath({ pathId: params.data.id, actorUserId: actor.user.id, canEdit: true, canEditAll: capabilities.canEditAll, package: body.data.package, bindings: body.data.bindings, idempotencyKey: key.data });
          if (validation.status !== "success") return reply.status(validation.status === "rate_limited" ? 429 : validation.status === "invalid" ? 422 : validation.status === "not_found" ? 404 : 409).send({ error: validation.status });
          const raw = validation.value as { previewId: string; activeActivity: unknown; issues: unknown; expiresAt: string };
          const preview = V2HttpContracts.editorPreview.response.parse({ previewId: raw.previewId, activeActivity: raw.activeActivity, issues: raw.issues, expiresAt: raw.expiresAt });
          let session = sessions.get(preview.previewId);
          const fingerprint = JSON.stringify(body.data);
          if (session && session.fingerprint !== fingerprint) return reply.status(409).send({ error: "conflict" });
          if (!session) {
            if (sessions.size >= 200 || [...sessions.values()].filter(item => item.actorUserId === actor.user.id).length >= 8) return reply.status(429).send({ error: "rate_limited" });
            session = { actorUserId: actor.user.id, pathId: params.data.id, expiresAt: Date.parse(preview.expiresAt), fingerprint, package: body.data.package, bindings: body.data.bindings, simulator: createEditorPreviewSimulator(body.data.package, body.data.profile, body.data.now) };
            if (session.expiresAt <= Date.now()) return reply.status(409).send({ error: "preview_expired" });
            sessions.set(preview.previewId, session);
          }
          return reply.send({ previewId: preview.previewId, expiresAt: preview.expiresAt, ...session.simulator.read() });
        }
        const previewId = (request.params as { previewId: string }).previewId;
        const session = sessions.get(previewId);
        if (!session || session.actorUserId !== actor.user.id || session.pathId !== params.data.id) return reply.status(404).send({ error: "not_found" });
        if (operation === "image" && "activityKey" in body.data) {
          const attempt = session.simulator.read().attempt;
          if (!attempt || attempt.rowVersion !== body.data.expectedVersion || attempt.activeActivity?.key !== body.data.activityKey || attempt.activeActivity.kind !== "image_target") return reply.status(409).send({ error: "version_conflict" });
          if (!provider.previewImage) return reply.status(503).send({ error: "learning_unavailable" });
          const image = await provider.previewImage({ pathId: params.data.id, actorUserId: actor.user.id, canEdit: true, canEditAll: capabilities.canEditAll, package: session.package, bindings: session.bindings, ...body.data });
          if (image.status !== "success") return reply.status(image.status === "forbidden" ? 403 : image.status === "invalid" ? 422 : 404).send({ error: image.status });
          return reply.send(V2EditorPreviewHttpContracts.image.response.parse(image.value));
        }
        return reply.send(session.simulator.execute(body.data, key.data));
      } catch (error) {
        const code = error instanceof Error ? error.message : "learning_unavailable";
        if (code === "rate_limited") return reply.status(429).send({ error: code });
        if (["conflict", "version_conflict", "invalid_clock", "bank_exhausted", "invalid_answer"].includes(code)) return reply.status(409).send({ error: code });
        request.log.error("Guided v2 editorial simulation failed");
        return reply.status(503).send({ error: "learning_unavailable" });
      }
    });
  }
  app.addHook("onError", async (request, reply, error) => {
    if (!request.url.startsWith("/v2/editor/learning-paths")) return;
    reply.header("Cache-Control", "private, no-store");
    if (error.message === "Origin not allowed") error.statusCode = 403;
  });
  app.get(V2HttpContracts.editorSourceCatalog.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const actor = await resolveGuidedUser(request, dependencies.identityProvider);
    if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
    if (!dependencies.contentProvider || !dependencies.provider?.listEditorSourceCatalog) return reply.status(503).send({ error: "learning_unavailable" });
    try {
      const capabilities = getContentCapabilities(await dependencies.contentProvider.getRoles(actor.user.id));
      if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
      const query = V2HttpContracts.editorSourceCatalog.query.safeParse(request.query);
      if (!query.success) return reply.status(400).send({ error: "invalid_request" });
      const value = await dependencies.provider.listEditorSourceCatalog({ ...query.data, actorUserId: actor.user.id, canEditAll: capabilities.canEditAll });
      return reply.send(V2HttpContracts.editorSourceCatalog.response.parse(value));
    } catch {
      request.log.error("Guided v2 source catalog request failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });
  for (const name of ["editorCreate", "editorGet", "editorPatch", "editorPreview", "convertV1"] as const) {
    const endpoint = V2HttpContracts[name];
    app.route({ method: endpoint.method, url: endpoint.path, bodyLimit: MAX_ROUTE_IMPORT_BYTES + 64 * 1024, handler: async (request, reply) => {
      reply.header("Cache-Control", "private, no-store");
      const actor = await resolveGuidedUser(request, dependencies.identityProvider);
      if (actor.kind !== "authenticated") return sendGuidedUserError(actor, reply);
      if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
      try {
        const capabilities = getContentCapabilities(await dependencies.contentProvider.getRoles(actor.user.id));
        if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
        const params = endpoint.params.safeParse(request.params);
        const body = endpoint.body.safeParse(request.body ?? {});
        const key = endpoint.method === "GET" ? null : z.string().uuid().safeParse(request.headers["idempotency-key"]);
        if (!params.success || !body.success || (key && !key.success)) return reply.status(400).send({ error: "invalid_request" });
        if ("package" in body.data) {
          const parsed = parseRouteImport(body.data.package);
          if (parsed.status !== "success") return reply.status(parsed.status === "too_large" ? 413 : 400).send({ error: "invalid_request" });
        }
        const provider = dependencies.provider;
        const id = "id" in params.data ? params.data.id : "";
        const common = { actorUserId: actor.user.id, canEdit: true, canEditAll: capabilities.canEditAll, pathId: id, idempotencyKey: key?.success ? key.data : "" };
        let result;
        if (name === "editorCreate" && "package" in body.data && provider.createDraft) result = await provider.createDraft({ ...common, canCreate: capabilities.canCreate, package: body.data.package, bindings: body.data.bindings, enforceAccess: true });
        else if (name === "editorGet" && provider.getEditorPath) result = await provider.getEditorPath({ ...common, enforceAccess: true });
        else if (name === "editorPatch" && "expectedVersion" in body.data && "package" in body.data && provider.saveDraft) result = await provider.saveDraft({ ...common, expectedVersion: body.data.expectedVersion, package: body.data.package, bindings: body.data.bindings, enforceAccess: true });
        else if (name === "editorPreview" && "package" in body.data && provider.previewPath) result = await provider.previewPath({ ...common, package: body.data.package, bindings: body.data.bindings });
        else if (name === "convertV1" && "expectedVersion" in body.data && provider.convertV1) result = await provider.convertV1({ ...common, expectedVersion: body.data.expectedVersion });
        else return reply.status(503).send({ error: "learning_unavailable" });
        if (result.status !== "success") {
          const status = result.status === "forbidden" ? 403 : result.status === "not_found" ? 404 : result.status === "invalid" ? 422 : result.status === "rate_limited" ? 429 : 409;
          return reply.status(status).send({ error: result.status === "invalid" ? "resource_unavailable" : result.status });
        }
        let value: unknown = result.value;
        if (name === "editorCreate") {
          const route = result.value as { pathId: string; pathVersionId: string; editVersion: number };
          value = { pathId: route.pathId, pathVersionId: route.pathVersionId, editVersion: route.editVersion, status: "draft" };
        } else if (name === "editorGet" || name === "editorPatch") value = { route: result.value };
        else if (name === "editorPreview") {
          const preview = result.value as Record<string, unknown>;
          value = { previewId: preview.previewId, activeActivity: preview.activeActivity, issues: preview.issues, expiresAt: preview.expiresAt };
        }
        const response = endpoint.response.safeParse(value);
        if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
        return reply.send(response.data);
      } catch {
        request.log.error("Guided v2 editorial request failed");
        return reply.status(503).send({ error: "learning_unavailable" });
      }
    } });
  }

  app.post<{ Body: unknown }>(V2HttpContracts.importValidate.path, { bodyLimit: 10 * 1024 * 1024 + 64 * 1024 }, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    if (!key.success) return reply.status(400).send({ error: "invalid_idempotency_key" });
    try {
      const packageBytes = Buffer.byteLength(JSON.stringify((request.body as { package?: unknown })?.package), "utf8");
      if (packageBytes > MAX_ROUTE_IMPORT_BYTES) return reply.status(413).send({ error: "import_too_large" });
    } catch { return reply.status(400).send({ error: "invalid_request" }); }
    const body = V2HttpContracts.importValidate.body.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: "invalid_request", fieldErrors: body.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })) });
    let result: Awaited<ReturnType<ImportProvider["validateImport"]>>;
    try {
      result = await dependencies.provider.validateImport({
        actorUserId: user.user.id, canCreate: capabilities.canCreate, canEditAll: capabilities.canEditAll,
        idempotencyKey: key.data, package: body.data.package, bindings: body.data.bindings,
        targetPathId: body.data.targetPathId, expectedVersion: body.data.expectedVersion,
      });
    } catch {
      request.log.error("Guided v2 import validation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "too_large") return reply.status(413).send({ error: "import_too_large" });
    if (result.status === "rate_limited") return reply.status(429).send({ error: "rate_limited" });
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status === "version_conflict" || result.status === "conflict") return reply.status(409).send({ error: result.status });
    if (result.status === "invalid") return reply.status(400).send({ error: "invalid_request", issues: result.issues });
    if (result.status !== "success") return reply.status(503).send({ error: "learning_unavailable" });
    const response = V2HttpContracts.importValidate.response.safeParse(result.value);
    if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
    return reply.send(response.data);
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.importCommit.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.importCommit.params.safeParse(request.params);
    const body = V2HttpContracts.importCommit.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    let result: Awaited<ReturnType<ImportProvider["commitImport"]>>;
    try {
      result = await dependencies.provider.commitImport({
        actorUserId: user.user.id, canCreate: capabilities.canCreate, canEditAll: capabilities.canEditAll,
        importId: params.data.id, idempotencyKey: key.data, hash: body.data.hash,
        expectedVersion: body.data.expectedVersion,
      });
    } catch {
      request.log.error("Guided v2 import commit failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status === "version_conflict" || result.status === "conflict") return reply.status(409).send({ error: result.status });
    if (result.status === "invalid") return reply.status(422).send({ error: "route_not_ready", issues: result.issues });
    if (result.status !== "success") return reply.status(503).send({ error: "learning_unavailable" });
    const response = V2HttpContracts.importCommit.response.safeParse(result.value);
    if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
    return reply.send(response.data);
  });

  app.get<{ Params: { id: string } }>(V2HttpContracts.editorExport.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate) return reply.status(403).send({ error: "forbidden" });
    const params = V2HttpContracts.editorExport.params.safeParse(request.params);
    if (!params.success) return reply.status(404).send({ error: "not_found" });
    let result: Awaited<ReturnType<ImportProvider["exportPath"]>>;
    try {
      result = await dependencies.provider.exportPath({ actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll, pathId: params.data.id });
    } catch {
      request.log.error("Guided v2 route export failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
    if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
    if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
    if (result.status !== "success") return reply.status(409).send({ error: result.status });
    const response = V2HttpContracts.editorExport.response.safeParse(result.value);
    if (!response.success) return reply.status(503).send({ error: "learning_unavailable" });
    return reply.send(response.data);
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorValidate.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorValidate.params.safeParse(request.params);
    const body = V2HttpContracts.editorValidate.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    try {
      const result = await dependencies.provider.validatePath({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        canPublish: capabilities.canPublish, pathId: params.data.id, expectedVersion: body.data.expectedVersion,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorValidate.response.parse(result.value));
    } catch {
      request.log.error("Guided v2 validation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorTransition.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorTransition.params.safeParse(request.params);
    const body = V2HttpContracts.editorTransition.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    if (body.data.status === "draft") return reply.status(409).send({ error: "conflict" });
    try {
      const result = await dependencies.provider.transitionPath({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        canReview: capabilities.canReview, canPublish: capabilities.canPublish,
        pathId: params.data.id, expectedVersion: body.data.expectedVersion,
        status: body.data.status, reviewNote: body.data.reviewNote,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status === "invalid") return reply.status(422).send({ error: "route_not_ready", issues: result.issues });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorTransition.response.parse({ route: result.value }));
    } catch {
      request.log.error("Guided v2 transition failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>(V2HttpContracts.editorVersion.path, async (request, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const user = await resolveGuidedUser(request, dependencies.identityProvider);
    if (user.kind !== "authenticated") return sendGuidedUserError(user, reply);
    if (!dependencies.contentProvider || !dependencies.provider) return reply.status(503).send({ error: "learning_unavailable" });
    let roles: Awaited<ReturnType<ContentProvider["getRoles"]>>;
    try { roles = await dependencies.contentProvider.getRoles(user.user.id); }
    catch { return reply.status(503).send({ error: "learning_unavailable" }); }
    const capabilities = getContentCapabilities(roles);
    if (!capabilities.canCreate && !capabilities.canEditAll) return reply.status(403).send({ error: "forbidden" });
    const key = z.string().uuid().safeParse(request.headers["idempotency-key"]);
    const params = V2HttpContracts.editorVersion.params.safeParse(request.params);
    const body = V2HttpContracts.editorVersion.body.safeParse(request.body);
    if (!key.success || !params.success || !body.success) return reply.status(400).send({ error: "invalid_request" });
    try {
      const result = await dependencies.provider.createVersion({
        actorUserId: user.user.id, canEdit: true, canEditAll: capabilities.canEditAll,
        pathId: params.data.id, expectedVersion: body.data.expectedVersion, releaseNotes: body.data.releaseNotes,
      });
      if (result.status === "forbidden") return reply.status(403).send({ error: "forbidden" });
      if (result.status === "not_found") return reply.status(404).send({ error: "not_found" });
      if (result.status !== "success") return reply.status(409).send({ error: result.status });
      return reply.status(201).header("Cache-Control", "private, no-store")
        .send(V2HttpContracts.editorVersion.response.parse(result.value));
    } catch {
      request.log.error("Guided v2 version creation failed");
      return reply.status(503).send({ error: "learning_unavailable" });
    }
  });
}
