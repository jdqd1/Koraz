import { randomUUID } from "node:crypto";
import {
  LearningPathCreateRequestSchema, LearningProjectionSchema, PublishableContentDraftSchema,
  normalizeContentLearningIdentity, type GuidedLearningResult,
} from "@cediah/contracts";
import { expect, it } from "vitest";
import material from "../../../docs/aprendizaje-guiado/plan-maestro/peritoneo-simulacion.json" with { type: "json" };
import proposals from "../../../docs/aprendizaje-guiado/plan-maestro/cuestionarios-candidatos.json" with { type: "json" };
import audit from "../../../output/implementacion-aprendizaje-2026-11-04/identidad-editorial-2026-11-05.json" with { type: "json" };
import { createActivityFromMaterial, editorDraftFromDetail } from "../../web/src/components/learning/editor/editor-model.js";
import { createPostgresGuidedLearningProvider } from "../src/providers/postgres-guided-learning.js";
import { gradeQuizOption, quizAdapter } from "../src/guided-learning/adapters/quiz.js";
import { createGuidedV2Postgres } from "./helpers/guided-v2-postgres.js";

function success<T>(result: GuidedLearningResult<T>): T {
  if (result.status !== "success") throw new Error(JSON.stringify(result));
  return result.value;
}

it.each(proposals.bancos)("grades every option in the proposed $title question bank", bank => {
  const repairedIds = bank.items.map(item => item.previousItemId);
  const duplicates = audit.duplicateOptions.filter(row => row.revision_id === bank.baseRevisionId);
  expect(duplicates.length).toBeGreaterThan(0);
  for (const duplicate of duplicates) expect(repairedIds).toContain(duplicate.item_id);
  const draft = PublishableContentDraftSchema.parse({
    kind: "quiz", slug: "banco-candidato", title: bank.title, summary: proposals.estado,
    topic: bank.title, content: { questions: bank.items },
  });
  const normalized = normalizeContentLearningIdentity(draft, randomUUID).value;
  const quiz = quizAdapter.parse(normalized.content);
  for (const question of quiz.questions) {
    expect(repairedIds).not.toContain(question.id);
    expect(question.explanation?.trim()).toBeTruthy();
    for (const [index, optionId] of question.optionIds.entries()) {
      expect(gradeQuizOption(question, optionId)?.correct).toBe(index === question.correctOptionIndex);
    }
  }
});

it.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("repairs four inherited Peritoneo holds and completes all six essential steps after voluntary adoption", async () => {
  const db = await createGuidedV2Postgres();
  try {
    const provider = createPostgresGuidedLearningProvider(db.database);
    const actorUserId = randomUUID(), reviewerId = randomUUID(), userId = randomUUID();
    for (const id of [actorUserId, reviewerId, userId]) {
      await db.pool.query("insert into auth_users(id,email,name) values($1,$2,'Simulación')", [id, id + "@example.test"]);
    }
    const topicId = randomUUID();
    const newMaterials = { fundamentos: randomUUID(), estacion: randomUUID() };
    const oldGuideId = audit.peritoneo[0]!.content_id;
    const insertContent = async (id: string, kind: string, title: string, content: unknown) => {
      const draft = PublishableContentDraftSchema.parse({
        catalogVisibility: "guided_only", content, kind, slug: "f01-" + id,
        summary: material.alcance, title, topic: "Anatomía",
      });
      const normalized = normalizeContentLearningIdentity(draft, randomUUID).value;
      await db.pool.query(`insert into content_items
        (id,kind,slug,title,summary,topic,content,catalog_visibility,author_user_id,status,published_by,published_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',$9,now())`,
      [id, kind, draft.slug, title, draft.summary, draft.topic, normalized.content, kind === "topic" ? "catalog" : "guided_only", actorUserId]);
    };
    await insertContent(topicId, "topic", "Abdomen", { introduction: material.alcance, objectives: ["Interpretar un modelo"], regions: ["Abdomen"] });
    const guide = (unit: typeof material.fundamentos) => ({
      sections: [...unit.sections, { heading: "Fuente anatómica", body: material.fuente }],
      quiz: { questions: unit.questions }, regions: ["Abdomen"],
    });
    // Reconstruct only the six audited relationships. Historical content and users are synthetic.
    await insertContent(oldGuideId, "guide", "Peritoneo", guide(material.fundamentos));
    for (const row of audit.peritoneo.filter((row, i, rows) => row.kind === "video" && rows.findIndex(r => r.content_id === row.content_id) === i)) {
      await insertContent(row.content_id, "video", row.content_title, {
        description: "Material histórico simulado", externalUrl: "https://example.test/video", durationSeconds: 60,
        keyPoints: ["Referencia histórica"], quiz: { questions: [{ prompt: "¿Qué tema anuncia este recurso?", options: [row.content_title, "Peritoneo"], correctOptionIndex: 0, explanation: "El título identifica el tema." }] },
      });
    }
    await insertContent(newMaterials.fundamentos, "quiz", material.fundamentos.title, { questions: material.fundamentos.questions });
    await insertContent(newMaterials.estacion, "guide", material.estacion.title, guide(material.estacion));
    const units = audit.objectives.map(unit => ({
      stableKey: unit.stable_key, objectives: unit.objectives_json, title: unit.stable_key, pedagogyVersion: 1,
      steps: audit.peritoneo.filter(row => row.unit === unit.stable_key).map(row => ({
        id: row.step_id, stableKey: row.step, title: row.step_title, isEssential: true, pedagogyVersion: 1,
        objectiveIds: unit.objectives_json.map(objective => objective.id), recommendedAfter: [],
        purpose: row.projection === "quiz" ? "check" : row.projection === "flashcards" ? "recall" : "understand",
        options: [{ id: row.option_id, isDefault: true, projection: row.projection, label: row.label, sourceContentId: row.content_id,
          rewardIdentity: randomUUID(), rewardVersion: 1, estimatedMinutes: 5, config: { selectedItemIds: [], objectiveMappings: [] } }],
      })),
    }));
    const draft = LearningPathCreateRequestSchema.parse({ slug: "peritoneo-simulacion", title: "Peritoneo simulado", summary: material.alcance,
      coverKey: "lungs", topicContentId: topicId, definition: { units, policyVersion: "guided-v1", evidenceLevel: "standard", releaseNotes: "Base histórica simulada" } });
    const previous = success(await provider.createPath({ actorUserId, draft }));
    const pathId = previous.id;
    // Restore the state of an already published v3, even though it would fail today's publication checks.
    await db.pool.query("update learning_path_versions set version_number=3,status='published',published_by=$1,published_at=now() where id=$2", [reviewerId, previous.version.id]);
    await db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [previous.version.id, pathId]);
    const { enrollment } = success(await provider.createEnrollment({ pathId, userId }));
    const launch = async (stepOptionId: string) => success(await provider.createAttempt({
      userId, idempotencyKey: randomUUID(), request: { clientAttemptId: randomUUID(), stepOptionId },
    })).attempt;
    const oldGuide = await launch(audit.peritoneo[0]!.option_id);
    success(await provider.completeAttempt({ attemptId: oldGuide.id, userId, idempotencyKey: randomUUID(), request: { expectedVersion: oldGuide.rowVersion, confirmation: true } }));
    const edit = { actorUserId, canEditAll: false, pathId };
    const copy = success(await provider.createVersion({ ...edit, releaseNotes: "Simulación de la revisión corregida" }));
    expect(copy.version.number).toBe(4);
    const blocked = await provider.transitionPath({ ...edit, canReview: false, canPublish: false, expectedVersion: copy.version.editVersion, status: "in_review" });
    expect(blocked.status).toBe("not_ready");
    if (blocked.status !== "not_ready") throw new Error("Expected inherited holds");
    expect(blocked.issues.filter(issue => issue.code === "editorial_replacement_required").map(i => i.context?.stepStableKey).sort())
      .toEqual(material.replacements.map(r => r.step).sort());
    const update = editorDraftFromDetail(copy);
    const station = update.definition.units.find(unit => unit.stableKey === "unidad-2")!;
    station.title = material.estacion.title;
    const stationObjectiveId = randomUUID();
    station.objectives = [{ id: stationObjectiveId, title: material.estacion.objective, importance: 3 }];
    for (const step of station.steps) step.objectiveIds = [stationObjectiveId];
    station.pedagogyVersion++;
    for (const replacement of material.replacements) {
      const step = update.definition.units.flatMap(unit => unit.steps).find(s => s.stableKey === replacement.step)!;
      const detail = success(await provider.getEditorMaterialDetail({ ...edit,
        contentId: newMaterials[replacement.material as keyof typeof newMaterials], projection: LearningProjectionSchema.parse(replacement.projection) }));
      if (detail.status !== "ready") throw new Error("Missing candidate material");
      const activity = createActivityFromMaterial({ detail, objectiveIds: step.objectiveIds });
      expect(activity.purpose).toBe(replacement.purpose);
      step.options = activity.options;
      step.purpose = activity.purpose;
      step.title = replacement.title;
      step.pedagogyVersion++;
    }
    let next = success(await provider.updatePath({ ...edit, update: { ...update, expectedVersion: copy.version.editVersion } }));
    expect(success(await provider.validatePath(edit))).toMatchObject({ issues: [], ready: true });
    for (const status of ["in_review", "approved", "published"] as const) {
      const review = status !== "in_review";
      next = success(await provider.transitionPath({ pathId, actorUserId: review ? reviewerId : actorUserId,
        canPublish: review, canReview: review, expectedVersion: next.version.editVersion, status }));
    }
    const pinned = await provider.getPathBySlug({ slug: draft.slug, userId });
    expect(pinned?.version.id).toBe(previous.version.id);
    expect(next.version.units[0]!.steps.slice(0, 2).map(s => s.options[0]!.resourceRevisionId))
      .toEqual(previous.version.units[0]!.steps.slice(0, 2).map(s => s.options[0]!.resourceRevisionId));
    const upgraded = success(await provider.upgradeEnrollment({ userId, enrollmentId: enrollment.id, idempotencyKey: randomUUID(),
      request: { expectedVersion: pinned!.enrollment!.rowVersion, targetPathVersionId: next.version.id } }));
    expect(upgraded.progress.completedEssentialSteps).toBe(1);
    expect(success(await provider.getAttempt({ userId, attemptId: oldGuide.id })).status).toBe("completed");
    const current = await provider.getPathBySlug({ slug: draft.slug, userId });
    expect(current?.version.id).toBe(next.version.id);
    const steps = current!.version.units.flatMap(unit => unit.steps);
    expect(steps).toHaveLength(6);
    const questions = [...material.fundamentos.questions, ...material.estacion.questions];
    for (const step of steps.slice(1)) {
      const option = step.options[0]!;
      let attempt = await launch(option.id);
      const manifest = attempt.manifest;
      expect(manifest.projection).toBe(option.projection);
      if (manifest.projection === "guide") {
        expect(manifest.sections[0]?.body).toBe(material.estacion.sections[0]!.body);
        attempt = success(await provider.completeAttempt({ attemptId: attempt.id, userId, idempotencyKey: randomUUID(), request: { expectedVersion: attempt.rowVersion, confirmation: true } })).attempt;
      } else if (manifest.projection === "flashcards") {
        expect(manifest.cards).toHaveLength(5);
        for (const card of manifest.cards) {
          const revealed = success(await provider.revealAttemptItem({ attemptId: attempt.id, userId, idempotencyKey: randomUUID(), itemId: card.itemId, expectedVersion: attempt.rowVersion }));
          attempt = success(await provider.recordAttemptResponse({ attemptId: attempt.id, userId, idempotencyKey: randomUUID(),
            request: { kind: "flashcards", itemId: card.itemId, round: 1, recallGrade: "good", expectedVersion: revealed.attempt.rowVersion } })).attempt;
        }
      } else if (manifest.projection === "quiz") {
        expect(manifest.questions).toHaveLength(5);
        for (const question of manifest.questions) {
          const key = questions.find(q => q.prompt === question.prompt)!;
          const answer = question.options.find(o => o.text === key.options[key.correctOptionIndex])!;
          attempt = success(await provider.recordAttemptResponse({ attemptId: attempt.id, userId, idempotencyKey: randomUUID(),
            request: { kind: "quiz", itemId: question.itemId, optionId: answer.id, round: 1, expectedVersion: attempt.rowVersion } })).attempt;
        }
        expect(attempt.score).toMatchObject({ answered: 5, correct: 5, percent: 100 });
      }
      expect(attempt.status).toBe("completed");
    }
    expect(success(await provider.getEnrollmentProgress({ userId, enrollmentId: enrollment.id })))
      .toMatchObject({ completedEssentialSteps: 6, totalEssentialSteps: 6, percentage: 100 });
  } finally {
    await db.close();
  }
}, 60_000);
