# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:209:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('[data-editor-preview]').getByRole('button', { name: 'Practicar con variante de texto o tabla', exact: true })
Expected: enabled
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" locator('[data-editor-preview]').getByRole('button', { name: 'Practicar con variante de texto o tabla', exact: true }) with timeout 60000ms
  - waiting for locator('[data-editor-preview]').getByRole('button', { name: 'Practicar con variante de texto o tabla', exact: true })

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
  - text: Revisión 2 · Sin cambios pendientes
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
        - status
        - text: Recorrido en curso Dominio por comprobar Consolidación pendiente 0 repasos pendientes 0 actividades completadas de 9
        - paragraph: "Objetivo: Práctica del objetivo actual"
        - 'heading "image-1: actividad sintética" [level=2]'
        - paragraph: Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.
        - paragraph: Señala un punto de la imagen. También puedes enfocar la imagen y usar las flechas, o ajustar las coordenadas.
        - paragraph: "image-1: actividad sintética"
        - text: Ampliación de imagen
        - combobox "Ampliación de imagen":
          - option "100 %" [selected]
          - option "150 %"
          - option "200 %"
          - option "300 %"
        - region "Área ampliada de imagen":
          - group "Imagen para responder":
            - img "Píxel sintético para comprobar coordenadas"
        - group "Ajustar el punto seleccionado":
          - text: Ajustar el punto seleccionado Horizontal (%)
          - spinbutton "Horizontal (%)": "21"
          - text: Vertical (%)
          - spinbutton "Vertical (%)": "19.9479"
        - status: "Punto seleccionado: horizontal 21.0 %, vertical 19.9 %."
        - button "Comprobar respuesta visual"
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
  - paragraph: "Confirmado en esta sesión: 4/10/2026, 8:00:00 · Revisión 2"
  - strong: Borrador al día
  - text: Borrador confirmado por el servidor.
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
  121 |   await page.goto(slug); await expect(page.getByRole("heading", { name: "Ruta T035 pequeña", exact: true })).toBeVisible();
  122 |   await capture(page, info, "learner-path");
  123 |   const enrollmentId = (await post(page, "enrollments", { pathId: ready.fixtures.small.pathId })).state.enrollmentId;
  124 |   await page.request.post(api + `/__test/map/${name}`, { data: {} });
  125 |   for (const [label, url] of [["today", "/aprendizaje?tab=hoy"], ["map", "/aprendizaje/mapa"],
  126 |     ["review-empty", "/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"]] as const) {
  127 |     await page.goto(url); await expect(page.locator("main").first()).toBeVisible();
  128 |     if (label === "map") await expect(page.getByRole("button", { name: "Vista de lista", exact: true })).toBeVisible();
  129 |     await capture(page, info, label);
  130 |     if (label === "map") { await keyboard(page.getByRole("button", { name: "Vista de lista", exact: true }));
```