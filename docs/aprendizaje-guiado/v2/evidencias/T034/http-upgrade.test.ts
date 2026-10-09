import Fastify from "../../../../../apps/api/node_modules/fastify/fastify.js";
import { beforeAll, afterAll, expect, it } from "../../../../../apps/api/node_modules/vitest/dist/index.js";
import { writeFile } from "node:fs/promises";
import { createImageHarness } from "../../../../../apps/api/test/helpers/guided-v2-images.js";
import { v2Id } from "../../../../../apps/api/test/helpers/guided-v2-db.js";
import { createGuidedV2HttpProvider, registerGuidedV2Routes } from "../../../../../apps/api/src/guided-learning/v2/routes.js";
let h: Awaited<ReturnType<typeof createImageHarness>>, app: ReturnType<typeof Fastify>, stop: () => void;
const flags = { enabled: true, newEnrollments: true };
beforeAll(async () => {
  h = await createImageHarness(); app = Fastify();
  const definition = structuredClone(h.definition); definition.objectives[0]!.title = "Identificar una posición actualizada";
  await h.pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(definition), v2Id(7)]);
  await h.pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id,asset_id,rights_status,rights_credit) select $1,local_key,kind,topic_content_id,asset_id,rights_status,rights_credit from learning_v2_bindings where path_version_id=$2", [v2Id(7), v2Id(6)]);
  await h.pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(7), v2Id(1)]);
  await h.pg.query("update learning_paths set slug='t034-upgrade',published_version_id=$1 where id=$2", [v2Id(7), v2Id(4)]);
  const identity = { getUser: async (request: { cookie?: string }) => request.cookie ? { id: v2Id(1), name: "Alumno T034", email: "upgrade@example.test" } : null } as never;
  await registerGuidedV2Routes(app, { flags, identityProvider: identity, provider: createGuidedV2HttpProvider(h.database) });
  app.get("/v1/auth/me", async () => ({ features: { guidedLearning: true, guidedLearningMap: false }, roles: ["student"], user: { id: v2Id(1), name: "Alumno T034", email: "upgrade@example.test" } }));
  app.get("/v1/guided-learning/paths/:slug", async (_req, reply) => reply.status(404).send({ error: "not_found" }));
  app.post("/__test/off", async () => { flags.enabled = false; return { enabled: false }; });
  app.get("/__test/data", async () => ({ rows: (await h.pg.query("select path_version_id,row_version from learning_enrollments where id=$1", [v2Id(8)])).rows,
    histories: (await h.pg.query("select count(*)::int n from learning_enrollment_versions where enrollment_id=$1 and path_version_id=$2", [v2Id(8), v2Id(7)])).rows,
    responses: (await h.pg.query("select count(*)::int n from learning_v2_responses")).rows,
    rewards: (await h.pg.query("select count(*)::int n from learning_rewards")).rows }));
  app.post("/__test/stop", async () => { stop?.(); return { stopped: true }; });
  // Serialize independent browser/SSR requests over PGlite's one connection.
  let queue = Promise.resolve(); const releases = new Map<string, () => void>();
  app.addHook("onRequest", async request => { const prior = queue; queue = new Promise<void>(resolve => releases.set(request.id, resolve)); await prior; });
  app.addHook("onResponse", async request => { releases.get(request.id)?.(); releases.delete(request.id); });
  await app.listen({ host: "127.0.0.1", port: 41034 });
  await writeFile(new URL("http-ready.json", import.meta.url), JSON.stringify({ ready: true, api: "http://127.0.0.1:41034" }));
}, 120000);
it("serves the real upgrade preview and pinned state", async () => {
  const result = await app.inject({ url: `/v2/guided-learning/enrollments/${v2Id(8)}/upgrade`, headers: { cookie: "t034=student" } });
  expect(result.statusCode).toBe(200); expect(result.json().objectiveImpact[0].willResetEvidence).toBe(true);
});
afterAll(async () => {
  if (process.env.T034_BROWSER_HOLD === "true") await new Promise<void>(resolve => { const timer = setTimeout(resolve, 1200000); stop = () => { clearTimeout(timer); resolve(); }; });
  await app?.close(); await h?.close();
}, 1201000);
