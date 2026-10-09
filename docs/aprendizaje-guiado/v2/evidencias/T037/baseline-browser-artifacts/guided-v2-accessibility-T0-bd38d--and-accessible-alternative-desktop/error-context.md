# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:130:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 60000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary "Navegación principal" [ref=e3]:
      - navigation [ref=e4]:
        - generic [ref=e5]:
          - link [ref=e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link [ref=e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link [ref=e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
          - button [ref=e22] [cursor=pointer]:
            - generic [aria-hidden]: Administrar
    - generic [ref=e25]:
      - banner [ref=e26]:
        - button "Expandir menú principal" [ref=e28] [cursor=pointer]
        - search "Buscar guías" [ref=e32]:
          - combobox "Buscar guías" [ref=e35]
        - heading "Koras" [level=1] [ref=e37]
        - generic [ref=e38]:
          - button "Notificaciones" [ref=e40] [cursor=pointer]
          - link [ref=e44] [cursor=pointer]:
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
            - tab "Datos y fuentes" [selected] [ref=e61] [cursor=pointer]
            - tab "Objetivos" [ref=e62] [cursor=pointer]
            - tab "Recorrido" [ref=e63] [cursor=pointer]
            - tab "Evaluación y repaso" [ref=e64] [cursor=pointer]
            - tab "Revisión" [ref=e65] [cursor=pointer]
          - tabpanel "Datos y fuentes" [ref=e66]:
            - generic [ref=e67]:
              - generic [ref=e68]:
                - generic [ref=e70]:
                  - text: Paso 1 de 5
                  - heading "Datos y fuentes" [level=2] [ref=e71]
                  - paragraph [ref=e72]: Los cambios se guardan cuando confirmas el borrador.
                - group "Datos de la ruta" [ref=e73]:
                  - generic [ref=e75]:
                    - generic [ref=e76]:
                      - generic [ref=e77]: Título
                      - textbox "Título" [ref=e78]: Ruta editorial T035
                    - generic [ref=e79]:
                      - generic [ref=e80]: Tema del catálogo
                      - combobox "Tema del catálogo" [ref=e81]:
                        - option "Tema T035" [selected]
                    - generic [ref=e82]:
                      - generic [ref=e83]: Nombre del tema
                      - textbox "Nombre del tema" [ref=e84]: Tema T035
                    - generic [ref=e85]:
                      - generic [ref=e86]: Descripción
                      - textbox "Descripción" [ref=e87]: Fixture de software sin contenido clínico real.
                    - generic [ref=e88]:
                      - generic [ref=e89]: Dirigida a
                      - textbox "Dirigida a" [ref=e90]: Alumno
                    - generic [ref=e91]:
                      - generic [ref=e92]: Disciplina
                      - combobox "Disciplina" [ref=e93]:
                        - option "Anatomía"
                        - option "Histología"
                        - option "Embriología"
                        - option "Fisiología"
                        - option "Bioquímica"
                        - option "Farmacología"
                        - option "Patología"
                        - option "Clínica"
                        - option "General" [selected]
                    - generic [ref=e94]:
                      - generic [ref=e95]: Portada
                      - combobox "Portada" [ref=e96]:
                        - option "Pulmones"
                        - option "Corazón" [selected]
                        - option "Cráneo"
                        - option "Cuello"
                        - option "Abdomen"
                        - option "Pelvis"
                        - option "Muslo"
                        - option "Espalda"
              - generic [ref=e97]:
                - generic [ref=e98]:
                  - generic [ref=e99]:
                    - generic [ref=e100]:
                      - heading "Fuentes" [level=2] [ref=e101]
                      - paragraph [ref=e102]: Localiza cada fragmento por sección o página y conserva su procedencia.
                    - button "Añadir fuente" [ref=e103] [cursor=pointer]
                  - generic [ref=e104]:
                    - generic [ref=e105]:
                      - generic [ref=e106]: Buscar guías del catálogo
                      - textbox "Buscar guías del catálogo" [ref=e107]
                    - button "Buscar guías" [ref=e108] [cursor=pointer]
                - region "Fuente 1" [ref=e109]:
                  - generic [ref=e110]:
                    - heading "Guía T035" [level=3] [ref=e111]
                    - button "Eliminar fuente" [disabled] [ref=e112]
                  - paragraph [ref=e113]: Esta fuente está vinculada a objetivos, actividades o recursos visuales. Retira esos vínculos antes de eliminarla.
                  - group "Editar Guía T035" [ref=e114]:
                    - generic [ref=e116]:
                      - generic [ref=e117]:
                        - generic [ref=e118]: Nombre de la fuente
                        - textbox "Nombre de la fuente" [ref=e119]: Guía T035
                      - generic [ref=e120]:
                        - generic [ref=e121]: Tipo de fuente
                        - combobox "Tipo de fuente" [ref=e122]:
                          - option "Guía del catálogo" [selected]
                          - option "Referencia bibliográfica"
                      - generic [ref=e123]:
                        - generic [ref=e124]: Guía y revisión
                        - combobox "Guía y revisión" [ref=e125]:
                          - option "Selecciona una guía con revisión"
                          - option "Guía T035 · revisión 1" [selected]
                        - generic [ref=e126]: La revisión y su huella se toman del catálogo. Cambiarla requiere localizar de nuevo el fragmento.
                      - generic [ref=e127]:
                        - generic [ref=e128]: Cita bibliográfica
                        - textbox "Cita bibliográfica" [ref=e129]: Fuente sintética (2026)
                      - generic [ref=e130]:
                        - generic [ref=e131]: Sección o encabezado
                        - textbox "Sección o encabezado" [ref=e132]: Fixture
                      - generic [ref=e133]:
                        - generic [ref=e134]: Página
                        - spinbutton "Página" [ref=e135]: "1"
                      - generic [ref=e136]:
                        - generic [ref=e137]: Ruta de secciones
                        - textbox "Ruta de secciones" [ref=e138]: Fixture
                        - generic [ref=e139]: Un encabezado por línea, desde la sección principal hasta el fragmento.
                      - generic [ref=e140]:
                        - generic [ref=e141]: Fragmento de la fuente
                        - textbox "Fragmento de la fuente" [ref=e142]: Contenido sintético para comprobar el software.
                      - generic [ref=e143]:
                        - generic [ref=e144]: Enlace HTTPS
                        - textbox "Enlace HTTPS" [ref=e145]
                      - generic [ref=e146]:
                        - generic [ref=e147]: Estado bibliográfico
                        - combobox "Estado bibliográfico" [ref=e148]:
                          - option "Fuente aportada"
                          - option "Verificada editorialmente" [selected]
                          - option "Pendiente de verificar"
                      - generic [ref=e149]:
                        - generic [ref=e150]: Fecha de comprobación
                        - textbox "Fecha de comprobación" [ref=e151]: 2026-10-04
                    - group [ref=e152]:
                      - generic "Detalles de trazabilidad" [ref=e153] [cursor=pointer]
        - generic [ref=e154]:
          - generic [ref=e155]:
            - strong [ref=e156]: Borrador al día
            - generic [ref=e157]: La versión mostrada procede del servidor.
          - button "Guardar borrador" [disabled] [ref=e158]
  - alert [ref=e159]
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
> 32  |     && Object.entries((element as unknown as Record<string, Record<string, unknown>>)[k] ?? {})
      |                                                                                                           ^ Error: expect(received).toBe(expected) // Object.is equality
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
  56  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
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
  98  |     ["review-empty", "/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"]]) {
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
```