# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:107:5

# Error details

```
Error: admin-3: page overflow

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 769
Received:    829
```

# Page snapshot

```yaml
- generic [ref=f8e1]:
  - generic [ref=f8e3]:
    - banner [ref=f8e4]:
      - search "Buscar guías" [ref=f8e6]:
        - combobox "Buscar guías" [ref=f8e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f8e11]
      - generic [ref=f8e12]:
        - button "Notificaciones" [ref=f8e14] [cursor=pointer]
        - link "Acceder" [ref=f8e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=f8e22]:
      - region "Sesión de aprendizaje" [ref=f8e23]:
        - generic [ref=f8e24]:
          - link "Volver a mi aprendizaje" [ref=f8e25] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
          - generic [ref=f8e26]:
            - text: Aprendizaje guiado
            - heading "Tu sesión de aprendizaje" [level=1] [ref=f8e27]
          - status [ref=f8e28]: Estado del servidor
        - status [ref=f8e29]: Sesión completada y guardada.
        - generic "Estado confirmado de la ruta" [ref=f8e30]:
          - generic [ref=f8e31]: Recorrido en curso
          - generic [ref=f8e32]: Dominio por comprobar
          - generic [ref=f8e33]: Consolidación pendiente
          - generic [ref=f8e34]: 0 repasos pendientes
          - generic [ref=f8e35]: 1 objetivo por reforzar
          - generic [ref=f8e36]: 3 actividades completadas de 9
        - generic [ref=f8e37]:
          - heading "Sesión completada" [active] [level=2] [ref=f8e38]
          - paragraph [ref=f8e39]: El recorrido y el dominio se muestran por separado en el resumen confirmado.
          - group [ref=f8e40]:
            - generic "Respuestas confirmadas" [ref=f8e41]
        - region "Próximos pasos confirmados" [ref=f8e42]:
          - heading "Cómo continuar" [level=2] [ref=f8e43]
          - paragraph [ref=f8e44]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
          - generic [ref=f8e45]:
            - paragraph [ref=f8e46]: Confusión CORE sintética
            - paragraph [ref=f8e47]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
          - group [ref=f8e48]:
            - generic "Agenda confirmada de la ruta" [ref=f8e49] [cursor=pointer]
    - navigation "Navegación móvil" [ref=f8e50]:
      - link "Inicio" [ref=f8e51] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f8e55] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f8e60] [cursor=pointer]
      - link [ref=f8e64] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f8e67]: Rutas deaprendizaje
  - alert [ref=f8e68]
```

# Test source

```ts
  1   | import { test, expect, chromium, type Page, type Locator, type TestInfo } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | import { writeFile } from "node:fs/promises";
  4   | import { resolve } from "node:path";
  5   | 
  6   | const api = "http://127.0.0.1:41035";
  7   | const root = "/api/v2/guided-learning/";
  8   | const slug = "/aprendizaje/rutas/t035-small";
  9   | const tabs = ["Datos y fuentes", "Objetivos", "Recorrido", "Evaluación y repaso", "Revisión"];
  10  | const kinds = ["study", "constructed", "choice", "short", "match", "sequence", "image", "case"];
  11  | async function actor(page: Page, name: string) {
  12  |   await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  13  |   await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  14  | }
  15  | async function post(page: Page, path: string, data: unknown) {
  16  |   const r = await page.request.post(root + path, { data, headers: { "idempotency-key": crypto.randomUUID() } });
  17  |   expect(r.status(), await r.text()).toBe(200); return r.json();
  18  | }
  19  | async function state(page: Page, id: string) {
  20  |   return (await (await page.request.get(root + `enrollments/${id}/state`)).json()).state;
  21  | }
  22  | async function launch(page: Page, id: string, key: string) {
  23  |   const s = await state(page, id);
  24  |   const a = (await post(page, "attempts", { clientAttemptId: crypto.randomUUID(), enrollmentId: id,
  25  |     target: { kind: "activity", key }, expectedEnrollmentVersion: s.rowVersion })).attempt;
  26  |   await page.goto(`/aprendizaje/sesiones/${a.attemptId}`);
  27  |   await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeFocused();
  28  |   return a;
  29  | }
  30  | async function keyboard(locator: Locator) { await expect(locator).toBeEnabled(); await locator.focus(); await locator.press("Enter"); }
  31  | async function hydrated(locator: Locator) {
  32  |   await expect.poll(() => locator.evaluate(element => Object.keys(element).some(k => k.startsWith("__reactProps")
  33  |     && Object.entries((element as unknown as Record<string, Record<string, unknown>>)[k] ?? {})
  34  |       .some(([name, value]) => name.startsWith("on") && typeof value === "function")))).toBe(true);
  35  | }
  36  | 
  37  | // Audit the complete page, including its shared shell: no axe exclusions.
  38  | async function capture(page: Page, info: TestInfo, name: string) {
  39  |   const cdp = await page.context().newCDPSession(page);
  40  |   const visible = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  41  |   if (visible.width !== page.viewportSize()?.width) {
  42  |     // Native zoom changes the CSS viewport without changing Playwright's device
  43  |     // viewport. Capture its actual bounds directly, avoiding a doubled crop.
  44  |     const metrics = await cdp.send("Page.getLayoutMetrics");
  45  |     const viewport = metrics.cssVisualViewport;
  46  |     const nativeScale = page.viewportSize()!.width / visible.width;
  47  |     for (const [suffix, clip] of [["-viewport", { x: viewport.pageX, y: viewport.pageY, width: visible.width, height: visible.height, scale: 1 }],
  48  |       ["", { ...metrics.cssContentSize, scale: 1 }]] as const) {
  49  |       const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true,
  50  |         clip: { x: clip.x * nativeScale, y: clip.y * nativeScale, width: clip.width * nativeScale, height: clip.height * nativeScale, scale: 1 } });
  51  |       await writeFile(info.outputPath(`${name}${suffix}.png`), Buffer.from(shot.data, "base64"));
  52  |     }
  53  |   } else {
  54  |     await page.screenshot({ path: info.outputPath(`${name}-viewport.png`) });
  55  |     await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  56  |   }
  57  |   const axe = await new AxeBuilder({ page }).analyze();
  58  |   await writeFile(info.outputPath(`${name}-axe.json`), JSON.stringify(axe, null, 2));
  59  |   const tree = await cdp.send("Accessibility.getFullAXTree"); await cdp.detach();
  60  |   await writeFile(info.outputPath(`${name}-ax.json`), JSON.stringify(tree, null, 2));
  61  |   const geometry = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
  62  |     pageWidth: document.documentElement.scrollWidth, zoom: getComputedStyle(document.documentElement).zoom, devicePixelRatio,
  63  |     focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 160) },
  64  |     controls: [...document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("main button, main input, main select")]
  65  |       .filter(e => e.getClientRects().length && !e.disabled).map(e => { const b = e.getBoundingClientRect();
  66  |         return { name: e.getAttribute("aria-label") ?? e.textContent?.slice(0, 90), width: b.width, height: b.height }; }) }));
  67  |   await writeFile(info.outputPath(`${name}-geometry.json`), JSON.stringify(geometry, null, 2));
  68  |   expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
> 69  |   expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
      |                                                             ^ Error: admin-3: page overflow
  70  | }
  71  | async function previewPoint(page: Page, key: string) {
  72  |   const p = page.locator("[data-editor-preview]");
  73  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
  74  |   await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  75  |   await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  76  |   if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  77  |   return p;
  78  | }
  79  | async function answerPreview(p: Locator, key: string) {
  80  |   const choice = async () => { const radio = p.getByRole("radio", { name: "Respuesta A", exact: true });
  81  |     await radio.focus(); await radio.press("Space"); await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); };
  82  |   const feedback = async () => keyboard(p.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).last());
  83  |   if (key === "study") { await keyboard(p.getByRole("button", { name: "Continuar a la práctica", exact: true })); return; }
  84  |   if (key === "choice" || key === "apply") await choice();
  85  |   if (key === "short") { await p.getByLabel("Tu respuesta", { exact: true }).pressSequentially("respuesta");
  86  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); }
  87  |   if (key === "constructed") { await p.getByLabel("Explica con tus palabras").pressSequentially("Una relación sintética.");
  88  |     await keyboard(p.getByRole("button", { name: "Guardar mi respuesta", exact: true }));
  89  |     await keyboard(p.getByRole("button", { name: "Comparar con el modelo", exact: true }));
  90  |     await keyboard(p.getByRole("button", { name: "Lo recuperé", exact: true })); }
  91  |   if (key === "match") { const select = p.getByRole("combobox", { name: "Origen", exact: true });
  92  |     await select.focus(); await select.press("End"); await select.press("Tab");
  93  |     await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true })); }
  94  |   if (key === "sequence") await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  95  |   if (key === "image") { await p.getByLabel("Horizontal (%)").fill("20"); await p.getByLabel("Vertical (%)").fill("20");
  96  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta visual", exact: true })); }
  97  |   if (key === "case") { await choice(); await feedback();
  98  |     await expect(p.getByRole("heading", { name: /Etapa 2: relación sintética.*case-short-1/ })).toBeFocused();
  99  |     await answerPreview(p, "short"); return; }
  100 |   await feedback();
  101 | }
  102 | async function finishPreview(p: Locator) {
  103 |   await keyboard(p.getByRole("button", { name: "Finalizar sesión", exact: true }));
  104 |   await expect(p.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  105 | }
  106 | 
  107 | test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  108 |   test.setTimeout(600000);
  109 |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  110 |   expect(ready.testOnly).toBe(true);
  111 |   await actor(page, "editor");
  112 |   await page.goto("/panel/rutas/nueva?mode=v2");
  113 |   await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  114 |   await capture(page, info, "admin-empty");
  115 |   await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  116 |   for (const name of tabs) {
  117 |     const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
  118 |     await expect(tab).toHaveAttribute("aria-selected", "true");
  119 |     await capture(page, info, `admin-${tabs.indexOf(name)}`);
  120 |   }
  121 |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  122 |   for (const key of kinds) {
  123 |     const p = await previewPoint(page, key);
  124 |     await capture(page, info, `renderer-${key}`);
  125 |     await answerPreview(p, key); await finishPreview(p);
  126 |   }
  127 |   await keyboard(page.locator("[data-editor-preview]").getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  128 |   await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
  129 |   // CSS zoom exercises real 200% layout/text scaling in Chromium. It is documented
  130 |   // separately from native browser zoom and checked together with small viewports.
  131 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  132 |   await capture(page, info, "admin-zoom200");
  133 |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  134 |   const index = ["desktop", "360", "390", "768"].indexOf(info.project.name);
  135 |   const name = `student-${22 + index}`; await actor(page, name);
  136 |   await page.goto(slug); await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
  137 |   await capture(page, info, "learner-path");
  138 |   const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  139 |   await page.request.post(api + `/__test/map/${name}`, { data: {} });
  140 |   for (const [label, url] of [["today", "/aprendizaje?tab=hoy"], ["map", "/aprendizaje/mapa"],
  141 |     ["review-empty", "/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"]] as const) {
  142 |     await page.goto(url); await expect(page.locator("main").first()).toBeVisible();
  143 |     if (label === "map") await expect(page.getByRole("button", { name: "Vista de lista", exact: true })).toBeVisible();
  144 |     await capture(page, info, label);
  145 |     if (label === "map") { await keyboard(page.getByRole("button", { name: "Vista de lista", exact: true }));
  146 |       await capture(page, info, "map-list"); }
  147 |   }
  148 |   await launch(page, enrollmentId, "study-1");
  149 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  150 |   await capture(page, info, "learner-zoom200");
  151 |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  152 |   await keyboard(page.getByRole("button", { name: "Continuar a la práctica", exact: true }));
  153 |   await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  154 |   await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  155 |   await launch(page, enrollmentId, "constructed-1");
  156 |   await answerPreview(page.getByRole("region", { name: "Sesión de aprendizaje", exact: true }), "constructed");
  157 |   await finishPreview(page.getByRole("region", { name: "Sesión de aprendizaje", exact: true }));
  158 |   await launch(page, enrollmentId, "choice-1");
  159 |   const radio = page.getByRole("radio", { name: "Respuesta B", exact: true }); await radio.focus(); await radio.press("Space");
  160 |   const button = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
  161 |   const responsePattern = "**/api/v2/guided-learning/attempts/*/responses";
  162 |   await page.route(responsePattern, route => route.abort("failed"));
  163 |   await keyboard(button);
  164 |   const retry = page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true });
  165 |   await expect(retry).toBeVisible();
  166 |   await capture(page, info, "learner-error"); await page.unroute(responsePattern);
  167 |   let release!: () => void; const held = new Promise<void>(r => { release = r; });
  168 |   const inFlight: Promise<void>[] = [];
  169 |   await page.route(responsePattern, route => { const task = held.then(() => route.continue()); inFlight.push(task); return task; });
```