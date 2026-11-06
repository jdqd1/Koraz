import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createLearningAdapterRegistry } from "../src/guided-learning/adapters/registry.js";
import type { ActivityAdapter } from "../src/guided-learning/adapters/types.js";
import { createStoredAttemptManifest, toPublicAttemptManifest } from "../src/guided-learning/attempt-manifest.js";
import { gradeQuizOption, quizAdapter } from "../src/guided-learning/adapters/quiz.js";
import { randomUUID } from "node:crypto";

describe("guided-learning adapter registry", () => {
  it("H02 preserves a legacy snapshot for history and prevents grading its ambiguous item", () => {
    const ambiguous = { id: randomUUID(), optionIds: [randomUUID(), randomUUID()], options: ["Parietal y visceral", "Parietal y visceral"], correctOptionIndex: 0, prompt: "Pregunta histórica" };
    const good = { ...ambiguous, id: randomUUID(), options: ["A", "B"] };
    const input = { projection: "quiz" as const, completionRule: { type: "quiz" as const, completion: "submitted" as const },
      title: "Fixture", payloadHash: "a".repeat(64), resourceRevisionId: randomUUID(), sourceContentId: randomUUID(),
      config: { objectiveMappings: [], selectedItemIds: [] }, content: { questions: [ambiguous, good] } };
    expect(() => createStoredAttemptManifest(input)).toThrow("revisión editorial");
    expect(toPublicAttemptManifest({ ...input, schemaVersion: 1 })).toMatchObject({ questions: [{ itemId: ambiguous.id }, { itemId: good.id }] });
    const selected = createStoredAttemptManifest({ ...input, config: { ...input.config, selectedItemIds: [good.id] } });
    expect(toPublicAttemptManifest(selected)).toMatchObject({ questions: [{ itemId: good.id }] });
    const question = quizAdapter.parse(input.content).questions[0]!;
    expect(gradeQuizOption(question, question.optionIds[0]!)).toBeNull();
  });

  it("accepts a new adapter type without exposing it as published content", () => {
    const PayloadSchema = z.strictObject({ prompt: z.string().min(1) });
    const caseStudyAdapter: ActivityAdapter<
      z.infer<typeof PayloadSchema>,
      { prompt: string },
      "case-study-test"
    > = {
      items: () => [],
      key: "case-study-test",
      parse: (content) => PayloadSchema.parse(content),
      toStudentPayload: (payload) => ({ prompt: payload.prompt }),
      version: 1,
    };

    const registry = createLearningAdapterRegistry([caseStudyAdapter]);
    const adapter = registry.get("case-study-test");
    const payload = adapter.parse({ prompt: "Correlaciona los hallazgos" });

    expect(adapter.toStudentPayload(payload)).toEqual({ prompt: "Correlaciona los hallazgos" });
  });

  it("rejects duplicate adapter keys", () => {
    const adapter: ActivityAdapter<unknown, unknown, "duplicate-test"> = {
      items: () => [],
      key: "duplicate-test",
      parse: (content) => content,
      toStudentPayload: (payload) => payload,
      version: 1,
    };

    expect(() => createLearningAdapterRegistry([adapter, adapter])).toThrow(/unique/);
  });
});
