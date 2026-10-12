import { LearningAttemptSchema } from "@cediah/contracts";
import { learningVisualAttempt } from "../learning-visual-fixtures";

/** Public, synthetic display fixtures. The enclosing page is development-only. */
export function legacyActivityFixture(mode: string) {
  const base = learningVisualAttempt;
  const id = base.manifest.projection === "quiz" ? base.manifest.questions[0]!.itemId : base.id;
  const common = { title: "Práctica de conceptos", resourceRevisionId: base.id, sourceContentId: base.id };
  const question = { itemId: id, memoryVersion: 1, objectiveIds: [], prompt: "¿Qué concepto precede a B?", options: [{ id: base.id, text: "Concepto A" }, { id: base.clientAttemptId, text: "Concepto C" }] };
  const manifest = mode === "flashcards" ? { ...common, projection: "flashcards", completionRule: { type: "flashcards", minimumRated: 1 }, cards: [{ itemId: id, memoryVersion: 1, objectiveIds: [], front: "Recuerda la relación entre A y B" }] }
    : mode === "guide" ? { ...common, projection: "guide", completionRule: { type: "guide", confirmationRequired: true }, document: null, selectedSectionIndexes: [], sections: [{ heading: "Una relación, paso a paso", body: "El concepto A precede a B. Primero identifica el origen y después relaciona el resultado.\n\nRecupera esta relación antes de pasar a la práctica." }, { heading: "Aplica lo aprendido", body: "Piensa en cómo cambia B cuando cambia A." }] }
      : mode === "video" || mode === "external-video" ? { ...common, projection: "video", completionRule: { type: "video", minimumCoveragePercent: 90, externalDeclarationRequired: true }, durationSeconds: 60, externalUrl: mode === "external-video" ? "https://example.test/video" : null, range: null }
        : mode === "review" || mode === "review-card" ? { projection: "review", title: "Repaso de conceptos", items: [{ resourceRevisionId: common.resourceRevisionId, sourceContentId: common.sourceContentId, itemId: id, memoryVersion: 1, objectiveIds: [], reviewStateVersion: 1, ...(mode === "review-card" ? { kind: "flashcards", front: "Recuerda la relación entre A y B" } : { kind: "quiz", prompt: question.prompt, options: question.options }) }] }
          : { ...common, projection: "quiz", completionRule: { type: "quiz", completion: "submitted" }, questions: [question] };
  return LearningAttemptSchema.parse({ ...base, manifest, status: "in_progress", score: null, submittedAt: null, responses: [], resume: { ...base.resume, currentIndex: 0, answeredItemIds: [] } });
}


