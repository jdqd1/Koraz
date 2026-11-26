import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { LearningPathCreateRequestSchema, type LearningPathCreateRequest } from "@cediah/contracts";
import { createPostgresGuidedLearningProvider } from "../../src/providers/postgres-guided-learning.js";
import type { createGuidedV2Postgres } from "./guided-v2-postgres.js";

export const navigationVideoKey = "guided-v1-letters.webm";
export const navigationVideoFile = new URL(navigationVideoKey, import.meta.url);

async function publishNavigationFixture(
  db: Awaited<ReturnType<typeof createGuidedV2Postgres>>,
  editorId: string,
  users: string[],
  clock: () => Date,
  draft: LearningPathCreateRequest,
) {
  const provider = createPostgresGuidedLearningProvider(db.database, { clock });
  const created = await provider.createPath({ actorUserId: editorId, draft });
  if (created.status !== "success") throw new Error(JSON.stringify(created));
  await db.pool.query("update learning_path_versions set status='published',published_by=$1,published_at=now() where id=$2", [editorId, created.value.version.id]);
  await db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [created.value.version.id, created.value.id]);
  for (const userId of users) {
    const enrollment = await provider.createEnrollment({ userId, pathId: created.value.id });
    if (enrollment.status !== "success") throw new Error(JSON.stringify(enrollment));
  }
  return created.value;
}

export async function seedLearningVideo(
  db: Awaited<ReturnType<typeof createGuidedV2Postgres>>,
  editorId: string,
  topicId: string,
  users: string[],
  clock: () => Date,
) {
  const sourceContentId = randomUUID();
  const objectiveId = randomUUID();
  const { size } = await stat(navigationVideoFile);
  await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,catalog_visibility,published_by,published_at)
    values($1,'video','video-f08-letras','Orden de letras','Simulación de reproducción','Simulación',$2,$3,'published','guided_only',$3,now())`,
  [sourceContentId, { description: "Observa el orden de A y B en este clip de simulación.", durationSeconds: 8,
    externalUrl: null, guide: { document: null, sections: [] }, keyPoints: ["A precede a B."], quiz: { questions: [] }, regions: [] }, editorId]);
  await db.pool.query(`insert into content_assets(content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at)
    values($1,$2,'video','test-assets',$3,$3,'video/webm',$4,'ready',now())`, [sourceContentId, editorId, navigationVideoKey, size]);
  const draft = LearningPathCreateRequestSchema.parse({
    slug: "simulacion-f08-video", title: "Simulación de video F08", summary: "Criterio de logro: reproducir el clip de orden de letras.",
    coverKey: "heart", topicContentId: topicId,
    definition: { policyVersion: "guided-v1", evidenceLevel: "standard", releaseNotes: "Simulación", units: [{
      title: "Orden de letras", stableKey: "orden", pedagogyVersion: 1,
      objectives: [{ id: objectiveId, title: "Reconocer el orden de A y B", importance: 2 }],
      steps: [{ stableKey: "video", title: "Observa qué letra aparece primero", purpose: "understand", isEssential: true,
        pedagogyVersion: 1, objectiveIds: [objectiveId], recommendedAfter: [], options: [{
          label: "Video con seguimiento", projection: "video", isDefault: true, sourceContentId,
          rewardIdentity: randomUUID(), rewardVersion: 1, estimatedMinutes: 1,
          config: { selectedItemIds: [], objectiveMappings: [] },
        }] }],
    }] },
  });
  await publishNavigationFixture(db, editorId, users, clock, draft);
}

export async function seedLearningNavigation(db: Awaited<ReturnType<typeof createGuidedV2Postgres>>, editorId: string, users: string[], clock: () => Date) {
  const topicId = randomUUID(), guideId = randomUUID(), objectiveId = randomUUID();
  const paragraph = (value: string) => ({ type: "paragraph", content: [{ type: "text", text: value }] });
  const document = { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Tabla de letras" }] },
    { type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", content: [paragraph("Letra")] }, { type: "tableHeader", content: [paragraph("Orden")] }] },
      { type: "tableRow", content: [{ type: "tableCell", content: [paragraph("A")] }, { type: "tableCell", content: [paragraph("Primera")] }] }] },
    { type: "bulletList", content: [{ type: "listItem", content: [paragraph("A precede a B")] }] },
    { type: "image", attrs: { src: "https://127.0.0.1:41036/fixture.png", alt: "Imagen sintética de la guía" } },
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Segunda lectura" }] }, paragraph("La letra B sigue a A."),
  ] };
  const questions = [{ id: randomUUID(), optionIds: [randomUUID(), randomUUID()], memoryVersion: 1,
    prompt: "Simulación F06: ¿qué letra aparece primero?", options: ["A", "B"], correctOptionIndex: 0, explanation: "La primera letra de esta simulación es A." }];
  await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,published_by,published_at)
    values($1,'topic','tema-f06','Simulación F06','Navegación','Simulación',$2,$3,'published',$3,now())`, [topicId, { introduction: "Simulación", objectives: ["Ordenar letras"], regions: [] }, editorId]);
  await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,published_by,published_at)
    values($1,'guide','guia-f06','Lectura estructurada F06','Navegación','Simulación',$2,$3,'published',$3,now())`, [guideId, { document,
    sections: [{ heading: "Tabla de letras", body: "Letra | Orden\nA | Primera\nA precede a B" }, { heading: "Segunda lectura", body: "La letra B sigue a A." }], quiz: { questions }, keyPoints: [], regions: [] }, editorId]);
  const definition = LearningPathCreateRequestSchema.parse({ slug: "simulacion-f06", title: "Simulación de navegación F06", summary: "Material sintético para verificar el recorrido", coverKey: "heart", topicContentId: topicId,
    definition: { policyVersion: "guided-v1", evidenceLevel: "standard", releaseNotes: "Simulación", units: [
      { stableKey: "lectura", title: "Lectura y comprobación", pedagogyVersion: 1, objectives: [{ id: objectiveId, title: "Reconocer la primera letra", importance: 2 }],
        steps: (["guide", "quiz", "flashcards"] as const).map((projection, index) => ({ stableKey: projection, title: ["Leer la tabla", "Comprobar el orden", "Recordar las letras"][index], purpose: index ? "recall" : "understand", isEssential: true,
          pedagogyVersion: 1, objectiveIds: [objectiveId], recommendedAfter: [], options: [{ label: ["Lectura con seguimiento", "Cuestionario con seguimiento", "Tarjetas con seguimiento"][index], projection, isDefault: true,
            sourceContentId: guideId, rewardIdentity: randomUUID(), rewardVersion: 1, estimatedMinutes: 1, config: { selectedItemIds: [], objectiveMappings: [] } }] })) },
      { stableKey: "otra", title: "Otra unidad", pedagogyVersion: 1, objectives: [{ id: randomUUID(), title: "Consultar otra unidad", importance: 1 }], steps: [] },
      ...Array.from({ length: 28 }, (_, index) => ({ stableKey: `contenido-${index + 1}`, title: `Contenido ${index + 1}`, pedagogyVersion: 1,
        objectives: [{ id: randomUUID(), title: `Objetivo sintético ${index + 1}`, importance: 1 }], steps: [] })),
    ] } });
  const path = await publishNavigationFixture(db, editorId, users, clock, definition);
  return { path, topicId, guideId, document };
}
