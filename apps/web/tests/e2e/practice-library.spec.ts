import { expect, test } from "@playwright/test";

test.skip(process.env.KORAZ_PRACTICE_E2E !== "true", "Requires the isolated catalog API in work/test/plan-maestro/bibliotecas.mts");
test.beforeEach(async ({ context }) => { await context.addCookies([{ name: "practice_fixture", value: "learner", url: "http://127.0.0.1:31044" }]); });

test("H26 and H27 open and finish the free quiz through its subject", async ({ page }) => {
  await page.goto("/asignaturas?tipo=quiz");
  await page.getByRole("link", { name: /Anatomía.*3 recursos/ }).click();
  await page.getByRole("link", { name: /Abdomen.*3 recursos/ }).click();
  await page.getByRole("link", { name: /Guía de prueba/ }).click();
  await page.getByRole("button", { name: "Practicar cuestionario" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Primera/ }).click();
  await expect(dialog.getByText("Respuesta correcta", { exact:true })).toBeVisible();
  await dialog.getByRole("button", { name: /resultado/i }).click();
  await dialog.getByRole("button", { name: "Volver al cuestionario" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/contenido\/guia-de-prueba\?/);
});

test("H26 searches flashcards in video companions and differentiates an empty search", async ({ page }) => {
  await page.goto("/asignaturas?tipo=flashcards");
  const input = page.getByRole("searchbox", { name: "Buscar flashcards" });
  await input.fill("video con preguntas");
  await input.press("Enter");
  await page.getByRole("link", { name: /Video con preguntas/ }).click();
  await expect(page).toHaveURL(/contenido\/video-con-preguntas\?.*tipo=flashcards/);
  await expect(page.getByRole("heading", { name: "Video con preguntas", exact:true }).first()).toBeVisible();
  await page.goto("/asignaturas?tipo=flashcards&q=inexistente");
  await expect(page.getByText("No encontramos recursos para esa búsqueda.")).toBeVisible();
});

test("H02 keeps a previously published ambiguous quiz out of grading", async ({ page }) => {
  await page.goto("/contenido/guia-en-revision?tipo=quiz");
  await page.getByRole("button", { name: "Practicar cuestionario" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/en revisión editorial porque hay opciones repetidas/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Misma opción/ })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Volver al cuestionario" }).click();
  await expect(dialog).toHaveCount(0);
});
