import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("F03: two cards, failed singleton, reload and due-time boundaries", async ({ page, context, request }, info) => {
  const actor = `f03-${info.project.name}`;
  await context.addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const advance = async (milliseconds: number) => {
    const result = await request.post("http://127.0.0.1:41035/__test/clock", { data: { milliseconds } });
    expect(result.ok()).toBe(true);
  };
  await page.goto("/aprendizaje/repaso?minutos=5");
  await expect(page.getByRole("heading", { name: "Repasos pendientes", exact: true })).toBeVisible();
  await expect(page.getByText("2 ítems pendientes: preguntas o tarjetas.")).toBeVisible();
  const retention = page.getByRole("region", { name: "Repasos de Simulación de actualización", exact: true });
  await expect(retention.locator("dl > div").filter({ hasText: "Mantenimiento" })).toContainText("1 objetivo pendiente");
  await expect(retention.locator("dl > div").filter({ hasText: "Evaluación a 7 días" })).toContainText("1 objetivo pendiente");
  await expect(retention.locator("dl > div").filter({ hasText: "Evaluación a 30 días" })).toContainText("0 objetivos pendientes");
  await page.getByRole("button", { name: "Comenzar · unos 5 min" }).click();
  await expect(page.getByText("Ítem 1 de 2", { exact: true })).toBeVisible();
  const sessionUrl = page.url();
  // Reopening the center must offer the same frozen attempt.
  await page.goto("/aprendizaje/repaso");
  await expect(page.getByRole("link", { name: "Retomar repaso", exact: true })).toHaveAttribute("href", new URL(sessionUrl).pathname);
  await expect(page.getByRole("button", { name: /Comenzar ·/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Retomar repaso", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar respuesta", exact: true }).click();
  await page.getByRole("button", { name: "No la recordé", exact: true }).click();
  await expect(page.getByText("Próximo repaso:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByText("Ítem 2 de 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mostrar respuesta", exact: true }).click();
  await page.getByRole("button", { name: "La recordé", exact: true }).click();
  await page.getByRole("button", { name: "Ver resumen", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Repaso completado", exact: true })).toBeVisible();
  const dates = await page.getByRole("region", { name: "Fechas de repaso guardadas" }).locator("time").evaluateAll(items => items.map(item => item.getAttribute("datetime")));
  expect(dates).toHaveLength(2);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Repaso completado", exact: true })).toBeVisible();
  expect(await page.getByRole("region", { name: "Fechas de repaso guardadas" }).locator("time").evaluateAll(items => items.map(item => item.getAttribute("datetime")))).toEqual(dates);
  await page.getByRole("link", { name: "Ver repasos pendientes", exact: true }).click();
  await expect(page.getByText("0 ítems pendientes: preguntas o tarjetas.")).toBeVisible();
  for (const retry of [1, 2]) {
    await advance(599_999);
    await page.getByRole("button", { name: "Actualizar repasos", exact: true }).click();
    await expect(page.getByText("0 ítems pendientes: preguntas o tarjetas.")).toBeVisible();
    await advance(1);
    await page.getByRole("button", { name: "Actualizar repasos", exact: true }).click();
    await expect(page.getByText("1 ítem pendiente: preguntas o tarjetas.")).toBeVisible();
    await page.getByRole("button", { name: /Comenzar ·/ }).click();
    await expect(page.getByText("Ítem 1 de 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "No la recordé", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Mostrar respuesta", exact: true }).click();
    await page.getByRole("button", { name: "No la recordé", exact: true }).click();
    await page.getByRole("button", { name: "Ver resumen", exact: true }).click();
    const next = await page.getByRole("region", { name: "Fechas de repaso guardadas" }).locator("time").getAttribute("datetime");
    const now = (await (await request.get("http://127.0.0.1:41035/__test/ready")).json()).now;
    expect(Date.parse(next!) - Date.parse(now)).toBe(retry === 1 ? 600_000 : 86_400_000);
    await page.getByRole("link", { name: "Ver repasos pendientes", exact: true }).click();
  }
  await advance(600_000);
  await page.reload();
  await expect(page.getByText("0 ítems pendientes: preguntas o tarjetas.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continuar aprendiendo", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("centro-repaso.png"), fullPage: true });
});

test("F03: multiple objective routes preserve the open-session priority", async ({ page, context, request }, info) => {
  const actor = `f03-${info.project.name}`;
  await context.addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const ready = await (await request.get("http://127.0.0.1:41035/__test/ready")).json();
  const post = async (path: string, data: unknown) => {
    const response = await request.post(`http://127.0.0.1:41035/v2/guided-learning/${path}`, {
      headers: { Cookie: `t035=${actor}`, "Idempotency-Key": randomUUID() }, data,
    });
    expect(response.status(), await response.text()).toBe(200);
    return response.json();
  };
  const first = await post("enrollments", { pathId: ready.fixtures.small.pathId });
  await post("enrollments", { pathId: ready.fixtures.upgrade.pathId });
  const started = await post("attempts", { enrollmentId: first.state.enrollmentId, expectedEnrollmentVersion: first.state.rowVersion,
    clientAttemptId: randomUUID(), target: { kind: "activity", key: "study-1" } });
  await page.goto("/aprendizaje/repaso");
  const block = page.getByRole("region", { name: "Repasos de Ruta T035 pequeña", exact: true });
  await expect(block.getByRole("heading", { name: "Retoma tu sesión abierta", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Repasos de Simulación de actualización", exact: true })).toBeVisible();
  await expect(block.getByRole("button", { name: "Continuar", exact: true })).toBeVisible();
  await block.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/aprendizaje/sesiones/${started.attempt.attemptId}$`));
  await page.getByRole("button", { name: "Guardar lectura", exact: true }).click();
  await page.getByRole("button", { name: "Finalizar sesión", exact: true }).click();
  await page.getByRole("link", { name: "Ver repasos pendientes", exact: true }).click();
  await expect(block.getByRole("heading", { name: "Siguiente paso recomendado", exact: true })).toBeVisible();
  await expect(block.getByRole("heading", { name: "Retoma tu sesión abierta", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(block.getByRole("heading", { name: "Siguiente paso recomendado", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("rutas-repaso.png"), fullPage: true });
});
