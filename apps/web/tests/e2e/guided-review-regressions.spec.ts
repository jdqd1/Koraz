import { expect, test } from "@playwright/test";
import { heldLearningOptionIds, LearningAttemptMutationResponseSchema, V2HttpContracts, type LearningAttemptResponseRecord } from "@cediah/contracts";
import { legacyActivityFixture } from "../../src/components/learning/activities/activity-player-fixtures";
import { playerFixture } from "../../src/components/learning/v2/player-fixture";
import { learningVisualPathDetail } from "../../src/components/learning/learning-visual-fixtures";
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
    let connected = mode === "review-card";
    let original: { key: string; body: string | null } | undefined;
    let saved: ReturnType<typeof LearningAttemptMutationResponseSchema.parse> | undefined;
    await page.context().route("**/api/guided-learning/attempts/**", async route => {
      const request = route.request();
      const reveal = request.url().endsWith("/reveal");
      if (!reveal) {
        const identity = { key: request.headers()["idempotency-key"]!, body: request.postData() };
        expect(identity.key).toBeTruthy();
        original ??= identity;
        expect(identity).toEqual(original);
        if (!connected && !correct) return route.abort();
        if (saved) return connected ? route.fulfill({ json: saved }) : route.abort();
      }
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
      const receipt = LearningAttemptMutationResponseSchema.parse({ attempt, feedback, awards: [], progress: null, saved: true });
      if (!reveal) saved = receipt;
      return connected ? route.fulfill({ json: receipt }) : route.abort();
    });
    await page.goto(`/visual-fixtures/aprendizaje-v2?surface=legacy-player&estado=${mode}`);
    if (mode === "review-card") {
      await page.getByRole("button", { name: "Mostrar respuesta" }).click();
      await page.getByRole("button", { name: correct ? "La recordé" : "No la recordé", exact: true }).click();
    } else {
      await page.getByRole("radio").nth(correct ? 0 : 1).check();
      await page.getByRole("button", { name: "Comprobar", exact: true }).click();
      const retry = { name: "Reintentar envío pendiente", exact: true };
      await expect(page.getByRole("button", retry)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      await page.reload();
      await expect(page.getByRole("button", retry)).toBeVisible();
      expect(responses).toBe(correct ? 1 : 0);
      const other = await page.context().newPage();
      await other.goto(page.url());
      await expect(other.getByRole("button", retry)).toBeVisible();
      await page.close();
      page = other;
      connected = true;
      await page.getByRole("button", retry).click();
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

test("F01 keeps a mixed step, a video-only step and a retired step visible with the correct destinations", async ({ page }) => {
  const steps = learningVisualPathDetail.version.units[0]!.steps;
  await page.goto("/visual-fixtures/aprendizaje?estado=path-editorial");
  await expect(page.getByText("Material en revisión editorial.", { exact: true })).toBeVisible();
  await expect(page.locator(`a[href*="${heldLearningOptionIds[2]}"]`)).toHaveCount(0);
  for (const [label, step, option] of [
    ["Resolver preguntas", steps[0]!, steps[2]!.options[0]!],
    ["Reproducir video", steps[1]!, steps[0]!.options[0]!],
  ] as const) {
    const link = page.getByRole("link", { name: new RegExp(label) });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", `/aprendizaje/rutas/${learningVisualPathDetail.slug}/actividades/${step.id}?opcion=${option.id}`);
  }
  await expect(page.getByText("Paso con material retirado", { exact: true })).toBeVisible();
  await expect(page.getByText("Material no disponible", { exact: false })).toBeVisible();
});

test("F01 offers only available help and identifies the source separately", async ({ page }) => {
  const { attempt, state } = playerFixture("single_choice");
  const kinds: string[] = [];
  let hasHint = false;
  await page.route("**/api/v2/guided-learning/**", async route => {
    const manifest = { ...attempt, activeActivity: { ...attempt.activeActivity!, hasHint } };
    if (route.request().method() === "GET") {
      return route.fulfill({ json: route.request().url().endsWith("/state") ? { state } : { attempt: manifest } });
    }
    const { kind } = V2HttpContracts.attemptHelp.body.parse(route.request().postDataJSON());
    kinds.push(kind);
    return route.fulfill({ json: V2HttpContracts.attemptHelp.response.parse({
      attempt: { ...manifest, rowVersion: manifest.rowVersion + 1 },
      help: { kind, text: kind === "source" ? "Sección de la guía sintética." : "Compara el orden de A y B." },
    }) });
  });
  await page.goto("/visual-fixtures/aprendizaje-v2?surface=player&estado=single_choice");
  const source = page.getByRole("button", { name: "Consultar fuente con ayuda" });
  const hint = page.getByRole("button", { name: "Necesito ayuda" });
  await expect(source).toBeVisible();
  await expect(hint).toHaveCount(0);
  expect(kinds).toEqual([]);
  await source.click();
  await expect(page.getByText("Sección de la guía sintética.")).toBeVisible();
  hasHint = true;
  await page.reload();
  await hint.click();
  await expect(page.getByText("Compara el orden de A y B.")).toBeVisible();
  expect(kinds).toEqual(["source", "hint"]);
});
