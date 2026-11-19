# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 keeps the answer, feedback and exit operable across priority sizes
- Location: tests\e2e\guided-learning-availability.spec.ts:15:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('#actividad-study-1').getByRole('button', { name: 'Abrir actividad', exact: true })
Expected: enabled
Timeout: 12000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" locator('#actividad-study-1').getByRole('button', { name: 'Abrir actividad', exact: true }) with timeout 12000ms
  - waiting for locator('#actividad-study-1').getByRole('button', { name: 'Abrir actividad', exact: true })

```

```yaml
- complementary "Navegación principal":
  - link "Koras, inicio":
    - /url: /dashboard
    - img "KORAS":
      - strong: KORAS
  - button "Abrir menú principal"
  - navigation:
    - link "Inicio":
      - /url: /dashboard
      - img
      - text: Inicio
    - link "Materias":
      - /url: /asignaturas
      - img
      - text: Materias
    - button "Material de estudio":
      - img
      - text: Material de estudio
- banner:
  - button "Abrir menú principal"
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Koras" [level=1]
  - link "Ir al inicio":
    - /url: /dashboard
  - button "Notificaciones"
  - img
- main "Cargando Aprendizaje guiado": Cargando tu progreso y próximas actividades…
- navigation "Navegación móvil":
  - link "Inicio":
    - /url: /dashboard
  - link "Guías":
    - /url: /guias
  - button "Materiales"
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import { writeFile } from "node:fs/promises";
  3   | import AxeBuilder from "@axe-core/playwright";
  4   | 
  5   | const api = "http://127.0.0.1:41035";
  6   | async function actor(page: Page, name: string) {
  7   |   await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  8   |   await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  9   | }
  10  | type Trace = { method: string; path: string; status: number; durationMs: number; bytes: number; reference?: string; requestId?: string };
  11  | const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1]!;
  12  | const fault = (page: Page, value: string) => page.context().addCookies([{ name: "f07_fault", value, domain: "127.0.0.1", path: "/" }]);
  13  | const restore = (page: Page) => page.context().clearCookies({ name: "f07_fault" });
  14  | 
  15  | test("F07 keeps the answer, feedback and exit operable across priority sizes", async ({ page }, info) => {
  16  |   test.skip(process.env.F07_BASELINE === "true");
  17  |   await actor(page, info.project.name === "mobile" ? "student-27" : "student-26");
  18  |   const ready = await (await page.request.get(`${api}/__test/ready`)).json();
  19  |   const enrollment = await page.request.post("/api/v2/guided-learning/enrollments", {
  20  |     data: { pathId: ready.fixtures.small.pathId }, headers: { "idempotency-key": crypto.randomUUID() },
  21  |   });
  22  |   expect(enrollment.status()).toBe(200);
  23  |   async function open(key: string) {
  24  |     await page.goto("/aprendizaje/rutas/t035-small?leccion=unit");
  25  |     const action = page.locator(`#actividad-${key}-1`).getByRole("button", { name: "Abrir actividad", exact: true });
> 26  |     await expect(action).toBeEnabled();
      |                          ^ Error: expect(locator).toBeEnabled() failed
  27  |     const start = performance.now();
  28  |     await action.click();
  29  |     await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  30  |     return start;
  31  |   }
  32  |   const completed = page.getByRole("heading", { name: "Sesión completada", exact: true });
  33  |   async function closeSession() {
  34  |     const finish = page.getByRole("button", { name: "Finalizar sesión", exact: true });
  35  |     await expect(completed.or(finish).first()).toBeVisible();
  36  |     if (await finish.isVisible()) await finish.press("Enter");
  37  |     await expect(completed).toBeFocused();
  38  |   }
  39  |   for (const key of ["study", "constructed", "choice"]) {
  40  |     await open(key);
  41  |     if (key === "study") await page.getByRole("button", { name: "Guardar lectura" }).click();
  42  |     else {
  43  |       if (key === "constructed") {
  44  |         await page.getByLabel("Explica con tus palabras").fill("Una relación sintética.");
  45  |         await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  46  |         await page.getByRole("button", { name: "Comparar con el modelo" }).click();
  47  |         await page.getByRole("button", { name: "Lo recuperé" }).click();
  48  |       } else {
  49  |         await page.getByRole("radio", { name: "Respuesta A", exact: true }).check();
  50  |         await page.getByRole("button", { name: "Comprobar respuesta", exact: true }).click();
  51  |       }
  52  |       await page.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).click();
  53  |     }
  54  |     await closeSession();
  55  |   }
  56  |   const start = await open("short");
  57  |   const field = page.getByRole("textbox", { name: "Tu respuesta", exact: true });
  58  |   await expect(field).toBeEnabled();
  59  |   const launchMs = performance.now() - start;
  60  |   const submit = page.getByRole("button", { name: "Comprobar respuesta", exact: true });
  61  |   const sizes = [[320, 740], [360, 800], [390, 844], [430, 932], [844, 390], [390, 420], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
  62  |   const original = page.viewportSize()!;
  63  |   const geometry = [];
  64  |   for (const [width, height] of sizes as [number, number][]) {
  65  |     await page.setViewportSize({ width, height });
  66  |     await field.focus();
  67  |     await field.fill("respuesta");
  68  |     await field.press("Tab");
  69  |     await expect(page.getByRole("button", { name: "Necesito ayuda" })).toBeFocused();
  70  |     await submit.scrollIntoViewIfNeeded();
  71  |     const result = await submit.evaluate(el => {
  72  |       const b = el.getBoundingClientRect(), hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
  73  |       return { width: innerWidth, height: innerHeight, targetHeight: b.height, reachable: el.contains(hit),
  74  |         overflows: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  75  |     });
  76  |     expect(result, `${width}×${height}`).toMatchObject({ reachable: true, overflows: false });
  77  |     expect(result.targetHeight).toBeGreaterThanOrEqual(44);
  78  |     geometry.push(result);
  79  |     if (width === 320) await page.screenshot({ path: info.outputPath("respuesta-320.png") });
  80  |   }
  81  |   await page.setViewportSize(original);
  82  |   const feedbackStart = performance.now();
  83  |   if (info.project.name === "mobile") await submit.tap();
  84  |   else { await submit.focus(); await submit.press("Enter"); }
  85  |   const feedback = page.getByRole("heading", { name: "Respuesta correcta", exact: true });
  86  |   await expect(feedback).toBeFocused();
  87  |   const responseMs = performance.now() - feedbackStart;
  88  |   const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations;
  89  |   await writeFile(info.outputPath("answer-geometry.json"), JSON.stringify({ geometry, launchMs, responseMs, violations: violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })) }, null, 2));
  90  |   expect(violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
  91  |   await page.getByRole("button", { name: "Continuar", exact: true }).press("Enter");
  92  |   await closeSession();
  93  |   await page.getByRole("link", { name: "Volver a la unidad", exact: true }).first().press("Enter");
  94  |   await expect(page.locator("#actividad-short-1")).toBeFocused();
  95  |   await expect(page.getByText("4 de 9 actividades obligatorias completadas", { exact: true }).first()).toBeVisible();
  96  |   await page.getByRole("link", { name: "Todas las rutas", exact: true }).click();
  97  |   await expect(page.getByRole("link", { name: "Abrir ruta Ruta T035 pequeña", exact: true })).toContainText("4 de 9 actividades obligatorias completadas");
  98  | });
  99  | 
  100 | test("F07 preserves resource section, attempt and catalog context across temporary failures", async ({ page }, info) => {
  101 |   test.skip(process.env.F07_BASELINE === "true");
  102 |   const actorName = `f06-${info.project.name}`;
  103 |   await actor(page, actorName);
  104 |   const route = "/aprendizaje/rutas/simulacion-f06";
  105 |   const counts = async () => (await (await page.request.get(api + "/__test/counts")).json());
  106 |   const before = await counts();
  107 |   await fault(page, "catalog");
  108 |   await page.goto("/aprendizaje?tab=rutas");
  109 |   const failure = page.getByRole("alert").filter({ hasText: "No pudimos cargar tus rutas de práctica por objetivos" });
  110 |   await expect(failure).toBeVisible();
  111 |   await expect(page.getByRole("link", { name: "Abrir ruta Simulación de navegación F06" })).toBeVisible();
  112 |   await restore(page);
  113 |   await failure.getByRole("link", { name: "Reintentar" }).click();
  114 |   await expect(failure).toHaveCount(0);
  115 |   await expect(page).toHaveURL(/tab=rutas/);
  116 |   await page.goto(`${route}?leccion=lectura&pestana=resources`);
  117 |   await page.getByRole("link", { name: "Consultar Lectura con seguimiento" }).click();
  118 |   await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  119 |   await expect(page).toHaveURL(/seccion=1/);
  120 |   const readerUrl = page.url();
  121 |   await fault(page, "resource");
  122 |   await page.reload();
  123 |   await expect(page.getByRole("heading", { name: "Lectura no disponible" })).toBeVisible();
  124 |   await restore(page);
  125 |   await page.getByRole("link", { name: "Reintentar lectura" }).click();
  126 |   await expect(page.getByText("La letra B sigue a A.", { exact: true })).toBeVisible();
```