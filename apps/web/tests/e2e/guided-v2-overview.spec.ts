import { test, expect } from "@playwright/test";

test("F05 mixed routes reconcile Inicio, Hoy and Progreso; account changes do not reuse summaries", async ({ page }, info) => {
  const actor = info.project.name === "mobile" ? "f03-mobile" : "f03-desktop";
  await page.context().addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const api = "http://127.0.0.1:41035";
  const headers = { cookie: `t035=${actor}` };
  const v1 = await (await page.request.get(api + "/v1/guided-learning/home", { headers })).json();
  const v2 = await (await page.request.get(api + "/v2/guided-learning/home", { headers })).json();
  const state = (await (await page.request.get(api + `/v2/guided-learning/enrollments/${v2.activePath.enrollmentId}/state`, { headers })).json()).state;
  const label = `${state.completedActivities} de ${state.plannedRequiredActivities} actividades obligatorias completadas`;
  await page.goto("/dashboard");
  await expect(page.getByText(v1.activePath.title, { exact: true }).first()).toBeVisible();
  const routes = page.getByRole("region", { name: "Mis rutas por objetivos" });
  await expect(routes.getByText(v2.activePath.title, { exact: true })).toBeVisible();
  await expect(routes.getByText(label, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath("inicio-mixto.png"), fullPage: true });
  await routes.getByRole("link", { name: "Abrir mi ruta" }).click();
  await expect(page).toHaveURL(new RegExp(`/aprendizaje/rutas/${v2.activePath.slug}`));
  await page.goto("/aprendizaje?tab=hoy");
  await expect(page.getByText(label, { exact: true })).toBeVisible();
  const continuation = page.getByRole("link", { name: "Continuar mi ruta" });
  await expect(continuation).toHaveAttribute("href", v1.activePath.continueHref);
  await page.goto("/aprendizaje?tab=progreso");
  await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.getByText("Puntos de aprendizaje", { exact: true })).toBeVisible();
  await page.context().addCookies([{ name: "t035", value: info.project.name === "mobile" ? "student-26" : "student-25", domain: "127.0.0.1", path: "/" }]);
  await page.reload();
  await expect(page.getByText("Todavía no hay avance que mostrar", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Progreso confirmado" }).getByText(v1.activePath.title, { exact: true })).toHaveCount(0);
});

test("F05 only-V2 enrollment appears on Inicio with a real route destination", async ({ page }, info) => {
  const actor = info.project.name === "mobile" ? "student-24" : "student-23";
  await page.context().addCookies([{ name: "t035", value: actor, domain: "127.0.0.1", path: "/" }]);
  const ready = await (await page.request.get("http://127.0.0.1:41035/__test/ready")).json();
  const enrolled = await page.request.post("/api/v2/guided-learning/enrollments", {
    headers: { "idempotency-key": crypto.randomUUID() }, data: { pathId: ready.fixtures.small.pathId },
  });
  expect(enrolled.status(), await enrolled.text()).toBe(200);
  await page.goto("/dashboard");
  await expect(page.getByText("Aprende con una ruta", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Mis rutas por objetivos" })).toBeVisible();
  await page.getByRole("link", { name: "Abrir mi ruta" }).click();
  await expect(page).toHaveURL(new RegExp(`/aprendizaje/rutas/${ready.fixtures.small.slug}`));
});
