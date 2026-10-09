import { test, expect, chromium, type Page, type Locator, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const api = "http://127.0.0.1:41035";
const root = "/api/v2/guided-learning/";
const slug = "/aprendizaje/rutas/t035-small";
const tabs = ["Datos y fuentes", "Objetivos", "Recorrido", "Evaluación y repaso", "Revisión"];
const kinds = ["study", "constructed", "choice", "short", "match", "sequence", "image", "case"];
async function actor(page: Page, name: string) {
  await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
}
async function post(page: Page, path: string, data: unknown) {
  const r = await page.request.post(root + path, { data, headers: { "idempotency-key": crypto.randomUUID() } });
  expect(r.status(), await r.text()).toBe(200); return r.json();
}
async function state(page: Page, id: string) {
  return (await (await page.request.get(root + `enrollments/${id}/state`)).json()).state;
}
async function launch(page: Page, id: string, key: string) {
  const s = await state(page, id);
  const a = (await post(page, "attempts", { clientAttemptId: crypto.randomUUID(), enrollmentId: id,
    target: { kind: "activity", key }, expectedEnrollmentVersion: s.rowVersion })).attempt;
  await page.goto(`/aprendizaje/sesiones/${a.attemptId}`);
  await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeFocused();
  return a;
}
async function keyboard(locator: Locator) { await expect(locator).toBeEnabled(); await locator.focus(); await locator.press("Enter"); }
async function hydrated(locator: Locator) {
  await expect.poll(() => locator.evaluate(element => Object.keys(element).some(k => k.startsWith("__reactProps")
    && Object.entries((element as unknown as Record<string, Record<string, unknown>>)[k] ?? {})
      .some(([name, value]) => name.startsWith("on") && typeof value === "function")))).toBe(true);
}

// Audit the complete page, including its shared shell: no axe exclusions.
async function capture(page: Page, info: TestInfo, name: string) {
  const cdp = await page.context().newCDPSession(page);
  const visible = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  if (visible.width !== page.viewportSize()?.width) {
    // Native zoom changes the CSS viewport without changing Playwright's device
    // viewport. Capture its actual bounds directly, avoiding a doubled crop.
    const metrics = await cdp.send("Page.getLayoutMetrics");
    const viewport = metrics.cssVisualViewport;
    const nativeScale = page.viewportSize()!.width / visible.width;
    for (const [suffix, clip] of [["-viewport", { x: viewport.pageX, y: viewport.pageY, width: visible.width, height: visible.height, scale: 1 }],
      ["", { ...metrics.cssContentSize, scale: 1 }]] as const) {
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true,
        clip: { x: clip.x * nativeScale, y: clip.y * nativeScale, width: clip.width * nativeScale, height: clip.height * nativeScale, scale: 1 } });
      await writeFile(info.outputPath(`${name}${suffix}.png`), Buffer.from(shot.data, "base64"));
    }
  } else {
    await page.screenshot({ path: info.outputPath(`${name}-viewport.png`) });
    await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  }
  const axe = await new AxeBuilder({ page }).analyze();
  await writeFile(info.outputPath(`${name}-axe.json`), JSON.stringify(axe, null, 2));
  const tree = await cdp.send("Accessibility.getFullAXTree"); await cdp.detach();
  await writeFile(info.outputPath(`${name}-ax.json`), JSON.stringify(tree, null, 2));
  const geometry = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
    pageWidth: document.documentElement.scrollWidth, zoom: getComputedStyle(document.documentElement).zoom, devicePixelRatio,
    focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 160) },
    controls: [...document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("main button, main input, main select")]
      .filter(e => e.getClientRects().length && !e.disabled).map(e => { const b = e.getBoundingClientRect();
        return { name: e.getAttribute("aria-label") ?? e.textContent?.slice(0, 90), width: b.width, height: b.height }; }) }));
  await writeFile(info.outputPath(`${name}-geometry.json`), JSON.stringify(geometry, null, 2));
  expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
  expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
}
async function previewPoint(page: Page, key: string) {
  const p = page.locator("[data-editor-preview]");
  await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
  await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  await expect(p.getByRole("heading", { name: key === "case" ? /Etapa 1: ejemplo sintético.*case-choice-1/ : `${key}-1: actividad sintética`, exact: true })).toBeVisible();
  if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  return p;
}
async function answerPreview(p: Locator, key: string) {
  const choice = async () => { const radio = p.getByRole("radio", { name: "Respuesta A", exact: true });
    await radio.focus(); await radio.press("Space"); await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); };
  const feedback = async () => keyboard(p.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).last());
  if (key === "study") { await keyboard(p.getByRole("button", { name: "Continuar a la práctica", exact: true })); return; }
  if (key === "choice" || key === "apply") await choice();
  if (key === "short") { await p.getByLabel("Tu respuesta", { exact: true }).pressSequentially("respuesta");
    await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); }
  if (key === "constructed") { await p.getByLabel("Explica con tus palabras").pressSequentially("Una relación sintética.");
    await keyboard(p.getByRole("button", { name: "Guardar mi respuesta", exact: true }));
    await keyboard(p.getByRole("button", { name: "Comparar con el modelo", exact: true }));
    await keyboard(p.getByRole("button", { name: "Lo recuperé", exact: true })); }
  if (key === "match") { const select = p.getByRole("combobox", { name: "Origen", exact: true });
    await select.focus(); await select.press("End"); await select.press("Tab");
    await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true })); }
  if (key === "sequence") await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  if (key === "image") { await p.getByLabel("Horizontal (%)").fill("20"); await p.getByLabel("Vertical (%)").fill("20");
    await keyboard(p.getByRole("button", { name: "Comprobar respuesta visual", exact: true })); }
  if (key === "case") { await choice(); await feedback();
    await expect(p.getByRole("heading", { name: /Etapa 2: relación sintética.*case-short-1/ })).toBeFocused();
    await answerPreview(p, "short"); return; }
  await feedback();
}
async function finishPreview(p: Locator) {
  await keyboard(p.getByRole("button", { name: "Finalizar sesión", exact: true }));
  await expect(p.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
}

test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  test.setTimeout(600000);
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  expect(ready.testOnly).toBe(true);
  await actor(page, "editor");
  await page.goto("/panel/rutas/nueva?mode=v2");
  await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  await capture(page, info, "admin-empty");
  await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  for (const name of tabs) {
    const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await capture(page, info, `admin-${tabs.indexOf(name)}`);
  }
  await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  for (const key of kinds) {
    const p = await previewPoint(page, key);
    const closeButton = p.locator(".learning-activity-header > button");
    await expect(closeButton).toBeVisible();
    const close = await closeButton.boundingBox();
    expect(close?.width).toBeGreaterThan(100);
    expect(close?.height).toBeLessThanOrEqual(70);
    await capture(page, info, `renderer-${key}`);
    await answerPreview(p, key); await finishPreview(p);
  }
  await keyboard(page.locator("[data-editor-preview]").getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
  // CSS zoom exercises real 200% layout/text scaling in Chromium. It is documented
  // separately from native browser zoom and checked together with small viewports.
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await capture(page, info, "admin-zoom200");
  await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  const index = ["desktop", "360", "390", "768"].indexOf(info.project.name);
  const name = `student-${22 + index}`; await actor(page, name);
  await page.goto(slug); await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
  await capture(page, info, "learner-path");
  const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  await page.request.post(api + `/__test/map/${name}`, { data: {} });
  for (const [label, url] of [["today", "/aprendizaje?tab=hoy"], ["map", "/aprendizaje/mapa"],
    ["review-empty", "/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"]] as const) {
    await page.goto(url); await expect(page.locator("main").first()).toBeVisible();
    if (label === "map") await expect(page.getByRole("button", { name: "Vista de lista", exact: true })).toBeVisible();
    await capture(page, info, label);
    if (label === "map") { await keyboard(page.getByRole("button", { name: "Vista de lista", exact: true }));
      await capture(page, info, "map-list"); }
  }
  await launch(page, enrollmentId, "study-1");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const reflow = await page.locator(".learning-activity-header").evaluate(header => {
    const title = header.querySelector("h1")!;
    const range = document.createRange(); range.selectNodeContents(title);
    const boxes = [...header.children].map(e => e.getBoundingClientRect());
    return { titleLines: new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size,
      overlapping: boxes.some((a, i) => boxes.slice(i + 1).some(b =>
        Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1)) };
  });
  expect(reflow.titleLines).toBeLessThanOrEqual(4.1); expect(reflow.overlapping).toBe(false);
  await writeFile(info.outputPath("zoom-reflow.json"), JSON.stringify(reflow, null, 2));
  await capture(page, info, "learner-zoom200");
  await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  await keyboard(page.getByRole("button", { name: "Continuar a la práctica", exact: true }));
  await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  await launch(page, enrollmentId, "constructed-1");
  await answerPreview(page.getByRole("region", { name: "Sesión de aprendizaje", exact: true }), "constructed");
  await finishPreview(page.getByRole("region", { name: "Sesión de aprendizaje", exact: true }));
  await launch(page, enrollmentId, "choice-1");
  const radio = page.getByRole("radio", { name: "Respuesta B", exact: true }); await radio.focus(); await radio.press("Space");
  const button = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
  const responsePattern = "**/api/v2/guided-learning/attempts/*/responses";
  await page.route(responsePattern, route => route.abort("failed"));
  await keyboard(button);
  const retry = page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true });
  await expect(retry).toBeVisible();
  await capture(page, info, "learner-error"); await page.unroute(responsePattern);
  let release!: () => void; const held = new Promise<void>(r => { release = r; });
  const inFlight: Promise<void>[] = [];
  await page.route(responsePattern, route => { const task = held.then(() => route.continue()); inFlight.push(task); return task; });
  try {
    await keyboard(retry);
    await expect(page.getByText("Confirmando con el servidor…", { exact: true })).toBeVisible();
    await expect(button).toBeDisabled();
    await capture(page, info, "learner-loading");
  } finally { release(); await Promise.all(inFlight); await page.unroute(responsePattern); }
  await expect(page.getByRole("heading", { name: "Vamos a reforzar este punto", exact: true })).toBeFocused();
  await capture(page, info, "learner-feedback");
  await keyboard(page.getByRole("button", { name: "Ver cierre de sesión", exact: true }));
  await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
});

test("T037 V03 native browser zoom at 200 percent", async ({}, info) => {
  test.skip(info.project.name !== "desktop", "Native zoom uses a dedicated Chromium context once.");
  const extension = resolve("../../docs/aprendizaje-guiado/v2/evidencias/T037/native-zoom-extension");
  const context = await chromium.launchPersistentContext("", { channel: "msedge", headless: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
    const page = context.pages()[0]!; await actor(page, "editor");
    await page.goto("http://127.0.0.1:31035/panel/rutas/nueva?mode=v2");
    await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
    // The temporary, local-only extension drives Chromium's native tab zoom.
    // Verify the changed CSS viewport and DPR instead of assuming CSS zoom is equivalent.
    await worker.evaluate(async () => {
      const browser = (globalThis as unknown as { chrome: { tabs: {
        query(input: object): Promise<{ id: number; url?: string }[]>; setZoom(id: number, value: number): Promise<void>;
      } } }).chrome;
      const target = (await browser.tabs.query({})).find(tab => tab.url?.startsWith("http://127.0.0.1:31035/"));
      if (!target) throw new Error("Local fixture tab required");
      await browser.tabs.setZoom(target.id, 2);
    });
    await expect.poll(() => page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio }))).toEqual({ width: 720, dpr: 2 });
    await capture(page, info, "native-zoom200-admin");
    await page.getByLabel("Título", { exact: true }).focus();
    // The shell scrolls smoothly; inspect reachability after focus scrolling settles.
    await expect.poll(() => page.getByLabel("Título", { exact: true }).evaluate(e => { const r = e.getBoundingClientRect();
      return [[r.x + 4, r.y + 4], [r.right - 4, r.y + 4], [r.x + 4, r.bottom - 4], [r.right - 4, r.bottom - 4],
        [r.x + r.width / 2, r.y + r.height / 2]].every(([x, y]) => e.contains(document.elementFromPoint(x!, y!))); })).toBe(true);
    await writeFile(info.outputPath("native-focus.json"), JSON.stringify(await page.getByLabel("Título", { exact: true }).evaluate(e => {
      const r = e.getBoundingClientRect();
      return { viewport: { width: innerWidth, height: innerHeight }, visual: { width: visualViewport?.width, height: visualViewport?.height, offsetTop: visualViewport?.offsetTop }, rect: r.toJSON(),
        hit: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.outerHTML.slice(0, 500),
        cornersAccessible: [[r.x + 4, r.y + 4], [r.right - 4, r.y + 4], [r.x + 4, r.bottom - 4], [r.right - 4, r.bottom - 4]]
          .every(([x, y]) => e.contains(document.elementFromPoint(x!, y!))),
        focus: document.activeElement === e, scroll: scrollY };
    }), null, 2));
    await capture(page, info, "native-zoom200-field-focus");
    await actor(page, "student-30"); await page.goto("http://127.0.0.1:31035" + slug);
    await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
    await capture(page, info, "native-zoom200-learner");
  } finally { await context.close(); }
});

test("T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative", async ({ page }, info) => {
  test.setTimeout(360000); await actor(page, "editor");
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  await page.goto(`/panel/rutas/${ready.fixtures[info.project.name === "desktop" ? "editorial" : "editorial-mobile"].pathId}`);
  const journey = page.getByRole("tab", { name: "Recorrido", exact: true }); await hydrated(journey); await keyboard(journey);
  const matchSummary = page.locator("summary").filter({ hasText: "match-1: actividad sintética" }); await keyboard(matchSummary);
  const presentation = page.getByLabel("Presentación de relaciones", { exact: true });
  await presentation.focus(); await presentation.press("Home"); await presentation.press("ArrowDown"); await presentation.press("Tab");
  await expect(presentation).toHaveValue("comparison_table");
  await keyboard(matchSummary.locator("..").locator("summary").filter({ hasText: "Solución y feedback" }));
  await capture(page, info, "editor-relations-table");
  // The shared fixture links image to a case representation. Configure a valid
  // text alternative through the editor before auditing the accessible detour.
  await keyboard(page.locator("summary").filter({ hasText: "image-1: actividad sintética" }));
  await page.getByLabel("Alternativa accesible de texto o tabla", { exact: true }).selectOption("short-1");
  const save = page.getByRole("button", { name: "Guardar borrador", exact: true });
  if (await save.isEnabled()) { await keyboard(save); await expect(save).toBeDisabled(); }
  const tab = page.getByRole("tab", { name: "Revisión", exact: true }); await keyboard(tab);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const open = page.getByRole("button", { name: "Abrir vista previa", exact: true });
  await expect(open).toBeEnabled(); await keyboard(open);
  const p = await previewPoint(page, "image");
  const surface = p.getByRole("group", { name: "Imagen para responder", exact: true });
  const img = surface.locator("img");
  const b = await img.boundingBox(); expect(b).not.toBeNull();
  // The square fixture letterboxes in a wide container on desktop/tablet.
  const natural = await img.evaluate(e => ({ width: (e as HTMLImageElement).naturalWidth, height: (e as HTMLImageElement).naturalHeight }));
  const scale = Math.min(b!.width / natural.width, b!.height / natural.height);
  const w = natural.width * scale, h = natural.height * scale;
  const box = { x: b!.x + (b!.width - w) / 2, y: b!.y + (b!.height - h) / 2, width: w, height: h };
  if (b!.width > w + 4) { await img.click({ position: { x: 1, y: b!.height / 2 } }); await expect(p.getByLabel("Horizontal (%)")).toHaveValue(""); }
  const x = box.x + w * .2, y = box.y + h * .2;
  await surface.scrollIntoViewIfNeeded();
  if (info.project.name === "360" || info.project.name === "390") {
    // Geometry is refreshed after scroll, because touch uses viewport coordinates.
    const current = await img.boundingBox(); const dx = current!.x - b!.x, dy = current!.y - b!.y;
    await page.touchscreen.tap(x + dx, y + dy);
  } else await img.click({ position: { x: x - b!.x, y: y - b!.y } });
  const selected = { x: await p.getByLabel("Horizontal (%)").inputValue(), y: await p.getByLabel("Vertical (%)").inputValue() };
  // Browser pointer coordinates round to device pixels. Require at most one
  // rendered pixel of error; preserve the exact selected value through zoom.
  expect(Math.abs(Number(selected.x) - 20)).toBeLessThanOrEqual(100 / w);
  expect(Math.abs(Number(selected.y) - 20)).toBeLessThanOrEqual(100 / h);
  await p.getByLabel("Ampliación de imagen").selectOption("2");
  await expect(p.getByLabel("Horizontal (%)")).toHaveValue(selected.x);
  await expect(p.getByLabel("Vertical (%)")).toHaveValue(selected.y);
  await surface.focus(); await surface.press("ArrowRight");
  await expect.poll(async () => Number(await p.getByLabel("Horizontal (%)").inputValue())).toBeCloseTo(Number(selected.x) + 1, 3);
  await writeFile(info.outputPath("image-pointer.json"), JSON.stringify({ viewport: page.viewportSize(), imageBox: b, natural, contained: box, selected, maxErrorPixels: 1 }, null, 2));
  await capture(page, info, "image-zoom-reduced-motion");
  await p.getByLabel("Ampliación de imagen").selectOption("1");
  await keyboard(p.getByRole("button", { name: "Practicar con variante de texto o tabla", exact: true }));
  await expect(p.getByText(/Variante accesible de texto o tabla\. Esta práctica/)).toBeVisible();
  await capture(page, info, "image-alternative");
  await answerPreview(p, "short");
  await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  await answerPreview(p, "image"); await finishPreview(p);
  await previewPoint(page, "match");
  await expect(p.getByRole("region", { name: "Tabla de relaciones", exact: true })).toBeVisible();
  await capture(page, info, "match-table-keyboard");
  const select = p.getByRole("combobox", { name: "Origen", exact: true });
  await select.focus(); await select.press("End"); await select.press("Tab");
  await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true }));
  await expect(p.getByRole("heading", { name: "Respuesta correcta", exact: true })).toBeFocused();
  await keyboard(p.getByRole("button", { name: "Ver cierre de sesión", exact: true })); await finishPreview(p);
  await previewPoint(page, "sequence");
  await keyboard(p.getByRole("button", { name: "Bajar: Uno", exact: true }));
  await expect(p.getByRole("button", { name: "Bajar: Uno", exact: true })).toBeFocused();
  await keyboard(p.getByRole("button", { name: "Subir: Uno", exact: true }));
  await expect(p.getByRole("button", { name: "Bajar: Uno", exact: true })).toBeFocused();
  await capture(page, info, "sequence-keyboard");
  await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  await expect(p.getByRole("heading", { name: "Respuesta correcta", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  await keyboard(p.getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
});

test("T037 V02 tab order, field reachability and modal focus restoration", async ({ page }, info) => {
  await actor(page, "editor"); await page.goto("/panel/rutas/nueva?mode=v2");
  const title = page.getByLabel("Título", { exact: true }); await expect(title).toBeVisible();
  // Start at the first editor link and reach the field using only sequential Tab.
  await page.getByRole("link", { name: "Volver a rutas", exact: true }).focus();
  const visited: string[] = [];
  for (let i = 0; i < 25 && !(await title.evaluate(e => e === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
    visited.push(await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 250) ?? ""));
  }
  await expect(title).toBeFocused(); await title.pressSequentially(`T037 teclado ${info.project.name}`);
  const list = page.getByRole("tablist", { name: "Secciones del editor de rutas" });
  const first = list.getByRole("tab", { name: "Datos y fuentes", exact: true }); await first.focus();
  await first.press("ArrowRight");
  const objective = list.getByRole("tab", { name: "Objetivos", exact: true }); await expect(objective).toBeFocused();
  await objective.press("Enter"); await expect(objective).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  await capture(page, info, "keyboard-objectives");
  const back = page.getByRole("link", { name: "Volver a rutas", exact: true }); await keyboard(back);
  const dialog = page.getByRole("alertdialog"); await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab"); expect(await dialog.evaluate(e => e.contains(document.activeElement))).toBe(true);
  }
  const reachable = await dialog.getByRole("button").evaluateAll(buttons => buttons.map(e => {
    const b = e.getBoundingClientRect();
    return { name: e.textContent, reachable: e.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)) };
  }));
  expect(reachable.every(button => button.reachable), JSON.stringify(reachable)).toBe(true);
  await writeFile(info.outputPath("dialog-pointer.json"), JSON.stringify(reachable, null, 2));
  await capture(page, info, "keyboard-dialog");
  await dialog.getByRole("button", { name: "Seguir editando", exact: true }).click();
  await expect(dialog).toHaveCount(0); await expect(back).toBeFocused();
  await keyboard(back); await expect(dialog).toBeVisible(); await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0); await expect(back).toBeFocused();
  const focused = await back.evaluate(e => { const style = getComputedStyle(e); const rect = e.getBoundingClientRect();
    return { outline: style.outlineStyle, width: style.outlineWidth, x: rect.x, y: rect.y, height: rect.height,
      covered: !e.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) }; });
  expect(focused.covered).toBe(false); expect(focused.outline).not.toBe("none");
  await writeFile(info.outputPath("keyboard-navigation.json"), JSON.stringify({ visited, focused }, null, 2));
});

test("T037 V01 stable map geometry and connections", async ({ page }, info) => {
  const index = ["desktop", "360", "390", "768"].indexOf(info.project.name);
  const name = `student-${32 + index}`; await actor(page, name);
  const ready = await (await page.request.get(api + "/__test/ready")).json();
  await post(page, "enrollments", { pathId: ready.fixtures.small.pathId });
  // E02 can publish the editorial fixture earlier in the same full regression.
  // Keep exact node/edge counts against that confirmed catalogue state.
  const editorial = await page.request.get(root + "paths/" + ready.fixtures.editorial.slug);
  expect([200, 404]).toContain(editorial.status());
  const editorialPublished = editorial.status() === 200;
  if (editorialPublished) expect((await editorial.json()).path.pathId).toBe(ready.fixtures.editorial.pathId);
  const expectedRoutes = editorialPublished ? 3 : 2;
  await page.request.post(api + `/__test/map/${name}`, { data: {} });
  await page.goto("/aprendizaje/mapa");
  const folder = page.getByRole("button", { name: "Abrir Tema T035", exact: true });
  await expect(folder).toBeVisible(); await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge-path")).toHaveCount(1);
  const phase = page.locator("[data-phase]").filter({ has: page.locator(".react-flow") });
  await expect(phase).toHaveAttribute("data-phase", "idle");
  await capture(page, info, "map-loaded-root");
  await keyboard(folder);
  await expect(page.getByRole("button", { name: "Abrir Ruta T035 pequeña", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir Ruta T035 de 200 objetivos", exact: true })).toBeVisible();
  if (editorialPublished) await expect(page.getByRole("button", { name: "Abrir Ruta editorial T035", exact: true })).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(expectedRoutes + 1);
  await expect(page.locator(".react-flow__edge-path")).toHaveCount(expectedRoutes);
  await expect(page.getByLabel("Conexión con el nivel anterior", { exact: true })).toBeVisible();
  await expect(phase).toHaveAttribute("data-phase", "idle");
  await page.getByRole("button", { name: "Ajustar vista", exact: true }).click();
  await capture(page, info, "map-loaded-routes");
  await writeFile(info.outputPath("map-connections.json"), JSON.stringify(await page.evaluate(() => ({
    nodes: [...document.querySelectorAll(".react-flow__node")].map(e => ({ label: e.textContent, rect: e.getBoundingClientRect().toJSON() })),
    connections: [...document.querySelectorAll(".react-flow__edge-path")].map(e => e.getAttribute("d")),
    incoming: document.querySelector('[aria-label="Conexión con el nivel anterior"]')?.getBoundingClientRect().toJSON(),
  })), null, 2));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await keyboard(page.getByRole("button", { name: "Volver desde Tema T035", exact: true }));
  await expect(folder).toBeVisible(); await expect(phase).toHaveAttribute("data-phase", "idle");
  await writeFile(info.outputPath("motion-settling.json"), JSON.stringify(await page.evaluate(() =>
    document.getAnimations().filter(a => a.playState === "running").map(a => ({
      target: (a.effect as KeyframeEffect | null)?.target instanceof Element
        ? ((a.effect as KeyframeEffect).target as Element).outerHTML.slice(0, 300) : null,
      name: "animationName" in a ? a.animationName : "transitionProperty" in a ? a.transitionProperty : null,
      timing: a.effect?.getComputedTiming(),
    }))), null, 2));
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length), { timeout: 2000 }).toBe(0);
  const motion = await page.evaluate(() => ({ reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    runningAnimations: document.getAnimations().filter(a => a.playState === "running").length }));
  expect(motion).toEqual({ reducedMotion: true, runningAnimations: 0 });
  await writeFile(info.outputPath("reduced-motion.json"), JSON.stringify(motion, null, 2));
});
