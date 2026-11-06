import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { LearningAttemptSchema, type LearningAttempt, type LearningAttemptResponseRecord } from "@cediah/contracts";
import { learningVisualAttempt } from "../learning-visual-fixtures";
import { ReviewActivity } from "./review-activity";
import { ActivityShell } from "./activity-shell";

type ReviewAttempt = LearningAttempt & { manifest: Extract<LearningAttempt["manifest"], { projection: "review" }> };
const itemId = "a1000000-0000-4000-8000-000000000910";
const attempt: ReviewAttempt = {
  ...learningVisualAttempt,
  manifest: { projection: "review", title: "Repaso", items: [{
    itemId, memoryVersion: 1, objectiveIds: [], reviewStateVersion: 1,
    resourceRevisionId: "a1000000-0000-4000-8000-000000000913", sourceContentId: "a1000000-0000-4000-8000-000000000914",
    kind: "quiz", prompt: "Pregunta", options: [{ id: "a1000000-0000-4000-8000-000000000911", text: "A" }, { id: "a1000000-0000-4000-8000-000000000912", text: "B" }],
  }] },
};

describe("review final feedback (H24)", () => {
  it.each(["quiz", "flashcards"] as const)("keeps the last %s receipt visible beyond the manifest", kind => {
    const current = structuredClone(attempt);
    if (kind === "flashcards") {
      const item = current.manifest.items[0]!;
      current.manifest.items = [{ itemId, memoryVersion: 1, objectiveIds: [], reviewStateVersion: 1,
        resourceRevisionId: item.resourceRevisionId, sourceContentId: item.sourceContentId, kind: "flashcards", front: "Pregunta" }];
    }
    expect(LearningAttemptSchema.safeParse(current).success).toBe(true);
    for (const correct of [true, false]) {
      const feedback: LearningAttemptResponseRecord = {
        answer: {}, answeredAt: "2026-11-04T12:00:00Z", itemId, memoryVersion: 1,
        grading: { ...(kind === "quiz" ? { correct } : { recallGrade: correct ? "good" : "again" }), explanation: "Resultado confirmado", sessionRetry: false },
        reviewState: null, round: 1, scheduleApplied: true,
      };
      const html = renderToString(<ReviewActivity attempt={current} feedback={feedback} mutate={vi.fn()} onFeedback={vi.fn()} />);
      expect(html).toContain("Resultado confirmado");
      expect(html).toContain("Ver resumen");
    }
  });

  it("shows the confirmed summary after reloading a completed review", () => {
    expect(renderToString(<ActivityShell initialAttempt={attempt} initialProgress={null} userId="learner" />)).toContain("Repaso completado");
  });

  it("offers an actionable recovery when an unfinished manifest has no current item", () => {
    const html = renderToString(<ReviewActivity attempt={{ ...attempt, status: "in_progress" }} feedback={null} mutate={vi.fn()} onFeedback={vi.fn()} />);
    expect(html).toContain("Volver al repaso");
  });
});
