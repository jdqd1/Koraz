# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:195:5

# Error details

```
TimeoutError: locator.selectOption: Timeout 60000ms exceeded.
Call log:
  - waiting for locator('[data-editor-preview]').getByLabel('Explorar un punto de la ruta')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
            - generic [ref=e56]: Revisión 1 · Cambios sin guardar
        - button "Importar archivo de ruta" [ref=e58] [cursor=pointer]
        - generic [ref=e59]:
          - tablist "Secciones del editor de rutas" [ref=e60]:
            - tab "Datos y fuentes" [ref=e61] [cursor=pointer]
            - tab "Objetivos" [ref=e62] [cursor=pointer]
            - tab "Recorrido" [ref=e63] [cursor=pointer]
            - tab "Evaluación y repaso" [ref=e64] [cursor=pointer]
            - tab "Revisión" [active] [selected] [ref=e65] [cursor=pointer]
          - tabpanel "Revisión" [ref=e66]:
            - generic [ref=e67]:
              - generic [ref=e68]:
                - heading "Revisión editorial" [level=2] [ref=e69]
                - paragraph [ref=e70]: Este contenido necesita una revisión vigente antes de publicarse.
                - paragraph [ref=e71]: Guarda los cambios antes de validar, revisar o exportar.
                - generic [ref=e72]:
                  - generic [ref=e73]: Nota de revisión o de nueva versión
                  - textbox "Nota de revisión o de nueva versión" [ref=e74]
                - generic [ref=e75]:
                  - button "Validar contenido" [disabled] [ref=e76]
                  - button "Enviar a revisión" [disabled] [ref=e77]
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
                  - combobox "Perfil de vista previa" [disabled] [ref=e93]:
                    - option "Principiante" [selected]
                    - option "Diagnóstico correcto"
                    - option "Error CORE"
                - button "Abrir vista previa" [disabled] [ref=e94]
                - status
              - generic [ref=e95]:
                - heading "Archivos y procedencia" [level=3] [ref=e96]
                - paragraph [ref=e97]: Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.
                - group "Revisar los archivos de la ruta" [ref=e98]:
                  - generic [ref=e100]:
                    - generic [ref=e101]:
                      - generic [ref=e102]: "Archivo: fixture.png"
                      - 'combobox "Archivo: fixture.png" [ref=e103]':
                        - option "Selecciona un archivo revisado"
                        - option "fixture.png" [selected]
                    - generic [ref=e104]:
                      - generic [ref=e105]: Derechos de fixture.png
                      - combobox "Derechos de fixture.png" [ref=e106]:
                        - option "Sin verificar"
                        - option "Propios" [selected]
                        - option "Con licencia"
                        - option "Dominio público"
                    - generic [ref=e107]:
                      - generic [ref=e108]: Crédito de fixture.png
                      - textbox "Crédito de fixture.png" [ref=e109]: Fixture del software
                    - generic [ref=e110]:
                      - generic [ref=e111]: Texto alternativo de fixture.png
                      - textbox "Texto alternativo de fixture.png" [ref=e112]: Píxel sintético para comprobar coordenadas
                    - generic [ref=e113]:
                      - generic [ref=e114]: Huella del archivo fixture.png
                      - textbox "Huella del archivo fixture.png" [ref=e115]
                      - generic [ref=e116]: Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.
              - generic [ref=e117]:
                - heading "Exportar" [level=3] [ref=e118]
                - paragraph [ref=e119]: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
                - generic [ref=e120]:
                  - button "Exportar paquete" [disabled] [ref=e121]
                  - button "Descargar cobertura" [disabled] [ref=e122]
                - status
        - generic [ref=e123]:
          - generic [ref=e124]:
            - strong [ref=e125]: Cambios sin guardar
            - generic [ref=e126]: Cambios sin guardar. La revisión anterior ya no acredita esta copia.
          - button "Guardar borrador" [ref=e127] [cursor=pointer]
  - alert [ref=e128]
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
> 57  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
      |                                                      ^ TimeoutError: locator.selectOption: Timeout 60000ms exceeded.
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
  82  |     await expect(p.getByRole("heading", { name: /Etapa 2: relación sintética.*case-short-1/ })).toBeFocused();
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
```