import { expect, test } from "@playwright/test";

test.skip(process.env.KORAZ_PRACTICE_E2E !== "true", "Requires the isolated learning-discovery-server.ts API");
test.beforeEach(async ({ context }) => { await context.addCookies([{ name: "practice_fixture", value: "learner", url: "http://127.0.0.1:31044" }]); });

test("H26 and H27 open and finish the free quiz through its subject", async ({ page }) => {
  await page.goto("/asignaturas?tipo=quiz");
  await page.getByRole("link", { name: /Anatomía.*3 recursos/ }).click();
  await page.getByRole("link", { name: /Abdomen.*3 recursos/ }).click();
  await page.getByRole("link", { name: /Guía de prueba/ }).click();
  await page.getByRole("button", { name: "Practicar cuestionario" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/No suma XP ni programa repasos/)).toBeVisible();
  await dialog.getByRole("button", { name: /Primera/ }).click();
  await expect(dialog.getByText("Respuesta correcta", { exact:true })).toBeVisible();
  await dialog.getByRole("button", { name: /resultado/i }).click();
  await dialog.getByRole("button", { name: "Volver al cuestionario" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Practicar cuestionario" })).toBeFocused();
  await expect(page).toHaveURL(/contenido\/guia-de-prueba\?/);
});

test("F05 embedded video guides open from the global library and match subject discovery", async ({ page }) => {
  await page.goto("/guias");
  const search = page.getByRole("searchbox", { name: /Buscar guía/ });
  await search.fill("Video con preguntas");
  await page.getByRole("link", { name: /Video con preguntas/ }).click();
  await expect(page).toHaveURL(/guias\/video-con-preguntas/);
  await expect(page.getByText("Lectura sintética.", { exact: true })).toBeVisible();
  await page.goto("/asignaturas/anatomia?tipo=guide&tema=Abdomen");
  await page.getByRole("link", { name: /Video con preguntas/ }).click();
  await expect(page.getByText("Lectura sintética.", { exact: true })).toBeVisible();
});

test("F05 search keyboard opens semantic results and Escape restores input focus", async ({ page }) => {
  await page.goto("/guias");
  const input = page.getByRole("combobox", { name: "Buscar guías" });
  await input.fill("sintetica");
  const panel = page.getByRole("dialog", { name: "Resultados de búsqueda" });
  const first = panel.getByRole("link").first();
  await expect(first).toBeVisible();
  await expect(panel).not.toContainText(/paragraph|reservedmetadata/);
  await input.press("ArrowDown");
  await expect(first).toBeFocused();
  await first.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(input).toBeFocused();
  await input.fill("sintética");
  await input.click();
  await expect(first).toBeVisible();
  const href = await first.getAttribute("href");
  await input.press("ArrowDown");
  await first.press("Enter");
  await expect(page).toHaveURL(new RegExp(href!));
});

test("F05 consultation and free practice preserve guided progress; the guided destination saves it", async ({ page }) => {
  const snapshot = async () => (await (await page.request.get("http://127.0.0.1:41044/__test/discovery")).json());
  const before = await snapshot();
  await page.goto("/contenido/guia-de-prueba?tipo=quiz");
  await page.getByText("Consultar preguntas y respuestas", { exact: true }).click();
  await expect(page.getByText("Primera", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Practicar cuestionario" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Primera/ }).click();
  await dialog.getByRole("button", { name: /resultado/i }).click();
  await dialog.getByRole("button", { name: "Volver al cuestionario" }).click();
  expect((await snapshot()).counts).toEqual(before.counts);
  const guided = page.getByRole("navigation", { name: "Rutas que incluyen esta actividad" }).getByRole("link");
  const target = await guided.getAttribute("href");
  await guided.click();
  await expect(page).toHaveURL(new RegExp(target!.split("?")[0]!));
  expect((await snapshot()).counts).toEqual(before.counts);
  await page.getByRole("button", { name: "Comenzar actividad", exact: true }).click();
  await page.getByRole("radio", { name: "Primera", exact: true }).check();
  await page.getByRole("button", { name: "Comprobar", exact: true }).click();
  await expect(page.getByText("Respuesta correcta", { exact: true })).toBeVisible();
  const saved = await snapshot();
  expect(saved.counts.responses).toBe(before.counts.responses + 1);
  expect(saved.progress.value.units.flatMap((unit: { steps: Array<{ state: string; title: string }> }) => unit.steps)
    .find((step: { title: string }) => step.title === "Comprobar el orden").state).toBe("completed");
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
