# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:242:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('summary').filter({ hasText: 'match-1: actividad sintética' }).locator('..').locator('summary').filter({ hasText: 'Respuesta y explicación' })
Expected: enabled
Timeout: 12000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" locator('summary').filter({ hasText: 'match-1: actividad sintética' }).locator('..').locator('summary').filter({ hasText: 'Respuesta y explicación' }) with timeout 12000ms
  - waiting for locator('summary').filter({ hasText: 'match-1: actividad sintética' }).locator('..').locator('summary').filter({ hasText: 'Respuesta y explicación' })

```

```yaml
- banner:
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Koras" [level=1]
  - button "Notificaciones"
  - button "Abrir menú de perfil de t035-1@example.test": T0
- region "Editor de ruta":
  - link "Volver a rutas de aprendizaje":
    - /url: /panel/rutas
  - heading "Ruta editorial T035" [level=1]
  - button "Importar archivo de ruta": Importar
  - tablist "Secciones del editor de rutas":
    - tab "Datos y fuentes":
      - strong: Datos
    - tab "Objetivos":
      - strong: Objetivos
    - tab "Recorrido" [selected]:
      - strong: Práctica
    - tab "Evaluación y repaso":
      - strong: Evaluar
    - tab "Revisión":
      - strong: Revisar
  - tabpanel "Recorrido":
    - heading "Actividades 16" [level=2]
    - button "Añadir actividad"
    - complementary "Actividades por unidad":
      - text: Buscar actividad
      - searchbox "Buscar actividad"
      - region "Unidad T035":
        - heading "Unidad T035 16" [level=3]
        - group:
          - strong: "study-1: actividad sintética"
          - text: Estudio
        - group:
          - strong: "constructed-1: actividad sintética"
          - text: Respuesta construida
        - group:
          - strong: "choice-1: actividad sintética"
          - text: Elección única
        - group:
          - strong: "short-1: actividad sintética"
          - text: Respuesta breve
        - group:
          - strong: "apply-1: actividad sintética"
          - text: Elección única
        - group:
          - strong: "match-1: actividad sintética"
          - text: Relaciones
        - group:
          - strong: "sequence-1: actividad sintética"
          - text: Secuencia
        - group:
          - strong: "image-1: actividad sintética"
          - text: "Imagen: señalar o etiquetar"
        - group:
          - strong: "case-1: actividad sintética"
          - text: Caso progresivo
        - group:
          - strong: "case-choice-1: actividad sintética"
          - text: Elección única
        - group:
          - strong: "case-short-1: actividad sintética"
          - text: Respuesta breve
        - group:
          - strong: "remediate-1: actividad sintética"
          - text: Estudio
        - group:
          - strong: "final-1: actividad sintética"
          - text: Elección única
        - group:
          - strong: "retention7-1: actividad sintética"
          - text: Elección única
        - group:
          - strong: "retention30-1: actividad sintética"
          - text: Elección única
        - group:
          - strong: "diagnostic-1: actividad sintética"
          - text: Elección única
    - heading "Relaciones" [level=3]
    - button "Editar" [pressed]
    - button "Probar"
    - complementary "Configuración de la actividad":
      - group:
        - heading "Configuración" [level=3]
        - region "Contenido de la actividad":
          - heading "Contenido" [level=4]
          - text: Consigna
          - textbox "Consigna":
            - /placeholder: Escribe lo que verá el estudiante…
            - text: "match-1: actividad sintética"
          - text: Presentación de relaciones
          - combobox "Presentación de relaciones":
            - option "Pares"
            - option "Tabla de comparación" [selected]
            - option "Micro-mapa causal"
          - heading "Enunciados" [level=4]
          - text: Enunciado 1
          - textbox "Enunciado 1": Origen
          - button "Retirar enunciado 1" [disabled]
          - button "Añadir enunciado"
          - heading "Opciones" [level=4]
          - text: Opción relacional 1
          - textbox "Opción relacional 1": Consecuencia
          - button "Retirar opción 1" [disabled]
          - button "Añadir opción relacional"
        - region "Respuesta y explicación":
          - heading "Respuesta y explicación" [level=4]
          - heading "Correspondencias correctas" [level=4]
          - paragraph: Cada fila relaciona un enunciado con una opción. Se puede editar íntegramente con teclado.
          - table "Tabla de correspondencias":
            - row "Enunciado Opción correcta":
              - columnheader "Enunciado"
              - columnheader "Opción correcta"
            - row "Origen Correspondencia 1 Consecuencia":
              - cell "Origen"
              - cell "Correspondencia 1 Consecuencia":
                - text: Correspondencia 1
                - combobox "Correspondencia 1":
                  - option "Selecciona una opción"
                  - option "Consecuencia" [selected]
          - checkbox "Permitir reutilizar una opción"
          - text: Permitir reutilizar una opción Explicación de la respuesta
          - button "Ayuda sobre explicación de la respuesta"
          - textbox "Explicación de la respuesta": Explicación sintética confirmada.
          - text: Explica el porqué de la respuesta, separado de la consigna.
          - group:
            - text: +
            - strong: Fuentes y ayuda adicional
        - group:
          - text: +
          - strong: Objetivo y fuentes
        - group:
          - text: +
          - strong: Opciones avanzadas
          - text: Recordar sin ayuda · Durante el aprendizaje
      - button "Eliminar actividad" [disabled]
      - paragraph: Esta actividad está reservada en una evaluación. Retírala de ella antes de eliminarla.
    - region "Vista de estudiante":
      - text: Vista previa En directo
      - 'heading "match-1: actividad sintética" [level=3]'
      - group "Completa la tabla de comparación":
        - text: Completa la tabla de comparación
        - paragraph: Usa cada opción una vez.
        - region "Tabla de relaciones":
          - table:
            - rowgroup:
              - row "Elemento Relación":
                - columnheader "Elemento"
                - columnheader "Relación"
            - rowgroup:
              - row "Origen Elige una relación":
                - rowheader "Origen"
                - cell "Elige una relación":
                  - combobox "Origen" [disabled]:
                    - option "Elige una relación" [disabled] [selected]
                    - option "Consecuencia" [disabled]
      - status: 0 de 1 relaciones seleccionadas
      - button "Comprobar relaciones" [disabled]
  - strong: Cambios sin guardar
  - button "Atrás"
  - button "Guardar borrador"
  - button "Continuar"
- navigation "Navegación móvil":
  - link "Inicio":
    - /url: /dashboard
  - link "Guías":
    - /url: /guias
  - button "Materiales"
  - link "Rutas de aprendizaje":
    - /url: /aprendizaje
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