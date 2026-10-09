# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:62:5

# Error details

```
Error: admin-empty: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 418

- Array []
+ Array [
+   Object {
+     "description": "Ensure buttons have discernible text",
+     "help": "Buttons must have discernible text",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/button-name?application=playwright",
+     "id": "button-name",
+     "impact": "critical",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "button-has-visible-text",
+             "impact": "critical",
+             "message": "Element does not have inner text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "critical",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "critical",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "critical",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "implicit-label",
+             "impact": "critical",
+             "message": "Element does not have an implicit (wrapped) <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "explicit-label",
+             "impact": "critical",
+             "message": "Element does not have an explicit <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "presentational-role",
+             "impact": "critical",
+             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element does not have inner text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute
+   Element does not have an implicit (wrapped) <label>
+   Element does not have an explicit <label>
+   Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+         "html": "<button aria-controls=\"sidebar-submenu-study\" aria-expanded=\"false\" class=\"sidebar-group-link\" type=\"button\">",
+         "impact": "critical",
+         "none": Array [],
+         "target": Array [
+           "button[aria-controls=\"sidebar-submenu-study\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "button-has-visible-text",
+             "impact": "critical",
+             "message": "Element does not have inner text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "critical",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "critical",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "critical",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "implicit-label",
+             "impact": "critical",
+             "message": "Element does not have an implicit (wrapped) <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "explicit-label",
+             "impact": "critical",
+             "message": "Element does not have an explicit <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "presentational-role",
+             "impact": "critical",
+             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element does not have inner text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute
+   Element does not have an implicit (wrapped) <label>
+   Element does not have an explicit <label>
+   Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+         "html": "<button aria-controls=\"sidebar-submenu-admin\" aria-expanded=\"false\" class=\"sidebar-group-link is-active\" type=\"button\">",
+         "impact": "critical",
+         "none": Array [],
+         "target": Array [
+           "button[aria-controls=\"sidebar-submenu-admin\"]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.name-role-value",
+       "wcag2a",
+       "wcag412",
+       "section508",
+       "section508.22.a",
+       "TTv5",
+       "TT6.a",
+       "EN-301-549",
+       "EN-9.4.1.2",
+       "ACT",
+       "RGAAv4",
+       "RGAA-11.9.1",
+     ],
+   },
+   Object {
+     "description": "Ensure links have discernible text",
+     "help": "Links must have discernible text",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/link-name?application=playwright",
+     "id": "link-name",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "has-visible-text",
+             "impact": "serious",
+             "message": "Element does not have text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "serious",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "serious",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "serious",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix all of the following:
+   Element is in tab order and does not have accessible text
+
+ Fix any of the following:
+   Element does not have text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute",
+         "html": "<a class=\"sidebar-link\" href=\"/dashboard\">",
+         "impact": "serious",
+         "none": Array [
+           Object {
+             "data": null,
+             "id": "focusable-no-name",
+             "impact": "serious",
+             "message": "Element is in tab order and does not have accessible text",
+             "relatedNodes": Array [],
+           },
+         ],
+         "target": Array [
+           ".sidebar-link[href$=\"dashboard\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "has-visible-text",
+             "impact": "serious",
+             "message": "Element does not have text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "serious",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "serious",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "serious",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix all of the following:
+   Element is in tab order and does not have accessible text
+
+ Fix any of the following:
+   Element does not have text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute",
+         "html": "<a class=\"sidebar-link\" href=\"/aprendizaje\">",
+         "impact": "serious",
+         "none": Array [
+           Object {
+             "data": null,
+             "id": "focusable-no-name",
+             "impact": "serious",
+             "message": "Element is in tab order and does not have accessible text",
+             "relatedNodes": Array [],
+           },
+         ],
+         "target": Array [
+           ".sidebar-link[href$=\"aprendizaje\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "has-visible-text",
+             "impact": "serious",
+             "message": "Element does not have text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "serious",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "serious",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "serious",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix all of the following:
+   Element is in tab order and does not have accessible text
+
+ Fix any of the following:
+   Element does not have text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute",
+         "html": "<a class=\"sidebar-link\" href=\"/asignaturas\">",
+         "impact": "serious",
+         "none": Array [
+           Object {
+             "data": null,
+             "id": "focusable-no-name",
+             "impact": "serious",
+             "message": "Element is in tab order and does not have accessible text",
+             "relatedNodes": Array [],
+           },
+         ],
+         "target": Array [
+           "a[href$=\"asignaturas\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "has-visible-text",
+             "impact": "serious",
+             "message": "Element does not have text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "serious",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "serious",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "serious",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix all of the following:
+   Element is in tab order and does not have accessible text
+
+ Fix any of the following:
+   Element does not have text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute",
+         "html": "<a class=\"profile-trigger profile-sign-in\" href=\"/acceder\">",
+         "impact": "serious",
+         "none": Array [
+           Object {
+             "data": null,
+             "id": "focusable-no-name",
+             "impact": "serious",
+             "message": "Element is in tab order and does not have accessible text",
+             "relatedNodes": Array [],
+           },
+         ],
+         "target": Array [
+           ".profile-trigger",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.name-role-value",
+       "wcag2a",
+       "wcag244",
+       "wcag412",
+       "section508",
+       "section508.22.a",
+       "TTv5",
+       "TT6.a",
+       "EN-301-549",
+       "EN-9.2.4.4",
+       "EN-9.4.1.2",
+       "ACT",
+       "RGAAv4",
+       "RGAA-6.2.1",
+     ],
+   },
+ ]
```

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 60000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary "Navegación principal" [ref=f1e3]:
      - navigation [ref=f1e4]:
        - generic [ref=f1e5]:
          - link [ref=f1e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link [ref=f1e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link [ref=f1e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button [ref=f1e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
          - button [ref=f1e22] [cursor=pointer]:
            - generic [aria-hidden]: Administrar
    - generic [ref=f1e25]:
      - banner [ref=f1e26]:
        - button "Expandir menú principal" [ref=f1e28] [cursor=pointer]
        - search "Buscar guías" [ref=f1e32]:
          - combobox "Buscar guías" [ref=f1e35]
        - heading "Koras" [level=1] [ref=f1e37]
        - generic [ref=f1e38]:
          - button "Notificaciones" [ref=f1e40] [cursor=pointer]
          - link [ref=f1e44] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f1e48]:
        - generic [ref=f1e49]:
          - generic [ref=f1e50]:
            - link "Volver a rutas" [ref=f1e51] [cursor=pointer]:
              - /url: /panel/rutas
            - heading "Ruta editorial T035" [level=1] [ref=f1e52]
            - paragraph [ref=f1e53]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
          - generic [ref=f1e54]:
            - strong [ref=f1e55]: Borrador
            - generic [ref=f1e56]: Revisión 1 · Sin cambios pendientes
        - button "Importar archivo de ruta" [ref=f1e58] [cursor=pointer]
        - generic [ref=f1e59]:
          - tablist "Secciones del editor de rutas" [ref=f1e60]:
            - tab "Datos y fuentes" [selected] [ref=f1e61] [cursor=pointer]
            - tab "Objetivos" [ref=f1e62] [cursor=pointer]
            - tab "Recorrido" [ref=f1e63] [cursor=pointer]
            - tab "Evaluación y repaso" [ref=f1e64] [cursor=pointer]
            - tab "Revisión" [ref=f1e65] [cursor=pointer]
          - tabpanel "Datos y fuentes" [ref=f1e66]:
            - generic [ref=f1e67]:
              - generic [ref=f1e68]:
                - generic [ref=f1e70]:
                  - text: Paso 1 de 5
                  - heading "Datos y fuentes" [level=2] [ref=f1e71]
                  - paragraph [ref=f1e72]: Los cambios se guardan cuando confirmas el borrador.
                - group "Datos de la ruta" [ref=f1e73]:
                  - generic [ref=f1e75]:
                    - generic [ref=f1e76]:
                      - generic [ref=f1e77]: Título
                      - textbox "Título" [ref=f1e78]: Ruta editorial T035
                    - generic [ref=f1e79]:
                      - generic [ref=f1e80]: Tema del catálogo
                      - combobox "Tema del catálogo" [ref=f1e81]:
                        - option "Tema T035" [selected]
                    - generic [ref=f1e82]:
                      - generic [ref=f1e83]: Nombre del tema
                      - textbox "Nombre del tema" [ref=f1e84]: Tema T035
                    - generic [ref=f1e85]:
                      - generic [ref=f1e86]: Descripción
                      - textbox "Descripción" [ref=f1e87]: Fixture de software sin contenido clínico real.
                    - generic [ref=f1e88]:
                      - generic [ref=f1e89]: Dirigida a
                      - textbox "Dirigida a" [ref=f1e90]: Alumno
                    - generic [ref=f1e91]:
                      - generic [ref=f1e92]: Disciplina
                      - combobox "Disciplina" [ref=f1e93]:
                        - option "Anatomía"
                        - option "Histología"
                        - option "Embriología"
                        - option "Fisiología"
                        - option "Bioquímica"
                        - option "Farmacología"
                        - option "Patología"
                        - option "Clínica"
                        - option "General" [selected]
                    - generic [ref=f1e94]:
                      - generic [ref=f1e95]: Portada
                      - combobox "Portada" [ref=f1e96]:
                        - option "Pulmones"
                        - option "Corazón" [selected]
                        - option "Cráneo"
                        - option "Cuello"
                        - option "Abdomen"
                        - option "Pelvis"
                        - option "Muslo"
                        - option "Espalda"
              - generic [ref=f1e97]:
                - generic [ref=f1e98]:
                  - generic [ref=f1e99]:
                    - generic [ref=f1e100]:
                      - heading "Fuentes" [level=2] [ref=f1e101]
                      - paragraph [ref=f1e102]: Localiza cada fragmento por sección o página y conserva su procedencia.
                    - button "Añadir fuente" [ref=f1e103] [cursor=pointer]
                  - generic [ref=f1e104]:
                    - generic [ref=f1e105]:
                      - generic [ref=f1e106]: Buscar guías del catálogo
                      - textbox "Buscar guías del catálogo" [ref=f1e107]
                    - button "Buscar guías" [ref=f1e108] [cursor=pointer]
                - region "Fuente 1" [ref=f1e109]:
                  - generic [ref=f1e110]:
                    - heading "Guía T035" [level=3] [ref=f1e111]
                    - button "Eliminar fuente" [disabled] [ref=f1e112]
                  - paragraph [ref=f1e113]: Esta fuente está vinculada a objetivos, actividades o recursos visuales. Retira esos vínculos antes de eliminarla.
                  - group "Editar Guía T035" [ref=f1e114]:
                    - generic [ref=f1e116]:
                      - generic [ref=f1e117]:
                        - generic [ref=f1e118]: Nombre de la fuente
                        - textbox "Nombre de la fuente" [ref=f1e119]: Guía T035
                      - generic [ref=f1e120]:
                        - generic [ref=f1e121]: Tipo de fuente
                        - combobox "Tipo de fuente" [ref=f1e122]:
                          - option "Guía del catálogo" [selected]
                          - option "Referencia bibliográfica"
                      - generic [ref=f1e123]:
                        - generic [ref=f1e124]: Guía y revisión
                        - combobox "Guía y revisión" [ref=f1e125]:
                          - option "Selecciona una guía con revisión"
                          - option "Guía T035 · revisión 1" [selected]
                        - generic [ref=f1e126]: La revisión y su huella se toman del catálogo. Cambiarla requiere localizar de nuevo el fragmento.
                      - generic [ref=f1e127]:
                        - generic [ref=f1e128]: Cita bibliográfica
                        - textbox "Cita bibliográfica" [ref=f1e129]: Fuente sintética (2026)
                      - generic [ref=f1e130]:
                        - generic [ref=f1e131]: Sección o encabezado
                        - textbox "Sección o encabezado" [ref=f1e132]: Fixture
                      - generic [ref=f1e133]:
                        - generic [ref=f1e134]: Página
                        - spinbutton "Página" [ref=f1e135]: "1"
                      - generic [ref=f1e136]:
                        - generic [ref=f1e137]: Ruta de secciones
                        - textbox "Ruta de secciones" [ref=f1e138]: Fixture
                        - generic [ref=f1e139]: Un encabezado por línea, desde la sección principal hasta el fragmento.
                      - generic [ref=f1e140]:
                        - generic [ref=f1e141]: Fragmento de la fuente
                        - textbox "Fragmento de la fuente" [ref=f1e142]: Contenido sintético para comprobar el software.
                      - generic [ref=f1e143]:
                        - generic [ref=f1e144]: Enlace HTTPS
                        - textbox "Enlace HTTPS" [ref=f1e145]
                      - generic [ref=f1e146]:
                        - generic [ref=f1e147]: Estado bibliográfico
                        - combobox "Estado bibliográfico" [ref=f1e148]:
                          - option "Fuente aportada"
                          - option "Verificada editorialmente" [selected]
                          - option "Pendiente de verificar"
                      - generic [ref=f1e149]:
                        - generic [ref=f1e150]: Fecha de comprobación
                        - textbox "Fecha de comprobación" [ref=f1e151]: 2026-10-04
                    - group [ref=f1e152]:
                      - generic "Detalles de trazabilidad" [ref=f1e153] [cursor=pointer]
        - generic [ref=f1e154]:
          - generic [ref=f1e155]:
            - strong [ref=f1e156]: Borrador al día
            - generic [ref=f1e157]: La versión mostrada procede del servidor.
          - button "Guardar borrador" [disabled] [ref=f1e158]
  - alert [ref=f1e159]
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