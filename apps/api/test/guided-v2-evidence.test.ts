import { sql, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler,
  type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { RoutePackageSchema, type RoutePackage } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { rebuildGuidedV2Evidence, type GuidedV2EvidenceEvent, type GuidedV2EvidenceResponse } from "../src/guided-learning/v2/evidence.js";
import { evaluateGuidedV2Gate } from "../src/guided-learning/v2/policy.js";
import { createPostgresGuidedV2AttemptService, readGuidedV2SourceFacts, createGuidedV2SnapshotReader, v2RebuildEvidence } from "../src/providers/postgres-guided-learning-v2.js";
import { readUpgradeEvidence } from "../src/guided-learning/v2/upgrade.js";
import { parseGuidedV2AttemptSnapshot } from "../src/guided-learning/v2/service.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";

const start = Date.parse("2026-08-01T12:00:00Z");
const at = (days = 0, hours = 0) => new Date(start + days * 86400000 + hours * 3600000).toISOString();
const base = { objectiveKey: "core", relatedObjectiveKeys: [], required: true, sourceKeys: [],
  equivalenceKey: "family", hints: ["Pista"], use: "learning", prompt: "Pregunta sintética",
  feedback: { explanation: "Feedback sintético", commonError: "Revisar", sourceKeys: [] },
  misconceptionMappings: [], alternativeActivityKey: null };
const choice = (key: string, phase = "retrieve", representation = "text") => ({ ...base,
  key, equivalenceKey: key, phase, representation, kind: "single_choice",
  payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "No" } } });
const study = (key: string, phase = "learn") => ({ ...base, key, equivalenceKey: key, phase,
  representation: "text", kind: "study", payload: { body: "Texto sintético", focusSpans: [], assetKey: null,
    scaffold: "explanation", videoRange: null } });
function definition(): RoutePackage {
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "evidence", revision: 1, locale: "es",
    route: { slug: "evidence-route", title: "Evidencia", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0", sources: [], assets: [],
    objectives: [{ key: "core", title: "Objetivo", unitKey: "unit", verb: "recall", criticality: "core", required: true,
      prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["core"], activityKeys: ["explain", "recall-a", "recall-b", "apply"], support: "full", estimatedMinutes: null }],
    activities: [study("explain"), choice("recall-a"), choice("recall-b"), choice("apply", "apply", "diagram"),
      { ...choice("final"), use: "final" }, { ...choice("retention-seven"), use: "retention7" },
      { ...choice("retention-thirty"), use: "retention30" }, study("remediate", "remediate"), choice("verify"),
      choice("recall-c"), choice("recall-d"), choice("recall-e")],
    assessments: [{ key: "final-test", kind: "final", afterUnitKey: null, objectiveKeys: ["core"], candidateActivityKeys: ["final"],
      thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar la política." },
      ...(["retention7", "retention30"] as const).map((kind) => ({ key: kind === "retention7" ? "seven-test" : "thirty-test", kind,
        afterUnitKey: null, objectiveKeys: ["core"], candidateActivityKeys: [kind === "retention7" ? "retention-seven" : "retention-thirty"],
        thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar la retención." }))],
    reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] } });
}
function response(n: number, activityKey: string, options: Partial<GuidedV2EvidenceResponse> = {}, route = definition()): GuidedV2EvidenceResponse {
  const activity = route.activities.find((item) => item.key === activityKey)!;
  return { kind: "response", id: String(n).padStart(5, "0"), semanticKey: `response:${n}`, at: at(0, n / 100),
    attemptId: `attempt-${n}`, activityKey, objectiveKey: activity.objectiveKey, equivalenceKey: activity.equivalenceKey,
    phase: activity.phase, modality: activity.representation, purpose: activity.use, gradingSource: "server", score01: 1,
    responseKey: "yes", assisted: false, valid: true, ...options };
}
const mastery = () => [response(1, "recall-a"), response(2, "recall-b"), response(3, "apply")];
const final = (n: number, correct = true): GuidedV2EvidenceEvent => ({ kind: "final", id: String(n).padStart(5, "0"),
  semanticKey: `final:${n}`, at: at(0, n / 100), assessmentKey: "final-test", attemptId: `final-${n}`, valid: true,
  answers: [{ objectiveKey: "core", score01: correct ? 1 : 0, gradingSource: "server", assisted: false }] });
const objective = (events: GuidedV2EvidenceEvent[], route = definition()) => rebuildGuidedV2Evidence(route, events).objectives[0]!;

describe("guided v2 evidence and policy", () => {
  it("T038 preserves mastery and consolidation history while unrelated objectives change", () => {
    const route = definition();
    route.objectives.push({ ...route.objectives[0]!, key: "other", required: false });
    route.activities.push({ ...route.activities.find((item) => item.key === "recall-a")!, key: "other-answer", objectiveKey: "other" });
    route.units[0]!.objectiveKeys.push("other");
    route.units[0]!.activityKeys.push("other-answer");
    const history = [...mastery(), response(10, "retention-seven", { at: at(8) }), response(11, "retention-thirty", { at: at(31) })];
    const expected = objective(history, route);
    expect(expected).toMatchObject({ mastered: true, consolidated: true, firstMasteredAt: at(0, .03), firstConsolidatedAt: at(31) });
    const unrelated = [response(20, "other-answer", { at: at(15), score01: 0 }, route),
      response(21, "other-answer", { at: at(32) }, route), { ...final(22), at: at(33) }];
    expect(objective([...unrelated, ...history], route)).toEqual(expected);
    expect(rebuildGuidedV2Evidence(route, [...history, ...unrelated], { dueObjectiveKeys: ["other"] }).objectives)
      .toMatchObject([{ reviewDue: false }, { reviewDue: true, label: "learning" }]);
  });

  it("P08 requires two recall families and an application in a different representation", () => {
    expect(objective(mastery())).toMatchObject({ mastered: true, objectiveScore: 100, label: "mastered", applicationDemonstrated: true, firstMasteredAt: at(0, .03) });
    expect(objective([response(1, "recall-a"), response(2, "recall-b"), response(3, "recall-c")]).mastered).toBe(false);
    expect(objective([response(1, "recall-a"), response(2, "apply"), response(3, "recall-c", { assisted: true })]).mastered).toBe(false);
    const route = definition();
    route.activities.find((item) => item.key === "apply")!.representation = "text";
    expect(objective(mastery().map((event) => event.activityKey === "apply" ? { ...event, modality: "text" } : event), route).mastered).toBe(false);
  });

  it.each([
    { assisted: true }, { purpose: "diagnostic" as const }, { purpose: "preview" as const },
    { gradingSource: "self" as const }, { gradingSource: "none" as const }, { score01: .75 }, { valid: false },
  ])("assisted, diagnostic, preview, self, partial and invalid answers cannot grant mastery (%j)", (excluded) => {
    expect(objective(mastery().map((event) => ({ ...event, ...excluded })))).toMatchObject({ mastered: false, objectiveScore: null });
  });

  it("reading and confidence do not grant evidence; empty evidence is null", () => {
    expect(objective([])).toMatchObject({ objectiveScore: null, label: "new" });
    expect(objective([response(1, "explain", { gradingSource: "none", score01: null })])).toMatchObject({ objectiveScore: null, mastered: false, label: "learning" });
  });

  it("compares application with the explanation, not with a worked example", () => {
    const route = definition();
    const example = route.activities.find((item) => item.key === "explain")!;
    if (example.kind !== "study") throw new Error("study fixture missing");
    route.activities.push({ ...example, key: "worked-example", equivalenceKey: "worked-example", representation: "diagram",
      payload: { ...example.payload, scaffold: "worked_example" } });
    expect(objective(mastery(), route).mastered).toBe(true);
  });

  it("preview cannot change learner state or postpone eligibility of a real response", () => {
    const first = response(1, "recall-a", { at: at() });
    const preview = response(2, "recall-a", { at: at(0, 23), purpose: "preview" });
    const real = response(3, "recall-a", { at: at(1), score01: 0 });
    expect(objective([preview])).toEqual(objective([]));
    expect(objective([first, preview, real])).toEqual(objective([first, real]));
  });

  it("keeps one family and does not reset the eligible window on immediate retries", () => {
    const route = definition();
    route.activities.find((item) => item.key === "recall-b")!.equivalenceKey = "recall-a";
    route.activities.find((item) => item.key === "apply")!.equivalenceKey = "recall-a";
    expect(objective([response(1, "recall-a", {}, route), response(2, "recall-b", {}, route), response(3, "apply", {}, route)], route).evidenceWindow).toHaveLength(1);
    const initial = response(1, "recall-a", { at: at(), score01: 0 });
    expect(objective([initial, response(2, "recall-a", { at: at(0, 23) })]).objectiveScore).toBe(0);
    expect(objective([initial, response(2, "recall-a", { at: at(1) })]).objectiveScore).toBe(100);
  });

  it("reuse waits 24h from the last response or reveal, including assisted exposures", () => {
    const initial = response(1, "recall-a", { at: at(), score01: 0 });
    const reveal: GuidedV2EvidenceEvent = { kind: "reveal", id: "00002", semanticKey: "reveal:2", at: at(0, 23), activityKey: "recall-a" };
    expect(objective([initial, reveal, response(3, "recall-a", { at: at(1, 22) })]).objectiveScore).toBe(0);
    expect(objective([initial, reveal, response(3, "recall-a", { at: at(1, 23) })]).objectiveScore).toBe(100);
    const helped = response(2, "recall-a", { at: at(0, 23), assisted: true });
    expect(objective([initial, helped, response(3, "recall-a", { at: at(1) })]).objectiveScore).toBe(0);
  });

  it("uses only the five latest distinct eligible families and unrounded objective scores", () => {
    const events = [response(1, "recall-a", { score01: 0 }), response(2, "recall-b"), response(3, "apply"),
      response(4, "recall-c"), response(5, "recall-d"), response(6, "recall-e")];
    const state = objective(events);
    expect(state.evidenceWindow.map((event) => event.activityKey)).toEqual(["recall-b", "apply", "recall-c", "recall-d", "recall-e"]);
    expect(state.objectiveScore).toBe(100);
    expect(objective([response(1, "recall-a"), response(2, "recall-b"), response(3, "apply", { score01: 0 })]).objectiveScore).toBe(200 / 3);
  });

  it("a latest eligible failure revokes current mastery while retaining its first date", () => {
    const state = objective([...mastery(), response(4, "recall-c", { score01: 0 })]);
    expect(state).toMatchObject({ mastered: false, label: "reinforce", firstMasteredAt: at(0, .03) });
    expect(objective([...mastery(), response(4, "recall-c", { score01: 0, gradingSource: "self" })]).mastered).toBe(true);
    expect(objective([...mastery(), response(4, "recall-c", { score01: 0, assisted: true })]).mastered).toBe(true);
  });

  it("critical errors need editorial mapping, completed remediation and objective verification", () => {
    const route = definition();
    route.objectives[0]!.misconceptions = [{ key: "error", description: "Confusión sintética", critical: true,
      remediationActivityKey: "remediate", verificationActivityKeys: ["verify", "recall-a"] }];
    route.activities.find((item) => item.key === "recall-a")!.misconceptionMappings = [{ responseKey: "no", misconceptionKey: "error" }];
    const wrong = response(1, "recall-a", { score01: 0, responseKey: "no", at: at() });
    expect(objective([wrong], route)).toMatchObject({ criticalErrorOpen: true, label: "reinforce" });
    expect(objective([wrong, response(2, "verify")], route).criticalErrorOpen).toBe(true);
    const remediate = response(2, "remediate", { gradingSource: "none", score01: null });
    expect(objective([wrong, remediate, response(3, "verify", { assisted: true })], route).criticalErrorOpen).toBe(true);
    expect(objective([wrong, remediate, response(3, "verify")], route).criticalErrorOpen).toBe(false);
    expect(objective([wrong, remediate, response(3, "recall-a", { at: at(0, 23) })], route).criticalErrorOpen).toBe(true);
    expect(objective([wrong, remediate, response(3, "recall-a", { at: at(1) })], route).criticalErrorOpen).toBe(false);
    expect(objective([response(1, "recall-b", { score01: 0, responseKey: "no" })], route).criticalErrorOpen).toBe(false);
  });

  it("P09 CORE cannot be compensated by a high average; missing is zero and optional failures do not block", () => {
    const route = definition();
    route.objectives.push({ ...route.objectives[0]!, key: "required", criticality: "high_yield" },
      { ...route.objectives[0]!, key: "optional", criticality: "detail", required: false });
    const states = [{ objectiveKey: "core", objectiveScore: 80, mastered: false, criticalErrorOpen: false },
      { objectiveKey: "required", objectiveScore: 100, mastered: true, criticalErrorOpen: false },
      { objectiveKey: "optional", objectiveScore: 0, mastered: false, criticalErrorOpen: true }];
    expect(evaluateGuidedV2Gate(route, "unit", states)).toMatchObject({ score: 90, passed: false, missingCoreKeys: ["core"] });
    states[0]!.mastered = true;
    expect(evaluateGuidedV2Gate(route, "unit", states).passed).toBe(true);
    expect(evaluateGuidedV2Gate(route, "unit", states.slice(0, 1))).toMatchObject({ score: 40, passed: false });
    states[0]!.objectiveScore = 59.9;
    expect(evaluateGuidedV2Gate(route, "unit", states)).toMatchObject({ score: 79.95, passed: false });
  });

  it("blocked descendants leave independent branches available", () => {
    const route = definition();
    route.objectives.push({ ...route.objectives[0]!, key: "child", prerequisiteKeys: ["core"] },
      { ...route.objectives[0]!, key: "independent", prerequisiteKeys: [] });
    const availability = rebuildGuidedV2Evidence(route, []).availability;
    expect(availability.find((item) => item.objectiveKey === "child")).toMatchObject({ available: false, blockedBy: ["core"] });
    expect(availability.find((item) => item.objectiveKey === "independent")?.available).toBe(true);
  });

  it("P10 completed, mastered and consolidated are separate; dispensations have their own count", () => {
    const studyEvent = response(0, "explain", { at: at(), gradingSource: "none", score01: null });
    const failed = mastery().map((event) => ({ ...event, score01: 0 }));
    expect(rebuildGuidedV2Evidence(definition(), [studyEvent, ...failed, final(4, false)]).route).toMatchObject({ completed: true, mastered: false, consolidated: false, completedActivities: 4 });
    const dispensed: GuidedV2EvidenceEvent = { kind: "dispense", id: "00004", semanticKey: "dispense", at: at(0, .04), activityKey: "explain", reason: "Gate demostrado; guided-v2.0" };
    const state = rebuildGuidedV2Evidence(definition(), [...mastery(), dispensed, final(5)]);
    expect(state.route).toMatchObject({ completed: true, mastered: true, consolidated: false,
      completedActivities: 3, dispensedActivities: 1, plannedRequiredActivities: 4, progressPercent: 75 });
    expect(rebuildGuidedV2Evidence(definition(), [...mastery(), { ...dispensed, reason: " " }, final(5)]).route.completed).toBe(false);
    expect(rebuildGuidedV2Evidence(definition(), [studyEvent, ...mastery()]).route.completed).toBe(false);
  });

  it("a final omitting a required objective scores that objective zero", () => {
    const route = definition();
    route.objectives.push({ ...route.objectives[0]!, key: "missing" });
    expect(rebuildGuidedV2Evidence(route, [final(1)]).route.finalScore).toBe(50);
  });

  it("retention requires days 7 and 30, separation of 7 days and distinct families", () => {
    const origin = at(0, .03);
    const seven = response(10, "retention-seven", { at: new Date(Date.parse(origin) + 7 * 86400000).toISOString() });
    const thirty = response(11, "retention-thirty", { at: new Date(Date.parse(origin) + 30 * 86400000).toISOString() });
    expect(objective([...mastery(), seven, thirty])).toMatchObject({ consolidated: true, firstConsolidatedAt: thirty.at });
    expect(objective([...mastery(), { ...seven, at: thirty.at }, thirty]).consolidated).toBe(false);
    expect(objective([...mastery(), { ...seven, at: new Date(Date.parse(thirty.at) - 6 * 86400000).toISOString() }, thirty]).consolidated).toBe(false);
    expect(objective([...mastery(), { ...seven, at: new Date(Date.parse(origin) + 7 * 86400000 - 1).toISOString() }, thirty]).consolidated).toBe(false);
    const route = definition();
    route.activities.find((item) => item.key === "retention-thirty")!.equivalenceKey = "retention-seven";
    expect(objective([...mastery(), seven, { ...thirty, equivalenceKey: "retention-seven" }], route).consolidated).toBe(false);
    const failed = objective([...mastery(), seven, thirty, response(12, "recall-c", { at: at(31), score01: 0 })]);
    expect(failed).toMatchObject({ consolidated: false, mastered: false, label: "reinforce", firstConsolidatedAt: thirty.at, firstMasteredAt: origin });
  });

  it("replay and input ordering preserve exact state; semantic duplicates have no effect", () => {
    const events = [...mastery(), final(4)];
    const state = rebuildGuidedV2Evidence(definition(), events);
    expect(rebuildGuidedV2Evidence(definition(), [...events].reverse())).toEqual(state);
    expect(rebuildGuidedV2Evidence(definition(), [...events, ...events.map((event) => ({ ...event, id: `duplicate-${event.id}` }))])).toEqual(state);
    const ties = mastery().map((event) => ({ ...event, at: at() }));
    expect(rebuildGuidedV2Evidence(definition(), [...ties].reverse())).toEqual(rebuildGuidedV2Evidence(definition(), ties));
  });

  it("recovery keeps the first mastery date and respects the unit's editorial threshold", () => {
    const events = [...mastery(), response(4, "recall-c", { score01: 0 }), response(5, "recall-d")];
    expect(objective(events)).toMatchObject({ mastered: true, objectiveScore: 80,
      firstMasteredAt: at(0, .03), lastMasteredAt: at(0, .05) });
    const route = definition();
    route.assessments.push({ key: "gate", kind: "unit_gate", afterUnitKey: "unit", objectiveKeys: ["core"],
      candidateActivityKeys: ["recall-a", "recall-b", "apply"], thresholdPercent: 81,
      thresholdRationale: "Umbral editorial sintético mayor al valor predeterminado." });
    expect(objective(events, route).mastered).toBe(false);
  });

  it("a case counts its wrapper once only after all children in the same attempt", () => {
    const route = definition();
    route.activities.push({ ...route.activities.find((item) => item.key === "recall-a")!, kind: "case",
      key: "case", equivalenceKey: "case", representation: "case", payload: { stages: [
        { key: "first", narrative: "Primera etapa", childActivityKey: "recall-a" },
        { key: "second", narrative: "Segunda etapa", childActivityKey: "recall-b" },
      ] } });
    route.units[0]!.activityKeys = ["case"];
    const first = response(1, "recall-a", { attemptId: "case-attempt" });
    const second = response(2, "recall-b", { attemptId: "case-attempt" });
    expect(rebuildGuidedV2Evidence(route, [first]).route).toMatchObject({ completedActivities: 0, plannedRequiredActivities: 1 });
    expect(rebuildGuidedV2Evidence(route, [first, second]).route).toMatchObject({ completedActivities: 1, plannedRequiredActivities: 1 });
    expect(rebuildGuidedV2Evidence(route, [first, { ...second, attemptId: "other" }]).route.completedActivities).toBe(0);
  });

  it("an empty initial plan is not a completed route", () => {
    const route = definition();
    route.units[0]!.activityKeys = [];
    expect(rebuildGuidedV2Evidence(route, [final(1)]).route).toMatchObject({ completed: false, plannedRequiredActivities: 0, progressPercent: 0 });
  });
});

function databaseFor(pg: PGlite): Kysely<CediahDatabase> {
  const connection: DatabaseConnection = { async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await pg.query<R>(query.sql, [...query.parameters]);
    return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
  }, async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; } };
  return new Kysely<CediahDatabase>({ dialect: {
    createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => { await pg.exec("begin"); },
      commitTransaction: async () => { await pg.exec("commit"); }, rollbackTransaction: async () => { await pg.exec("rollback"); },
      destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }),
  } });
}

describe("guided v2 evidence persisted/rebuilt from source facts", () => {
  let pg: PGlite;
  let database: Kysely<CediahDatabase>;
  let clock = new Date(at());
  let service: ReturnType<typeof createPostgresGuidedV2AttemptService>;
  let serial = 1000;
  beforeAll(async () => {
    pg = await createGuidedV2Database();
    await seedGuidedV2Runtime(pg);
    await pg.query("update public.content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
    await pg.query("update public.learning_path_versions set definition_v2_json=$1::jsonb where id=$2", [JSON.stringify(definition()), v2Id(6)]);
    await pg.query("insert into public.learning_v2_bindings (path_version_id,local_key,kind,topic_content_id) values ($1,'topic','topic',$2)", [v2Id(6), v2Id(3)]);
    await pg.query("update public.learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(6), v2Id(1)]);
    await pg.query("update public.learning_paths set published_version_id=$1 where id=$2", [v2Id(6), v2Id(4)]);
    database = databaseFor(pg);
    service = createPostgresGuidedV2AttemptService(database, { now: () => clock });
  }, 120000);
  afterAll(async () => { await database?.destroy(); await pg?.close(); });
  async function answer(activityKey: string) {
    const created = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++),
      idempotencyKey: v2Id(serial++), expectedEnrollmentVersion: 1, target: { kind: "activity", key: activityKey } });
    if (created.status !== "success") throw new Error("create failed");
    const input = { userId: v2Id(1), attemptId: created.value.attemptId, activityKey,
      idempotencyKey: v2Id(serial++), expectedVersion: 1, confidence: "sure" as const,
      answer: { kind: "single_choice", optionKey: "yes" } };
    const accepted = await service.respond(input);
    expect(accepted.status).toBe("success");
    return { input, accepted };
  }

  it("T038 rechecks revocation when reusing a definition from an earlier transaction", async () => {
    const created = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++),
      idempotencyKey: v2Id(serial++), expectedEnrollmentVersion: 1, target: { kind: "activity", key: "recall-e" } });
    if (created.status !== "success") throw new Error("create failed");
    let loaded: Parameters<typeof service.respond>[0]["definition"];
    expect((await service.read({ userId: v2Id(1), attemptId: created.value.attemptId, onDefinition: (value) => { loaded = value; } })).status).toBe("success");
    expect(loaded?.pathVersionId).toBe(v2Id(6));
    await pg.query("update content_items set status='draft' where id=$1", [v2Id(3)]);
    try {
      expect(await service.respond({ userId: v2Id(1), attemptId: created.value.attemptId, activityKey: "recall-e",
        idempotencyKey: v2Id(serial++), expectedVersion: 1, confidence: null,
        answer: { kind: "single_choice", optionKey: "yes" }, definition: loaded })).toEqual({ status: "access_revoked" });
      expect(await service.complete({ userId: v2Id(1), attemptId: created.value.attemptId,
        idempotencyKey: v2Id(serial++), expectedVersion: 1, definition: loaded })).toEqual({ status: "access_revoked" });
      expect((await pg.query("select count(*)::int as total from learning_v2_responses where attempt_id=$1", [created.value.attemptId])).rows)
        .toEqual([{ total: 0 }]);
    } finally { await pg.query("update content_items set status='published' where id=$1", [v2Id(3)]); }
  });

  it("persists mastery atomically, reconstructs corrupted cache and keeps replay versions stable", async () => {
    await answer("recall-a");
    clock = new Date(at(0, 1));
    await answer("recall-b");
    clock = new Date(at(0, 2));
    const third = await answer("apply");
    const state = await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
    expect(state).toMatchObject({ status: "success", value: { objectives: [{ mastered: true, firstMasteredAt: at(0, 2) }] } });
    const cached = await pg.query<{ row_version: number; evidence_json: unknown }>("select row_version,evidence_json from public.learning_v2_objective_state where enrollment_id=$1", [v2Id(8)]);
    expect(await service.respond(third.input)).toEqual(third.accepted);
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toEqual(state);
    expect((await pg.query("select row_version from public.learning_v2_objective_state where enrollment_id=$1", [v2Id(8)])).rows).toEqual([{ row_version: cached.rows[0]!.row_version }]);
    await pg.query("update public.learning_v2_objective_state set first_mastered_at=first_mastered_at+interval '0.000123 seconds' where enrollment_id=$1", [v2Id(8)]);
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toEqual(state);
    expect((await pg.query("select row_version from public.learning_v2_objective_state where enrollment_id=$1", [v2Id(8)])).rows).toEqual([{ row_version: cached.rows[0]!.row_version }]);
    const rewards = await pg.query("select award_key,reward_kind,xp,event_id,local_date,created_at from learning_rewards where user_id=$1 order by award_key", [v2Id(1)]);
    expect(rewards.rows).toHaveLength(2);
    const recalledKey = `v2:${v2Id(6)}:core:v2_objective_recalled`;
    await pg.query("delete from learning_rewards where user_id=$1 and award_key=$2", [v2Id(1), recalledKey]);
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toEqual(state);
    expect((await pg.query("select award_key,reward_kind,xp,event_id,local_date,created_at from learning_rewards where user_id=$1 order by award_key", [v2Id(1)])).rows).toEqual(rewards.rows);
    expect((await pg.query("select count(*)::int as total from learning_events where user_id=$1 and semantic_key=$2", [v2Id(1), recalledKey])).rows).toEqual([{ total: 1 }]);
    await database.transaction().execute(async transaction => {
      const { events, ...batched } = await readGuidedV2SourceFacts(transaction, v2Id(1), v2Id(8), v2Id(6));
      expect(batched).toEqual(await readUpgradeEvidence(transaction, v2Id(1), v2Id(8), v2Id(6)));
      expect(events).toEqual(await transaction.selectFrom("learning_events")
        .select(["id", "user_id", "enrollment_id", "event_type", "semantic_key", "occurred_at", "policy_version", "payload_json"])
        .where("user_id", "=", v2Id(1)).where("enrollment_id", "=", v2Id(8))
        .where("policy_version", "=", "guided-v2.0").orderBy("occurred_at").orderBy("id").execute());
      const foreign = await readGuidedV2SourceFacts(transaction, v2Id(2), v2Id(8), v2Id(6));
      expect([foreign.attempts, foreign.responses, foreign.events]).toEqual([[],[],[]]);
      const readSnapshot = createGuidedV2SnapshotReader();
      const raw = batched.attempts[0]!.snapshot_json;
      const firstSnapshot = readSnapshot(batched.attempts[0]!.id, raw);
      expect(firstSnapshot).toEqual(parseGuidedV2AttemptSnapshot(raw));
      expect(readSnapshot(batched.attempts[0]!.id, structuredClone(raw))).toBe(firstSnapshot);
      expect(Object.isFrozen(firstSnapshot?.activities[0])).toBe(true);
      const changed = { ...structuredClone(firstSnapshot!), pathVersionId: v2Id(77) };
      expect(readSnapshot(batched.attempts[0]!.id, changed)).toEqual(parseGuidedV2AttemptSnapshot(changed));
      expect(readSnapshot(batched.attempts[0]!.id, { ...changed, orderedKeys: ["missing"] })).toBeNull();
      expect(createGuidedV2SnapshotReader()(batched.attempts[0]!.id, raw)).not.toBe(firstSnapshot);
      const review = await sql<{ dueAt: string }>`select due_at::text as "dueAt" from learning_v2_review_state
        where enrollment_id=${v2Id(8)}::uuid and objective_key='core'`.execute(transaction);
      try {
        await sql`update learning_v2_review_state set due_at=${clock}::timestamptz + interval '0.000123 seconds'
          where enrollment_id=${v2Id(8)}::uuid and objective_key='core'`.execute(transaction);
        expect((await v2RebuildEvidence(transaction, v2Id(1), v2Id(8), v2Id(6), clock, { persist: false }))
          .objectives[0]!.reviewDue).toBe(false);
        await sql`update learning_v2_review_state set due_at=${clock}::timestamptz - interval '0.000123 seconds'
          where enrollment_id=${v2Id(8)}::uuid and objective_key='core'`.execute(transaction);
        expect((await v2RebuildEvidence(transaction, v2Id(1), v2Id(8), v2Id(6), clock, { persist: false }))
          .objectives[0]!.reviewDue).toBe(true);
      } finally {
        await sql`update learning_v2_review_state set due_at=${review.rows[0]!.dueAt}::timestamptz
          where enrollment_id=${v2Id(8)}::uuid and objective_key='core'`.execute(transaction);
      }
    });
    await pg.query("update public.learning_v2_objective_state set evidence_json='{}',error_json='{}',first_mastered_at=null where enrollment_id=$1", [v2Id(8)]);
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toEqual(state);
    expect(await service.readEvidence({ userId: v2Id(2), enrollmentId: v2Id(8) })).toEqual({ status: "not_found" });
  });

  it("failure rolls back response, progress, event, receipt and evidence together", async () => {
    const created = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++),
      idempotencyKey: v2Id(serial++), expectedEnrollmentVersion: 1, target: { kind: "activity", key: "recall-c" } });
    if (created.status !== "success") throw new Error("create failed");
    const before = await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
    await pg.exec("create function t016_reject_evidence() returns trigger language plpgsql as $$ begin raise exception 't016_atomicity_probe'; end $$; create trigger t016_reject_evidence before update on public.learning_v2_objective_state for each row execute function t016_reject_evidence();");
    const key = v2Id(serial++);
    try {
      await expect(service.respond({ userId: v2Id(1), attemptId: created.value.attemptId, activityKey: "recall-c",
        idempotencyKey: key, expectedVersion: 1, confidence: null, answer: { kind: "single_choice", optionKey: "yes" } })).rejects.toThrow("t016_atomicity_probe");
    } finally { await pg.exec("drop trigger t016_reject_evidence on public.learning_v2_objective_state; drop function t016_reject_evidence();"); }
    const counts = await pg.query(`select (select count(*)::int from public.learning_v2_responses where attempt_id=$1) as responses,
      (select count(*)::int from public.learning_mutation_receipts where idempotency_key=$2) as receipts,
      (select count(*)::int from public.learning_events where semantic_key=$3) as events`, [created.value.attemptId, key, `v2-response:${created.value.attemptId}:recall-c`]);
    expect(counts.rows).toEqual([{ responses: 0, receipts: 0, events: 0 }]);
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toEqual(before);
    expect(await service.read({ userId: v2Id(1), attemptId: created.value.attemptId })).toMatchObject({ status: "success", value: { rowVersion: 1 } });
  });

  it("persists final and deferred evidence, then reconstructs historical consolidation after a later failure", async () => {
    clock = new Date(at(0, 3));
    const study = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++),
      expectedEnrollmentVersion: 1, target: { kind: "activity", key: "explain" } });
    if (study.status !== "success") throw new Error("create failed");
    await service.respond({ userId: v2Id(1), attemptId: study.value.attemptId, activityKey: "explain", idempotencyKey: v2Id(serial++),
      expectedVersion: 1, confidence: null, answer: { kind: "study", acknowledged: true } });
    const assess = async (key: string, activityKey: string) => {
      const created = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++),
        expectedEnrollmentVersion: 1, target: { kind: "assessment", key } });
      if (created.status !== "success") throw new Error("create assessment failed");
      const result = await service.respond({ userId: v2Id(1), attemptId: created.value.attemptId, activityKey,
        idempotencyKey: v2Id(serial++), expectedVersion: 1, confidence: null, answer: { kind: "single_choice", optionKey: "yes" } });
      expect(result.status).toBe("success");
      expect((await service.complete({ userId: v2Id(1), attemptId: created.value.attemptId, idempotencyKey: v2Id(serial++), expectedVersion: 2 })).status).toBe("success");
    };
    await assess("final-test", "final");
    clock = new Date(at(7, 2));
    const seven = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++),
      expectedEnrollmentVersion: 1, target: { kind: "activity", key: "retention-seven" } });
    if (seven.status !== "success") throw new Error("create reserve failed");
    // Directly launching a reserved item is not authorized evidence.
    await service.respond({ userId: v2Id(1), attemptId: seven.value.attemptId, activityKey: "retention-seven", idempotencyKey: v2Id(serial++),
      expectedVersion: 1, confidence: null, answer: { kind: "single_choice", optionKey: "yes" } });
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toMatchObject({ status: "success", value: {
      route: { completed: true, mastered: true, consolidated: false }, objectives: [{ firstConsolidatedAt: null }] } });
    await assess("seven-test", "retention-seven");
    clock = new Date(at(30, 2));
    await assess("thirty-test", "retention-thirty");
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toMatchObject({ status: "success", value: {
      route: { completed: true, mastered: true, consolidated: true }, objectives: [{ firstConsolidatedAt: at(30, 2) }] } });
    clock = new Date(at(31));
    const failed = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++),
      expectedEnrollmentVersion: 1, target: { kind: "activity", key: "recall-c" } });
    if (failed.status !== "success") throw new Error("create failed");
    await service.respond({ userId: v2Id(1), attemptId: failed.value.attemptId, activityKey: "recall-c", idempotencyKey: v2Id(serial++),
      expectedVersion: 1, confidence: null, answer: { kind: "single_choice", optionKey: "no" } });
    const before = await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
    expect(before).toMatchObject({ status: "success", value: { route: { completed: true, mastered: false, consolidated: false, consolidatedAt: at(30, 2) },
      objectives: [{ label: "reinforce", firstMasteredAt: at(0, 2), firstConsolidatedAt: at(30, 2) }] } });
    await pg.query("delete from public.learning_v2_objective_state where enrollment_id=$1", [v2Id(8)]);
    expect(await service.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toEqual(before);
  });
});
