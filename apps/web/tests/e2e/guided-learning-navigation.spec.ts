import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type { LearningAttempt, LearningEnrollmentProgress } from "@cediah/contracts";
const api = "http://127.0.0.1:41035";
async function actor(page: Page, token: string) {
  await page.context().addCookies([{ name: "t035", value: token, domain: "127.0.0.1", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
}

test("F09 V1 and V2 show the active unit on the initial route screen", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const viewport = page.viewportSize()!;
  const v2Actor = info.project.name === "mobile" ? "student-33" : "student-32";
  await actor(page, v2Actor);
  const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  const enrollment = await page.request.post("/api/v2/guided-learning/enrollments", {
    data: { pathId: ready.fixtures.small.pathId },
    headers: { "idempotency-key": crypto.randomUUID() },
  });
  expect(enrollment.ok()).toBe(true);

  const measurements = [];
  for (const route of [
    { engine: "guided-v1", slug: "simulacion-f06", title: "Simulación de navegación F06", unit: "lectura", token: `f06-${info.project.name}`, fault: "progress", retry: "Reintentar progreso" },
    { engine: "guided-v2", slug: "t035-small", title: "Ruta T035 pequeña", unit: "unit", token: v2Actor, fault: "state", retry: "Reintentar estado" },
  ]) {
    await actor(page, route.token);
    await page.goto(`/aprendizaje/rutas/${route.slug}?leccion=${route.unit}`);
    const detail = page.locator(`article[data-engine-version="${route.engine}"]:visible`);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveText(route.title);
    await expect(detail.getByRole("region", { name: "Acción recomendada" })).toBeVisible();
    const progress = detail.getByRole("region", { name: "Tu progreso" });
    await expect(progress).toBeVisible();
    await expect(detail.getByRole("tab", { name: "Actividades" })).toHaveAttribute("aria-selected", "true");
    const unit = detail.locator(`#leccion-${route.unit}`);
    await expect(unit).toHaveAttribute("open", "");
    const summary = unit.locator(":scope > summary");
    await expect(summary).toBeFocused();
    await detail.locator("header img").evaluate(image => (image as HTMLImageElement).decode());
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise(requestAnimationFrame);
    });
    const dimensions = await summary.evaluate(element => {
      const navigation = document.querySelector('nav[aria-label="Navegación móvil"]');
      return {
        unitHeadingBottom: Math.round(element.getBoundingClientRect().bottom + window.scrollY),
        usableBottom: navigation?.getClientRects().length
          ? Math.min(window.innerHeight, navigation.getBoundingClientRect().top)
          : window.innerHeight,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    await page.screenshot({ path: info.outputPath(`f09-${route.engine}.png`), scale: "css" });
    const twoLineTitleUnitBottom = info.project.name === "mobile" ? await summary.evaluate(element => {
      const title = element.closest("article")!.querySelector("h1")!;
      const original = title.textContent;
      title.textContent = "Vascularización del abdomen";
      const range = document.createRange();
      range.selectNodeContents(title);
      const bottom = range.getClientRects().length === 2
        ? Math.round(element.getBoundingClientRect().bottom + window.scrollY)
        : null;
      title.textContent = original;
      return bottom;
    }) : undefined;

    if (route.engine === "guided-v2") {
      const details = progress.getByText("Detalles del progreso", { exact: true });
      await details.press("Enter");
      await expect(progress.getByText("Lo aprendido", { exact: true })).toBeVisible();
      await details.press("Enter");
      await expect(progress.getByText("Lo aprendido", { exact: true })).toBeHidden();
    }

    // Exercise wrapping independently of the short titles in the seeded routes.
    await page.setViewportSize({ width: 320, height: 720 });
    const wrapsLongHeading = await heading.evaluate(element => {
      element.textContent = "Reconocimiento de las letras y las relaciones entre los elementos de una secuencia de práctica";
      const range = document.createRange();
      range.selectNodeContents(element);
      const lines = [...range.getClientRects()];
      return lines.length > 1 && lines.every(line => line.left >= 0 && line.right <= window.innerWidth);
    });
    await page.setViewportSize(viewport);
    measurements.push({ engine: route.engine, ...dimensions, twoLineTitleUnitBottom, wrapsLongHeadingAt320: wrapsLongHeading });

    await page.context().addCookies([{ name: "f07_fault", value: route.fault, domain: "127.0.0.1", path: "/" }]);
    await page.reload();
    await expect(heading).toHaveText(route.title);
    await expect(detail.getByRole("link", { name: route.retry })).toBeVisible();
    await expect(progress).toHaveCount(0);
    await page.context().clearCookies({ name: "f07_fault" });
    await detail.getByRole("link", { name: route.retry }).click();
    await expect(progress).toBeVisible();
  }

  await info.attach("f09-route-layout.json", {
    body: JSON.stringify({ viewport, measurements }), contentType: "application/json",
  });
  for (const result of measurements) {
    expect.soft(result.unitHeadingBottom, result.engine).toBeLessThanOrEqual(result.usableBottom);
    if (info.project.name === "mobile") {
      expect.soft(result.twoLineTitleUnitBottom ?? Infinity, result.engine).toBeLessThanOrEqual(result.usableBottom);
    }
    expect.soft(result.horizontalOverflow, result.engine).toBeLessThanOrEqual(1);
    expect.soft(result.wrapsLongHeadingAt320, result.engine).toBe(true);
  }
});

test("T55 plays authorized V1 video and persists observed completion", async ({ page }, info) => {
  const durationSeconds = 8;
  const expectedVideoXp = 10;
  await actor(page, `f08-video-${info.project.name}`);
  await page.goto("/aprendizaje/rutas/simulacion-f08-video?leccion=orden");
  const activity = page.getByRole("tabpanel", { name: "Actividades", exact: true });
  await activity.getByRole("button", { name: "Video con seguimiento" }).click();
  await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  const attemptId = new URL(page.url()).pathname.split("/").at(-1);
  const webAttempt = `/api/guided-learning/attempts/${attemptId}`;
  const owner = await page.request.get(webAttempt + "/media");
  expect(owner.status()).toBe(200);
  const otherProfile = info.project.name === "desktop" ? "mobile" : "desktop";
  const foreign = await page.request.get(webAttempt + "/media", { headers: { Cookie: `t035=f08-video-${otherProfile}` } });
  expect(foreign.status()).toBe(404);

  const video = page.locator("video[aria-label]");
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBe(durationSeconds);
  await video.evaluate((element: HTMLVideoElement) => {
    element.muted = true;
    return element.play();
  });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(1);
  const summary = page.getByRole("heading", { name: "Actividad completada", exact: true });
  await expect(summary).toBeVisible({ timeout: 25_000 });

  const getAttempt = async (): Promise<LearningAttempt> => {
    const response = await page.request.get(`${api}/v1/guided-learning/attempts/${attemptId}`);
    expect(response.ok()).toBe(true);
    return response.json();
  };
  const completed = await getAttempt();
  expect(completed.status).toBe("completed");
  const coverage = completed.resume.observedRanges.reduce((total, range) => total + range.endSeconds - range.startSeconds, 0);
  expect(coverage).toBeGreaterThanOrEqual(durationSeconds * 0.9);
  expect(completed.awards?.filter(award => award.kind === "activity_understand")).toEqual([
    expect.objectContaining({ xp: expectedVideoXp }),
  ]);
  const response = await page.request.get(`${api}/v1/guided-learning/enrollments/${completed.enrollmentId}/progress`);
  expect(response.ok()).toBe(true);
  const progress: LearningEnrollmentProgress = await response.json();
  expect(progress.completedEssentialSteps).toBe(1);
  expect(progress.units[0]?.steps[0]).toMatchObject({ attemptId, completionMethod: "observed", state: "completed" });

  await page.reload();
  await expect(summary).toBeVisible();
  expect(await getAttempt()).toEqual(completed);
  await info.attach("reproduccion-v1.json", { contentType: "application/json", body: JSON.stringify({
    profile: info.project.name, mediaOwnerStatus: owner.status(), mediaOtherLearnerStatus: foreign.status(),
    durationSeconds, coverageSeconds: coverage,
    activityXp: expectedVideoXp, completionMethod: "observed", completedEssentialSteps: progress.completedEssentialSteps,
  }) });
});

test("F06 V1 retains unit, activity, guide section and resource tab without duplicating work", async ({ page }, info) => {
  await actor(page, `f06-${info.project.name}`);
  const slug = "simulacion-f06", route = `/aprendizaje/rutas/${slug}`;
  const origin = "/aprendizaje/mapa";
  const { activePath } = await (await page.request.get(api + "/v1/guided-learning/home")).json();
  const v2Home = await (await page.request.get(api + "/v2/guided-learning/home")).json();
  expect(activePath.pathHref).toBe(route);
  expect(v2Home.activePath).toBeNull();
  await page.goto("/dashboard");
  await expect(page.getByText(activePath.title, { exact: true }).first()).toBeVisible();
  await page.goto("/aprendizaje?tab=hoy");
  await expect(page.getByRole("link", { name: "Continuar mi ruta" })).toHaveAttribute("href", activePath.continueHref);
  await page.goto("/aprendizaje?tab=progreso");
  const progress = page.getByRole("progressbar", { name: `Progreso de ${activePath.title}` });
  await expect(progress).toHaveAttribute("value", String(activePath.completedSteps));
  await expect(progress).toHaveAttribute("max", String(activePath.totalSteps));

  const detail = (await (await page.request.get(api + `/v1/guided-learning/paths/${slug}`)).json());
  const guide = detail.version.units[0].steps[0];
  const counts = async () => (await (await page.request.get(api + "/__test/counts")).json());
  const before = await counts();
  await page.goto(`${route}?leccion=lectura&returnTo=${encodeURIComponent(origin)}`);
  const activities = page.getByRole("tabpanel", { name: "Actividades", exact: true });
  await expect(activities.locator("#leccion-lectura")).toHaveAttribute("open", "");
  await expect(page.getByRole("tab", { name: "Actividades" })).toBeVisible();
  await expect(page.locator("table")).toHaveCount(0);
  await page.locator(`[id="actividad-${guide.id}"]`).getByRole("button", { name: /Lectura con seguimiento/ }).click();
  await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  const sessionUrl = page.url();
  await expect(page.getByRole("cell", { name: "Primera", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Letra", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByText("La letra B sigue a A.", { exact: true })).toBeVisible();
  await expect.poll(async () => (await counts()).learning_attempts).toBe(before.learning_attempts + 1);
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`actividad=${guide.id}`));
  await expect(page.locator(`[id="actividad-${guide.id}"]`)).toBeFocused();
  await page.reload();
  await page.locator(`[id="actividad-${guide.id}"]`).getByRole("button", { name: /Lectura con seguimiento/ }).click();
  await expect(page).toHaveURL(sessionUrl);
  await expect(page.getByText("La letra B sigue a A.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Terminé esta lectura" }).click();
  await expect(page.getByRole("heading", { name: "Actividad completada" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  const saved = await counts();
  await page.locator(`[id="actividad-${guide.id}"]`).getByRole("link", { name: "Consultar resultado", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Actividad completada" })).toBeVisible();
  expect(await counts()).toEqual(saved);
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await page.getByRole("tab", { name: "Recursos" }).click();
  await expect(page).toHaveURL(/pestana=resources/);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "Consultar Lectura con seguimiento" }).click();
  await expect(page.getByRole("cell", { name: "Primera", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("region", { name: "Lectura de consulta" }).getByText("La letra B sigue a A.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Volver a los recursos de la unidad" }).click();
  await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  expect(await counts()).toEqual(saved);
  await page.screenshot({ path: info.outputPath("recursos-v1.png"), fullPage: true });
  await page.getByRole("tab", { name: "Recursos" }).focus(); await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "Actividades" })).toHaveAttribute("aria-selected", "true");
  await page.goBack(); await expect(page.getByRole("tab", { name: "Recursos" })).toHaveAttribute("aria-selected", "true");
  await page.goForward(); await expect(page.getByRole("tab", { name: "Actividades" })).toHaveAttribute("aria-selected", "true");
  const viewport = page.viewportSize()!;
  const activitiesTab = page.getByRole("tab", { name: "Actividades" });
  for (const width of [320, 360, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: viewport.height });
    await activitiesTab.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    const geometry = await activitiesTab.evaluate(element => {
      const rect = element.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { reachable: element.contains(hit), client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth };
    });
    expect(geometry.reachable, `Actividades is reachable at ${width}px`).toBe(true);
    expect(geometry.scroll, `Route fits at ${width}px`).toBeLessThanOrEqual(geometry.client + 1);
  }
  await page.setViewportSize(viewport);
  const quiz = detail.version.units[0].steps[1], cards = detail.version.units[0].steps[2];
  await page.locator(`[id="actividad-${quiz.id}"]`).getByRole("button", { name: /Cuestionario con seguimiento/ }).click();
  await page.getByRole("radio", { name: "A", exact: true }).check();
  await page.getByRole("button", { name: "Comprobar", exact: true }).click();
  await page.getByRole("button", { name: "Ver resultado", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Actividad completada" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await page.locator(`[id="actividad-${cards.id}"]`).getByRole("button", { name: /Tarjetas con seguimiento/ }).click();
  await page.getByRole("button", { name: "Mostrar respuesta", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "La recordé", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "La recordé", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Actividad completada" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await page.goto(`${route}?leccion=removed&actividad=removed&returnTo=https%3A%2F%2Fevil.test`);
  await expect(page.getByRole("status").filter({ hasText: "El lugar que abriste cambió" })).toBeVisible();
  await expect(page.locator('a[href*="evil.test"]')).toHaveCount(0);
});

test("F06 map summary opens V2 detail and retains context through study and authorized resources", async ({ page }, info) => {
  const token = info.project.name === "mobile" ? "student-38" : "student-37";
  await actor(page, token);
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  await page.request.post(api + `/__test/map/${token}`, { data: {} });
  await page.goto(`/aprendizaje/mapa?node=${ready.fixtures.small.pathId}&item=${ready.fixtures.small.pathId}&unit=unit&detail=1`);
  const panel = page.getByRole("complementary", { name: "Detalle de práctica por objetivos" });
  await expect(panel.getByRole("link", { name: "Abrir ruta", exact: true })).toBeVisible();
  await expect(panel.getByRole("tab")).toHaveCount(0);
  await panel.getByRole("link", { name: "Abrir ruta", exact: true }).click();
  await expect(page).toHaveURL(/leccion=unit/);
  await expect(page.locator("#leccion-unit")).toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Comenzar", exact: true }).click();
  const row = page.locator("#actividad-study-1");
  await expect(row.getByRole("button", { name: "Abrir actividad", exact: true })).toBeVisible();
  await page.route("**/api/v2/guided-learning/attempts/*/image?*", route => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"fixture_unavailable"}' }));
  await row.getByRole("button", { name: "Abrir actividad", exact: true }).click();
  await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  await expect(page.getByRole("button", { name: "Guardar lectura" })).toBeDisabled();
  await expect(page.getByRole("alert").filter({ hasText: "Imagen no disponible" })).toBeVisible();
  await page.unroute("**/api/v2/guided-learning/attempts/*/image?*");
  await page.getByRole("button", { name: "Reintentar imagen", exact: true }).click();
  await expect(page.getByRole("img", { name: "Píxel sintético para comprobar coordenadas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar lectura" })).toBeEnabled();
  await page.getByRole("button", { name: "Guardar lectura" }).click();
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await expect(page.locator("#actividad-study-1")).toBeFocused();
  const path = (await (await page.request.get(api + "/v2/guided-learning/paths/t035-small")).json()).path;
  const state = (await (await page.request.get(api + `/v2/guided-learning/enrollments/${path.enrollmentId}/state`)).json()).state;
  expect(state.nextAction.kind).toBe("resume");
  const before = await (await page.request.get(api + "/__test/counts")).json();
  await page.getByRole("tab", { name: "Recursos" }).click();
  await page.getByRole("link", { name: "Guía T035", exact: true }).click();
  await expect(page.getByRole("region", { name: "Lectura de consulta" })).toBeVisible();
  expect(await (await page.request.get(api + "/__test/counts")).json()).toEqual(before);
  await page.getByRole("link", { name: "Volver a los recursos de la unidad" }).click();
  await page.getByRole("link", { name: "Volver al mapa", exact: true }).click();
  await expect(panel).toBeVisible();
  await page.screenshot({ path: info.outputPath("mapa-retorno-v2.png"), fullPage: true });
});

test("F06 shows map cards while their measurements are pending", async ({ page }, info) => {
  const token = `f06-${info.project.name}`;
  await actor(page, token);
  await page.addInitScript(() => {
    const NativeResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeResizeObserver {
      observe(target: Element, options?: ResizeObserverOptions) {
        if (!target.classList.contains("react-flow__node")) super.observe(target, options);
      }
    };
  });
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  const pathId = ready.fixtures.navigation.pathId;
  expect((await page.request.post(`${api}/__test/map/${token}`, { data: {} })).ok()).toBe(true);
  await page.goto(`/aprendizaje/mapa?node=${pathId}&item=${pathId}`);
  const lesson = page.getByRole("button", { name: "Abrir Lectura y comprobación", exact: true });
  await expect(lesson).toBeVisible({ timeout: 10_000 });
  await lesson.click();
  await expect(page.getByRole("complementary", { name: "Lección Lectura y comprobación" })).toBeVisible();
});

test("F06 H19 records map nodes after activity return, resizing and reload", async ({ page }, info) => {
  const token = `f06-${info.project.name}`;
  await actor(page, token);
  const traceUrl = `${api}/__test/trace/${token}`;
  await page.request.post(traceUrl, { data: {} });
  const ready = await (await page.request.get(api + "/__test/ready")).json(), pathId = ready.fixtures.navigation.pathId;
  await page.request.post(api + `/__test/map/f06-${info.project.name}`, { data: {} });
  await page.goto(`/aprendizaje/mapa?node=${pathId}&item=${pathId}`);
  const canvas = page.getByRole("region", { name: /Mapa del nivel/ });
  await canvas.evaluate(element => { element.scrollTop = 0; });
  const firstLesson = page.getByRole("button", { name: "Abrir Lectura y comprobación", exact: true });
  await expect(firstLesson).toBeVisible();
  const readMountedNodes = () => page.locator(".react-flow__node").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-id")));
  const beforeReturn = await readMountedNodes();
  await firstLesson.click();
  const detail = page.getByRole("complementary", { name: "Lección Lectura y comprobación" });
  await detail.getByRole("link", { name: "Abrir ruta", exact: true }).click();
  const activities = page.getByRole("tabpanel", { name: "Actividades", exact: true });
  const reading = activities.locator("[id^='actividad-']").filter({ hasText: "Leer la tabla" });
  await expect(reading).toBeVisible();
  const savedResult = reading.getByRole("link", { name: "Consultar resultado", exact: true });
  const startReading = reading.getByRole("button", { name: /Lectura con seguimiento/ });
  await (await savedResult.isVisible() ? savedResult : startReading).click();
  await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().click();
  await page.getByRole("link", { name: "Volver al mapa", exact: true }).click();
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Cerrar lección" }).click();
  const scrollTopBeforeReset = await canvas.evaluate(element => {
    const previous = element.scrollTop;
    element.scrollTop = 0;
    return previous;
  });
  try {
    await expect(firstLesson).toBeVisible({ timeout: 10_000 });
  } catch (error) {
    const frame = await canvas.evaluate(element => ({
      scrollTop: element.scrollTop,
      width: element.clientWidth,
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
      transform: element.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform,
      nodes: [...element.querySelectorAll<HTMLElement>(".react-flow__node")].map(node => ({
        id: node.dataset.id,
        visibility: getComputedStyle(node).visibility,
        transform: node.style.transform,
      })),
    }));
    await info.attach("h19-frame-after-close.json", {
      body: JSON.stringify({ scrollTopBeforeReset, beforeReturn, ...frame }, null, 2),
      contentType: "application/json",
    });
    throw error;
  }
  const afterReturn = await readMountedNodes();
  expect(afterReturn).toContain(beforeReturn[0]);
  const snapshots = [];
  for (const width of [390, 1440, 320, 430]) {
    await page.setViewportSize({ width, height: 820 });
    await page.getByRole("button", { name: "Vista de lista", exact: true }).click();
    await page.getByRole("button", { name: "Vista de mapa", exact: true }).click();
    await canvas.evaluate(element => { element.scrollTop = 0; });
    await expect(page.getByRole("button", { name: "Abrir Lectura y comprobación", exact: true })).toBeVisible();
    const first = await readMountedNodes();
    await canvas.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(page.getByRole("button", { name: "Abrir Contenido 28", exact: true })).toBeVisible();
    const last = await readMountedNodes();
    snapshots.push({ requested: { node: pathId, item: pathId }, unitCount: 30, width, first, last, measures: await canvas.evaluate(element => ({ width: element.clientWidth, height: element.clientHeight, scrollTop: element.scrollTop, scrollHeight: element.scrollHeight })) });
    await canvas.evaluate(element => { element.scrollTop = 0; });
    await expect(page.getByRole("button", { name: "Abrir Lectura y comprobación", exact: true })).toBeVisible();
  }
  await page.reload();
  await canvas.evaluate(element => { element.scrollTop = 0; });
  await expect(page.getByRole("button", { name: "Abrir Lectura y comprobación", exact: true })).toBeVisible();
  const trace: { method: string; path: string; status: number; durationMs: number; bytes: number }[] = await (await page.request.get(traceUrl)).json();
  const evidence = info.outputPath("h19-map-snapshots.json");
  await writeFile(evidence, JSON.stringify({ beforeReturn, afterReturn, snapshots, trace: trace.filter(item => item.path.startsWith("/v1/guided-learning/map")) }, null, 2));
  await info.attach("h19-map-snapshots", { path: evidence, contentType: "application/json" });
});

