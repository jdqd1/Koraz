# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02 tab order, field reachability and modal focus restoration
- Location: tests\e2e\guided-v2-accessibility.spec.ts:268:5

# Error details

```
Error: keyboard-objectives: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 187

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"app-shell   sidebar-collapsed\">",
+                 "target": Array [
+                   ".app-shell",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"app-shell   sidebar-collapsed\">",
+                 "target": Array [
+                   ".app-shell",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"app-shell   sidebar-collapsed\">",
+                 "target": Array [
+                   ".app-shell",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"app-shell   sidebar-collapsed\">",
+                 "target": Array [
+                   ".app-shell",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Rutas de<br>aprendizaje</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"aprendizaje\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: keyboard-dialog: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f7f9",
+               "contrastRatio": 3.64,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\" data-aria-hidden=\"true\" aria-hidden=\"true\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__primaryAction\" type=\"button\">Guardar y salir</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__dialogActions > .route-editor-module__Uwf6nG__primaryAction",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f7f9",
+               "contrastRatio": 3.64,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\" data-aria-hidden=\"true\" aria-hidden=\"true\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__primaryAction\" type=\"button\">Guardar y salir</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__dialogActions > .route-editor-module__Uwf6nG__primaryAction",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f7f9",
+               "contrastRatio": 3.64,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\" data-aria-hidden=\"true\" aria-hidden=\"true\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__primaryAction\" type=\"button\">Guardar y salir</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__dialogActions > .route-editor-module__Uwf6nG__primaryAction",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Koras" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - link "Acceder" [ref=e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - link "Volver a rutas" [active] [ref=e25] [cursor=pointer]:
            - /url: /panel/rutas
          - heading "Nueva ruta" [level=1] [ref=e26]
          - paragraph [ref=e27]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
        - generic [ref=e28]:
          - strong [ref=e29]: Nueva ruta
          - generic [ref=e30]: Sin guardar · Cambios sin guardar
      - button "Importar archivo de ruta" [ref=e32] [cursor=pointer]
      - generic [ref=e33]:
        - tablist "Secciones del editor de rutas" [ref=e34]:
          - tab "Datos y fuentes" [ref=e35] [cursor=pointer]
          - tab "Objetivos" [selected] [ref=e36] [cursor=pointer]
          - tab "Recorrido" [ref=e37] [cursor=pointer]
          - tab "Evaluación y repaso" [ref=e38] [cursor=pointer]
          - tab "Revisión" [ref=e39] [cursor=pointer]
        - tabpanel "Objetivos" [ref=e40]:
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]:
                - text: Paso 2 de 5
                - heading "Objetivos" [level=2] [ref=e45]
                - paragraph [ref=e46]: Describe capacidades observables y elige sus fuentes.
              - button "Añadir objetivo" [disabled] [ref=e47]
            - paragraph [ref=e48]: Crea una unidad para agrupar los primeros objetivos.
            - group [ref=e49]:
              - generic [ref=e50]:
                - generic [ref=e51]:
                  - generic [ref=e52]: Nombre de nueva unidad
                  - textbox "Nombre de nueva unidad" [ref=e53]
                - button "Añadir unidad" [disabled] [ref=e54]
            - paragraph [ref=e55]: Este borrador todavía no tiene objetivos.
      - generic [ref=e56]:
        - generic [ref=e57]:
          - strong [ref=e58]: Cambios sin guardar
          - generic [ref=e59]: Cambios sin guardar. La revisión anterior ya no acredita esta copia.
        - button "Guardar borrador" [ref=e60] [cursor=pointer]
    - navigation "Navegación móvil" [ref=e61]:
      - link "Inicio" [ref=e62] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e66] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e71] [cursor=pointer]
      - link [ref=e75] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e78]: Rutas deaprendizaje
  - alert [ref=e79]
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
> 52  |   expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
      |                                                                                                             ^ Error: keyboard-dialog: axe
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
```