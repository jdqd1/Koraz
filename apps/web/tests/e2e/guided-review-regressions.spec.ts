import { expect, test } from "@playwright/test";
import { LearningAttemptMutationResponseSchema, type LearningAttemptResponseRecord } from "@cediah/contracts";
import { legacyActivityFixture } from "../../src/components/learning/activities/activity-player-fixtures";
import { fixtureId } from "../../src/components/learning/v2/fixtures";

test("H18 consulting a version cannot retry an unconfirmed adoption", async ({ page }) => {
  const key = fixtureId(99), enrollment = fixtureId(3);
  await page.addInitScript(({key,enrollment,target}) => sessionStorage.setItem(`koraz:v2:upgrade:${enrollment}`, JSON.stringify({ key, body: { targetVersionId: target, expectedVersion: 1, acknowledgedReset: true } })), {key,enrollment,target:fixtureId(8)});
  const methods: string[] = [];
  await page.route("**/api/v2/guided-learning/enrollments/*/upgrade", async route => {
    methods.push(route.request().method());
    if (route.request().method() === "POST") expect(route.request().headers()["idempotency-key"]).toBe(key);
    await route.fulfill({ status: 409, json: { error: "version_conflict" } });
  });
  await page.goto("/visual-fixtures/aprendizaje-v2?surface=route&estado=ready");
  await page.getByText("Versiones e historial", { exact: true }).click();
  await page.getByRole("button", { name: "Revisar actualización" }).click();
  await expect(page.getByText(/No pudimos consultar las versiones/)).toBeVisible();
  expect(methods).toEqual(["GET"]);
  await page.getByRole("button", { name: "Recuperar actualización pendiente" }).click();
  await expect(page.getByText(/No se pudo adoptar otra versión/)).toBeVisible();
  expect(methods).toEqual(["GET","POST"]);
});

for (const mode of ["review", "review-card"]) for (const correct of [true, false]) {
  test(`H24 ${mode} final ${correct ? "correct" : "incorrect"} response keeps feedback and summary`, async ({ page }, info) => {
    let attempt = legacyActivityFixture(mode);
    const item = attempt.manifest.projection === "review" ? attempt.manifest.items[0]! : null;
    if (!item) throw new Error("Expected review fixture");
    let responses = 0;
    await page.route("**/api/guided-learning/attempts/**", async route => {
      const request = route.request();
      const reveal = request.url().endsWith("/reveal");
      let feedback: LearningAttemptResponseRecord | null = null;
      if (reveal) {
        attempt = { ...attempt, rowVersion: attempt.rowVersion + 1, revealedCards: [{ itemId: item.itemId, back: "A precede a B." }] };
      } else {
        responses++;
        feedback = {
          itemId: item.itemId, memoryVersion: 1, round: 1, answeredAt: "2026-11-04T16:00:00Z", scheduleApplied: true,
          answer: request.postDataJSON(),
          grading: { explanation: "Respuesta confirmada de esta pasada.", sessionRetry: false,
            ...(mode === "review" ? { correct } : { recallGrade: correct ? "good" : "again" }) },
          reviewState: { lapses: correct ? 0 : 1, nextDueAt: correct ? "2026-11-05T16:00:00Z" : "2026-11-04T16:10:00Z", policyVersion: "scheduler-v1", rowVersion: 2, stage: correct ? 1 : 0 },
        };
        attempt = { ...attempt, status: "completed", submittedAt: feedback.answeredAt, rowVersion: attempt.rowVersion + 1,
          responses: [feedback], resume: { ...attempt.resume, currentIndex: 1,
            ...(mode === "review" ? { answeredItemIds: [item.itemId] } : { ratedItemIds: [item.itemId] }) } };
      }
      return route.fulfill({ json: LearningAttemptMutationResponseSchema.parse({ attempt, feedback, awards: [], progress: null, saved: true }) });
    });
    await page.goto(`/visual-fixtures/aprendizaje-v2?surface=legacy-player&estado=${mode}`);
    if (mode === "review-card") {
      await page.getByRole("button", { name: "Mostrar respuesta" }).click();
      await page.getByRole("button", { name: correct ? "La recordé" : "No la recordé", exact: true }).click();
    } else {
      await page.getByRole("radio").nth(correct ? 0 : 1).check();
      await page.getByRole("button", { name: "Comprobar", exact: true }).click();
    }
    await expect(page.getByText("Respuesta confirmada de esta pasada.", { exact: true })).toBeVisible();
    await expect(page.getByText(/Próximo repaso:/)).toBeVisible();
    const summary = page.getByRole("button", { name: "Ver resumen", exact: true });
    await expect(summary).toBeVisible();
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.screenshot({ path: info.outputPath("feedback-final.png"), fullPage: true });
    await summary.press("Enter");
    await expect(page.getByRole("heading", { name: "Repaso completado", exact: true })).toBeVisible();
    expect(responses).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
