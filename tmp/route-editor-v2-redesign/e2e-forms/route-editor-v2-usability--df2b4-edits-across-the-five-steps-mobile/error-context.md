# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: route-editor-v2-usability.spec.ts >> new route stays focused on essentials and keeps edits across the five steps
- Location: tests\e2e\route-editor-v2-usability.spec.ts:17:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/visual-fixtures/editor-rutas-v2?estado=new
Call log:
  - navigating to "http://127.0.0.1:3100/visual-fixtures/editor-rutas-v2?estado=new", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | 
  4   | const id = (index: number) => `fa000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
  5   | async function openEditor(page: Page, mode = "ready") {
  6   |   await page.route("**/api/v2/editor/learning-paths/source-catalog?**", (route) => route.fulfill({
  7   |     json: { topics: [{ id: id(3), title: "Tema sintético" }], items: [], nextCursor: null },
  8   |   }));
> 9   |   await page.goto(`/visual-fixtures/editor-rutas-v2?estado=${mode}`);
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/visual-fixtures/editor-rutas-v2?estado=new
  10  |   await expect(page.getByRole("heading", { name: "Datos de la ruta" })).toBeVisible();
  11  |   await expect(page.getByLabel("Tema del catálogo")).toContainText("Tema sintético");
  12  | }
  13  | async function noOverflow(page: Page) {
  14  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  15  | }
  16  | 
  17  | test("new route stays focused on essentials and keeps edits across the five steps", async ({ page }, info) => {
  18  |   await openEditor(page, "new");
  19  |   await expect(page.getByRole("heading", { name: "Nueva ruta" })).toBeVisible();
  20  |   await expect(page.getByRole("heading", { name: "Datos de la ruta" }).locator("..").locator("p")).toHaveCount(0);
  21  |   await expect(page.getByText(/^Paso [1-5] de 5$/)).toHaveCount(0);
  22  |   await expect(page.getByLabel("Dirigida a", { exact: true })).toBeHidden();
  23  |   await page.getByLabel("Título", { exact: true }).fill("Ruta nueva de ejemplo");
  24  |   await page.getByLabel("Tema del catálogo").selectOption(id(3));
  25  |   await page.getByLabel("Descripción", { exact: true }).fill("Estudio y práctica del tema de ejemplo.");
  26  |   await noOverflow(page);
  27  |   await page.evaluate(() => window.scrollTo(0, 0));
  28  |   await page.screenshot({ path: info.outputPath("new-route.png"), fullPage: true });
  29  |   await page.screenshot({ path: info.outputPath("new-route-viewport.png") });
  30  |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  31  |   await expect(page.getByRole("tabpanel", { name: "Objetivos", exact: true })).toBeFocused();
  32  |   await page.getByLabel("Nombre de nueva unidad").fill("Primera unidad");
  33  |   await page.getByRole("button", { name: "Añadir unidad", exact: true }).click();
  34  |   await page.getByRole("button", { name: "Añadir objetivo", exact: true }).click();
  35  |   await expect(page.getByLabel("Objetivo de aprendizaje")).toBeFocused();
  36  |   await page.getByLabel("Objetivo de aprendizaje").fill("Identificar las estructuras principales");
  37  |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  38  |   await page.getByLabel("Tipo de nueva actividad").selectOption("study");
  39  |   await page.getByRole("button", { name: "Añadir actividad", exact: true }).click();
  40  |   await expect(page.getByLabel("Consigna", { exact: true })).toBeFocused();
  41  |   await page.getByLabel("Consigna", { exact: true }).fill("Lee la sección de estructuras");
  42  |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  43  |   await page.getByLabel("Tipo de evaluación").selectOption("final");
  44  |   await page.getByRole("button", { name: "Añadir evaluación", exact: true }).click();
  45  |   await expect(page.locator('[data-field-path="package.assessments.0.objectiveKeys"]')).toBeFocused();
  46  |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  47  |   await expect(page.getByRole("heading", { name: "Revisión de la ruta" })).toBeVisible();
  48  |   await page.getByRole("tab", { name: "Datos y fuentes", exact: true }).click();
  49  |   await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Ruta nueva de ejemplo");
  50  |   await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue("Estudio y práctica del tema de ejemplo.");
  51  |   await page.getByRole("tab", { name: "Objetivos", exact: true }).click();
  52  |   await page.locator("summary").filter({ hasText: "Identificar las estructuras principales" }).click();
  53  |   await expect(page.getByLabel("Objetivo de aprendizaje")).toHaveValue("Identificar las estructuras principales");
  54  |   await noOverflow(page);
  55  | });
  56  | 
  57  | test("editing collapsed options preserves the package and saves the confirmed version", async ({ page }, info) => {
  58  |   await openEditor(page);
  59  |   await page.getByLabel("Título", { exact: true }).fill("Ruta editada con el nuevo flujo");
  60  |   await page.locator("summary").filter({ hasText: "Presentación de la ruta" }).click();
  61  |   await page.getByLabel("Dirigida a", { exact: true }).fill("Estudiantes de medicina");
  62  |   await page.locator("summary").filter({ hasText: "Presentación de la ruta" }).click();
  63  |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  64  |   await expect(page.getByLabel("Objetivo de aprendizaje")).toBeHidden();
  65  |   await page.locator("summary").filter({ hasText: "Relacionar los ejemplos" }).click();
  66  |   await expect(page.getByLabel("Objetivo de aprendizaje")).toHaveValue("Relacionar los ejemplos");
  67  |   await page.screenshot({ path: info.outputPath("objectives.png"), fullPage: true });
  68  |   await page.getByRole("button", { name: "Continuar", exact: true }).click();
  69  |   await expect(page.locator("[data-activity-form]")).toHaveCount(0);
  70  |   await page.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  71  |   await expect(page.getByText("Borrador al día", { exact: true })).toBeVisible();
  72  |   const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("t023:fixture-server:ready")!));
  73  |   expect(saved.editVersion).toBe(2);
  74  |   expect(saved.definition.route.title).toBe("Ruta editada con el nuevo flujo");
  75  |   expect(saved.definition.route.audience).toBe("Estudiantes de medicina");
  76  |   expect(saved.definition.objectives).toHaveLength(1);
  77  |   expect(saved.definition.activities).toHaveLength(8);
  78  |   expect(saved.bindings.sources[0].resourceRevisionId).toBe(id(6));
  79  |   await page.reload();
  80  |   await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Ruta editada con el nuevo flujo");
  81  |   await noOverflow(page);
  82  |   const audit = await new AxeBuilder({ page }).include("[data-editor-surface]").analyze();
  83  |   expect(audit.violations).toEqual([]);
  84  | });
  85  | 
  86  | test("validation opens a collapsed source and focuses its invalid field", async ({ page }) => {
  87  |   await openEditor(page);
  88  |   const source = page.getByRole("region", { name: "Fuente 1", exact: true });
  89  |   // A named section is exposed as a region; native details retain mounted inputs.
  90  |   await source.locator("summary").filter({ hasText: "Guía sintética" }).click();
  91  |   await page.getByLabel("Nombre de la fuente", { exact: true }).fill("");
  92  |   await source.locator("summary").filter({ hasText: "Fuente 1" }).click();
  93  |   await expect(page.getByLabel("Nombre de la fuente", { exact: true })).toBeHidden();
  94  |   await page.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  95  |   await page.locator("li").filter({ hasText: "Fuente 1: revisa el nombre." }).getByRole("button", { name: "Ir al campo", exact: true }).click();
  96  |   await expect(page.getByLabel("Nombre de la fuente", { exact: true })).toBeFocused();
  97  |   await expect(page.getByLabel("Nombre de la fuente", { exact: true })).toHaveAttribute("aria-invalid", "true");
  98  |   expect(await page.evaluate(() => sessionStorage.getItem("t023:fixture-server:ready"))).toBeNull();
  99  | });
  100 | 
  101 | test("objective and activity settings stay out of the main form and preserve saved data", async ({ page }, info) => {
  102 |   await openEditor(page);
  103 |   await page.getByRole("tab", { name: "Objetivos", exact: true }).click();
  104 |   await page.locator("summary").filter({ hasText: "Relacionar los ejemplos" }).click();
  105 |   await expect(page.getByLabel("Objetivo de aprendizaje", { exact: true })).toBeVisible();
  106 |   await expect(page.getByLabel("Verbo", { exact: true })).toBeHidden();
  107 |   await expect(page.getByLabel("Prioridad", { exact: true })).toBeHidden();
  108 |   await page.screenshot({ path: info.outputPath("objective-form.png"), fullPage: true });
  109 |   await page.locator("summary").filter({ hasText: "Configuración del objetivo" }).click();
```