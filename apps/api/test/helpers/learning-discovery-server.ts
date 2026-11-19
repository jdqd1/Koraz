import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { buildApp } from "../../src/app.js";
import { readEnvironment } from "../../src/config.js";
import { registerProductionAuxiliaryRoutes } from "../../src/production-auxiliary-routes.js";
import { createGuidedV2Postgres } from "./guided-v2-postgres.js";
import { guidedV2FixtureId } from "./guided-v2-fixtures.js";

import { LearningPathCreateRequestSchema } from "@cediah/contracts";
import { createPostgresGuidedLearningProvider } from "../../src/providers/postgres-guided-learning.js";
const db = await createGuidedV2Postgres();
let app: Awaited<ReturnType<typeof buildApp>> | undefined;
try {
  const learner = { id: randomUUID(), email: "lector@example.test" };
  await db.pool.query("insert into auth_users(id,email,name) values($1,$2,'Lector de pruebas')", [learner.id,learner.email]);
  const contentFixtures = [
    ["guia-de-prueba","Guía de prueba","guide",["Primera","Segunda"]],
    ["guia-en-revision","Guía en revisión","guide",["Misma opción","Misma opción"]],
    ["video-con-preguntas","Video con preguntas","video",["Primera","Segunda"]],
  ] as const;
  for (const [index, [slug, title, kind, options]] of contentFixtures.entries()) {
    // The web's public content cache can outlive each disposable database.
    const id = guidedV2FixtureId(900 + index);
    const quiz = { questions: [{ id: guidedV2FixtureId(910 + index), optionIds: options.map((_, optionIndex) => guidedV2FixtureId(920 + index * 2 + optionIndex)), memoryVersion: 1,
      prompt: "¿Qué opción aparece primero?", options, correctOptionIndex: 0, explanation: "Resultado de prueba." }] };
    const guide = { document: null, sections: [{ heading: "Fixture", body: "Lectura sintética." }] };
    const content = kind === "guide" ? { ...guide, quiz, keyPoints: [], regions: ["Abdomen"] } : { guide, quiz, description: "Fixture", keyPoints: ["Punto"], regions: ["Abdomen"], durationSeconds: 60, externalUrl: null };
    await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,published_at,published_by)
      values($1,$2,$3,$4,'Catálogo de prueba','Abdomen',$5,$6,'published',now(),$6)`, [id,kind,slug,title,content,learner.id]);
    await db.pool.query("insert into content_subjects(content_item_id,subject_id) select $1,id from subjects where slug='anatomia'", [id]);
  }
  const provider = createPostgresGuidedLearningProvider(db.database);
  const source = (await db.pool.query("select id from content_items where slug='guia-de-prueba'")).rows[0].id;
  const topic = randomUUID(), objective = randomUUID();
  await db.pool.query("insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,published_by,published_at) values($1,'topic','tema-f05','Simulación F05','Fixture','Simulación',$2,$3,'published',$3,now())",
    [topic, { introduction: "Prueba de modalidades", objectives: ["Reconocer la primera opción"], regions: [] }, learner.id]);
  const created = await provider.createPath({ actorUserId: learner.id, draft: LearningPathCreateRequestSchema.parse({
    slug: "simulacion-f05", title: "Simulación de modalidades F05", summary: "Material sintético para verificar consulta y práctica", coverKey: "heart", topicContentId: topic,
    definition: { policyVersion: "guided-v1", evidenceLevel: "standard", releaseNotes: "Simulación", units: [{ stableKey: "unidad", title: "Orden", pedagogyVersion: 1,
      objectives: [{ id: objective, title: "Reconocer la primera opción", importance: 2 }],
      steps: ["guide", "quiz"].map((projection, index) => ({ stableKey: `paso-${index}`, title: index ? "Comprobar el orden" : "Consultar el orden", purpose: index ? "check" : "understand",
        isEssential: true, pedagogyVersion: 1, objectiveIds: [objective], recommendedAfter: [], options: [{ label: index ? "Resolver con seguimiento" : "Leer con seguimiento",
          projection, isDefault: true, sourceContentId: source, rewardIdentity: randomUUID(), rewardVersion: 1, estimatedMinutes: 1,
          config: { selectedItemIds: [], objectiveMappings: [] } }] })) }] } }) });
  if (created.status !== "success") throw new Error(JSON.stringify(created));
  await db.pool.query("update learning_path_versions set status='published',published_by=$1,published_at=now() where id=$2", [learner.id, created.value.version.id]);
  await db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [created.value.version.id, created.value.id]);
  const enrollment = await provider.createEnrollment({ userId: learner.id, pathId: created.value.id });
  if (enrollment.status !== "success") throw new Error(JSON.stringify(enrollment));
  app = await buildApp(readEnvironment({ NODE_ENV: "test", HOST: "127.0.0.1", PORT: "41044", DATABASE_URL: db.url,
    DATABASE_MIGRATIONS_ENABLED: "false", GUIDED_LEARNING_ENABLED: "true", WEB_ORIGINS: "http://127.0.0.1:31044" }), {
    guidedLearningProvider: provider,
    identityProvider: { getUser: async request => {
      const cookies = request.cookie?.split(";").map(part => part.trim());
      return cookies?.includes("practice_fixture=learner") ? learner : null;
    }, revokeSessions: async () => {} },
  });
  registerProductionAuxiliaryRoutes(app, db.database);
  app.get("/__test/discovery", async () => ({ home: await provider.getHome({ userId: learner.id }),
    progress: await provider.getEnrollmentProgress({ userId: learner.id, enrollmentId: enrollment.value.enrollment.id }),
    counts: (await db.pool.query("select (select count(*)::int from learning_attempts) as attempts, (select count(*)::int from learning_responses) as responses, (select count(*)::int from learning_rewards) as rewards")).rows[0] }));
  await app.listen({ host: "127.0.0.1", port: 41044 });
  const directory = await app.inject({ method: "GET", url: "/v1/study/practice?kind=quiz" });
  assert.equal(directory.statusCode, 200, directory.body);
  assert.equal(directory.json().resourceCount, 3);
  const web = fileURLToPath(new URL("../../../web/", import.meta.url));
  const production = process.env.KORAZ_PRACTICE_PRODUCTION === "true";
  const child = spawn(process.execPath, ["node_modules/@playwright/test/cli.js","test","--config", production ? "playwright.learning-catalog.config.ts" : "playwright.functional.config.ts", ...process.argv.slice(2)], {
    cwd: web, windowsHide: true, stdio: "inherit", env: { ...process.env, NODE_ENV: production ? "production" : "development", KORAZ_PRACTICE_E2E: "true" },
  });
  const [code] = await once(child,"exit");
  process.exitCode = typeof code === "number" ? code : 1;
} finally { await app?.close(); await db.close(); }
