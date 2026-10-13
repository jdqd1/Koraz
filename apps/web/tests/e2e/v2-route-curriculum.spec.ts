import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const id = (n: number) => `b2800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const map = `/visual-fixtures/aprendizaje-v2?surface=map&estado=abdomen&node=${id(8)}&item=${id(1)}&unit=portal`;
const evidence = resolve(process.cwd(), "../../docs/diseno-actividades-rutas");

for (const width of [320, 390, 768, 1440]) {
  test(`unit curriculum and fixed next action remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(map.replace("&unit=portal", ""));
    await page.getByRole("button", { name: "Abrir Sistema porta hepático", exact: true }).click();
    const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
    await expect(panel.getByRole("heading", { name: "Sistema porta hepático", exact: true })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Ordenar el flujo portal y relacionar su topografía" })).toBeVisible();
    await expect(panel.getByText("3 de 9 completadas", { exact: true })).toBeVisible();
    await expect(panel.locator('[data-current="true"]')).toContainText("Ahora");
    await expect(panel.getByRole("heading", { name: "Relacionar la VCI con sus trayectos y tributarias" })).toHaveCount(0);
    const primary = panel.getByRole("button", { name: "Continuar actividad", exact: true });
    const mobileSheet = await page.getByRole("dialog", { name: "Detalle del mapa", exact: true }).count() > 0;
    await expect(primary).toBeVisible();
    const box = await primary.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, panels: [...document.querySelectorAll('[role="tabpanel"]')].filter(el => !el.hasAttribute("hidden")).map(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth })) }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(width);
    expect(overflow.panels.every(panel => panel.scrollWidth <= panel.width)).toBe(true);
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: resolve(evidence, `unidad-${width}.png`) });
    await panel.getByRole("tab", { name: "Recursos", exact: true }).click();
    await expect(panel.getByText("Guía de vascularización abdominal", { exact: true })).toBeVisible();
    await expect(panel.getByText("Página 3", { exact: false })).toBeVisible();
    await expect(primary).toBeVisible();
    if (width === 390) await page.screenshot({ path: resolve(evidence, "recursos-390.png") });
    await panel.getByRole("button", { name: "Cerrar detalle" }).click();
    await expect(panel).toHaveCount(0);
    if (mobileSheet) await expect(page.getByRole("button", { name: "Abrir Sistema porta hepático", exact: true })).toBeFocused();
  });
}

test("route opens the recommended unit and tabs support keyboard and accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/visual-fixtures/aprendizaje-v2?surface=route&estado=abdomen", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Abdomen", exact: true })).toBeVisible();
  await expect(page.locator("#leccion-vena-cava")).toHaveAttribute("open", "");
  const resources = page.getByRole("tab", { name: "Recursos", exact: true });
  await page.getByRole("tab", { name: "Actividades", exact: true }).press("ArrowRight");
  await expect(resources).toBeFocused();
  await expect(resources).toHaveAttribute("aria-selected", "true");
  await resources.press("Home");
  await expect(page.getByRole("tab", { name: "Actividades", exact: true })).toHaveAttribute("aria-selected", "true");
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, "ruta-390.png"), fullPage: true });
  const axe = await new AxeBuilder({ page }).include('[data-engine-version="guided-v2"]').analyze();
  await writeFile(resolve(evidence, "accessibility-route.json"), JSON.stringify(axe.violations, null, 2));
  expect(axe.violations).toEqual([]);
  await page.goto(map);
  await expect(page.getByRole("button", { name: "Continuar actividad", exact: true })).toBeVisible();
  const panelAxe = await new AxeBuilder({ page }).include('[aria-label="Detalle de práctica por objetivos"]').analyze();
  await writeFile(resolve(evidence, "accessibility-panel.json"), JSON.stringify(panelAxe.violations, null, 2));
  expect(panelAxe.violations).toEqual([]);
});

test("continuing opens the authorized activity of the selected unit with its pinned version", async ({ page }) => {
  let body: Record<string, unknown> | null = null;
  await page.route("**/api/v2/guided-learning/attempts", async route => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { attempt: { engineVersion: "guided-v2", attemptId: id(4), enrollmentId: id(3), pathVersionId: id(2), policyVersion: "guided-v2.0", purpose: "activity", rowVersion: 1, status: "open", activeActivity: null, acceptedResponses: [] } } });
  });
  await page.route("**/aprendizaje/sesiones/**", route => route.fulfill({ contentType: "text/html", body: "<main>Sesión de prueba</main>" }));
  await page.goto(map);
  await page.getByRole("button", { name: "Continuar actividad", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/aprendizaje/sesiones/${id(4)}`));
  expect(body).toMatchObject({ enrollmentId: id(3), expectedEnrollmentVersion: 4, target: { kind: "activity", key: "practice-portal" } });
  const returnTo = new URL(page.url()).searchParams.get("returnTo");
  expect(returnTo).toContain("unit=portal");
});

test("missing state never becomes zero progress or an enabled continuation", async ({ page }) => {
  await page.goto(`/visual-fixtures/aprendizaje-v2?surface=map&estado=missing&node=${id(8)}&item=${id(1)}&unit=unit-a`);
  const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
  await expect(panel.getByText("No pudimos cargar el estado confirmado.", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: /Continuar|Abrir actividad/ })).toHaveCount(0);
  await expect(panel.getByRole("progressbar")).toHaveCount(0);
});
