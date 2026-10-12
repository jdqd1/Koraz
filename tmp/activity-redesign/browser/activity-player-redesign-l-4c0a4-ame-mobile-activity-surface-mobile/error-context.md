# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> legacy review uses the same mobile activity surface
- Location: tests\e2e\activity-player-redesign.spec.ts:156:7

# Error details

```
ZodError: [
  {
    "code": "invalid_value",
    "values": [
      "in_progress",
      "completed",
      "abandoned"
    ],
    "path": [
      "status"
    ],
    "message": "Invalid option: expected one of \"in_progress\"|\"completed\"|\"abandoned\""
  }
]
```

# Test source

```ts
  1  | import { LearningAttemptSchema } from "@cediah/contracts";
  2  | import { learningVisualAttempt } from "../learning-visual-fixtures";
  3  | 
  4  | /** Public, synthetic display fixtures. The enclosing page is development-only. */
  5  | export function legacyActivityFixture(mode: string) {
  6  |   const base = learningVisualAttempt;
  7  |   const id = base.manifest.projection === "quiz" ? base.manifest.questions[0]!.itemId : base.id;
  8  |   const common = { title: "Práctica de conceptos", resourceRevisionId: base.id, sourceContentId: base.id };
  9  |   const question = { itemId: id, memoryVersion: 1, objectiveIds: [], prompt: "¿Qué concepto precede a B?", options: [{ id: base.id, text: "Concepto A" }, { id: base.clientAttemptId, text: "Concepto C" }] };
  10 |   const manifest = mode === "flashcards" ? { ...common, projection: "flashcards", completionRule: { type: "flashcards", minimumRated: 1 }, cards: [{ itemId: id, memoryVersion: 1, objectiveIds: [], front: "Recuerda la relación entre A y B" }] }
  11 |     : mode === "guide" ? { ...common, projection: "guide", completionRule: { type: "guide", confirmationRequired: true }, document: null, selectedSectionIndexes: [], sections: [{ heading: "Una relación, paso a paso", body: "El concepto A precede a B. Primero identifica el origen y después relaciona el resultado.\n\nRecupera esta relación antes de pasar a la práctica." }, { heading: "Aplica lo aprendido", body: "Piensa en cómo cambia B cuando cambia A." }] }
  12 |       : mode === "video" || mode === "external-video" ? { ...common, projection: "video", completionRule: { type: "video", minimumCoveragePercent: 90, externalDeclarationRequired: true }, durationSeconds: 60, externalUrl: mode === "external-video" ? "https://example.test/video" : null, range: null }
  13 |         : mode === "review" || mode === "review-card" ? { projection: "review", title: "Repaso de conceptos", items: [{ resourceRevisionId: common.resourceRevisionId, sourceContentId: common.sourceContentId, itemId: id, memoryVersion: 1, objectiveIds: [], reviewStateVersion: 1, ...(mode === "review-card" ? { kind: "flashcards", front: "Recuerda la relación entre A y B" } : { kind: "quiz", prompt: question.prompt, options: question.options }) }] }
  14 |           : { ...common, projection: "quiz", completionRule: { type: "quiz", completion: "submitted" }, questions: [question] };
> 15 |   return LearningAttemptSchema.parse({ ...base, manifest, status: "open", score: null, submittedAt: null, responses: [], resume: { ...base.resume, currentIndex: 0, answeredItemIds: [] } });
     |                                ^ ZodError: [
  16 | }
  17 | 
  18 | 
  19 | 
```