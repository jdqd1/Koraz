# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:131:5

# Error details

```
TimeoutError: locator.selectOption: Timeout 60000ms exceeded.
Call log:
  - waiting for locator('[data-editor-preview]').getByLabel('Explorar un punto de la ruta')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary "Navegación principal" [ref=e3]:
      - navigation [ref=e4]:
        - generic [ref=e5]:
          - link "Inicio" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
          - button "Administrar" [ref=e22] [cursor=pointer]:
            - generic [aria-hidden]: Administrar
    - generic [ref=e25]:
      - banner [ref=e26]:
        - button "Expandir menú principal" [ref=e28] [cursor=pointer]
        - search "Buscar guías" [ref=e32]:
          - combobox "Buscar guías" [ref=e35]
        - heading "Koras" [level=1] [ref=e37]
        - generic [ref=e38]:
          - button "Notificaciones" [ref=e40] [cursor=pointer]
          - link "Acceder" [ref=e44] [cursor=pointer]:
            - /url: /acceder
      - main [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50]:
            - link "Volver a rutas" [ref=e51] [cursor=pointer]:
              - /url: /panel/rutas
            - heading "Ruta editorial T035" [level=1] [ref=e52]
            - paragraph [ref=e53]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
          - generic [ref=e54]:
            - strong [ref=e55]: Borrador
            - generic [ref=e56]: Revisión 1 · Sin cambios pendientes
        - button "Importar archivo de ruta" [ref=e58] [cursor=pointer]
        - generic [ref=e59]:
          - tablist "Secciones del editor de rutas" [ref=e60]:
            - tab "Datos y fuentes" [ref=e61] [cursor=pointer]
            - tab "Objetivos" [ref=e62] [cursor=pointer]
            - tab "Recorrido" [ref=e63] [cursor=pointer]
            - tab "Evaluación y repaso" [ref=e64] [cursor=pointer]
            - tab "Revisión" [selected] [ref=e65] [cursor=pointer]
          - tabpanel "Revisión" [ref=e66]:
            - generic [ref=e67]:
              - generic [ref=e68]:
                - heading "Revisión editorial" [level=2] [ref=e69]
                - paragraph [ref=e70]: Este contenido necesita una revisión vigente antes de publicarse.
                - paragraph [ref=e71]: La validación comprueba cobertura y fuentes. La aprobación editorial debe comprobar el contenido.
                - generic [ref=e72]:
                  - generic [ref=e73]: Nota de revisión o de nueva versión
                  - textbox "Nota de revisión o de nueva versión" [ref=e74]
                - generic [ref=e75]:
                  - button "Validar contenido" [ref=e76] [cursor=pointer]
                  - button "Enviar a revisión" [ref=e77] [cursor=pointer]
                - status
                - paragraph [ref=e78]: Comprobación local de cobertura; aún no confirma catálogo ni permisos.
                - list [ref=e79]:
                  - listitem [ref=e80]:
                    - strong [ref=e81]: "Aviso:"
                    - text: Diagnóstico limitado por una ruta con menos de cuatro objetivos.
                    - paragraph [ref=e82]: Registra esta limitación editorial.
                    - button "Ir al campo" [ref=e83] [cursor=pointer]
                - generic [ref=e84]:
                  - generic [ref=e85]: Notas editoriales de la ruta
                  - textbox "Notas editoriales de la ruta" [ref=e86]: Fixture sintético de integración.
              - region "Vista previa editorial" [ref=e87]:
                - heading "Vista previa de la ruta" [level=2] [ref=e88]
                - status [ref=e89]:
                  - strong [ref=e90]: Vista previa · no guarda progreso
                - paragraph [ref=e91]: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
                - generic [ref=e92]:
                  - text: Perfil de vista previa
                  - combobox "Perfil de vista previa" [ref=e93]:
                    - option "Principiante" [selected]
                    - option "Diagnóstico correcto"
                    - option "Error CORE"
                - button "Abrir vista previa" [ref=e94] [cursor=pointer]
                - status [ref=e95]: No se pudo abrir la vista previa. Comprueba los permisos, las fuentes y las incidencias del borrador.
              - generic [ref=e96]:
                - heading "Archivos y procedencia" [level=3] [ref=e97]
                - paragraph [ref=e98]: Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.
                - group "Revisar los archivos de la ruta" [ref=e99]:
                  - generic [ref=e101]:
                    - generic [ref=e102]:
                      - generic [ref=e103]: "Archivo: fixture.png"
                      - 'combobox "Archivo: fixture.png" [ref=e104]':
                        - option "Selecciona un archivo revisado"
                        - option "fixture.png" [selected]
                    - generic [ref=e105]:
                      - generic [ref=e106]: Derechos de fixture.png
                      - combobox "Derechos de fixture.png" [ref=e107]:
                        - option "Sin verificar"
                        - option "Propios" [selected]
                        - option "Con licencia"
                        - option "Dominio público"
                    - generic [ref=e108]:
                      - generic [ref=e109]: Crédito de fixture.png
                      - textbox "Crédito de fixture.png" [ref=e110]: Fixture del software
                    - generic [ref=e111]:
                      - generic [ref=e112]: Texto alternativo de fixture.png
                      - textbox "Texto alternativo de fixture.png" [ref=e113]: Píxel sintético para comprobar coordenadas
                    - generic [ref=e114]:
                      - generic [ref=e115]: Huella del archivo fixture.png
                      - textbox "Huella del archivo fixture.png" [ref=e116]
                      - generic [ref=e117]: Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.
              - generic [ref=e118]:
                - heading "Exportar" [level=3] [ref=e119]
                - paragraph [ref=e120]: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
                - generic [ref=e121]:
                  - button "Exportar paquete" [ref=e122] [cursor=pointer]
                  - button "Descargar cobertura" [ref=e123] [cursor=pointer]
                - status
        - generic [ref=e124]:
          - generic [ref=e125]:
            - strong [ref=e126]: Borrador al día
            - generic [ref=e127]: La versión mostrada procede del servidor.
          - button "Guardar borrador" [disabled] [ref=e128]
  - alert [ref=e129]
```

# Test source

```ts
  1   | import { test, expect, type Page, type Locator, type TestInfo } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | import { writeFile } from "node:fs/promises";
  4   | 
  5   | const api = "http://127.0.0.1:41035";
  6   | const root = "/api/v2/guided-learning/";
  7   | const slug = "/aprendizaje/rutas/t035-small";
  8   | const tabs = ["Datos y fuentes", "Objetivos", "Recorrido", "Evaluación y repaso", "Revisión"];
  9   | const kinds = ["study", "constructed", "choice", "short", "match", "sequence", "image", "case"];
  10  | async function actor(page: Page, name: string) {
  11  |   await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  12  |   await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  13  | }
  14  | async function post(page: Page, path: string, data: unknown) {
  15  |   const r = await page.request.post(root + path, { data, headers: { "idempotency-key": crypto.randomUUID() } });
  16  |   expect(r.status(), await r.text()).toBe(200); return r.json();
  17  | }
  18  | async function state(page: Page, id: string) {
  19  |   return (await (await page.request.get(root + `enrollments/${id}/state`)).json()).state;
  20  | }
  21  | async function launch(page: Page, id: string, key: string) {
  22  |   const s = await state(page, id);
  23  |   const a = (await post(page, "attempts", { clientAttemptId: crypto.randomUUID(), enrollmentId: id,
  24  |     target: { kind: "activity", key }, expectedEnrollmentVersion: s.rowVersion })).attempt;
  25  |   await page.goto(`/aprendizaje/sesiones/${a.attemptId}`);
  26  |   await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeVisible();
  27  |   return a;
  28  | }
  29  | async function keyboard(locator: Locator) { await locator.focus(); await locator.press("Enter"); }
  30  | async function hydrated(locator: Locator) {
  31  |   await expect.poll(() => locator.evaluate(element => Object.keys(element).some(k => k.startsWith("__reactProps")
  32  |     && Object.entries((element as unknown as Record<string, Record<string, unknown>>)[k] ?? {})
  33  |       .some(([name, value]) => name.startsWith("on") && typeof value === "function")))).toBe(true);
  34  | }
  35  | 
  36  | // Audit the complete page, including its shared shell: no axe exclusions.
  37  | async function capture(page: Page, info: TestInfo, name: string) {
  38  |   await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  39  |   const axe = await new AxeBuilder({ page }).analyze();
  40  |   await writeFile(info.outputPath(`${name}-axe.json`), JSON.stringify(axe, null, 2));
  41  |   const cdp = await page.context().newCDPSession(page);
  42  |   const tree = await cdp.send("Accessibility.getFullAXTree"); await cdp.detach();
  43  |   await writeFile(info.outputPath(`${name}-ax.json`), JSON.stringify(tree, null, 2));
  44  |   const geometry = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
  45  |     pageWidth: document.documentElement.scrollWidth, zoom: getComputedStyle(document.documentElement).zoom,
  46  |     focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 160) },
  47  |     controls: [...document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("main button, main input, main select")]
  48  |       .filter(e => e.getClientRects().length && !e.disabled).map(e => { const b = e.getBoundingClientRect();
  49  |         return { name: e.getAttribute("aria-label") ?? e.textContent?.slice(0, 90), width: b.width, height: b.height }; }) }));
  50  |   await writeFile(info.outputPath(`${name}-geometry.json`), JSON.stringify(geometry, null, 2));
  51  |   expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
  52  |   expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
  53  | }
  54  | async function previewPoint(page: Page, key: string) {
  55  |   const p = page.locator("[data-editor-preview]");
> 56  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
      |                                                      ^ TimeoutError: locator.selectOption: Timeout 60000ms exceeded.
  57  |   await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  58  |   await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  59  |   if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  60  |   return p;
  61  | }
  62  | 
  63  | test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  64  |   test.setTimeout(600000);
  65  |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  66  |   expect(ready.testOnly).toBe(true);
  67  |   await actor(page, "editor");
  68  |   await page.goto("/panel/rutas/nueva?mode=v2");
  69  |   await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  70  |   await capture(page, info, "admin-empty");
  71  |   await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  72  |   for (const name of tabs) {
  73  |     const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
  74  |     await expect(tab).toHaveAttribute("aria-selected", "true");
  75  |     await capture(page, info, `admin-${tabs.indexOf(name)}`);
  76  |   }
  77  |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  78  |   for (const key of kinds) {
  79  |     // The preview closes as an inline session; reopen it for each independent point.
  80  |     const p = await previewPoint(page, key);
  81  |     await capture(page, info, `renderer-${key}`);
  82  |     await keyboard(p.getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  83  |     await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
  84  |     if (key !== kinds.at(-1)) await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  85  |   }
  86  |   // CSS zoom exercises real 200% layout/text scaling in Chromium. It is documented
  87  |   // separately from native browser zoom and checked together with small viewports.
  88  |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  89  |   await capture(page, info, "admin-zoom200");
  90  |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  91  |   const index = ["desktop", "360", "390", "768"].indexOf(info.project.name);
  92  |   const name = `student-${22 + index}`; await actor(page, name);
  93  |   await page.goto(slug); await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
  94  |   await capture(page, info, "learner-path");
  95  |   const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  96  |   await page.request.post(api + `/__test/map/${name}`, { data: {} });
  97  |   for (const [label, url] of [["today", "/aprendizaje?tab=hoy"], ["map", "/aprendizaje/mapa"],
  98  |     ["review-empty", "/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"]] as const) {
  99  |     await page.goto(url); await expect(page.locator("main")).toBeVisible(); await capture(page, info, label!);
  100 |   }
  101 |   await launch(page, enrollmentId, "study-1");
  102 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  103 |   await capture(page, info, "learner-zoom200");
  104 |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  105 |   await keyboard(page.getByRole("button", { name: "Continuar a la práctica", exact: true }));
  106 |   await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  107 |   await expect(page.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  108 |   await launch(page, enrollmentId, "choice-1");
  109 |   const radio = page.getByRole("radio", { name: "Respuesta B", exact: true }); await radio.focus(); await radio.press("Space");
  110 |   const button = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
  111 |   const responsePattern = "**/api/v2/guided-learning/attempts/*/responses";
  112 |   let release!: () => void; const held = new Promise<void>(r => { release = r; });
  113 |   await page.route(responsePattern, async route => { await held; await route.continue(); });
  114 |   await keyboard(button);
  115 |   await expect(page.getByText("Guardando…", { exact: true })).toBeVisible();
  116 |   await capture(page, info, "learner-loading"); release(); await page.unroute(responsePattern);
  117 |   await expect(page.getByRole("heading", { name: "Vamos a reforzar este punto", exact: true })).toBeFocused();
  118 |   await capture(page, info, "learner-feedback");
  119 |   await keyboard(page.getByRole("button", { name: "Ver cierre de sesión", exact: true }));
  120 |   await keyboard(page.getByRole("button", { name: "Finalizar sesión", exact: true }));
  121 |   await launch(page, enrollmentId, "short-1");
  122 |   await page.getByLabel("Tu respuesta", { exact: true }).fill("respuesta");
  123 |   await page.route(responsePattern, route => route.abort("failed"));
  124 |   await keyboard(page.getByRole("button", { name: "Comprobar respuesta", exact: true }));
  125 |   await expect(page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true })).toBeVisible();
  126 |   await capture(page, info, "learner-error"); await page.unroute(responsePattern);
  127 |   await keyboard(page.getByRole("button", { name: "Reintentar solicitud pendiente", exact: true }));
  128 |   await expect(page.getByRole("heading", { name: "Respuesta correcta", exact: true })).toBeFocused();
  129 | });
  130 | 
  131 | test("T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative", async ({ page }, info) => {
  132 |   test.setTimeout(360000); await actor(page, "editor");
  133 |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  134 |   await page.goto(`/panel/rutas/${ready.fixtures[info.project.name === "desktop" ? "editorial" : "editorial-mobile"].pathId}`);
  135 |   const tab = page.getByRole("tab", { name: "Revisión", exact: true }); await hydrated(tab); await keyboard(tab);
  136 |   await page.emulateMedia({ reducedMotion: "reduce" });
  137 |   expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  138 |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  139 |   const p = await previewPoint(page, "image");
  140 |   const surface = p.getByRole("group", { name: "Imagen para responder", exact: true });
  141 |   const img = surface.locator("img");
  142 |   const b = await img.boundingBox(); expect(b).not.toBeNull();
  143 |   // The square fixture letterboxes in a wide container on desktop/tablet.
  144 |   const natural = await img.evaluate(e => ({ width: (e as HTMLImageElement).naturalWidth, height: (e as HTMLImageElement).naturalHeight }));
  145 |   const scale = Math.min(b!.width / natural.width, b!.height / natural.height);
  146 |   const w = natural.width * scale, h = natural.height * scale;
  147 |   const box = { x: b!.x + (b!.width - w) / 2, y: b!.y + (b!.height - h) / 2, width: w, height: h };
  148 |   if (b!.width > w + 4) { await img.click({ position: { x: 1, y: b!.height / 2 } }); await expect(p.getByLabel("Horizontal (%)")).toHaveValue(""); }
  149 |   const x = box.x + w * .2, y = box.y + h * .2;
  150 |   await surface.scrollIntoViewIfNeeded();
  151 |   if (info.project.name === "360" || info.project.name === "390") {
  152 |     // Geometry is refreshed after scroll, because touch uses viewport coordinates.
  153 |     const current = await img.boundingBox(); const dx = current!.x - b!.x, dy = current!.y - b!.y;
  154 |     await page.touchscreen.tap(x + dx, y + dy);
  155 |   } else await img.click({ position: { x: x - b!.x, y: y - b!.y } });
  156 |   await expect(p.getByLabel("Horizontal (%)")).toHaveValue("20");
```