import { test, expect } from "@playwright/test";

const map = "/aprendizaje/mapa";
const studentCookie = {
  name: "map_e2e",
  value: "student",
  url: "http://localhost:3000",
};

test.describe("disposable API/SQL persistence", () => {
  test.skip(
    process.env.MAP_E2E_REAL !== "true",
    "Requires the isolated learning-map-server and API_BASE_URL=http://127.0.0.1:4100",
  );

  test("published routes are visible before enrollment and have no incoming root lines", async ({ page, context }) => {
    await context.addCookies([studentCookie]);
    await page.goto(map);
    const subject = page.getByRole("button", { name: "Abrir Tema E2E", exact: true });
    await expect(subject).toBeVisible();
    await expect(page.locator(".react-flow__edge")).toHaveCount(0);
    await subject.click();
    const route = page.getByRole("button", { name: "Abrir Bloque E2E", exact: true });
    await expect(route).toBeVisible();
    await expect(page.getByRole("button", { name: /nuevo nodo|crear nodo|agregar contenido/i })).toHaveCount(0);
    await route.click();
    await expect(page.getByRole("heading", { name: "Bloque E2E", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir Lección E2E 1", exact: true })).toBeVisible();
    await expect(page.locator(".react-flow__edge-connection")).toHaveCount(1);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Bloque E2E", exact: true })).toBeVisible();
  });

  test("published route is shared while spatial state stays account scoped", async ({ page, context }) => {
    await context.addCookies([studentCookie]);
    await page.goto(map);
    await page.getByRole("button", { name: "Abrir Tema E2E", exact: true }).click();
    await expect(page.getByRole("button", { name: "Abrir Bloque E2E", exact: true })).toBeVisible();
    await page.evaluate(() =>
      sessionStorage.setItem(
        "learning-map:v1:c1000000-0000-4000-8000-000000000001:corrupt",
        "{broken",
      ),
    );
    await context.addCookies([
      { name: "map_e2e", value: "other", url: "http://localhost:3000" },
    ]);
    await page.reload();
    await expect(page.getByRole("button", { name: "Abrir Bloque E2E", exact: true })).toBeVisible();
    expect(await page.evaluate(() =>
      Object.keys(sessionStorage).some((key) =>
        key.includes("c1000000-0000-4000-8000-000000000001"),
      ),
    )).toBe(false);
  });

  test("opens a published lesson, launches its guide and returns to the same place", async ({ page, context }) => {
    await context.addCookies([studentCookie]);
    await page.goto(map);
    await page.getByRole("button", { name: "Abrir Tema E2E", exact: true }).click();
    const route = page.getByRole("button", { name: "Abrir Bloque E2E", exact: true });
    await expect(route).toBeVisible();
    await route.click();
    const lesson = page.getByRole("button", { name: "Abrir Lección E2E 1", exact: true });
    await expect(lesson).toBeVisible();
    await lesson.click();
    const returnUrl = page.url();
    await page.getByRole("button", {
      name: /^(Comenzar lección|Comenzar actividad|Continuar actividad)$/,
    }).click();
    await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//, { timeout: 30_000 });
    await expect(page.getByText("Contenido sintético sin uso médico.")).toBeVisible();
    await page.getByRole("link", { name: "Mi mapa", exact: true }).click();
    await expect(page).toHaveURL(returnUrl);
    await expect(page.getByRole("heading", { name: "Lección E2E 1", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar lección", exact: true }).click();
    await page.getByRole("button", { name: "Atrás en el mapa", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tema E2E", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Atrás en el mapa", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Rutas de aprendizaje", exact: true })).toBeVisible();
  });
});
