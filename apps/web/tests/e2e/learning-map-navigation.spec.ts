import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const root = "/visual-fixtures/mapa";
const anatomy = "b1000000-0000-4000-8000-000000000001";

test("touch scrolling starts on a card and leaves the page and hierarchy still", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Native touch gesture in the mobile Chromium project.");
  await page.goto(root);
  const card = page.getByRole("button", { name: "Abrir Anatomía", exact: true });
  await expect(card).toBeVisible();
  const canvas = page.getByRole("region", { name: /Mapa del nivel/ });
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBe(0);
  const controls = page.getByLabel("Controles del mapa");
  for (const button of await controls.getByRole("button").all()) {
    const bounds = await button.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  const controlBox = await controls.boundingBox();
  const navBox = await page.getByRole("navigation", { name: "Navegación móvil" }).boundingBox();
  expect(controlBox!.y + controlBox!.height).toBeLessThanOrEqual(navBox!.y);
  const box = await card.boundingBox();
  const x = box!.x + box!.width / 2, y = box!.y + box!.height - 15;
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 15 }] });
    await page.waitForTimeout(16);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBeGreaterThan(60);
  expect(new URL(page.url()).searchParams.has("node")).toBe(false);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("back, list view and reload restore the zoom and scroll position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${root}?node=${anatomy}`);
  const canvas = page.getByRole("region", { name: "Mapa del nivel Anatomía" });
  await expect(page.getByRole("button", { name: "Abrir Tórax", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Acercar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restablecer zoom al 100 %" })).toContainText("110");
  await canvas.evaluate(el => { el.scrollTop = 300; });
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBe(300);
  await page.getByRole("button", { name: "Abrir Tórax", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tórax", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Atrás en el mapa" }).click();
  await expect(page.getByRole("heading", { name: "Anatomía", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restablecer zoom al 100 %" })).toContainText("110");
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBe(300);
  await page.getByRole("button", { name: "Vista de lista" }).click();
  await page.getByRole("button", { name: "Vista de mapa" }).click();
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBe(300);
  await page.reload();
  await expect(page.getByRole("button", { name: "Restablecer zoom al 100 %" })).toContainText("110");
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBe(300);
});

test("large maps keep first and last cards reachable with a bounded DOM", async ({ page }) => {
  await page.goto(`${root}?estado=large`);
  const canvas = page.getByRole("region", { name: /Mapa del nivel/ });
  await expect(page.getByRole("button", { name: "Abrir Contenido 1", exact: true })).toBeVisible();
  await expect.poll(() => page.locator(".react-flow__node article").count()).toBeLessThan(15);
  await canvas.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByRole("button", { name: "Abrir Contenido 200", exact: true })).toBeVisible();
  expect(await page.locator(".react-flow__node article").count()).toBeLessThan(15);
  await canvas.evaluate(el => { el.scrollTop = 0; });
  await expect(page.getByRole("button", { name: "Abrir Contenido 1", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.has("node")).toBe(false);
});

test("map and lesson details have no serious accessibility violations", async ({ page }, testInfo) => {
  for (const query of ["", `?node=${anatomy}&item=b1000000-0000-4000-8000-000000000022&unit=leccion-2`]) {
    await page.goto(`${root}${query}`);
    await expect(page.locator(".react-flow__node article").first()).toBeAttached();
    if (query) await expect(page.getByRole("heading", { name: "Corazón", exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).include('[aria-label="Mapa de aprendizaje"]').analyze();
    const violations = results.violations.filter(result => ["serious", "critical"].includes(result.impact ?? ""));
    await testInfo.attach(query ? "lesson-axe" : "map-axe", { body: JSON.stringify(results), contentType: "application/json" });
    expect(violations).toEqual([]);
  }
});

test("mouse dragging pans the background without opening a route", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse interaction on desktop.");
  await page.goto(`${root}?estado=large`);
  const canvas = page.getByRole("region", { name: /Mapa del nivel/ });
  await expect(page.locator(".react-flow__node article").first()).toBeVisible();
  const box = await canvas.boundingBox();
  const top = await canvas.evaluate(el => el.scrollTop);
  await page.mouse.move(box!.x + 10, box!.y + 300);
  await page.mouse.down();
  await page.mouse.move(box!.x + 10, box!.y + 100, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => canvas.evaluate(el => el.scrollTop)).toBeGreaterThan(top + 100);
  expect(new URL(page.url()).searchParams.has("node")).toBe(false);
});

test("v2 cards fit their signals and open the confirmed objective details", async ({ page }) => {
  await page.goto("/visual-fixtures/aprendizaje-v2?surface=map&estado=critical");
  for (let level = 0; level < 3; level++) {
    const cards = page.locator(".react-flow__node article");
    await expect(cards.first()).toBeVisible();
    await expect(page.locator('[data-phase="idle"]')).toBeAttached();
    expect(await cards.evaluateAll(elements => elements.every(el => {
      const card = el.getBoundingClientRect();
      return Array.from(el.querySelectorAll("[class*=cardContent] > span")).every(content => {
        const bounds = content.getBoundingClientRect();
        return bounds.bottom <= card.bottom + 1 && bounds.right <= card.right + 1;
      });
    }))).toBe(true);
    await cards.first().locator("[data-map-open]").click();
  }
  const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(/^Necesita refuerzo/).first()).toBeVisible();
  await expect(panel.getByRole("button", { name: "Reforzar", exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Cerrar detalle" })).toBeVisible();
});
