import { writeFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";
import { RoutePackageSchema } from "../../../../../packages/contracts/dist/index.js";
import { createImageHarness } from "../../../../../apps/api/test/helpers/guided-v2-images.js";
import { v2Id } from "../../../../../apps/api/test/helpers/guided-v2-db.js";
import { prepareGuidedV2AttemptSnapshot, initialGuidedV2AttemptResume } from "../../../../../apps/api/src/guided-learning/v2/service.js";

let h: Awaited<ReturnType<typeof createImageHarness>>, stop: () => void;
let listening = false;
const attemptId = "b2800000-0000-4000-8000-000000000004";
function definition() {
  const pkg = h.definition;
  const base = { objectiveKey: "objective-a", relatedObjectiveKeys: [], phase: "apply", required: true, sourceKeys: [], representation: "case", hints: [], use: "learning", feedback: { explanation: "Feedback autorizado de la respuesta sintética.", commonError: "Revisa la relación elegida.", sourceKeys: [] }, misconceptionMappings: [], alternativeActivityKey: null };
  const activity = (key: string, kind: string, prompt: string, payload: unknown) => ({ ...base, key, equivalenceKey: key, kind, prompt, payload });
  const study = (key: string, scaffold: string) => ({ ...activity(key, "study", "Comprende el ejemplo sintético", { body: "APOYO_PREVIO: A origina un cambio y el cambio produce un resultado.", focusSpans: [], assetKey: null, scaffold, videoRange: null }), phase: "learn" });
  const activities = [
    study("worked", "worked_example"), study("partial", "partial_example"),
    activity("sequence", "sequence", "Ordena los cambios sintéticos", { items: [{ key: "result", text: "Resultado" }, { key: "origin", text: "Origen" }, { key: "change", text: "Cambio" }], acceptedOrders: [["origin", "change", "result"]], whyActivityKey: "correct" }),
    activity("prediction", "short_answer", "Predice qué sigue al cambio", { acceptedAnswers: ["resultado"], maxChars: 80, modelAnswer: "resultado", normalization: "nfkc-lower-space" }),
    activity("comparison", "match", "Completa la comparación sintética", { presentation: "comparison_table", prompts: [{ key: "p1", text: "Origen" }, { key: "p2", text: "Resultado" }], choices: [{ key: "c1", text: "Primero" }, { key: "c2", text: "Último" }], correctByPrompt: { p1: "c1", p2: "c2" }, allowReuse: false, edges: [] }),
    activity("detect", "single_choice", "Detecta el error en el orden propuesto", { options: [{ key: "yes", text: "El resultado aparece antes del origen" }, { key: "no", text: "El orden es coherente" }], correctKey: "yes", distractorFeedback: { no: "Revisa qué origina el cambio." } }),
    activity("correct", "constructed_response", "Corrige el error y explica la causa", { modelAnswer: "MODELO_AUTORIZADO: el origen produce el cambio antes del resultado.", rubric: [{ key: "cause", criterion: "Explica la relación de causa", example: "El origen precede al cambio." }], verificationActivityKey: "detect" }),
    activity("progressive", "case", "Caso progresivo sintético", { stages: [
      { key: "s1", narrative: "NARRATIVA_UNO: observa un ejemplo con apoyo.", childActivityKey: "partial" },
      { key: "s2", narrative: "NARRATIVA_DOS: ahora recupera el orden sin el ejemplo.", childActivityKey: "sequence" },
      { key: "s3", narrative: "NARRATIVA_TRES: aparece un cambio nuevo.", childActivityKey: "prediction" },
      { key: "s4", narrative: "NARRATIVA_CUATRO: compara las posiciones.", childActivityKey: "comparison" },
      { key: "s5", narrative: "NARRATIVA_CINCO: se propone un orden invertido.", childActivityKey: "detect" },
      { key: "s6", narrative: "NARRATIVA_SEIS: corrige y explica la causa.", childActivityKey: "correct" },
    ] }),
  ];
  return RoutePackageSchema.parse({ ...pkg, packageKey: "t031", assets: [], activities, units: [{ ...pkg.units[0], activityKeys: activities.map(item => item.key) }] });
}
async function seed(key: string) {
  // Only the fresh, in-memory PGlite created by this harness is reachable here.
  await h.pg.exec("delete from learning_v2_responses; delete from learning_v2_activity_state; delete from learning_v2_review_state; delete from learning_v2_objective_state; delete from learning_events; delete from learning_mutation_receipts; delete from learning_v2_attempts;");
  const pkg = definition();
  const snapshot = prepareGuidedV2AttemptSnapshot(pkg, v2Id(7), { kind: "activity", key });
  if (!snapshot) throw new Error("Invalid synthetic target");
  await h.pg.query("insert into learning_v2_attempts(id,user_id,enrollment_id,path_version_id,client_attempt_id,purpose,snapshot_json,resume_json) values($1,$2,$3,$4,$5,'activity',$6,$7)", [attemptId, v2Id(1), v2Id(8), v2Id(7), v2Id(95001), JSON.stringify(snapshot), JSON.stringify(initialGuidedV2AttemptResume())]);
}
beforeAll(async () => {
  h = await createImageHarness();
  // Install the synthetic content in the existing draft, then publish once.
  // The helper's published image version stays immutable.
  await h.pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(definition()), v2Id(7)]);
  await h.pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(7), v2Id(3)]);
  await h.pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(7), v2Id(1)]);
  await h.pg.exec("begin");
  await h.pg.query("update learning_enrollments set path_version_id=$1 where id=$2", [v2Id(7), v2Id(8)]);
  await h.pg.query("insert into learning_enrollment_versions(enrollment_id,path_id,path_version_id) values($1,$2,$3)", [v2Id(8), v2Id(4), v2Id(7)]);
  await h.pg.exec("commit");
  await seed("progressive");
  h.app.post("/__test/seed/:key", async request => { await seed((request.params as { key: string }).key); return { attemptId }; });
  h.app.get("/__test/storage", async () => ({ responses: (await h.pg.query("select activity_key,answer_json,modality,assisted,score01 from learning_v2_responses order by accepted_at")).rows, attempt: (await h.pg.query("select row_version,resume_json,status from learning_v2_attempts where id=$1", [attemptId])).rows[0], activityStates: (await h.pg.query("select activity_key,state from learning_v2_activity_state order by activity_key")).rows }));
  h.app.post("/__test/stop", async () => { stop?.(); return { stopped: true }; });
  await h.app.listen({ host: "127.0.0.1", port: 41031 });
  listening = true;
  await writeFile(new URL("http-ready.json", import.meta.url), JSON.stringify({ baseUrl: "http://127.0.0.1:41031", attemptId, identity: "Synthetic t030 cookie identity; real Fastify services and isolated PGlite" }, null, 2));
}, 120000);
afterAll(async () => {
  if (listening && process.env.T031_BROWSER_HOLD === "true") await new Promise<void>(resolve => { const timer = setTimeout(resolve, 1200000); stop = () => { clearTimeout(timer); resolve(); }; });
  await h?.close();
}, 1201000);
it("projects only the first case child and current narrative over real HTTP", async () => {
  const result = await h.app.inject({ url: `/v2/guided-learning/attempts/${attemptId}`, headers: { cookie: "t030=learner" } });
  expect(result.statusCode).toBe(200);
  expect(result.json().attempt.activeActivity.key).toBe("partial");
  expect(result.body).toContain("NARRATIVA_UNO");
  expect(result.body).not.toMatch(/NARRATIVA_DOS|MODELO_AUTORIZADO|acceptedOrders|correctByPrompt/);
});
