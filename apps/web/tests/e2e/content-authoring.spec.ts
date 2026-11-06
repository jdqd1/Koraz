import { expect, test } from "@playwright/test";

test.skip(process.env.KORAZ_PRACTICE_E2E !== "true", "Requires the isolated editorial API and database");

test.setTimeout(120_000);
test.use({ actionTimeout: 15_000 });

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([{ name: "practice_fixture", value: "editor", url: "http://127.0.0.1:31044" }]);
  await page.goto("/panel/contenido");
  await page.getByRole("button", { name: "Expandir publicaciones" }).click();
});

test("repairs, saves, reopens and publishes a legacy quiz with stable option identities", async ({ page, context }, info) => {
  const name = `F01 quiz ${info.project.name}`;
  const item = page.getByRole("button", { name: new RegExp(`Cuestionario: ${name}\\.`) });
  const opened = page.waitForResponse(response => response.url().includes("/api/editor/content/") && response.request().method() === "GET");
  await item.click();
  const original = (await (await opened).json()).content.questions[1];
  const review = page.getByRole("button", { name: "Enviar a revisión" });
  await review.click();
  const option = page.getByRole("textbox", { name: "Opción 2 de la pregunta 2" });
  await expect(option).toBeFocused();
  await option.fill("Término con tilde");
  await review.click();
  const explanation = page.getByRole("textbox", { name: "Explicación de la pregunta 2" });
  await expect(explanation).toBeFocused();
  await explanation.fill("La segunda opción incluye la palabra solicitada.");
  const saved = page.waitForResponse(response => response.request().method() === "PATCH");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  const result = await saved;
  expect(result.status()).toBe(200);
  expect((await result.json()).content.questions[1]).toMatchObject({
    options: ["Ítem uno", "Término con tilde"], correctOptionIndex: 1,
    id: original.id, optionIds: original.optionIds, memoryVersion: original.memoryVersion + 1,
  });
  await page.reload();
  await page.getByRole("button", { name: "Expandir publicaciones" }).click();
  await item.click();
  await page.getByRole("button", { name: /Qué opción contiene la palabra término/ }).click();
  await expect(option).toHaveValue("Término con tilde");
  await expect(page.getByRole("radio", { name: "Marcar la opción 2 como correcta" })).toBeChecked();
  for (const [action, status] of [["Enviar a revisión", "in_review"], ["Aprobar", "published"]]) {
    const transition = page.waitForResponse(response => response.url().endsWith("/transition"));
    await page.getByRole("button", { name: action, exact: true }).click();
    const response = await transition;
    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe(status);
  }
  await context.addCookies([{ name: "practice_fixture", value: "learner", url: "http://127.0.0.1:31044" }]);
  await page.goto(`/contenido/f01-quiz-${info.project.name}?tipo=quiz`);
  await page.getByRole("button", { name: "Practicar cuestionario" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /\bA\b/ }).first().click();
  await dialog.getByRole("button", { name: /siguiente/i }).click();
  await dialog.getByRole("button", { name: /Término con tilde/ }).click();
  await expect(dialog.getByText("Respuesta correcta", { exact: true })).toBeVisible();
});

test("opens the offending guide companion field from a collapsed question", async ({ page }, info) => {
  await page.getByRole("button", { name: new RegExp(`Guía: F01 guide ${info.project.name}\\.`) }).click();
  await page.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(page.getByRole("textbox", { name: "Opción 2 de la pregunta 2" })).toBeFocused();
});

test("saves a consultation card with its own front and back", async ({ page }, info) => {
  await page.getByRole("button", { name: "Crear flashcards" }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(`Tarjetas F01 ${info.project.name}`);
  await page.getByRole("textbox", { name: "Frente" }).fill("Primera letra");
  await page.getByRole("textbox", { name: "Reverso" }).fill("A");
  const saving = page.waitForResponse(response => response.url().endsWith("/api/editor/content") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  const result = await saving;
  expect(result.ok()).toBe(true);
  const saved = await result.json();
  expect(saved.kind).toBe("flashcards");
  expect(saved.content.cards).toMatchObject([{ front: "Primera letra", back: "A" }]);
  expect(saved.content).not.toHaveProperty("questions");
});
