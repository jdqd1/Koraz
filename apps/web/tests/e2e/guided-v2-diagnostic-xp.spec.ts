import { test, expect } from "@playwright/test";
import type { V2AttemptManifest } from "@cediah/contracts";

for (const passed of [true, false]) test(`XP enable a diagnostic; ${passed ? "passing opens the chosen objective" : "failing preserves prerequisites"}`, async ({ page, request }, info) => {
  const actor = `xp-${passed ? "success" : "failure"}${info.project.name === "mobile" ? "-mobile" : ""}`;
  await page.context().addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const ready = await (await request.get("http://127.0.0.1:41035/__test/ready")).json();
  await page.goto("/aprendizaje/rutas/xp-admission");
  const begin = page.getByRole("button", { name: "Comenzar", exact: true });
  await expect(begin).toBeVisible();
  await expect.poll(() => begin.evaluate(element => Object.keys(element).some(key => key.startsWith("__reactProps")
    && typeof (element as unknown as Record<string, { onClick?: unknown }>)[key]?.onClick === "function"))).toBe(true);
  const enrollment = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/v2/guided-learning/enrollments");
  await begin.click();
  expect((await enrollment).status()).toBe(200);
  const points = page.getByRole("region", { name: "Puntos de aprendizaje" });
  await expect(points.getByText("50 XP", { exact: true })).toBeVisible();
  const objective = page.getByRole("region", { name: "Objetivo: Aplicar el ejemplo 2", exact: true });
  const diagnostic = objective.getByRole("button", { name: "Hacer diagnóstico para avanzar", exact: true });
  {
    const creation = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/v2/guided-learning/attempts");
    await diagnostic.click();
    let attempt: V2AttemptManifest = (await (await creation).json()).attempt;
    await expect(page.getByRole("heading", { name: "Diagnóstico para avanzar", exact: true })).toBeVisible();
    let answered = 0;
    while (attempt.activeActivity) {
      const activity = attempt.activeActivity;
      await expect(page.getByRole("heading", { name: activity.prompt, exact: true })).toBeVisible();
      if (activity.kind === "single_choice") await page.getByRole("radio", { name: !passed && answered === 0 ? "Respuesta B" : "Respuesta A", exact: true }).check();
      else if (activity.kind === "match") await page.getByRole("combobox", { name: "Origen", exact: true }).selectOption("c");
      else if (activity.kind === "short_answer") await page.getByRole("textbox", { name: "Tu respuesta", exact: true }).fill("respuesta");
      else throw new Error(`Unexpected fixture activity: ${activity.kind}`);
      const receipt = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith(`/attempts/${attempt.attemptId}/responses`));
      await page.getByRole("button", { name: activity.kind === "match" ? "Comprobar relaciones" : "Comprobar respuesta", exact: true }).click();
      const response = await receipt;
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.feedback.score01).toBeNull();
      expect(result.feedback.explanation).toBe("");
      attempt = result.attempt;
      answered++;
      await expect(page.getByRole("heading", { name: "Respuesta correcta", exact: true })).not.toBeVisible();
    }
    expect(answered).toBe(3);
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
