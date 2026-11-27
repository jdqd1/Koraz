import { test, expect, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { installBrowserTiming, measureClick, type BrowserTiming } from "./learning-browser-timing";

const api = "http://127.0.0.1:41035";
async function actor(page: Page, name: string) {
  await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
}
type Trace = { method: string; path: string; status: number; durationMs: number; bytes: number; reference?: string; requestId?: string };
const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1]!;
const fault = (page: Page, value: string) => page.context().addCookies([{ name: "f07_fault", value, domain: "127.0.0.1", path: "/" }]);
const restore = (page: Page) => page.context().clearCookies({ name: "f07_fault" });

async function waitForClickHandler(control: Locator) {
  await expect.poll(() => control.evaluate(element => Object.entries(element).some(([key, props]) =>
    key.startsWith("__reactProps") && typeof (props as { onClick?: unknown })?.onClick === "function"))).toBe(true);
}

test("F07 keeps the answer, feedback and exit operable across priority sizes", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  await actor(page, info.project.name === "mobile" ? "student-27" : "student-26");
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  const enrollment = await page.request.post("/api/v2/guided-learning/enrollments", {
    data: { pathId: ready.fixtures.small.pathId }, headers: { "idempotency-key": crypto.randomUUID() },
  });
  expect(enrollment.status()).toBe(200);
  async function open(key: string) {
    await page.goto("/aprendizaje/rutas/t035-small?leccion=unit");
    const action = page.locator(`#actividad-${key}-1`).getByRole("button", { name: "Abrir actividad", exact: true });
    await expect(action).toBeEnabled();
    await waitForClickHandler(action);
    const start = performance.now();
    await action.click();
    await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
    return start;
  }
  const completed = page.getByRole("heading", { name: "Sesión completada", exact: true });
  async function closeSession() {
    const finish = page.getByRole("button", { name: "Finalizar sesión", exact: true });
    await expect(completed.or(finish).first()).toBeVisible();
    if (await finish.isVisible()) await finish.press("Enter");
    await expect(completed).toBeFocused();
  }
  for (const key of ["study", "constructed", "choice"]) {
    await open(key);
    if (key === "study") await page.getByRole("button", { name: "Guardar lectura" }).click();
    else {
      if (key === "constructed") {
        await page.getByLabel("Explica con tus palabras").fill("Una relación sintética.");
        await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
        await page.getByRole("button", { name: "Comparar con el modelo" }).click();
        await page.getByRole("button", { name: "Lo recuperé" }).click();
      } else {
        await page.getByRole("radio", { name: "Respuesta A", exact: true }).check();
        await page.getByRole("button", { name: "Comprobar respuesta", exact: true }).click();
      }
      await page.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).click();
    }
    await closeSession();
  }
  const start = await open("short");
  const field = page.getByRole("textbox", { name: "Tu respuesta", exact: true });
  await expect(field).toBeEnabled();
  const launchMs = performance.now() - start;
  const submit = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
  const sizes = [[320, 740], [360, 800], [390, 844], [430, 932], [844, 390], [390, 420], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
  const original = page.viewportSize()!;
  const geometry = [];
  for (const [width, height] of sizes as [number, number][]) {
    await page.setViewportSize({ width, height });
    await field.focus();
    await field.fill("respuesta");
    await field.press("Tab");
    await expect(page.getByRole("button", { name: "Necesito ayuda" })).toBeFocused();
    await submit.scrollIntoViewIfNeeded();
    const result = await submit.evaluate(el => {
      const b = el.getBoundingClientRect(), hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { width: innerWidth, height: innerHeight, targetHeight: b.height, reachable: el.contains(hit),
        overflows: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
    });
    expect(result, `${width}×${height}`).toMatchObject({ reachable: true, overflows: false });
    expect(result.targetHeight).toBeGreaterThanOrEqual(44);
    geometry.push(result);
    if (width === 320) await page.screenshot({ path: info.outputPath("respuesta-320.png") });
  }
  await page.setViewportSize(original);
  const feedbackStart = performance.now();
  if (info.project.name === "mobile") await submit.tap();
  else { await submit.focus(); await submit.press("Enter"); }
  const feedback = page.getByRole("heading", { name: "Respuesta correcta", exact: true });
  await expect(feedback).toBeFocused();
  const responseMs = performance.now() - feedbackStart;
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations;
  await writeFile(info.outputPath("answer-geometry.json"), JSON.stringify({ geometry, launchMs, responseMs, violations: violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })) }, null, 2));
  expect(violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
  await page.getByRole("button", { name: "Continuar", exact: true }).press("Enter");
  await closeSession();
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().press("Enter");
  await expect(page.locator("#actividad-short-1")).toBeFocused();
  await expect(page.getByText("4 de 9 actividades obligatorias completadas", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Todas las rutas", exact: true }).click();
  await expect(page.getByRole("link", { name: "Abrir ruta Ruta T035 pequeña", exact: true })).toContainText("4 de 9 actividades obligatorias completadas");
});

test("F07 preserves resource section, attempt and catalog context across temporary failures", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  const actorName = `f06-${info.project.name}`;
  await actor(page, actorName);
  const route = "/aprendizaje/rutas/simulacion-f06";
  const counts = async () => (await (await page.request.get(api + "/__test/counts")).json());
  const before = await counts();
  await fault(page, "catalog");
  await page.goto("/aprendizaje?tab=rutas");
  const failure = page.getByRole("alert").filter({ hasText: "No pudimos cargar tus rutas de práctica por objetivos" });
  await expect(failure).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir ruta Simulación de navegación F06" })).toBeVisible();
  await restore(page);
  await failure.getByRole("link", { name: "Reintentar" }).click();
  await expect(failure).toHaveCount(0);
  await expect(page).toHaveURL(/tab=rutas/);
  await page.goto(`${route}?leccion=lectura&pestana=resources`);
  await page.getByRole("link", { name: "Consultar Lectura con seguimiento" }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page).toHaveURL(/seccion=1/);
  const readerUrl = page.url();
  await fault(page, "resource");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Lectura no disponible" })).toBeVisible();
  await restore(page);
  await page.getByRole("link", { name: "Reintentar lectura" }).click();
  await expect(page.getByText("La letra B sigue a A.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(readerUrl);
  expect(await counts()).toEqual(before);
  await page.getByRole("link", { name: "Volver a los recursos de la unidad" }).click();
  await page.getByRole("tab", { name: "Recursos" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "Actividades" })).toBeFocused();
  await fault(page, "progress");
  await page.reload();
  await expect(page.getByRole("heading", { name: "No pudimos cargar tu progreso" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Lectura con seguimiento/ })).toHaveCount(0);
  await restore(page);
  await page.getByRole("link", { name: "Reintentar progreso" }).click();
  const guideAction = page.getByRole("button", { name: /Lectura con seguimiento/ });
  await waitForClickHandler(guideAction);
  await guideAction.click();
  await expect(page.getByRole("button", { name: "Siguiente", exact: true })).toBeVisible();
  const sessionUrl = page.url();
  const open = await counts();
  await fault(page, "attempt");
  await page.reload();
  await expect(page.getByRole("heading", { name: "No pudimos recuperar la sesión" })).toBeVisible();
  await restore(page);
  await page.getByRole("link", { name: "Reintentar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Siguiente", exact: true })).toBeVisible();
  await expect(page).toHaveURL(sessionUrl);
  expect(await counts()).toEqual(open);
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await expect(page.locator('[id^="actividad-"]:focus')).toHaveCount(1);
});

test("F10 recovers a route read after identity is available", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  await actor(page, "f06-" + info.project.name);
  const route = "/aprendizaje/rutas/t035-small?leccion=unit&actividad=study-1&pestana=resources#actividad-study-1";
  await fault(page, "path");
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "No pudimos abrir esta ruta" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Koraz volverá a intentar" })).toBeVisible();
  await restore(page);
  await expect(page.getByRole("tab", { name: "Recursos", selected: true })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Recursos" })).toBeVisible();
  await expect(page).toHaveURL(new URL(route, "http://127.0.0.1:31035").toString());
});

test("F07 correlates the retry and preserves the deep link on expired identity", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  const name = info.project.name === "mobile" ? "student-36" : "student-35";
  await actor(page, name);
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  const enrolled = await page.request.post("/api/v2/guided-learning/enrollments", {
    data: { pathId: ready.fixtures.small.pathId }, headers: { "idempotency-key": crypto.randomUUID() },
  });
  expect(enrolled.status()).toBe(200);
  await fault(page, "identity-once");
  const path = "/aprendizaje/rutas/t035-small?leccion=unit&pestana=resources";
  await page.goto(path);
  await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  const trace: Trace[] = await (await page.request.get(`${api}/__test/trace/${name}`)).json();
  const identity = trace.filter(item => item.path === "/v1/auth/me");
  expect(identity.slice(0, 2).map(item => item.status)).toEqual([503, 200]);
  expect(identity[0]?.reference).toBeTruthy();
  expect(identity[0]?.reference).toBe(identity[1]?.reference);
  expect(identity[0]?.requestId).not.toBe(identity[1]?.requestId);
  await restore(page);
  await fault(page, "state");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Estado por confirmar" })).toBeVisible();
  await restore(page);
  await page.getByRole("link", { name: "Reintentar estado" }).click();
  await expect(page.getByRole("region", { name: "Tu progreso", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  await page.context().clearCookies({ name: "t035" });
  await page.reload();
  await expect(page).toHaveURL(/\/acceder\?error=sesion/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(path);
  await actor(page, name);
  await page.goto(path);
  await expect(page.getByRole("tab", { name: "Recursos" })).toBeFocused();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  await info.attach("axe-route.json", { body: JSON.stringify(results.violations), contentType: "application/json" });
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
});

test("F07 recovers identity on the same page and stops automatic retries after four attempts", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  await actor(page, info.project.name === "mobile" ? "student-36" : "student-35");
  await page.clock.install({ time: new Date("2026-10-04T12:00:00Z") });
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  const enrollment = await page.request.post("/api/v2/guided-learning/enrollments", {
    data: { pathId: ready.fixtures.small.pathId }, headers: { "idempotency-key": crypto.randomUUID() },
  });
  expect(enrollment.status()).toBe(200);
  const path = "/aprendizaje/rutas/t035-small?leccion=unit&pestana=resources";
  const failed = page.getByRole("heading", { name: "No pudimos verificar tu sesión" });
  const retry = page.getByRole("link", { name: "Reintentar", exact: true });
  const automatic = page.getByRole("status").filter({ hasText: "Koraz volverá a intentar" });
  const reference = page.getByText(/^Referencia: [\w-]+$/);
  const outage = (value: "timeout" | "service") =>
    page.context().addCookies([{ name: "f02_access", value, domain: "127.0.0.1", path: "/" }]);
  const recover = () => page.context().clearCookies({ name: "f02_access" });
  const counts = async () => (await (await page.request.get(`${api}/__test/counts`)).json());
  const before = await counts();

  await outage("timeout");
  await page.goto(path);
  await expect(failed).toBeVisible();
  await expect(page.getByText(/El servidor tardó demasiado/)).toBeVisible();
  await expect(automatic).toBeVisible();
  await recover();
  await page.clock.fastForward(4_000);
  await expect(failed).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(path);

  await page.waitForLoadState("networkidle");
  await outage("service");
  const prefetched: string[] = [];
  page.on("request", request => {
    if (request.headers()["next-router-prefetch"]) prefetched.push(new URL(request.url()).pathname);
  });
  await page.reload();
  await expect(failed).toBeVisible();
  let previousReference = await reference.textContent();
  for (const delay of [4_000, 8_000, 16_000, 32_000]) {
    await page.clock.fastForward(delay);
    await expect(reference).not.toHaveText(previousReference!);
    previousReference = await reference.textContent();
  }
  await expect(automatic).toHaveCount(0);
  await page.clock.fastForward(60_000);
  await expect(reference).toHaveText(previousReference!);
  await expect(retry).toBeVisible();
  expect(prefetched).toEqual([]);
  await recover();
  await retry.click();
  await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  expect(await counts()).toEqual(before);
});

test("F07 measures cold and warm catalog navigation with request and payload budgets", async ({ page }, info) => {
  await installBrowserTiming(page);
  const name = info.project.name === "mobile" ? "student-38" : "student-37";
  await actor(page, name);
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  for (const key of ["small", "admission", "large"]) {
    const response = await page.request.post("/api/v2/guided-learning/enrollments", {
      data: { pathId: ready.fixtures[key].pathId }, headers: { "idempotency-key": crypto.randomUUID() },
    });
    expect(response.status()).toBe(200);
  }
  const samples: { mode: "cold" | "warm"; usableMs: number; bytes: number; trace: Trace[]; timing?: BrowserTiming; browserRequests: { path: string; type: string; prefetch: boolean; startMs: number; responseMs?: number; endMs?: number; failure?: string }[] }[] = [];
  for (const mode of ["cold", "warm"] as const) {
    for (let n = 0; n < (mode === "warm" && process.env.F07_BASELINE !== "true" ? 30 : 12); n++) {
      if (mode === "warm") {
        await page.goto("/aprendizaje?tab=hoy");
        await waitForClickHandler(page.getByRole("navigation", { name: "Secciones de Aprendizaje guiado" }).getByRole("link", { name: "Rutas", exact: true }));
      }
      await page.request.post(`${api}/__test/trace/${name}`, { data: {} });
      const started = performance.now();
      const browserRequests: typeof samples[number]["browserRequests"] = [];
      const requests = new Map<import("@playwright/test").Request, typeof browserRequests[number]>();
      const requested = (request: import("@playwright/test").Request) => {
        const url = new URL(request.url()); url.searchParams.delete("_rsc");
        const entry = { path: url.pathname + url.search, type: request.resourceType(), prefetch: request.headers()["next-router-prefetch"] === "1", startMs: performance.now() - started };
        browserRequests.push(entry); requests.set(request, entry);
      };
      const finished = (request: import("@playwright/test").Request) => { const entry = requests.get(request); if (entry) entry.endMs = performance.now() - started; };
      const responded = (response: import("@playwright/test").Response) => { const entry = requests.get(response.request()); if (entry) entry.responseMs = performance.now() - started; };
      const failed = (request: import("@playwright/test").Request) => { const entry = requests.get(request); if (entry) { entry.endMs = performance.now() - started; entry.failure = request.failure()?.errorText; } };
      page.on("request", requested); page.on("requestfinished", finished); page.on("response", responded); page.on("requestfailed", failed);
      let timing: BrowserTiming | undefined;
      if (mode === "cold") await page.goto("/aprendizaje?tab=rutas");
      else timing = await measureClick(page, page.getByRole("navigation", { name: "Secciones de Aprendizaje guiado" }).getByRole("link", { name: "Rutas", exact: true }), 'section[aria-labelledby="learning-routes-title"] a[href="/aprendizaje/rutas/t035-small"]');
      await expect(page.getByRole("heading", { name: "Rutas disponibles", exact: true })).toBeVisible();
      await expect(page.locator('a[href="/aprendizaje/rutas/t035-small"]').first()).toBeVisible();
      const usableMs = performance.now() - started;
      await page.waitForLoadState("networkidle");
      page.off("request", requested); page.off("requestfinished", finished); page.off("response", responded); page.off("requestfailed", failed);
      const trace: Trace[] = await (await page.request.get(`${api}/__test/trace/${name}`)).json();
      samples.push({ mode, usableMs, bytes: trace.reduce((sum, item) => sum + item.bytes, 0), trace, timing, browserRequests });
    }
  }
  const measurements = info.outputPath("catalog-measurements.json");
  await writeFile(measurements, JSON.stringify({ samples, summary: ["cold", "warm"].map(mode => ({ mode,
    p75: percentile(samples.filter(s => s.mode === mode).map(s => s.usableMs), .75),
    p95: percentile(samples.filter(s => s.mode === mode).map(s => s.usableMs), .95),
  })) }, null, 2));
  await info.attach("catalog-measurements.json", { path: measurements, contentType: "application/json" });
  if (process.env.F07_BASELINE !== "true") {
    for (const sample of samples.filter(s => s.mode === "cold")) {
      expect(sample.trace.filter(t => /\/enrollments\/[^/]+\/state$/.test(t.path))).toHaveLength(0);
      expect(sample.trace.filter(t => t.path === "/v2/guided-learning/paths?limit=20&includeState=true")).toHaveLength(1);
      expect(sample.trace.filter(t => /^\/v[12]\/guided-learning\/home$/.test(t.path))).toHaveLength(0);
    }
    const detailSamples = [];
    for (const mode of ["cold", "warm"] as const) {
      for (let n = 0; n < (mode === "cold" ? 12 : 30); n++) {
        if (mode === "warm") {
          await page.goto("/aprendizaje?tab=rutas");
          await waitForClickHandler(page.getByRole("link", { name: "Abrir ruta Ruta T035 pequeña", exact: true }));
        }
        const started = performance.now();
        if (mode === "cold") await page.goto("/aprendizaje/rutas/t035-small");
        else await page.getByRole("link", { name: "Abrir ruta Ruta T035 pequeña", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
        await expect(page.locator("#leccion-unit:visible")).toHaveAttribute("open", "");
        await expect(page.getByRole("region", { name: "Acción recomendada" }).getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
        detailSamples.push({ mode, usableMs: performance.now() - started });
      }
    }
    await writeFile(info.outputPath("detail-measurements.json"), JSON.stringify({ browser: page.context().browser()?.version(), viewport: page.viewportSize(), detailSamples }, null, 2));
  }
});

test("F07 measures map panel with fresh and cached data", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  const token = `f06-${info.project.name}`;
  await actor(page, token);
  await installBrowserTiming(page);
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  const pathId = ready.fixtures.navigation.pathId;
  const mapHref = `/aprendizaje/mapa?node=${pathId}&item=${pathId}`;
  expect((await page.request.post(`${api}/__test/map/${token}`, { data: {} })).ok()).toBe(true);

  const panels: { mode: string; ms: number; timing: BrowserTiming }[] = [];
  for (const mode of ["cold", "warm"] as const) {
    for (let index = 0; index < (mode === "cold" ? 10 : 30); index++) {
      if (mode === "cold" || index === 0) await page.goto(mapHref);
      const node = page.getByRole("button", { name: "Abrir Lectura y comprobación", exact: true });
      await expect(node).toBeVisible();
      const panel = page.getByRole("complementary", { name: "Lección Lectura y comprobación", exact: true });
      const start = performance.now();
      const timing = await measureClick(page, node, 'aside[aria-label="Lección Lectura y comprobación"] a', "Abrir ruta");
      await expect(panel.getByRole("link", { name: "Abrir ruta", exact: true })).toBeVisible();
      panels.push({ mode, ms: performance.now() - start, timing });
      await panel.getByRole("button", { name: "Cerrar lección", exact: true }).click();
      await expect(panel).toHaveCount(0);
    }
  }
  await writeFile(info.outputPath("panel-measurements.json"), JSON.stringify(panels, null, 2));
});

test("F07 measures V1 activity launch and confirmed submission", async ({ page }, info) => {
  test.skip(process.env.F07_BASELINE === "true");
  test.setTimeout(360_000);
  await actor(page, `f06-${info.project.name}`);
  await installBrowserTiming(page);
  const routeHref = "/aprendizaje/rutas/simulacion-f06?leccion=lectura";
  const samples: { mode: string; launchMs: number; confirmationMs: number; visualMs: number; launchTiming: BrowserTiming; resumeTiming: BrowserTiming; confirmationTiming: BrowserTiming }[] = [];
  const counts = async () => (await (await page.request.get(`${api}/__test/counts`)).json()) as { learning_responses: number; learning_attempts: number };
  const before = await counts();
  let firstResult: string | undefined;
  for (const mode of ["cold", "warm"] as const) {
    for (let index = 0; index < (mode === "cold" ? 10 : 30); index++) {
      if (mode === "cold" || index === 0) await page.goto(routeHref);
      const action = page.getByRole("button", { name: /Cuestionario con seguimiento/ });
      await waitForClickHandler(action);
      await action.scrollIntoViewIfNeeded();
      const launch = performance.now();
      const launchTiming = await measureClick(page, action, 'input[type="radio"]');
      const radio = page.getByRole("radio", { name: "A", exact: true });
      await expect(radio).toBeEnabled();
      const launchMs = performance.now() - launch;
      const sessionUrl = page.url();
      await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
      const resume = page.getByRole("button", { name: /Cuestionario con seguimiento/ });
      await waitForClickHandler(resume);
      await expect(resume).toContainText("Retomar actividad");
      if (firstResult) {
        const result = resume.locator("xpath=ancestor::li[1]").getByRole("link", { name: "Consultar resultado" });
        await expect(result).toHaveAttribute("href", new RegExp(new URL(firstResult).pathname));
      }
      const openCounts = await counts();
      const resumeTiming = await measureClick(page, resume, 'input[type="radio"]');
      await expect(page).toHaveURL(sessionUrl);
      expect(await counts()).toEqual(openCounts);
      await radio.check();
      const submit = page.getByRole("button", { name: "Comprobar", exact: true });
      await waitForClickHandler(submit);
      await submit.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        delete document.documentElement.dataset.f07ActivationMs;
        const observeClick = (event: MouseEvent) => {
          const button = (event.target as Element).closest("button");
          if (button?.textContent?.trim() !== "Comprobar") return;
          document.removeEventListener("click", observeClick, true);
          const start = performance.now();
          const observer = new MutationObserver(() => {
            if (button.isConnected && !button.disabled && button.textContent?.trim() === "Comprobar") return;
            observer.disconnect();
            document.documentElement.dataset.f07ActivationMs = String(performance.now() - start);
          });
          observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
        };
        document.addEventListener("click", observeClick, true);
      });
      const sent = performance.now();
      const confirmationTiming = await measureClick(page, submit, 'button', "Ver resultado");
      const finish = page.getByRole("button", { name: "Ver resultado", exact: true });
      await expect(finish).toBeVisible();
      const confirmationMs = performance.now() - sent;
      const readVisualTime = () => page.evaluate(() => document.documentElement.dataset.f07ActivationMs);
      await expect.poll(readVisualTime).toBeDefined();
      samples.push({ mode, launchMs, confirmationMs, visualMs: Number(await readVisualTime()), launchTiming, resumeTiming, confirmationTiming });
      await finish.click();
      await expect(page.getByRole("heading", { name: "Actividad completada", exact: true })).toBeVisible();
      firstResult ??= sessionUrl;
      await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
      await expect(action).toBeVisible();
    }
  }
  const after = await counts();
  expect(after.learning_attempts - before.learning_attempts).toBe(samples.length);
  expect(after.learning_responses - before.learning_responses).toBe(samples.length);
  await writeFile(info.outputPath("interaction-measurements.json"), JSON.stringify(samples, null, 2));
});
