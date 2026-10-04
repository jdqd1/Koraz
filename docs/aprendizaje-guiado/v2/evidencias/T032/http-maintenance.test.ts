import { writeFile } from "node:fs/promises";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { RoutePackageSchema, V2HttpContracts } from "../../../../../packages/contracts/dist/index.js";
import { createImageHarness } from "../../../../../apps/api/test/helpers/guided-v2-images.js";
import { v2Id } from "../../../../../apps/api/test/helpers/guided-v2-db.js";

let h: Awaited<ReturnType<typeof createImageHarness>>, stop: () => void;
let listening = false;
const epoch = Date.parse("2026-10-04T02:30:00Z"), enrollmentId = v2Id(8);
let serial = 80000;
function definition() {
  const base = { relatedObjectiveKeys: [], required: true, sourceKeys: ["source"], hints: [], use: "learning", feedback: { explanation: "La relación sintética se explica desde el origen al resultado.", commonError: "Revisa el orden de la relación.", sourceKeys: ["source"] }, misconceptionMappings: [], alternativeActivityKey: null };
  const objectives = Array.from({ length: 13 }, (_, i) => ({ key: `objective-${i}`, title: `Comprender la relación sintética ${i + 1}`, unitKey: i === 12 ? "child-unit" : "unit", verb: "explain", criticality: i === 0 ? "core" : "supporting", required: true, prerequisiteKeys: i === 12 ? ["objective-0"] : [], sourceKeys: ["source"], comparisonGroup: null,
    misconceptions: i === 0 ? [{ key: "inversion", description: "Confusión confirmada: invertir el origen y el resultado.", critical: true, remediationActivityKey: "remedy-0", verificationActivityKeys: ["verify-0"] }] : [] }));
  const choice = (i: number, suffix: string, use = "learning", required = true) => ({ ...base, key: `${suffix}-${i}`, objectiveKey: `objective-${i}`, equivalenceKey: `${suffix}-${i}`, phase: suffix === "apply" ? "apply" : "retrieve", representation: suffix === "apply" ? "diagram" : "text", use, required, kind: "single_choice", prompt: `Recupera la relación sintética ${i + 1}`, payload: { options: [{ key: "yes", text: "El origen precede al resultado" }, { key: "no", text: "El resultado precede al origen" }], correctKey: "yes", distractorFeedback: { no: "Revisa qué aparece primero." } }, misconceptionMappings: i === 0 && use === "learning" ? [{ responseKey: "no", misconceptionKey: "inversion" }] : [] });
  const study = (i: number, key: string, phase = "learn") => ({ ...base, key, objectiveKey: `objective-${i}`, equivalenceKey: key, phase, representation: "text", kind: "study", prompt: `Estudia la relación sintética ${i + 1}`, payload: { body: "El origen precede al resultado en este ejemplo sintético.", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } });
  const activities = objectives.flatMap((_, i) => [study(i, `learn-${i}`), choice(i, "recall"), choice(i, "variant"), choice(i, "apply"), choice(i, "final", "final", false), choice(i, "seven", "retention7", false), choice(i, "thirty", "retention30", false), ...(i < 4 ? [choice(i, "diagnostic", "diagnostic", false)] : [])]);
  activities.push(study(0, "remedy-0", "remediate"), choice(0, "verify"));
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "t032", revision: 1, locale: "es", policyVersion: "guided-v2.0", route: { slug: "t032-route", title: "Práctica y mantenimiento sintéticos", summary: "Fixture técnico aislado", topicLabel: "Relaciones sintéticas", audience: "Alumno", discipline: "general", coverKey: "heart" },
    sources: [{ key: "source", kind: "reference", title: "Referencia sintética", citation: "Fixture T032, sección 1", locator: { heading: "Relación", sectionPath: [], page: 1 }, documentSha256: "a".repeat(64), excerpt: "El origen precede al resultado. Fuente sintética para verificar refuerzo.", url: null, verification: "provided", checkedAt: null }], assets: [], objectives,
    units: ["unit", "child-unit"].map(key => ({ key, title: key === "unit" ? "Comprender relaciones" : "Aplicación dependiente", objectiveKeys: objectives.filter(o => o.unitKey === key).map(o => o.key), activityKeys: activities.filter(a => objectives.find(o => o.key === a.objectiveKey)!.unitKey === key).map(a => a.key), support: "full", estimatedMinutes: 10 })), activities,
    assessments: ["diagnostic", "final", "retention7", "retention30"].map(kind => ({ key: kind === "diagnostic" ? "diagnosis" : kind, kind, afterUnitKey: null, objectiveKeys: kind === "diagnostic" ? objectives.slice(0, 4).map(o => o.key) : objectives.map(o => o.key), candidateActivityKeys: activities.filter(a => a.use === kind).map(a => a.key), thresholdPercent: 80, thresholdRationale: "Umbral documentado del fixture técnico para comprobar el flujo HTTP." })), reviewPlan: { objectiveKeys: objectives.map(o => o.key) }, editorial: { notes: "Sintético; no acreditado para publicación editorial.", unresolvedIssues: [] } });
}
async function state() { const result = await h.provider.invoke("enrollmentState", v2Id(1), { id: enrollmentId }, {}, ""); if (!("value" in result)) throw new Error(result.status); return V2HttpContracts.enrollmentState.response.parse(result.value).state; }
async function completeActivity(key: string, wrong = false) {
  vi.setSystemTime(Date.now() + 1000);
  const current = await state();
  const created = await h.provider.invoke("attemptCreate", v2Id(1), {}, { clientAttemptId: v2Id(serial++), enrollmentId, expectedEnrollmentVersion: current.rowVersion, target: { kind: "activity", key } }, v2Id(serial++));
  if (!("value" in created)) throw new Error(`${key}: ${created.status}`);
  const attempt = V2HttpContracts.attemptCreate.response.parse(created.value).attempt;
  const answer = attempt.activeActivity!.kind === "study" ? { kind: "study", acknowledged: true } : { kind: "single_choice", optionKey: wrong ? "no" : "yes" };
  const submitted = await h.provider.invoke("attemptResponse", v2Id(1), { id: attempt.attemptId }, { activityKey: attempt.activeActivity!.key, answer, confidence: null, expectedVersion: attempt.rowVersion }, v2Id(serial++));
  if (!("value" in submitted)) throw new Error(`${key} response: ${submitted.status}`);
  const receipt = V2HttpContracts.attemptResponse.response.parse(submitted.value);
  const closed = await h.provider.invoke("attemptComplete", v2Id(1), { id: attempt.attemptId }, { expectedVersion: receipt.attempt.rowVersion }, v2Id(serial++));
  if (!("value" in closed)) throw new Error(`${key} complete: ${closed.status}`);
}
async function reset(mode: string) {
  vi.setSystemTime(epoch);
  await h.pg.exec("delete from learning_v2_responses; delete from learning_v2_activity_state; delete from learning_v2_review_state; delete from learning_v2_objective_state; delete from learning_events; delete from learning_mutation_receipts; delete from learning_v2_attempts; delete from learning_rewards;");
  if (mode === "critical" || mode === "exhausted") {
    await completeActivity("learn-0"); await completeActivity("recall-0", true);
    if (mode === "exhausted") { await completeActivity("remedy-0"); await completeActivity("verify-0", true); await completeActivity("learn-0"); await completeActivity("remedy-0"); }
  } else if (mode === "review") {
    for (let i = 0; i < 12; i++) { await completeActivity(`learn-${i}`); await completeActivity(`recall-${i}`); }
    vi.setSystemTime(epoch + 2 * 86400000);
  } else if (mode === "retention") {
    for (const key of ["learn-0", "recall-0", "variant-0", "apply-0"]) await completeActivity(key);
    vi.setSystemTime(epoch + 10 * 86400000);
  }
  return state();
}
beforeAll(async () => {
  h = await createImageHarness();
  const pkg = definition();
  await h.pg.query("delete from learning_enrollments where id=$1", [v2Id(9)]);
  await h.pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(pkg), v2Id(7)]);
  await h.pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(7), v2Id(3)]);
  await h.pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(7), v2Id(1)]);
  await h.pg.exec("begin");
  await h.pg.query("update learning_enrollments set path_version_id=$1 where id=$2", [v2Id(7), enrollmentId]);
  await h.pg.query("insert into learning_enrollment_versions(enrollment_id,path_id,path_version_id) values($1,$2,$3)", [enrollmentId, v2Id(4), v2Id(7)]);
  await h.pg.query("update learning_paths set slug='t032-route',published_version_id=$1 where id=$2", [v2Id(7), v2Id(4)]);
  await h.pg.query("insert into learning_preferences(user_id,timezone) values($1,'America/Caracas')", [v2Id(1)]);
  await h.pg.exec("commit");
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(epoch);
  // Single-connection PGlite harness serializes requests; no independent-connection claim.
  let queue = Promise.resolve(); const releases = new Map<string, () => void>();
  h.app.addHook("onRequest", async request => { const prior = queue; queue = new Promise<void>(resolve => releases.set(request.id, resolve)); await prior; if (!request.url.startsWith("/__test/")) vi.setSystemTime(Date.now() + 10); });
  h.app.addHook("onResponse", async request => { releases.get(request.id)?.(); releases.delete(request.id); });
  h.app.post("/__test/reset/:mode", async request => reset((request.params as { mode: string }).mode));
  h.app.post("/__test/clock/:days", async request => { vi.setSystemTime(epoch + Number((request.params as { days: string }).days) * 86400000); return state(); });
  h.app.get("/__test/storage", async () => ({ responses: (await h.pg.query("select activity_key,purpose,score01 from learning_v2_responses order by accepted_at")).rows, agenda: (await h.pg.query("select objective_key,lapses,due_at,retention7_accepted_at,retention30_accepted_at from learning_v2_review_state order by objective_key")).rows }));
  h.app.post("/__test/stop", async () => { stop?.(); return { stopped: true }; });
  await h.app.listen({ host: "127.0.0.1", port: 41032 });
  listening = true;
  await writeFile(new URL("http-maintenance-ready.json", import.meta.url), JSON.stringify({ api: "http://127.0.0.1:41032", enrollmentId, slug: "t032-route", identity: "Synthetic t030 cookie identity; real provider and PGlite; controlled server Date only" }, null, 2));
}, 120000);
afterAll(async () => { if (listening && process.env.T032_BROWSER_HOLD === "true") await new Promise<void>(resolve => { const timer = setTimeout(resolve, 1200000); stop = () => { clearTimeout(timer); resolve(); }; }); await h?.close(); vi.useRealTimers(); }, 1201000);
it("offers only public diagnostic metadata and current practice over real HTTP", async () => {
  const response = await h.app.inject({ url: `/v2/guided-learning/enrollments/${enrollmentId}/state`, headers: { cookie: "t030=learner" } });
  expect(response.statusCode).toBe(200); expect(response.json().state.maintenance.diagnostic).toEqual({ status: "pending", assessmentKey: "diagnosis" });
  expect(response.body).not.toMatch(/correctKey|candidateActivityKeys|equivalenceKey|rubric|acceptedAnswers|seven-0|thirty-0/);
});
