import { test, expect } from "@playwright/test";

for (const passed of [true, false]) test(`XP enable a diagnostic; ${passed ? "passing opens the chosen objective" : "failing preserves prerequisites"}`, async ({ page, request }, info) => {
  const actor = `xp-${passed ? "success" : "failure"}${info.project.name === "mobile" ? "-mobile" : ""}`;
  await page.context().addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const ready = await (await request.get("http://127.0.0.1:41035/__test/ready")).json();
  await page.goto("/aprendizaje/rutas/xp-admission");
  const begin = page.getByRole("button", { name: "Comenzar", exact: true });
  if (await begin.isVisible()) {
    await expect.poll(() => begin.evaluate(element => Object.keys(element).some(key => key.startsWith("__reactProps")
      && typeof (element as unknown as Record<string, { onClick?: unknown }>)[key]?.onClick === "function"))).toBe(true);
    await begin.click();
  }
  const points = page.getByRole("region", { name: "Puntos de aprendizaje" });
  await expect(points.getByText("50 XP", { exact: true })).toBeVisible();
  const objective = page.getByRole("region", { name: "Objetivo: Aplicar el ejemplo 2", exact: true });
  const diagnostic = objective.getByRole("button", { name: "Hacer diagnóstico para avanzar", exact: true });
  {
    await diagnostic.click();
    await expect(page.getByRole("heading", { name: "Diagnóstico para avanzar", exact: true })).toBeVisible();
    await page.getByRole("radio", { name: passed ? "Respuesta A" : "Respuesta B", exact: true }).check();
    await page.getByRole("button", { name: "Comprobar respuesta", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Respuesta correcta", exact: true })).not.toBeVisible();
    await page.getByRole("button", { name: "Finalizar sesión", exact: true }).click();
    await expect(page.getByRole("heading", { name: passed ? "Puedes avanzar a tu objetivo" : "Refuerza los conocimientos previos", exact: true })).toBeVisible();
    await expect(page.getByText("Ganaste 0 XP · Total: 50 XP", { exact: true })).toBeVisible();
    if (passed) {
      await page.getByRole("button", { name: "Siguiente actividad", exact: true }).click();
      await expect(page.getByRole("heading", { name: "study-2: actividad sintética", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Continuar a la práctica", exact: true }).click();
      await page.getByRole("button", { name: "Finalizar sesión", exact: true }).click();
    }
    await page.goto("/aprendizaje/rutas/xp-admission");
  }
  const path = await (await page.request.get("/api/v2/guided-learning/paths/xp-admission")).json();
  expect(path.path.pathId).toBe(ready.fixtures.admission.pathId);
  const state = (await (await page.request.get(`/api/v2/guided-learning/enrollments/${path.path.enrollmentId}/state`)).json()).state;
  expect(state.masteredAt).toBeNull(); expect(state.consolidatedAt).toBeNull();
  expect(state.objectives.every((item: { objectiveScore: number | null }) => item.objectiveScore === null)).toBe(true);
  expect(state.motivation.totalXp).toBe(50);
  expect(state.completedActivities).toBe(passed ? 1 : 0);
  expect(state.maintenance.blockers.some((item: { objectiveKey: string }) => item.objectiveKey === "objective-2")).toBe(!passed);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
