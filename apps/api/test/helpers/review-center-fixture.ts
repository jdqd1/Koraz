import { randomUUID } from "node:crypto";
import { LearningPathCreateRequestSchema } from "@cediah/contracts";
import { createPostgresGuidedLearningProvider } from "../../src/providers/postgres-guided-learning.js";
import type { createGuidedV2Postgres } from "./guided-v2-postgres.js";

/** Synthetic alphabet questions, with real catalog bindings and review eligibility. */
export async function seedReviewCenter(db: Awaited<ReturnType<typeof createGuidedV2Postgres>>, actorUserId: string, users: string[], clock: () => Date) {
  const provider = createPostgresGuidedLearningProvider(db.database, { clock });
  const contentId = randomUUID(), topicId = randomUUID(), objectiveId = randomUUID();
  const questions = ["A", "B"].map(letter => ({ id: randomUUID(), optionIds: [randomUUID(), randomUUID()],
    prompt: `Letra ${letter}: elige la primera opción`, options: [`Respuesta ${letter}`, `Otra ${letter}`], correctOptionIndex: 0,
    explanation: `La respuesta de esta simulación es ${letter}.` }));
  await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,catalog_visibility,published_by,published_at)
    values($1::uuid,'topic',$1::text,'Simulación F03','Alfabeto','Simulación',$2,$3,'published','catalog',$3,now())`,
  [topicId, { introduction: "Simulación", objectives: ["Recordar letras"], regions: [] }, actorUserId]);
  await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,catalog_visibility,published_by,published_at)
    values($1::uuid,'quiz',$1::text,'Preguntas F03','Alfabeto','Simulación',$2,$3,'published','guided_only',$3,now())`, [contentId, { questions }, actorUserId]);
  const draft = LearningPathCreateRequestSchema.parse({ slug: "repaso-f03", title: "Repaso simulado F03", summary: "Simulación de repaso con reloj controlado",
    coverKey: "heart", topicContentId: topicId, definition: { policyVersion: "guided-v1", evidenceLevel: "standard", releaseNotes: "Simulación",
      units: [{ stableKey: "letters", title: "Letras", pedagogyVersion: 1, objectives: [{ id: objectiveId, title: "Recordar letras", importance: 2 }],
        steps: [{ stableKey: "cards", title: "Recordar letras", purpose: "recall", isEssential: true, pedagogyVersion: 1,
          objectiveIds: [objectiveId], recommendedAfter: [], options: [{ label: "Tarjetas", projection: "flashcards", isDefault: true,
            sourceContentId: contentId, rewardIdentity: randomUUID(), rewardVersion: 1, estimatedMinutes: 5,
            config: { selectedItemIds: [], objectiveMappings: [] } }] }] }] } });
  const created = await provider.createPath({ actorUserId, draft });
  if (created.status !== "success") throw new Error(JSON.stringify(created));
  const path = created.value;
  // Seed a published synthetic revision; editorial workflow is covered separately.
  await db.pool.query("update learning_path_versions set status='published',published_by=$1,published_at=now() where id=$2", [actorUserId, path.version.id]);
  await db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [path.version.id, path.id]);
  for (const userId of users) {
    const enrollment = await provider.createEnrollment({ userId, pathId: path.id });
    if (enrollment.status !== "success") throw new Error(JSON.stringify(enrollment));
    for (const item of questions) await db.pool.query("insert into learning_review_states(user_id,item_id,memory_version,next_due_at) values($1,$2,1,$3)", [userId, item.id, clock()]);
  }
  return { pathId: path.id, itemIds: questions.map(item => item.id) };
}
