import { test, expect, type Page } from "@playwright/test";
import type { RoutePackage } from "@cediah/contracts";

function importPackage(): RoutePackage {
  return { schemaVersion: "2.0", packageKey: "dropzone-test", revision: 1, locale: "es", policyVersion: "guided-v2.0",
    route: { slug: "dropzone-test", title: "Ruta importada de prueba", summary: "Paquete sintético para verificar la carga local.", topicLabel: "Tema de prueba", audience: "Estudiantes", discipline: "general", coverKey: "heart" },
    sources: [], assets: [], objectives: [], units: [], activities: [], assessments: [],
    reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] } };
}

async function openImport(page: Page) {
  await page.route("**/api/v2/editor/learning-paths/source-catalog?**", (route) => route.fulfill({
    json: { topics: [], items: [], nextCursor: null },
  }));
  await page.goto("/visual-fixtures/editor-rutas-v2?estado=new");
  await page.getByRole("button", { name: "Importar archivo de ruta", exact: true }).click();
  const wizard = page.getByRole("region", { name: "Importar ruta", exact: true });
  await expect(wizard.getByRole("heading", { name: "Importar ruta", exact: true })).toBeVisible();
  await expect(wizard.getByText(/Los cambios del editor se conservan/)).toHaveCount(0);
  await expect(wizard.getByLabel("Archivo de ruta", { exact: true })).toHaveAttribute("accept", ".json,application/json");
  return wizard;
}
async function dropFiles(page: Page, files: { name: string; text?: string; size?: number }[]) {
  const transfer = await page.evaluateHandle((values) => {
    const data = new DataTransfer();
    for (const value of values) data.items.add(new File([value.size ? new Uint8Array(value.size) : value.text ?? ""], value.name, { type: "application/json" }));
    return data;
  }, files);
  const zone = page.getByRole("group", { name: "Zona para cargar el archivo de ruta", exact: true });
  await zone.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(zone).toHaveAttribute("data-dragging", "true");
  await zone.dispatchEvent("drop", { dataTransfer: transfer });
  await expect(zone).toHaveAttribute("data-dragging", "false");
  await transfer.dispose();
}

test("minimal drop zone supports choosing a file with the keyboard", async ({ page }, info) => {
  const wizard = await openImport(page);
  const zone = page.getByRole("group", { name: "Zona para cargar el archivo de ruta", exact: true });
  await zone.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("import-dropzone.png") });
  const chooser = page.waitForEvent("filechooser");
  await wizard.getByRole("button", { name: "Seleccionar archivo", exact: true }).press("Enter");
  await (await chooser).setFiles({ name: "invalido.json", mimeType: "application/json", buffer: Buffer.from("{invalid") });
  await expect(wizard.getByText("El archivo no contiene JSON válido.", { exact: true })).toBeVisible();
  await expect(wizard.getByRole("button", { name: "Seleccionar archivo", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("dropping a valid package reads it locally without importing automatically", async ({ page }) => {
  const wizard = await openImport(page);
  const mutations: string[] = [];
  page.on("request", (request) => { if (["POST", "PATCH"].includes(request.method()) && request.url().includes("/api/v2/editor/learning-paths")) mutations.push(request.url()); });
  const pkg = importPackage();
  await dropFiles(page, [{ name: "ruta.json", text: JSON.stringify(pkg) }]);
  await expect(wizard.getByText("ruta.json", { exact: true })).toBeVisible();
  await expect(wizard.getByRole("heading", { name: pkg.route.title, exact: true })).toBeVisible();
  await expect(wizard.getByRole("button", { name: "Cambiar archivo", exact: true })).toBeEnabled();
  await expect(wizard.getByRole("button", { name: "Comprobar importación", exact: true })).toBeVisible();
  expect(mutations).toEqual([]);
  await dropFiles(page, [{ name: "otro.json", text: "{invalid" }]);
  await expect(wizard.getByText("El archivo no contiene JSON válido.", { exact: true })).toBeVisible();
  await expect(wizard.getByText("ruta.json", { exact: true })).toBeVisible();
});

test("drop zone rejects multiple and oversized files and can be used again", async ({ page }) => {
  const wizard = await openImport(page);
  await dropFiles(page, [{ name: "uno.json", text: "{}" }, { name: "dos.json", text: "{}" }]);
  await expect(wizard.getByText("Selecciona un solo archivo de ruta.", { exact: true })).toBeVisible();
  await dropFiles(page, [{ name: "grande.json", size: 10 * 1024 * 1024 + 1 }]);
  await expect(wizard.getByText("El archivo supera 10 MiB.", { exact: true })).toBeVisible();
  await expect(wizard.getByRole("button", { name: "Seleccionar archivo", exact: true })).toBeEnabled();
});
