# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:91:5

# Error details

```
Error: map: axe

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 58

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
+               "bgColor": "#f8fbff",
+               "contrastRatio": 4.44,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#6174a5",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.44 (foreground color: #6174a5, background color: #f8fbff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"learning-map-module__RbHqDa__body\"><div class=\"learning-map-module__RbHqDa__empty\"><h2>Preparando tu mapa</h2><p>La información se confirma desde tu cuenta.</p></div></div>",
+                 "target": Array [
+                   ".learning-map-module__RbHqDa__body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.44 (foreground color: #6174a5, background color: #f8fbff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p>La información se confirma desde tu cuenta.</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "p",
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
Error: {"error":"conflict"}

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 409
```

# Page snapshot

```yaml
- generic [ref=f6e1]:
  - generic [ref=f6e2]:
    - complementary "Navegación principal" [ref=f6e3]:
      - navigation [ref=f6e4]:
        - generic [ref=f6e5]:
          - link "Inicio" [ref=f6e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f6e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f6e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f6e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f6e20]:
      - banner [ref=f6e21]:
        - button "Expandir menú principal" [ref=f6e23] [cursor=pointer]
        - search "Buscar guías" [ref=f6e27]:
          - combobox "Buscar guías" [ref=f6e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f6e32]
        - generic [ref=f6e33]:
          - button "Notificaciones" [ref=f6e35] [cursor=pointer]
          - link "Acceder" [ref=f6e39] [cursor=pointer]:
            - /url: /acceder
      - region "Sesión de aprendizaje" [ref=f6e43]:
        - generic [ref=f6e44]:
          - link "Volver a mi aprendizaje" [ref=f6e45] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
          - generic [ref=f6e46]:
            - text: Aprendizaje guiado
            - heading "Tu sesión de aprendizaje" [level=1] [ref=f6e47]
          - status [ref=f6e48]: Estado del servidor
        - status [ref=f6e49]: Sesión completada y guardada.
        - generic "Estado confirmado de la ruta" [ref=f6e50]:
          - generic [ref=f6e51]: Recorrido en curso
          - generic [ref=f6e52]: Dominio por comprobar
          - generic [ref=f6e53]: Consolidación pendiente
          - generic [ref=f6e54]: 0 repasos pendientes
          - generic [ref=f6e55]: 1 actividades completadas de 9
        - generic [ref=f6e56]:
          - heading "Sesión completada" [active] [level=2] [ref=f6e57]
          - paragraph [ref=f6e58]: El recorrido y el dominio se muestran por separado en el resumen confirmado.
          - group [ref=f6e59]:
            - generic "Respuestas confirmadas" [ref=f6e60]
        - region "Próximos pasos confirmados" [ref=f6e61]:
          - heading "Cómo continuar" [level=2] [ref=f6e62]
          - paragraph [ref=f6e63]: Siguiente actividad de la rama disponible
  - alert [ref=f6e64]
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
> 17  |   expect(r.status(), await r.text()).toBe(200); return r.json();
      |                                      ^ Error: {"error":"conflict"}
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
```