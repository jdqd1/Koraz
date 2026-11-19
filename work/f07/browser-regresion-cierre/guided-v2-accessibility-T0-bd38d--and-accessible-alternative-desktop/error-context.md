# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:242:5

# Error details

```
Error: image-zoom-reduced-motion: axe

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 93

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
+               "bgColor": "#edf0f7",
+               "contrastRatio": 3.62,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7c7c85",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.62 (foreground color: #7c7c85, background color: #edf0f7, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
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
+   Element has insufficient color contrast of 3.62 (foreground color: #7c7c85, background color: #edf0f7, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<small>16</small>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#radix-_R_3lfiv5u9fnb_-trigger-journey > small",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 4.38,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#657a97",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.38 (foreground color: #657a97, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"Uwf6nG_card undefined\">",
+                 "target": Array [
+                   ".undefined.Uwf6nG_card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.38 (foreground color: #657a97, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<small>Sugerencia</small>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "h5 > small",
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
Error: image-alternative: axe

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 93

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
+               "bgColor": "#edf0f7",
+               "contrastRatio": 3.62,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7c7c85",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.62 (foreground color: #7c7c85, background color: #edf0f7, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
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
+   Element has insufficient color contrast of 3.62 (foreground color: #7c7c85, background color: #edf0f7, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<small>16</small>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#radix-_R_3lfiv5u9fnb_-trigger-journey > small",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 4.38,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#657a97",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.38 (foreground color: #657a97, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"Uwf6nG_card undefined\">",
+                 "target": Array [
+                   ".undefined.Uwf6nG_card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.38 (foreground color: #657a97, background color: #ffffff, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<small>Sugerencia</small>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "h5 > small",
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
Error: expect(locator).toBeEnabled() failed

Locator: locator('[data-editor-preview]').getByRole('button', { name: 'Finalizar sesión', exact: true })
Expected: enabled
Timeout: 12000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" locator('[data-editor-preview]').getByRole('button', { name: 'Finalizar sesión', exact: true }) with timeout 12000ms
  - waiting for locator('[data-editor-preview]').getByRole('button', { name: 'Finalizar sesión', exact: true })

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
  - button "Abrir menú de perfil de t035-1@example.test": T0
- region "Editor de ruta":
  - link "Volver a rutas de aprendizaje":
    - /url: /panel/rutas
  - heading "Ruta editorial T035" [level=1]
  - text: Borrador
  - button "Importar archivo de ruta"
  - tablist "Secciones del editor de rutas":
    - tab "Datos y fuentes":
      - strong: Datos y fuentes
    - tab "Objetivos":
      - strong: Objetivos
      - text: "1"
    - tab "Recorrido":
      - strong: Actividades
      - text: "16"
    - tab "Evaluación y repaso":
      - strong: Evaluación
      - text: "5"
    - tab "Revisión" [selected]:
      - strong: Revisión
  - tabpanel "Revisión":
    - heading "Revisión de la ruta" [level=2]
    - text: Por revisar
    - term: Unidades
    - definition: "1"
    - term: Objetivos
    - definition: "1"
    - term: Actividades
    - definition: "16"
    - term: Evaluaciones
    - definition: "5"
    - status: Comprueba el contenido y prueba el recorrido antes de enviarlo a revisión.
    - button "Comprobar ruta"
    - button "Enviar a revisión"
    - paragraph: Estos pendientes corresponden al borrador. Comprobar ruta también revisa las fuentes y tus permisos.
    - region "Pendientes de la ruta":
      - heading "Por completar" [level=3]
      - text: 1 sugerencia
      - group:
        - text: ›
        - strong: Evaluación y repaso
        - text: "1"
        - list:
          - listitem:
            - heading "Revisa la evaluación inicial Sugerencia" [level=5]
            - paragraph: Esta ruta tiene menos de 4 objetivos y su evaluación inicial es más corta. Indica esta limitación en las notas de revisión.
            - button "Añadir nota"
    - group:
      - text: +
      - strong: Mensaje para el revisor
    - group:
      - text: +
      - strong: Notas editoriales
    - region "Vista previa editorial":
      - heading "Vista previa de la ruta" [level=2]
      - status:
        - strong: Vista previa · no guarda progreso
      - paragraph: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
      - paragraph:
        - text: "Reloj simulado:"
        - time: 4 de octubre de 2026, 8:00 a. m.
        - text: (hora de Venezuela).
      - paragraph: La sesión editorial vence en diez minutos reales. Cerrar o reiniciar descarta sus resultados.
      - button "Avanzar 1 día"
      - button "Avanzar 7 días"
      - button "Avanzar 30 días"
      - button "Cerrar vista previa"
      - status
      - text: Actividades en curso Aprendizaje por comprobar Repaso a largo plazo pendiente 2 de 9 actividades obligatorias completadas
      - button "Simular diagnóstico"
      - button "Omitir diagnóstico en preview"
      - paragraph: Siguiente actividad de la rama disponible
      - button "Simular siguiente actividad"
      - text: Explorar un punto de la ruta
      - combobox "Explorar un punto de la ruta":
        - option "Elige una actividad o evaluación"
        - 'option "study-1: actividad sintética"'
        - 'option "constructed-1: actividad sintética"'
        - 'option "choice-1: actividad sintética"'
        - 'option "short-1: actividad sintética"'
        - 'option "apply-1: actividad sintética"'
        - 'option "match-1: actividad sintética"'
        - 'option "sequence-1: actividad sintética"'
        - 'option "image-1: actividad sintética" [selected]'
        - 'option "case-1: actividad sintética"'
        - 'option "remediate-1: actividad sintética"'
        - 'option "diagnostic: diagnostic"'
        - 'option "unit_gate: gate"'
        - 'option "final: final"'
        - 'option "retention7: retention7"'
        - 'option "retention30: retention30"'
      - button "Abrir punto seleccionado"
      - region "Próximos pasos confirmados":
        - heading "Cómo continuar" [level=2]
        - paragraph: Siguiente actividad de la rama disponible
        - group: Agenda confirmada de la ruta
      - region "Sesión de aprendizaje":
        - button "Cerrar vista previa"
        - text: Vista previa · sin guardar progreso
        - heading "Tu sesión de aprendizaje" [level=1]
        - group:
          - button "Detalles de la sesión"
        - progressbar "Avance de la ruta"
        - text: 2 de 9
        - status: Sesión completada y guardada.
        - heading "Sesión completada" [level=2]
        - paragraph: Tu progreso está guardado. Continúa a tu ritmo.
        - button "Cerrar vista previa"
        - group: Respuestas confirmadas +
        - group: Progreso y próximos repasos +
    - group:
      - text: +
      - strong: Archivos y derechos
      - text: 1 archivos vinculados
    - heading "Exportar" [level=3]
    - paragraph: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
    - button "Exportar paquete"
    - button "Descargar cobertura"
    - status
  - strong: Borrador al día
  - button "Atrás"
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
  27  |   await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeFocused();
  28  |   return a;
  29  | }
> 30  | async function keyboard(locator: Locator) { await expect(locator).toBeEnabled(); await locator.focus(); await locator.press("Enter"); }
      |                                                                   ^ Error: expect(locator).toBeEnabled() failed
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
  69  |   expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
  70  | }
  71  | async function previewPoint(page: Page, key: string) {
  72  |   const p = page.locator("[data-editor-preview]");
  73  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
  74  |   await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  75  |   await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  76  |   await expect(p.getByRole("heading", { name: key === "case" ? "case-choice-1: actividad sintética" : `${key}-1: actividad sintética`, exact: true })).toBeVisible();
  77  |   if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  78  |   return p;
  79  | }
  80  | async function answerPreview(p: Locator, key: string) {
  81  |   const choice = async () => { const radio = p.getByRole("radio", { name: "Respuesta A", exact: true });
  82  |     await radio.focus(); await radio.press("Space"); await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); };
  83  |   const feedback = async () => keyboard(p.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).last());
  84  |   if (key === "study") { await keyboard(p.getByRole("button", { name: "Guardar lectura", exact: true })); return; }
  85  |   if (key === "choice" || key === "apply") await choice();
  86  |   if (key === "short") { await p.getByLabel("Tu respuesta", { exact: true }).pressSequentially("respuesta");
  87  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); }
  88  |   if (key === "constructed") { await p.getByLabel("Explica con tus palabras").pressSequentially("Una relación sintética.");
  89  |     await keyboard(p.getByRole("button", { name: "Guardar mi respuesta", exact: true }));
  90  |     await keyboard(p.getByRole("button", { name: "Comparar con el modelo", exact: true }));
  91  |     await keyboard(p.getByRole("button", { name: "Lo recuperé", exact: true })); }
  92  |   if (key === "match") { const select = p.getByRole("combobox", { name: "Origen", exact: true });
  93  |     await select.focus(); await select.press("End"); await select.press("Tab");
  94  |     await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true })); }
  95  |   if (key === "sequence") await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  96  |   if (key === "image") { const adjust=p.locator("summary").filter({hasText:"Ajustar el punto seleccionado"});if(!await adjust.evaluate(e=>e.parentElement?.hasAttribute("open")))await keyboard(adjust);await p.getByLabel("Horizontal (%)").fill("20"); await p.getByLabel("Vertical (%)").fill("20");
  97  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta visual", exact: true })); }
  98  |   if (key === "case") { await choice(); await feedback();
  99  |     await expect(p.getByRole("heading", { name: "case-short-1: actividad sintética", exact: true })).toBeFocused();
  100 |     await answerPreview(p, "short"); return; }
  101 |   await feedback();
  102 | }
  103 | async function finishPreview(p: Locator) {
  104 |   if (!await p.getByRole("heading", { name: "Sesión completada", exact: true }).isVisible()) await keyboard(p.getByRole("button", { name: "Finalizar sesión", exact: true }));
  105 |   await expect(p.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  106 | }
  107 | 
  108 | test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  109 |   test.setTimeout(600000);
  110 |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  111 |   expect(ready.testOnly).toBe(true);
  112 |   await actor(page, "editor");
  113 |   await page.goto("/panel/rutas/nueva?mode=v2");
  114 |   await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  115 |   await capture(page, info, "admin-empty");
  116 |   await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  117 |   for (const name of tabs) {
  118 |     const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
  119 |     await expect(tab).toHaveAttribute("aria-selected", "true");
  120 |     await capture(page, info, `admin-${tabs.indexOf(name)}`);
  121 |   }
  122 |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  123 |   for (const key of kinds) {
  124 |     const p = await previewPoint(page, key);
  125 |     const closeButton = p.getByRole("button", { name: "Cerrar vista previa", exact: true }).first();
  126 |     await expect(closeButton).toBeVisible();
  127 |     const close = await closeButton.boundingBox();
  128 |     expect(close?.width).toBeGreaterThanOrEqual(44);
  129 |     expect(close?.height).toBeLessThanOrEqual(70);
  130 |     await capture(page, info, `renderer-${key}`);
```