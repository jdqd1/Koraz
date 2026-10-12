# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: route-import-v2.spec.ts >> drop zone rejects multiple and oversized files and can be used again
- Location: tests\e2e\route-import-v2.spec.ts:66:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/visual-fixtures/editor-rutas-v2?estado=new
Call log:
  - navigating to "http://127.0.0.1:3100/visual-fixtures/editor-rutas-v2?estado=new", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect, type Page } from "@playwright/test";
  2  | import type { RoutePackage } from "@cediah/contracts";
  3  | 
  4  | function importPackage(): RoutePackage {
  5  |   return { schemaVersion: "2.0", packageKey: "dropzone-test", revision: 1, locale: "es", policyVersion: "guided-v2.0",
  6  |     route: { slug: "dropzone-test", title: "Ruta importada de prueba", summary: "Paquete sintético para verificar la carga local.", topicLabel: "Tema de prueba", audience: "Estudiantes", discipline: "general", coverKey: "heart" },
  7  |     sources: [], assets: [], objectives: [], units: [], activities: [], assessments: [],
  8  |     reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] } };
  9  | }
  10 | 
  11 | async function openImport(page: Page) {
  12 |   await page.route("**/api/v2/editor/learning-paths/source-catalog?**", (route) => route.fulfill({
  13 |     json: { topics: [], items: [], nextCursor: null },
  14 |   }));
> 15 |   await page.goto("/visual-fixtures/editor-rutas-v2?estado=new");
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/visual-fixtures/editor-rutas-v2?estado=new
  16 |   await page.getByRole("button", { name: "Importar archivo de ruta", exact: true }).click();
  17 |   const wizard = page.getByRole("region", { name: "Importar ruta", exact: true });
  18 |   await expect(wizard.getByRole("heading", { name: "Importar ruta", exact: true })).toBeVisible();
  19 |   await expect(wizard.getByText(/Los cambios del editor se conservan/)).toHaveCount(0);
  20 |   await expect(wizard.getByLabel("Archivo de ruta", { exact: true })).toHaveAttribute("accept", ".json,application/json");
  21 |   return wizard;
  22 | }
  23 | async function dropFiles(page: Page, files: { name: string; text?: string; size?: number }[]) {
  24 |   const transfer = await page.evaluateHandle((values) => {
  25 |     const data = new DataTransfer();
  26 |     for (const value of values) data.items.add(new File([value.size ? new Uint8Array(value.size) : value.text ?? ""], value.name, { type: "application/json" }));
  27 |     return data;
  28 |   }, files);
  29 |   const zone = page.getByRole("group", { name: "Zona para cargar el archivo de ruta", exact: true });
  30 |   await zone.dispatchEvent("dragenter", { dataTransfer: transfer });
  31 |   await expect(zone).toHaveAttribute("data-dragging", "true");
  32 |   await zone.dispatchEvent("drop", { dataTransfer: transfer });
  33 |   await expect(zone).toHaveAttribute("data-dragging", "false");
  34 |   await transfer.dispose();
  35 | }
  36 | 
  37 | test("minimal drop zone supports choosing a file with the keyboard", async ({ page }, info) => {
  38 |   const wizard = await openImport(page);
  39 |   const zone = page.getByRole("group", { name: "Zona para cargar el archivo de ruta", exact: true });
  40 |   await zone.scrollIntoViewIfNeeded();
  41 |   await page.screenshot({ path: info.outputPath("import-dropzone.png") });
  42 |   const chooser = page.waitForEvent("filechooser");
  43 |   await wizard.getByRole("button", { name: "Seleccionar archivo", exact: true }).press("Enter");
  44 |   await (await chooser).setFiles({ name: "invalido.json", mimeType: "application/json", buffer: Buffer.from("{invalid") });
  45 |   await expect(wizard.getByText("El archivo no contiene JSON válido.", { exact: true })).toBeVisible();
  46 |   await expect(wizard.getByRole("button", { name: "Seleccionar archivo", exact: true })).toBeEnabled();
  47 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  48 | });
  49 | 
  50 | test("dropping a valid package reads it locally without importing automatically", async ({ page }) => {
  51 |   const wizard = await openImport(page);
  52 |   const mutations: string[] = [];
  53 |   page.on("request", (request) => { if (["POST", "PATCH"].includes(request.method()) && request.url().includes("/api/v2/editor/learning-paths")) mutations.push(request.url()); });
  54 |   const pkg = importPackage();
  55 |   await dropFiles(page, [{ name: "ruta.json", text: JSON.stringify(pkg) }]);
  56 |   await expect(wizard.getByText("ruta.json", { exact: true })).toBeVisible();
  57 |   await expect(wizard.getByRole("heading", { name: pkg.route.title, exact: true })).toBeVisible();
  58 |   await expect(wizard.getByRole("button", { name: "Cambiar archivo", exact: true })).toBeEnabled();
  59 |   await expect(wizard.getByRole("button", { name: "Comprobar importación", exact: true })).toBeVisible();
  60 |   expect(mutations).toEqual([]);
  61 |   await dropFiles(page, [{ name: "otro.json", text: "{invalid" }]);
  62 |   await expect(wizard.getByText("El archivo no contiene JSON válido.", { exact: true })).toBeVisible();
  63 |   await expect(wizard.getByText("ruta.json", { exact: true })).toBeVisible();
  64 | });
  65 | 
  66 | test("drop zone rejects multiple and oversized files and can be used again", async ({ page }) => {
  67 |   const wizard = await openImport(page);
  68 |   await dropFiles(page, [{ name: "uno.json", text: "{}" }, { name: "dos.json", text: "{}" }]);
  69 |   await expect(wizard.getByText("Selecciona un solo archivo de ruta.", { exact: true })).toBeVisible();
  70 |   await dropFiles(page, [{ name: "grande.json", size: 10 * 1024 * 1024 + 1 }]);
  71 |   await expect(wizard.getByText("El archivo supera 10 MiB.", { exact: true })).toBeVisible();
  72 |   await expect(wizard.getByRole("button", { name: "Seleccionar archivo", exact: true })).toBeEnabled();
  73 | });
  74 | 
```