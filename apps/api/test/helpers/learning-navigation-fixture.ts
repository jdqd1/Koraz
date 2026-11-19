import { randomUUID } from "node:crypto";
import { LearningPathCreateRequestSchema } from "@cediah/contracts";
import { createPostgresGuidedLearningProvider } from "../../src/providers/postgres-guided-learning.js";
import type { createGuidedV2Postgres } from "./guided-v2-postgres.js";

export async function seedLearningNavigation(db: Awaited<ReturnType<typeof createGuidedV2Postgres>>, editorId: string, users: string[], clock: () => Date) {
  const provider = createPostgresGuidedLearningProvider(db.database, { clock });
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
  const created = await provider.createPath({ actorUserId: editorId, draft: definition });
  if (created.status !== "success") throw new Error(JSON.stringify(created));
  await db.pool.query("update learning_path_versions set status='published',published_by=$1,published_at=now() where id=$2", [editorId, created.value.version.id]);
  await db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [created.value.version.id, created.value.id]);
  for (const userId of users) {
    const enrollment = await provider.createEnrollment({ userId, pathId: created.value.id });
    if (enrollment.status !== "success") throw new Error(JSON.stringify(enrollment));
  }
  return { path: created.value, topicId, guideId, document };
}
