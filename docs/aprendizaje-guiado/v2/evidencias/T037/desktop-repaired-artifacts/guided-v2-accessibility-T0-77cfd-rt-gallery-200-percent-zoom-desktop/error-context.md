# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:91:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: locator('[data-editor-preview]').getByRole('heading', { name: 'case-short-1: actividad sintética', exact: true })
Expected: focused
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeFocused" locator('[data-editor-preview]').getByRole('heading', { name: 'case-short-1: actividad sintética', exact: true }) with timeout 60000ms
  - waiting for locator('[data-editor-preview]').getByRole('heading', { name: 'case-short-1: actividad sintética', exact: true })

```

```yaml
- complementary "Navegación principal":
  - navigation:
    - link "Inicio":
      - /url: /dashboard
      - img
    - link "Aprendizaje guiado":
      - /url: /aprendizaje
      - img
    - link "Materias":
      - /url: /asignaturas
      - img
    - button "Material de estudio":
      - img
    - button "Administrar":
      - img
- banner:
  - button "Expandir menú principal"
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Koras" [level=1]
  - button "Notificaciones"
  - link "Acceder":
    - /url: /acceder
- main:
  - link "Volver a rutas":
    - /url: /panel/rutas
  - heading "Ruta editorial T035" [level=1]
  - paragraph: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
  - strong: Borrador
  - text: Revisión 1 · Sin cambios pendientes
  - button "Importar archivo de ruta"
  - tablist "Secciones del editor de rutas":
    - tab "Datos y fuentes"
    - tab "Objetivos"
    - tab "Recorrido"
    - tab "Evaluación y repaso"
    - tab "Revisión" [selected]
  - tabpanel "Revisión":
    - heading "Revisión editorial" [level=2]
    - paragraph: Este contenido necesita una revisión vigente antes de publicarse.
    - paragraph: La validación comprueba cobertura y fuentes. La aprobación editorial debe comprobar el contenido.
    - text: Nota de revisión o de nueva versión
    - textbox "Nota de revisión o de nueva versión"
    - button "Validar contenido"
    - button "Enviar a revisión"
    - status
    - paragraph: Comprobación local de cobertura; aún no confirma catálogo ni permisos.
    - list:
      - listitem:
        - strong: "Aviso:"
        - text: Diagnóstico limitado por una ruta con menos de cuatro objetivos.
        - paragraph: Registra esta limitación editorial.
        - button "Ir al campo"
    - text: Notas editoriales de la ruta
    - textbox "Notas editoriales de la ruta": Fixture sintético de integración.
    - region "Vista previa editorial":
      - heading "Vista previa de la ruta" [level=2]
      - status:
        - strong: Vista previa · no guarda progreso
      - paragraph: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
      - paragraph:
        - text: "Reloj simulado:"
        - time: 4/10/2026, 8:00:00 a. m.
        - text: (America/Caracas).
      - paragraph: La sesión editorial vence en diez minutos reales. Cerrar o reiniciar descarta sus resultados.
      - button "Avanzar 1 día" [disabled]
      - button "Avanzar 7 días" [disabled]
      - button "Avanzar 30 días" [disabled]
      - button "Cerrar vista previa"
      - status
      - region "Sesión de aprendizaje":
        - button "Cerrar vista previa"
        - text: Aprendizaje guiado
        - heading "Tu sesión de aprendizaje" [level=1]
        - status: Estado simulado
        - status: Respuesta simulada. No guarda progreso.
        - text: Recorrido en curso Dominio por comprobar Consolidación pendiente 0 repasos pendientes 7 actividades completadas de 9
        - paragraph: "Objetivo: Práctica del objetivo actual"
        - 'heading "Etapa 2: relación sintética case-short-1: actividad sintética" [level=2]'
        - paragraph: Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.
        - text: Tu respuesta
        - textbox "Tu respuesta"
        - paragraph: 0 / 200 caracteres
        - button "Comprobar respuesta" [disabled]
        - button "Necesito ayuda"
        - button "Consultar fuente con ayuda"
    - heading "Archivos y procedencia" [level=3]
    - paragraph: Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.
    - group "Revisar los archivos de la ruta":
      - text: "Revisar los archivos de la ruta Archivo: fixture.png"
      - 'combobox "Archivo: fixture.png"':
        - option "Selecciona un archivo revisado"
        - option "fixture.png" [selected]
      - text: Derechos de fixture.png
      - combobox "Derechos de fixture.png":
        - option "Sin verificar"
        - option "Propios" [selected]
        - option "Con licencia"
        - option "Dominio público"
      - text: Crédito de fixture.png
      - textbox "Crédito de fixture.png": Fixture del software
      - text: Texto alternativo de fixture.png
      - textbox "Texto alternativo de fixture.png": Píxel sintético para comprobar coordenadas
      - text: Huella del archivo fixture.png
      - textbox "Huella del archivo fixture.png"
      - text: Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.
    - heading "Exportar" [level=3]
    - paragraph: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
    - button "Exportar paquete"
    - button "Descargar cobertura"
    - status
  - strong: Borrador al día
  - text: La versión mostrada procede del servidor.
  - button "Guardar borrador" [disabled]
- alert
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
  27  |   await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeVisible();
  28  |   return a;
  29  | }
  30  | async function keyboard(locator: Locator) { await locator.focus(); await locator.press("Enter"); }
  31  | async function hydrated(locator: Locator) {
  32  |   await expect.poll(() => locator.evaluate(element => Object.keys(element).some(k => k.startsWith("__reactProps")
  33  |     && Object.entries((element as unknown as Record<string, Record<string, unknown>>)[k] ?? {})
  34  |       .some(([name, value]) => name.startsWith("on") && typeof value === "function")))).toBe(true);
  35  | }
  36  | 
  37  | // Audit the complete page, including its shared shell: no axe exclusions.
  38  | async function capture(page: Page, info: TestInfo, name: string) {
  39  |   await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  40  |   const axe = await new AxeBuilder({ page }).analyze();
  41  |   await writeFile(info.outputPath(`${name}-axe.json`), JSON.stringify(axe, null, 2));
  42  |   const cdp = await page.context().newCDPSession(page);
  43  |   const tree = await cdp.send("Accessibility.getFullAXTree"); await cdp.detach();
  44  |   await writeFile(info.outputPath(`${name}-ax.json`), JSON.stringify(tree, null, 2));
  45  |   const geometry = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
  46  |     pageWidth: document.documentElement.scrollWidth, zoom: getComputedStyle(document.documentElement).zoom, devicePixelRatio,
  47  |     focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 160) },
  48  |     controls: [...document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("main button, main input, main select")]
  49  |       .filter(e => e.getClientRects().length && !e.disabled).map(e => { const b = e.getBoundingClientRect();
  50  |         return { name: e.getAttribute("aria-label") ?? e.textContent?.slice(0, 90), width: b.width, height: b.height }; }) }));
  51  |   await writeFile(info.outputPath(`${name}-geometry.json`), JSON.stringify(geometry, null, 2));
  52  |   expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
  53  |   expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
  54  | }
  55  | async function previewPoint(page: Page, key: string) {
  56  |   const p = page.locator("[data-editor-preview]");
  57  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
  58  |   await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  59  |   await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  60  |   if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  61  |   return p;
  62  | }
  63  | async function answerPreview(p: Locator, key: string) {
  64  |   const choice = async () => { const radio = p.getByRole("radio", { name: "Respuesta A", exact: true });
  65  |     await radio.focus(); await radio.press("Space"); await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); };
  66  |   const feedback = async () => keyboard(p.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).last());
  67  |   if (key === "study") { await keyboard(p.getByRole("button", { name: "Continuar a la práctica", exact: true })); return; }
  68  |   if (key === "choice" || key === "apply") await choice();
  69  |   if (key === "short") { await p.getByLabel("Tu respuesta", { exact: true }).pressSequentially("respuesta");
  70  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); }
  71  |   if (key === "constructed") { await p.getByLabel("Explica con tus palabras").pressSequentially("Una relación sintética.");
  72  |     await keyboard(p.getByRole("button", { name: "Guardar mi respuesta", exact: true }));
  73  |     await keyboard(p.getByRole("button", { name: "Comparar con el modelo", exact: true }));
  74  |     await keyboard(p.getByRole("button", { name: "Lo recuperé", exact: true })); }
  75  |   if (key === "match") { const select = p.getByRole("combobox", { name: "Origen", exact: true });
  76  |     await select.focus(); await select.press("End"); await select.press("Tab");
  77  |     await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true })); }
  78  |   if (key === "sequence") await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  79  |   if (key === "image") { await p.getByLabel("Horizontal (%)").fill("20"); await p.getByLabel("Vertical (%)").fill("20");
  80  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta visual", exact: true })); }
  81  |   if (key === "case") { await choice(); await feedback();
> 82  |     await expect(p.getByRole("heading", { name: "case-short-1: actividad sintética", exact: true })).toBeFocused();
      |                                                                                                      ^ Error: expect(locator).toBeFocused() failed
  83  |     await answerPreview(p, "short"); return; }
  84  |   await feedback();
  85  | }
  86  | async function finishPreview(p: Locator) {
  87  |   await keyboard(p.getByRole("button", { name: "Finalizar sesión", exact: true }));
  88  |   await expect(p.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  89  | }
  90  | 
  91  | test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  92  |   test.setTimeout(600000);
  93  |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  94  |   expect(ready.testOnly).toBe(true);
  95  |   await actor(page, "editor");
  96  |   await page.goto("/panel/rutas/nueva?mode=v2");
  97  |   await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  98  |   await capture(page, info, "admin-empty");
  99  |   await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  100 |   for (const name of tabs) {
  101 |     const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
  102 |     await expect(tab).toHaveAttribute("aria-selected", "true");
  103 |     await capture(page, info, `admin-${tabs.indexOf(name)}`);
  104 |   }
  105 |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  106 |   for (const key of kinds) {
  107 |     const p = await previewPoint(page, key);
  108 |     await capture(page, info, `renderer-${key}`);
  109 |     await answerPreview(p, key); await finishPreview(p);
  110 |   }
  111 |   await keyboard(page.locator("[data-editor-preview]").getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  112 |   await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
  113 |   // CSS zoom exercises real 200% layout/text scaling in Chromium. It is documented
  114 |   // separately from native browser zoom and checked together with small viewports.
  115 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  116 |   await capture(page, info, "admin-zoom200");
  117 |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  118 |   const index = ["desktop", "360", "390", "768"].indexOf(info.project.name);
  119 |   const name = `student-${22 + index}`; await actor(page, name);
  120 |   await page.goto(slug); await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
  121 |   await capture(page, info, "learner-path");
  122 |   const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  123 |   await page.request.post(api + `/__test/map/${name}`, { data: {} });
  124 |   for (const [label, url] of [["today", "/aprendizaje?tab=hoy"], ["map", "/aprendizaje/mapa"],
  125 |     ["review-empty", "/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"]] as const) {
  126 |     await page.goto(url); await expect(page.locator("main").first()).toBeVisible();
  127 |     if (label === "map") await expect(page.getByRole("button", { name: "Vista de lista", exact: true })).toBeVisible();
  128 |     await capture(page, info, label);
  129 |     if (label === "map") { await keyboard(page.getByRole("button", { name: "Vista de lista", exact: true }));
  130 |       await capture(page, info, "map-list"); }
  131 |   }
  132 |   await launch(page, enrollmentId, "study-1");
  133 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  134 |   await capture(page, info, "learner-zoom200");
  135 |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  136 |   await keyboard(page.getByRole("button", { name: "Continuar a la práctica", exact: true }));
  137 |   await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  138 |   await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  139 |   await launch(page, enrollmentId, "choice-1");
  140 |   const radio = page.getByRole("radio", { name: "Respuesta B", exact: true }); await radio.focus(); await radio.press("Space");
  141 |   const button = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
  142 |   const responsePattern = "**/api/v2/guided-learning/attempts/*/responses";
  143 |   let release!: () => void; const held = new Promise<void>(r => { release = r; });
  144 |   await page.route(responsePattern, async route => { await held; await route.continue(); });
  145 |   await keyboard(button);
  146 |   await expect(page.getByText("Guardando…", { exact: true })).toBeVisible();
  147 |   await capture(page, info, "learner-loading"); release(); await page.unroute(responsePattern);
  148 |   await expect(page.getByRole("heading", { name: "Vamos a reforzar este punto", exact: true })).toBeFocused();
  149 |   await capture(page, info, "learner-feedback");
  150 |   await keyboard(page.getByRole("button", { name: "Ver cierre de sesión", exact: true }));
  151 |   await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  152 |   await launch(page, enrollmentId, "short-1");
  153 |   await page.getByLabel("Tu respuesta", { exact: true }).fill("respuesta");
  154 |   await page.route(responsePattern, route => route.abort("failed"));
  155 |   await keyboard(page.getByRole("button", { name: "Comprobar respuesta", exact: true }));
  156 |   await expect(page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true })).toBeVisible();
  157 |   await capture(page, info, "learner-error"); await page.unroute(responsePattern);
  158 |   await keyboard(page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true }));
  159 |   await expect(page.getByRole("heading", { name: "Respuesta correcta", exact: true })).toBeFocused();
  160 | });
  161 | 
  162 | test("T037 V03 native browser zoom at 200 percent", async ({}, info) => {
  163 |   test.skip(info.project.name !== "desktop", "Native zoom uses a dedicated Chromium context once.");
  164 |   const extension = resolve("../../docs/aprendizaje-guiado/v2/evidencias/T037/native-zoom-extension");
  165 |   const context = await chromium.launchPersistentContext("", { channel: "chromium", headless: true,
  166 |     viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true,
  167 |     args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  168 |   try {
  169 |     const worker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
  170 |     const page = context.pages()[0]!; await actor(page, "editor");
  171 |     await page.goto("http://127.0.0.1:31035/panel/rutas/nueva?mode=v2");
  172 |     await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  173 |     // The temporary, local-only extension drives Chromium's native tab zoom.
  174 |     // Verify the changed CSS viewport and DPR instead of assuming CSS zoom is equivalent.
  175 |     await worker.evaluate(async () => {
  176 |       const browser = (globalThis as unknown as { chrome: { tabs: {
  177 |         query(input: object): Promise<{ id: number; url?: string }[]>; setZoom(id: number, value: number): Promise<void>;
  178 |       } } }).chrome;
  179 |       const target = (await browser.tabs.query({})).find(tab => tab.url?.startsWith("http://127.0.0.1:31035/"));
  180 |       if (!target) throw new Error("Local fixture tab required");
  181 |       await browser.tabs.setZoom(target.id, 2);
  182 |     });
```