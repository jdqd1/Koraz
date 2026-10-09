# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:92:5

# Error details

```
Error: route._innerContinue: Route is already handled!
```

```
Error: apiRequestContext.get: Test ended.
```

# Page snapshot

```yaml
- generic [ref=f8e1]:
  - generic [ref=f8e2]:
    - complementary "Navegación principal" [ref=f8e3]:
      - navigation [ref=f8e4]:
        - generic [ref=f8e5]:
          - link "Inicio" [ref=f8e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f8e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f8e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f8e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f8e20]:
      - banner [ref=f8e21]:
        - button "Expandir menú principal" [ref=f8e23] [cursor=pointer]
        - search "Buscar guías" [ref=f8e27]:
          - combobox "Buscar guías" [ref=f8e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f8e32]
        - generic [ref=f8e33]:
          - button "Notificaciones" [ref=f8e35] [cursor=pointer]
          - link "Acceder" [ref=f8e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f8e43]:
        - region "Sesión de aprendizaje" [ref=f8e44]:
          - generic [ref=f8e45]:
            - link "Volver a mi aprendizaje" [ref=f8e46] [cursor=pointer]:
              - /url: /aprendizaje?tab=hoy
            - generic [ref=f8e47]:
              - text: Aprendizaje guiado
              - heading "Tu sesión de aprendizaje" [level=1] [ref=f8e48]
            - status [ref=f8e49]: Estado del servidor
          - status [ref=f8e50]: Sesión completada y guardada.
          - generic "Estado confirmado de la ruta" [ref=f8e51]:
            - generic [ref=f8e52]: Recorrido en curso
            - generic [ref=f8e53]: Dominio por comprobar
            - generic [ref=f8e54]: Consolidación pendiente
            - generic [ref=f8e55]: 0 repasos pendientes
            - generic [ref=f8e56]: 1 objetivo por reforzar
            - generic [ref=f8e57]: 3 actividades completadas de 9
          - generic [ref=f8e58]:
            - heading "Sesión completada" [active] [level=2] [ref=f8e59]
            - paragraph [ref=f8e60]: El recorrido y el dominio se muestran por separado en el resumen confirmado.
            - group [ref=f8e61]:
              - generic "Respuestas confirmadas" [ref=f8e62]
          - region "Próximos pasos confirmados" [ref=f8e63]:
            - heading "Cómo continuar" [level=2] [ref=f8e64]
            - paragraph [ref=f8e65]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
            - generic [ref=f8e66]:
              - paragraph [ref=f8e67]: Confusión CORE sintética
              - paragraph [ref=f8e68]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
            - group [ref=f8e69]:
              - generic "Agenda confirmada de la ruta" [ref=f8e70] [cursor=pointer]
  - alert [ref=f8e71]
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
> 20  |   return (await (await page.request.get(root + `enrollments/${id}/state`)).json()).state;
      |                                     ^ Error: apiRequestContext.get: Test ended.
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
  39  |   await page.screenshot({ path: info.outputPath(`${name}-viewport.png`) });
  40  |   await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  41  |   const axe = await new AxeBuilder({ page }).analyze();
  42  |   await writeFile(info.outputPath(`${name}-axe.json`), JSON.stringify(axe, null, 2));
  43  |   const cdp = await page.context().newCDPSession(page);
  44  |   const tree = await cdp.send("Accessibility.getFullAXTree"); await cdp.detach();
  45  |   await writeFile(info.outputPath(`${name}-ax.json`), JSON.stringify(tree, null, 2));
  46  |   const geometry = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
  47  |     pageWidth: document.documentElement.scrollWidth, zoom: getComputedStyle(document.documentElement).zoom, devicePixelRatio,
  48  |     focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 160) },
  49  |     controls: [...document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("main button, main input, main select")]
  50  |       .filter(e => e.getClientRects().length && !e.disabled).map(e => { const b = e.getBoundingClientRect();
  51  |         return { name: e.getAttribute("aria-label") ?? e.textContent?.slice(0, 90), width: b.width, height: b.height }; }) }));
  52  |   await writeFile(info.outputPath(`${name}-geometry.json`), JSON.stringify(geometry, null, 2));
  53  |   expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
  54  |   expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
  55  | }
  56  | async function previewPoint(page: Page, key: string) {
  57  |   const p = page.locator("[data-editor-preview]");
  58  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
  59  |   await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  60  |   await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  61  |   if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  62  |   return p;
  63  | }
  64  | async function answerPreview(p: Locator, key: string) {
  65  |   const choice = async () => { const radio = p.getByRole("radio", { name: "Respuesta A", exact: true });
  66  |     await radio.focus(); await radio.press("Space"); await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); };
  67  |   const feedback = async () => keyboard(p.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).last());
  68  |   if (key === "study") { await keyboard(p.getByRole("button", { name: "Continuar a la práctica", exact: true })); return; }
  69  |   if (key === "choice" || key === "apply") await choice();
  70  |   if (key === "short") { await p.getByLabel("Tu respuesta", { exact: true }).pressSequentially("respuesta");
  71  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); }
  72  |   if (key === "constructed") { await p.getByLabel("Explica con tus palabras").pressSequentially("Una relación sintética.");
  73  |     await keyboard(p.getByRole("button", { name: "Guardar mi respuesta", exact: true }));
  74  |     await keyboard(p.getByRole("button", { name: "Comparar con el modelo", exact: true }));
  75  |     await keyboard(p.getByRole("button", { name: "Lo recuperé", exact: true })); }
  76  |   if (key === "match") { const select = p.getByRole("combobox", { name: "Origen", exact: true });
  77  |     await select.focus(); await select.press("End"); await select.press("Tab");
  78  |     await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true })); }
  79  |   if (key === "sequence") await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  80  |   if (key === "image") { await p.getByLabel("Horizontal (%)").fill("20"); await p.getByLabel("Vertical (%)").fill("20");
  81  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta visual", exact: true })); }
  82  |   if (key === "case") { await choice(); await feedback();
  83  |     await expect(p.getByRole("heading", { name: /Etapa 2: relación sintética.*case-short-1/ })).toBeFocused();
  84  |     await answerPreview(p, "short"); return; }
  85  |   await feedback();
  86  | }
  87  | async function finishPreview(p: Locator) {
  88  |   await keyboard(p.getByRole("button", { name: "Finalizar sesión", exact: true }));
  89  |   await expect(p.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  90  | }
  91  | 
  92  | test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  93  |   test.setTimeout(600000);
  94  |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  95  |   expect(ready.testOnly).toBe(true);
  96  |   await actor(page, "editor");
  97  |   await page.goto("/panel/rutas/nueva?mode=v2");
  98  |   await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  99  |   await capture(page, info, "admin-empty");
  100 |   await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  101 |   for (const name of tabs) {
  102 |     const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
  103 |     await expect(tab).toHaveAttribute("aria-selected", "true");
  104 |     await capture(page, info, `admin-${tabs.indexOf(name)}`);
  105 |   }
  106 |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  107 |   for (const key of kinds) {
  108 |     const p = await previewPoint(page, key);
  109 |     await capture(page, info, `renderer-${key}`);
  110 |     await answerPreview(p, key); await finishPreview(p);
  111 |   }
  112 |   await keyboard(page.locator("[data-editor-preview]").getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  113 |   await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
  114 |   // CSS zoom exercises real 200% layout/text scaling in Chromium. It is documented
  115 |   // separately from native browser zoom and checked together with small viewports.
  116 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  117 |   await capture(page, info, "admin-zoom200");
  118 |   await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  119 |   const index = ["desktop", "360", "390", "768"].indexOf(info.project.name);
  120 |   const name = `student-${22 + index}`; await actor(page, name);
```