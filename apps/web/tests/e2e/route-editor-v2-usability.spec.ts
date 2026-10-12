import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const id = (index: number) => `fa000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
async function openEditor(page: Page, mode = "ready") {
  await page.route("**/api/v2/editor/learning-paths/source-catalog?**", (route) => route.fulfill({
    json: { topics: [{ id: id(3), title: "Tema sintético" }], items: [], nextCursor: null },
  }));
  await page.goto(`/visual-fixtures/editor-rutas-v2?estado=${mode}`);
  await expect(page.getByRole("heading", { name: "Datos de la ruta" })).toBeVisible();
  await expect(page.getByLabel("Tema del catálogo")).toContainText("Tema sintético");
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("new route stays focused on essentials and keeps edits across the five steps", async ({ page }, info) => {
  await openEditor(page, "new");
  await expect(page.getByRole("heading", { name: "Nueva ruta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Datos de la ruta" }).locator("..").locator("p")).toHaveCount(0);
  await expect(page.getByText(/^Paso [1-5] de 5$/)).toHaveCount(0);
  await expect(page.getByLabel("Dirigida a", { exact: true })).toBeHidden();
  await page.getByLabel("Título", { exact: true }).fill("Ruta nueva de ejemplo");
  await page.getByLabel("Tema del catálogo").selectOption(id(3));
  await page.getByLabel("Descripción", { exact: true }).fill("Estudio y práctica del tema de ejemplo.");
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("new-route.png"), fullPage: true });
  await page.screenshot({ path: info.outputPath("new-route-viewport.png") });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Objetivos", exact: true })).toBeFocused();
  await page.getByLabel("Nombre de nueva unidad").fill("Primera unidad");
  await page.getByRole("button", { name: "Añadir unidad", exact: true }).click();
  await page.getByRole("button", { name: "Añadir objetivo", exact: true }).click();
  await expect(page.getByLabel("Capacidad observable")).toBeFocused();
  await page.getByLabel("Capacidad observable").fill("Identificar las estructuras principales");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Tipo de nueva actividad").selectOption("study");
  await page.getByRole("button", { name: "Añadir actividad", exact: true }).click();
  await expect(page.getByLabel("Consigna", { exact: true })).toBeFocused();
  await page.getByLabel("Consigna", { exact: true }).fill("Lee la sección de estructuras");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Tipo de evaluación").selectOption("final");
  await page.getByRole("button", { name: "Añadir evaluación", exact: true }).click();
  await expect(page.locator('[data-field-path="package.assessments.0.objectiveKeys"]')).toBeFocused();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Revisión de la ruta" })).toBeVisible();
  await page.getByRole("tab", { name: "Datos y fuentes", exact: true }).click();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Ruta nueva de ejemplo");
  await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue("Estudio y práctica del tema de ejemplo.");
  await page.getByRole("tab", { name: "Objetivos", exact: true }).click();
  await page.locator("summary").filter({ hasText: "Identificar las estructuras principales" }).click();
  await expect(page.getByLabel("Capacidad observable")).toHaveValue("Identificar las estructuras principales");
  await noOverflow(page);
});

test("editing collapsed options preserves the package and saves the confirmed version", async ({ page }, info) => {
  await openEditor(page);
  await page.getByLabel("Título", { exact: true }).fill("Ruta editada con el nuevo flujo");
  await page.locator("summary").filter({ hasText: "Presentación de la ruta" }).click();
  await page.getByLabel("Dirigida a", { exact: true }).fill("Estudiantes de medicina");
  await page.locator("summary").filter({ hasText: "Presentación de la ruta" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Capacidad observable")).toBeHidden();
  await page.locator("summary").filter({ hasText: "Relacionar los ejemplos" }).click();
  await expect(page.getByLabel("Capacidad observable")).toHaveValue("Relacionar los ejemplos");
  await page.screenshot({ path: info.outputPath("objectives.png"), fullPage: true });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("[data-activity-form]")).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(page.getByText("Borrador al día", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("t023:fixture-server:ready")!));
  expect(saved.editVersion).toBe(2);
  expect(saved.definition.route.title).toBe("Ruta editada con el nuevo flujo");
  expect(saved.definition.route.audience).toBe("Estudiantes de medicina");
  expect(saved.definition.objectives).toHaveLength(1);
  expect(saved.definition.activities).toHaveLength(8);
  expect(saved.bindings.sources[0].resourceRevisionId).toBe(id(6));
  await page.reload();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Ruta editada con el nuevo flujo");
  await noOverflow(page);
  const audit = await new AxeBuilder({ page }).include("[data-editor-surface]").analyze();
  expect(audit.violations).toEqual([]);
});

test("validation opens a collapsed source and focuses its invalid field", async ({ page }) => {
  await openEditor(page);
  const source = page.getByRole("region", { name: "Fuente 1", exact: true });
  // A named section is exposed as a region; native details retain mounted inputs.
  await source.locator("summary").filter({ hasText: "Guía sintética" }).click();
  await page.getByLabel("Nombre de la fuente", { exact: true }).fill("");
  await source.locator("summary").filter({ hasText: "Fuente 1" }).click();
  await expect(page.getByLabel("Nombre de la fuente", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await page.locator("li").filter({ hasText: "Fuente 1: revisa el nombre." }).getByRole("button", { name: "Ir al campo", exact: true }).click();
  await expect(page.getByLabel("Nombre de la fuente", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Nombre de la fuente", { exact: true })).toHaveAttribute("aria-invalid", "true");
  expect(await page.evaluate(() => sessionStorage.getItem("t023:fixture-server:ready"))).toBeNull();
});
