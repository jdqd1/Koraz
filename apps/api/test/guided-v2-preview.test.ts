import { randomUUID } from "node:crypto";
import { describe, expect, it, afterAll, vi } from "vitest";
import { analyzeRouteGraph, RoutePackageSchema, V2HttpContracts, V2AttemptManifestSchema, type ContentProvider } from "@cediah/contracts";
import { createEditorPreviewSimulator, registerGuidedV2EditorImportRoutes } from "../src/guided-learning/v2/editor-routes.js";
import { editorV2FixturePackage } from "../../web/src/components/learning/editor/v2/editor-fixtures.js";
import { createImageHarness } from "./helpers/guided-v2-images.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";
import { v2Id } from "./helpers/guided-v2-db.js";
import { guidedV2PolicySnapshot } from "../src/guided-learning/v2/service.js";

const now = "2026-10-04T12:00:00.000Z";
function fixture() {
  const pkg = editorV2FixturePackage();
  pkg.objectives[0]!.misconceptions = [{ key: "confusion", description: "Confusión CORE sintética", critical: true, remediationActivityKey: "study", verificationActivityKeys: ["short"] }];
  pkg.activities.find(item => item.key === "choice")!.misconceptionMappings = [{ responseKey: "b", misconceptionKey: "confusion" }];
  const choice = structuredClone(pkg.activities.find(item => item.key === "choice")!);
  choice.key = "diagnostic-item"; choice.equivalenceKey = choice.key; choice.use = "diagnostic";
  pkg.activities.push(choice);
  pkg.units[0]!.activityKeys.push(choice.key);
  pkg.assessments = [{ key: "diagnosis", kind: "diagnostic", afterUnitKey: null, objectiveKeys: ["objective"], candidateActivityKeys: [choice.key], thresholdPercent: 80, thresholdRationale: "Umbral sintético de software para comprobar el diagnóstico sin acreditar dominio." }];
  const parsed = RoutePackageSchema.parse(pkg);
  expect(analyzeRouteGraph(parsed).issues).toEqual([]);
  return parsed;
}
function runner(profile: "beginner" | "diagnostic_correct" | "core_error" = "beginner") {
  const sim = createEditorPreviewSimulator(fixture(), profile, now);
  const run = (operation: string, body: object = {}, key = randomUUID()) => sim.execute({ operation, body: { expectedVersion: sim.read().state.rowVersion, ...body } }, key) as Record<string, unknown>;
  const start = (key: string, kind = "activity") => run("start", { target: { kind, key } });
  const answer = (value: object) => run("response", { activityKey: sim.read().attempt!.activeActivity!.key, answer: value, confidence: null });
  return { sim, run, start, answer };
}
describe("T033 isolated editorial simulator", () => {
  it("uses real diagnostic/CORE policies and separates sessions", () => {
    const beginner = runner(), diagnosed = runner("diagnostic_correct"), critical = runner("core_error");
    expect(beginner.sim.read().state.objectives[0]?.label).toBe("new");
    expect(diagnosed.sim.read().state.objectives[0]?.firstMasteredAt).toBeNull();
    expect(diagnosed.sim.read().state.maintenance?.diagnostic.status).toBe("completed");
    expect(critical.sim.read().state.objectives[0]?.criticalErrorOpen).toBe(true);
    critical.start("short"); critical.answer({ kind: "short_answer", text: "respuesta" });
    expect(beginner.sim.read().state.completedActivities).toBe(0);
  });
  it("shares correction, help and constructed submission/reveal/self rating", () => {
    const r = runner(); r.start("constructed");
    expect(() => r.run("help", { activityKey: "constructed", kind: "reveal" })).toThrow("conflict");
    const pending = r.answer({ kind: "constructed_response", text: "Mi razonamiento", selfRating: null });
    expect(pending.accepted).toBe(false);
    expect(JSON.stringify(pending)).not.toContain('"modelAnswer"');
    r.run("help", { activityKey: "constructed", kind: "reveal" });
    expect(r.sim.read().attempt?.constructedResponse?.stage).toBe("revealed");
    const response = r.answer({ kind: "constructed_response", text: "Mi razonamiento", selfRating: "good" });
    expect(response.accepted).toBe(true);
    expect(r.sim.read().state.objectives[0]?.firstMasteredAt).toBeNull();
    V2HttpContracts.attemptResponse.response.parse(response);
  });
  it("projects one case stage without future solutions, then advances child by child", () => {
    const r = runner(); r.start("case");
    expect(r.sim.read().attempt?.activeActivity?.prompt).toContain("Etapa 1");
    expect(JSON.stringify(r.sim.read())).not.toContain("Etapa 2");
    r.answer({ kind: "single_choice", optionKey: "a" });
    expect(r.sim.read().attempt?.activeActivity?.prompt).toContain("Etapa 2");
    r.answer({ kind: "short_answer", text: "respuesta" }); r.run("complete");
    expect(r.sim.read().attempt?.status).toBe("completed");
    expect(r.sim.read().state.nextAction.key).not.toBe("case");
  });
  it("grades match, sequence and spatial answers with the existing evaluator", () => {
    const r = runner();
    for (const [key, answer] of [
      ["match", { kind: "match", pairs: { p: "c" } }],
      ["sequence", { kind: "sequence", orderedKeys: ["one", "two", "three"] }],
      ["image", { kind: "image_target", mode: "hotspot", targetKey: "target", point: { x: .2, y: .2 } }],
    ] as const) { r.start(key); const value = V2HttpContracts.attemptResponse.response.parse(r.answer(answer)); expect(value.feedback.score01).toBe(1); r.run("complete"); }
  });
  it("reuses receipts and rejects CAS, malformed answers, backwards clocks and open-session switches", () => {
    const r = runner(); r.start("short");
    const key = randomUUID(), action = { operation: "response", body: { expectedVersion: r.sim.read().state.rowVersion, activityKey: "short", answer: { kind: "short_answer", text: "respuesta" }, confidence: null } };
    const first = r.sim.execute(action, key);
    expect(r.sim.execute(action, key)).toEqual(first);
    expect(() => r.sim.execute(action, randomUUID())).toThrow("version_conflict");
    expect(() => r.sim.execute({ ...action, body: { ...action.body, answer: { kind: "short_answer", text: "otra" } } }, key)).toThrow("conflict");
    r.run("complete"); r.start("sequence");
    expect(() => r.answer({ kind: "sequence", orderedKeys: ["one", "one", "two"] })).toThrow("invalid_answer");
    expect(() => r.start("study")).toThrow("conflict");
    expect(() => r.run("clock", { now: "2026-10-03T12:00:00Z" })).toThrow("invalid_clock");
  });
  it("simulates review dates without treating absence as a failed response", () => {
    const r = runner(); r.start("short"); r.answer({ kind: "short_answer", text: "respuesta" }); r.run("complete");
    const before = r.sim.read().state;
    r.run("clock", { now: "2026-10-10T12:00:00.000Z" });
    expect(r.sim.read().state.dueReviews).toBe(1);
    expect(r.sim.read().state.maintenance?.agenda).toEqual(before.maintenance?.agenda);
    expect(r.sim.read().state.objectives[0]?.objectiveScore).toBe(before.objectives[0]?.objectiveScore);
    r.start("objective", "review");
    expect(r.sim.read().attempt?.purpose).toBe("review");
    r.answer({ kind: "single_choice", optionKey: "a" }); r.run("complete");
    expect(r.sim.read().state.dueReviews).toBe(0);
  });
  it("allows omission without conferring mastery and reports empty routes explicitly", () => {
    const r = runner(); r.run("omit_diagnostic");
    expect(r.sim.read().state.maintenance?.diagnostic.status).toBe("omitted");
    expect(r.sim.read().state.masteredAt).toBeNull();
    const pkg = fixture(); pkg.activities = []; pkg.objectives = []; pkg.units = []; pkg.assessments = []; pkg.reviewPlan.objectiveKeys = [];
    const empty = createEditorPreviewSimulator(pkg, "core_error", now).read();
    expect(empty.targets).toEqual([]); expect(empty.profileWarning).toBeTruthy();
  });
  it("keeps reserved feedback private until assessment completion and grades labels", () => {
    const pkg = fixture();
    const reserve = structuredClone(pkg.activities.find(item => item.key === "short")!);
    reserve.key = "reserved"; reserve.equivalenceKey = reserve.key; reserve.use = "final"; reserve.feedback.explanation = "PRIVATE_FINAL_FEEDBACK";
    pkg.activities.push(reserve); pkg.units[0]!.activityKeys.push(reserve.key);
    pkg.assessments.push({ key: "final", kind: "final", afterUnitKey: null, objectiveKeys: ["objective"], candidateActivityKeys: [reserve.key], thresholdPercent: 80, thresholdRationale: "Umbral del fixture que comprueba reserva y corrección diferida." });
    const sim = createEditorPreviewSimulator(pkg, "beginner", now);
    sim.execute({ operation: "start", body: { expectedVersion: 1, target: { kind: "assessment", key: "final" } } }, randomUUID());
    const submitted = sim.execute({ operation: "response", body: { expectedVersion: 2, activityKey: "reserved", confidence: null, answer: { kind: "short_answer", text: "respuesta" } } }, randomUUID());
    expect(JSON.stringify(submitted)).not.toContain("PRIVATE_FINAL_FEEDBACK");
    const closed = sim.execute({ operation: "complete", body: { expectedVersion: 3 } }, randomUUID());
    expect(JSON.stringify(closed)).toContain("PRIVATE_FINAL_FEEDBACK");
    V2HttpContracts.attemptComplete.response.parse(closed);
    const image = pkg.activities.find(item => item.kind === "image_target")!;
    if (image.kind !== "image_target") throw new Error("fixture");
    image.payload.mode = "labeling"; image.payload.labels = [{ key: "a", text: "A" }, { key: "b", text: "B" }]; image.payload.correctLabelByTarget = { target: "a" };
    const labels = createEditorPreviewSimulator(pkg, "beginner", now);
    labels.execute({ operation: "start", body: { expectedVersion: 1, target: { kind: "activity", key: "image" } } }, randomUUID());
    const response = labels.execute({ operation: "response", body: { expectedVersion: 2, activityKey: "image", confidence: null, answer: { kind: "image_target", mode: "labeling", labelsByTarget: { target: "a" } } } }, randomUUID());
    expect(V2HttpContracts.attemptResponse.response.parse(response).feedback.score01).toBe(1);
  });
});

describe("T033 real Fastify/provider/PGlite preview isolation", () => {
  let harness: Awaited<ReturnType<typeof createImageHarness>> | null = null;
  afterAll(async () => { await harness?.close(); });
  it("authorizes editors, isolates actors, retries once and leaves all learner table counts unchanged", async () => {
    harness = await createImageHarness();
    await harness.pg.query("update learning_path_versions set policy_json=$1,definition_v2_json=$2 where id=$3", [JSON.stringify(guidedV2PolicySnapshot), JSON.stringify(harness.definition), v2Id(7)]);
    await harness.pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id,asset_id,rights_status,rights_credit) select $1,local_key,kind,topic_content_id,asset_id,rights_status,rights_credit from learning_v2_bindings where path_version_id=$2", [v2Id(7), v2Id(6)]);
    const signed = vi.fn().mockResolvedValue("https://preview-media.example.test/signed.png");
    const provider = createPostgresGuidedLearningV2Provider(harness.database, { assetStorage: { bucket: "test-assets", createDownloadUrl: signed } });
    const roles = new Map<string, string[]>([[v2Id(1), ["content_creator"]], [v2Id(2), ["content_creator"]]]);
    await registerGuidedV2EditorImportRoutes(harness.app, { provider, identityProvider: { getUser: async (request: { authorization?: string }) => request.authorization ? { id: request.authorization.includes("other") ? v2Id(2) : v2Id(1), email: "preview@example.test", name: "Editor" } : null } as never, contentProvider: { getRoles: async (id: string) => roles.get(id) ?? [] } as unknown as ContentProvider });
    await harness.app.ready();
    const tables = (await harness.pg.query<{ tablename: string }>("select tablename from pg_tables where schemaname='public' and (tablename like 'learning_%' or tablename like '%reward%') and tablename <> 'learning_mutation_receipts' order by tablename")).rows.map(item => item.tablename);
    const counts = async () => Object.fromEntries(await Promise.all(tables.map(async table => [table, (await harness!.pg.query<{ n: number }>(`select count(*)::int n from public.${table}`)).rows[0]!.n])));
    const before = await counts();
    const root = `/v2/editor/learning-paths/${v2Id(4)}/preview-sessions`;
    const pkg = harness.definition, bindings = { topicContentId: v2Id(3), sources: [], assets: [{ key: "figure", assetId: v2Id(10) }] };
    const post = (url: string, payload: unknown, actor = "editor", key = randomUUID()) => harness!.app.inject({ method: "POST", url, payload: JSON.stringify(payload), headers: { "content-type": "application/json", authorization: `Bearer ${actor}`, "idempotency-key": key } });
    const init = { package: pkg, bindings, profile: "beginner", now };
    roles.set(v2Id(1), ["student"]); expect((await post(root, init)).statusCode).toBe(403); roles.set(v2Id(1), ["content_creator"]);
    expect((await harness.app.inject({ method: "POST", url: root, payload: init })).statusCode).toBe(401);
    expect((await post(root, init, "other")).statusCode).toBe(404);
    const creation = await post(root, init);
    expect(creation.statusCode, creation.body).toBe(200);
    const session = creation.json();
    const actionUrl = `${root}/${session.previewId}/actions`;
    expect((await post(actionUrl, { operation: "clock", body: { expectedVersion: 1, now } }, "other")).statusCode).toBe(404);
    const started = await post(actionUrl, { operation: "start", body: { expectedVersion: session.state.rowVersion, target: { kind: "activity", key: "match" } } });
    expect(started.statusCode, started.body).toBe(200);
    V2AttemptManifestSchema.parse(started.json().attempt);
    const action = { operation: "response", body: { expectedVersion: started.json().state.rowVersion, activityKey: "match", answer: { kind: "match", pairs: { p1: "c1", p2: "c2", p3: "c3", p4: "c4" } }, confidence: null } };
    const key = randomUUID(), answered = await post(actionUrl, action, "editor", key);
    expect(answered.statusCode, answered.body).toBe(200);
    V2HttpContracts.attemptResponse.response.parse(answered.json());
    expect((await post(actionUrl, action, "editor", key)).json()).toEqual(answered.json());
    expect((await post(actionUrl, { operation: "complete", body: { expectedVersion: answered.json().state.rowVersion } })).statusCode).toBe(200);
    const imageStart = await post(actionUrl, { operation: "start", body: { expectedVersion: answered.json().state.rowVersion + 1, target: { kind: "activity", key: "hotspot" } } });
    expect(imageStart.statusCode, imageStart.body).toBe(200);
    const imageUrl = `${root}/${session.previewId}/image`;
    const imageBody = { activityKey: "hotspot", expectedVersion: imageStart.json().state.rowVersion };
    const imageRead = await post(imageUrl, imageBody);
    expect(imageRead.statusCode, imageRead.body).toBe(200);
    expect(imageRead.body).not.toMatch(/polygon|PRIVATE_SPATIAL_SOLUTION|storage_path/);
    expect(signed).toHaveBeenCalledOnce();
    expect((await post(imageUrl, { ...imageBody, expectedVersion: 1 })).statusCode).toBe(409);
    await harness.pg.query("update content_assets set status='pending',finalized_at=null where id=$1", [v2Id(10)]);
    expect((await post(imageUrl, imageBody)).statusCode).toBe(409);
    expect(signed).toHaveBeenCalledOnce();
    await harness.pg.query("update content_assets set status='ready',finalized_at=now() where id=$1", [v2Id(10)]);
    roles.set(v2Id(1), ["student"]); expect((await post(actionUrl, { operation: "clock", body: { expectedVersion: imageStart.json().state.rowVersion, now } })).statusCode).toBe(403);
    roles.set(v2Id(1), ["content_creator"]);
    const wall = Date.now(); const clock = vi.spyOn(Date, "now").mockReturnValue(wall + 11 * 60000);
    expect((await post(actionUrl, { operation: "clock", body: { expectedVersion: imageStart.json().state.rowVersion, now } })).statusCode).toBe(404);
    clock.mockRestore();
    expect(await counts()).toEqual(before);
  }, 120000);
});
