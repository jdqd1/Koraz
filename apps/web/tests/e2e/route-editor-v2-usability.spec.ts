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

test("activity picker explains and previews every type before creating blank content", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("tab", { name: "Recorrido", exact: true }).click();
  await page.getByRole("button", { name: "Añadir actividad", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Elegir actividad" });
  const types = dialog.getByRole("navigation", { name: "Tipos de actividad" }).locator("button");
  await expect(types).toHaveCount(13);
  for (const button of await types.all()) {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByText("Cuándo usarla", { exact: true })).toBeVisible();
    await expect(dialog.locator("[data-student-preview]")).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Respuesta breve", exact: true }).click();
  await dialog.getByLabel("Tu respuesta", { exact: true }).fill("tarjeta");
  await dialog.getByRole("button", { name: "Comprobar respuesta", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Respuesta de prueba enviada");
  await dialog.getByRole("button", { name: "Crear actividad", exact: true }).click();
  await expect(page.getByLabel("Consigna", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Consigna", { exact: true })).toHaveValue("");
  await expect(page.locator("[data-activity-form]")).toHaveCount(1);
});

test("student preview follows live edits and keeps the private answer behind reveal", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("tab", { name: "Recorrido", exact: true }).click();
  await page.locator('summary[aria-label="Estudio · Pregunta sintética"]').click();
  await page.getByLabel("Consigna", { exact: true }).fill("Lee este contenido antes de practicar");
  await page.getByLabel("Contenido de estudio", { exact: true }).fill("Contenido actualizado desde el lienzo editable.");
  const configuration = page.getByRole("complementary", { name: "Configuración de la actividad", exact: true });
  await expect(configuration.getByLabel("Consigna", { exact: true })).toBeVisible();
  const preview = page.locator("[data-student-preview]");
  await expect(preview).toContainText("Contenido actualizado desde el lienzo editable.");
  await expect(preview.getByText("En directo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Probar", exact: true }).click();
  await expect(preview.getByRole("button", { name: "Reiniciar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(page.getByLabel("Contenido de estudio", { exact: true })).toHaveValue("Contenido actualizado desde el lienzo editable.");
  await page.locator('summary[aria-label="Respuesta construida · Pregunta sintética"]').click();
  await page.getByRole("button", { name: "Probar", exact: true }).click();
  await expect(preview.getByRole("heading", { name: "Respuesta modelo" })).toHaveCount(0);
  await preview.getByLabel("Explica con tus palabras").fill("Mi explicación de prueba");
  await preview.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await preview.getByRole("button", { name: "Comparar con el modelo" }).click();
  await expect(preview.getByRole("heading", { name: "Respuesta modelo" })).toBeVisible();
  await preview.getByRole("button", { name: "Reiniciar" }).click();
  await expect(preview.getByLabel("Explica con tus palabras")).toHaveValue("");
});

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
  await expect(page.getByLabel("Objetivo de aprendizaje")).toBeFocused();
  await page.getByLabel("Objetivo de aprendizaje").fill("Identificar las estructuras principales");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Añadir actividad", exact: true }).click();
  await page.getByRole("button", { name: "Estudio", exact: true }).click();
  await page.getByRole("button", { name: "Crear actividad", exact: true }).click();
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
  await expect(page.getByLabel("Objetivo de aprendizaje")).toHaveValue("Identificar las estructuras principales");
  await noOverflow(page);
});

test("editing collapsed options preserves the package and saves the confirmed version", async ({ page }, info) => {
  await openEditor(page);
  await page.getByLabel("Título", { exact: true }).fill("Ruta editada con el nuevo flujo");
  await page.locator("summary").filter({ hasText: "Presentación de la ruta" }).click();
  await page.getByLabel("Dirigida a", { exact: true }).fill("Estudiantes de medicina");
  await page.locator("summary").filter({ hasText: "Presentación de la ruta" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Objetivo de aprendizaje")).toBeHidden();
  await page.locator("summary").filter({ hasText: "Relacionar los ejemplos" }).click();
  await expect(page.getByLabel("Objetivo de aprendizaje")).toHaveValue("Relacionar los ejemplos");
  await page.screenshot({ path: info.outputPath("objectives.png"), fullPage: true });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("[data-activity-form]")).toHaveCount(1);
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

test("objective and activity settings stay out of the main form and preserve saved data", async ({ page }, info) => {
  await openEditor(page);
  await page.getByRole("tab", { name: "Objetivos", exact: true }).click();
  await page.locator("summary").filter({ hasText: "Relacionar los ejemplos" }).click();
  await expect(page.getByLabel("Objetivo de aprendizaje", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Verbo", { exact: true })).toBeHidden();
  await expect(page.getByLabel("Prioridad", { exact: true })).toBeHidden();
  await page.screenshot({ path: info.outputPath("objective-form.png"), fullPage: true });
  await page.locator("summary").filter({ hasText: "Configuración del objetivo" }).click();
  const required = page.getByLabel(/^Obligatorio/);
  await expect(required).toBeChecked();
  await expect(required).toBeDisabled();
  await page.getByLabel("Prioridad", { exact: true }).selectOption("high_yield");
  // CORE objectives remain required. Switch criticality before changing this field.
  await expect(required).toBeEnabled();
  await required.uncheck();
  await page.getByRole("tab", { name: "Recorrido", exact: true }).click();
  await page.getByRole("button", { name: "Añadir actividad", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Tipos de actividad" }).locator("button")).toHaveCount(13);
  await page.getByRole("button", { name: "Cerrar selector de actividades" }).click();
  await page.locator('summary[aria-label="Estudio · Pregunta sintética"]').click();
  await expect(page.getByLabel("Contenido de estudio", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Fase de aprendizaje", { exact: true })).toBeHidden();
  await expect(page.getByLabel("Apoyo del ejemplo", { exact: true })).toBeHidden();
  await page.getByLabel("Contenido de estudio", { exact: true }).fill("Contenido conservado después de ajustar la configuración.");
  await page.screenshot({ path: info.outputPath("activity-form.png"), fullPage: true });
  await page.locator("summary").filter({ hasText: "Opciones avanzadas" }).click();
  await page.getByLabel("Fase de aprendizaje", { exact: true }).selectOption("learn");
  await page.getByLabel("Actividad requerida", { exact: true }).uncheck();
  await page.locator("summary").filter({ hasText: "Opciones de estudio" }).click();
  await expect(page.getByLabel("Apoyo del ejemplo", { exact: true })).toHaveValue("explanation");
  await page.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(page.getByText("Borrador al día", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("t023:fixture-server:ready")!));
  expect(saved.definition.objectives[0]).toMatchObject({ criticality: "high_yield", required: false, sourceKeys: ["source"] });
  const study = saved.definition.activities.find((activity: { key: string }) => activity.key === "study");
  expect(study).toMatchObject({ phase: "learn", required: false, sourceKeys: ["source"], payload: { body: "Contenido conservado después de ajustar la configuración.", scaffold: "explanation" } });
  expect(saved.definition.activities.find((activity: { key: string }) => activity.key === "choice").payload.correctKey).toBe("a");
  expect(saved.definition.units[0].activityKeys).toHaveLength(8);
  await noOverflow(page);
});
