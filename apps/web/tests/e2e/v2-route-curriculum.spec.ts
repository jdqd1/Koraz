import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const id = (n: number) => `b2800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const map = `/visual-fixtures/aprendizaje-v2?surface=map&estado=abdomen&node=${id(8)}&item=${id(1)}&unit=portal`;
const evidence = resolve(process.cwd(), "../../docs/diseno-mapa-unidades");

test("previous and next units update immediately and returning to activities restores the available activity", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(map);
  const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
  await expect(panel.locator('[data-current="true"]')).toBeInViewport();
  async function switchUnit(name: string, title: string) {
    const elapsed = await panel.getByRole("button", { name, exact: true }).evaluate((button, expected) => new Promise<number>(resolve => {
      const start = performance.now(), panel = button.closest("aside")!;
      const observer = new MutationObserver(() => {
        if (panel.querySelector("h2")?.textContent !== expected) return;
        observer.disconnect();
        requestAnimationFrame(() => resolve(performance.now() - start));
      });
      observer.observe(panel, { subtree: true, childList: true, characterData: true });
      (button as HTMLButtonElement).click();
    }), title);
    await expect(panel.getByRole("heading", { name: title, exact: true })).toBeVisible();
    expect(elapsed).toBeLessThan(200);
    return elapsed;
  }
  const forward = await switchUnit("Unidad siguiente", "Comunicaciones venosas");
  const back = await switchUnit("Unidad anterior", "Sistema porta hepático");
  await panel.getByRole("tab", { name: "Recursos", exact: true }).click();
  await panel.getByRole("tab", { name: "Actividades", exact: true }).click();
  await expect(panel.locator('[data-current="true"]')).toBeInViewport();
  await mkdir(evidence, { recursive: true });
  await writeFile(resolve(evidence, "navigation-performance.json"), JSON.stringify({ viewport: "430x932", fixture: "abdomen", forwardMs: forward, backMs: back }, null, 2));
});

test("the same stored instant uses the device country and editorial notes stay optional", async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  for (const [timezoneId, expected] of [["America/Caracas", "mañana a la 1:00"], ["Europe/Madrid", "hoy a las 7:00"]]) {
    const context = await browser.newContext({ timezoneId, viewport: { width: 430, height: 932 } });
    const page = await context.newPage();
    await page.goto(map.replace("estado=abdomen", "estado=abdomen-complete").replace("unit=portal", "unit=arteries"));
    const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
    const date = panel.locator('footer time[datetime="2026-10-14T05:00:14.480Z"]');
    await expect(date).toHaveAttribute("data-time-zone", timezoneId!);
    await expect(date).toContainText(expected!);
    await expect(panel.getByRole("list", { name: /^Actividades de/ }).getByRole("listitem")).toHaveCount(8);
    await panel.locator("[data-panel-scroll]").evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(panel.getByText("Ya demostraste lo que aprendiste", { exact: true })).toBeVisible();
    await expect(panel.getByText(/^Vuelve a repasar/)).toBeVisible();
    await page.screenshot({ path: resolve(evidence, timezoneId === "America/Caracas" ? "horario-venezuela-430.png" : "horario-madrid-430.png") });
    await panel.getByRole("tab", { name: "Recursos", exact: true }).click();
    await expect(panel.getByText(/^Snapshot suministrado/)).not.toBeVisible();
    await expect(panel.getByRole("list", { name: "Secciones de lectura", exact: true }).getByRole("listitem")).toHaveCount(3);
    if (timezoneId === "America/Caracas") await page.screenshot({ path: resolve(evidence, "recursos-arterias-430.png") });
    await panel.getByText("Sobre esta fuente", { exact: true }).click();
    await expect(panel.getByText(/^Snapshot suministrado/)).toBeVisible();
    await context.close();
  }
});

test("subtle panel and tab animations respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(map);
  const dialog = page.getByRole("dialog", { name: "Detalle del mapa", exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  const activities = dialog.getByRole("tabpanel", { name: "Actividades", exact: true });
  expect(await activities.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await expect(dialog.locator('[data-current="true"]')).toBeInViewport();
});

for (const width of [320, 390, 768, 1440]) {
  test(`unit curriculum and fixed next action remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(map.replace("&unit=portal", ""));
    await page.getByRole("button", { name: "Abrir Sistema porta hepático", exact: true }).click();
    const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
    await expect(panel.getByRole("heading", { name: "Sistema porta hepático", exact: true })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Ordenar el flujo portal y relacionar su topografía" })).toBeVisible();
    await expect(panel.getByText("3 de 9 completadas", { exact: true })).toBeVisible();
    await expect(panel.locator('[data-current="true"]')).toHaveAttribute("aria-current", "step");
    await expect(panel.locator('[data-current="true"]')).toBeInViewport();
    await expect(panel.getByRole("list", { name: "Actividades de Ordenar el flujo portal y relacionar su topografía", exact: true }).getByRole("listitem")).toHaveCount(9);
    await expect(panel.locator('details summary').filter({ hasText: /actividades completadas/ })).toHaveCount(0);
    await expect(panel.locator("header").getByRole("link", { name: "Ver ruta completa" })).toBeVisible();
    await expect(panel.getByText("Ahora", { exact: true })).toHaveCount(0);
    await expect(panel.getByText("Pendiente", { exact: true })).toHaveCount(0);
    await expect(panel.getByText(/^Unidad \d+ de \d+$/)).toHaveCount(0);
    await expect(panel.getByText("Progreso de la ruta", { exact: true })).toHaveCount(0);
    await expect(panel.getByRole("img", { name: "Práctica visual", exact: true })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Relacionar la VCI con sus trayectos y tributarias" })).toHaveCount(0);
    const primary = panel.getByRole("button", { name: "Continuar actividad", exact: true });
    const mobileSheet = await page.getByRole("dialog", { name: "Detalle del mapa", exact: true }).count() > 0;
    await expect(primary).toBeVisible();
    const box = await primary.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    const progressBounds = await panel.getByRole("progressbar", { name: "Actividades completadas de esta unidad", exact: true }).boundingBox();
    const tabsBounds = await panel.getByRole("tablist", { name: "Contenido de la unidad", exact: true }).boundingBox();
    expect(Math.abs(progressBounds!.x - tabsBounds!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(progressBounds!.width - tabsBounds!.width)).toBeLessThanOrEqual(1);
    const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, panels: [...document.querySelectorAll('[role="tabpanel"]')].filter(el => !el.hasAttribute("hidden")).map(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth })) }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(width);
    expect(overflow.panels.every(panel => panel.scrollWidth <= panel.width)).toBe(true);
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: resolve(evidence, `unidad-${width}.png`) });
    await panel.getByRole("tab", { name: "Recursos", exact: true }).click();
    await expect(panel.getByText("Guía de vascularización abdominal", { exact: true })).toBeVisible();
    await expect(panel.getByText("Página 3", { exact: false })).toBeVisible();
    await expect(panel.getByText("Material sintético para validar la interfaz; no es una fuente clínica.", { exact: true })).toHaveCount(0);
    await expect(primary).toBeVisible();
    if (width === 390) await page.screenshot({ path: resolve(evidence, "recursos-390.png") });
    await panel.getByRole("button", { name: "Cerrar detalle" }).click();
    await expect(panel).toHaveCount(0);
    if (mobileSheet) await expect(page.getByRole("button", { name: "Abrir Sistema porta hepático", exact: true })).toBeFocused();
  });
}

test("route opens the recommended unit and tabs support keyboard and accessibility", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
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
  expect(errors).toEqual([]);
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
