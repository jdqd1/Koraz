import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { buildApp } from "../../../apps/api/src/app.js";
import { readEnvironment } from "../../../apps/api/src/config.js";
import { registerProductionAuxiliaryRoutes } from "../../../apps/api/src/production-auxiliary-routes.js";
import { createGuidedV2Postgres } from "../../../apps/api/test/helpers/guided-v2-postgres.js";

const db = await createGuidedV2Postgres();
let app: Awaited<ReturnType<typeof buildApp>> | undefined;
try {
  const learner = { id: randomUUID(), email: "lector@example.test" };
  await db.pool.query("insert into auth_users(id,email,name) values($1,$2,'Lector de pruebas')", [learner.id,learner.email]);
  for (const [slug, title, kind, options] of [
    ["guia-de-prueba","Guía de prueba","guide",["Primera","Segunda"]],
    ["guia-en-revision","Guía en revisión","guide",["Misma opción","Misma opción"]],
    ["video-con-preguntas","Video con preguntas","video",["Primera","Segunda"]],
  ] as const) {
    const id = randomUUID(), quiz = { questions: [{ prompt: "¿Qué opción aparece primero?", options, correctOptionIndex: 0, explanation: "Resultado de prueba." }] };
    const guide = { document: null, sections: [{ heading: "Fixture", body: "Lectura sintética." }] };
    const content = kind === "guide" ? { ...guide, quiz, keyPoints: [], regions: ["Abdomen"] } : { guide, quiz, description: "Fixture", keyPoints: ["Punto"], regions: ["Abdomen"], durationSeconds: 60, externalUrl: null };
    await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,published_at,published_by)
      values($1,$2,$3,$4,'Catálogo de prueba','Abdomen',$5,$6,'published',now(),$6)`, [id,kind,slug,title,content,learner.id]);
    await db.pool.query("insert into content_subjects(content_item_id,subject_id) select $1,id from subjects where slug='anatomia'", [id]);
  }
  const editor = { id: randomUUID(), email: "editor@example.test" };
  await db.pool.query("insert into auth_users(id,email,name) values($1,$2,'Editor de pruebas')", [editor.id, editor.email]);
  await db.pool.query("insert into user_roles(user_id,role,assigned_by) values($1,'administrator',$1)", [editor.id]);
  for (const viewport of ["mobile", "compact", "desktop"]) {
    const questions = [
      { prompt: "¿Qué letra va primero?", options: ["A", "B"], correctOptionIndex: 0, explanation: "" },
      { id: randomUUID(), optionIds: [randomUUID(), randomUUID()], memoryVersion: 3,
        prompt: "¿Qué opción contiene la palabra término?", options: ["Ítem uno", "I\u0301tem   uno"], correctOptionIndex: 1, explanation: "dasdasd" },
    ];
    for (const kind of ["quiz", "guide"]) {
      const content = kind === "quiz" ? { questions, regions: ["Abdomen"] } : {
        sections: [{heading: "Sección", body: "Lectura sintética"}], keyPoints: ["Punto"], quiz: { questions }, regions: ["Abdomen"],
      };
      await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status)
        values($1,$2,$3,$4,'Material sintético','Abdomen',$5,$6,'draft')`,
        [randomUUID(), kind, `f01-${kind}-${viewport}`, `F01 ${kind} ${viewport}`, content, editor.id]);
    }
  }
  app = await buildApp(readEnvironment({ NODE_ENV: "test", HOST: "127.0.0.1", PORT: "41044", DATABASE_URL: db.url,
    DATABASE_MIGRATIONS_ENABLED: "false", WEB_ORIGINS: "http://127.0.0.1:31044" }), {
    identityProvider: { getUser: async request => {
      const cookies = request.cookie?.split(";").map(part => part.trim());
      if (cookies?.includes("practice_fixture=editor")) return editor;
      return cookies?.includes("practice_fixture=learner") ? learner : null;
    }, revokeSessions: async () => {} },
  });
  registerProductionAuxiliaryRoutes(app, db.database);
  await app.listen({ host: "127.0.0.1", port: 41044 });
  const directory = await app.inject({ method: "GET", url: "/v1/study/practice?kind=quiz" });
  assert.equal(directory.statusCode, 200, directory.body);
  assert.equal(directory.json().resourceCount, 3);
  const web = fileURLToPath(new URL("../../../apps/web/", import.meta.url));
  const child = spawn(process.execPath, ["node_modules/@playwright/test/cli.js","test","--config","playwright.functional.config.ts", ...process.argv.slice(2)], {
    cwd: web, windowsHide: true, stdio: "inherit", env: { ...process.env, NODE_ENV: "development", KORAZ_PRACTICE_E2E: "true" },
  });
  const [code] = await once(child,"exit");
  process.exitCode = typeof code === "number" ? code : 1;
} finally { await app?.close(); await db.close(); }
