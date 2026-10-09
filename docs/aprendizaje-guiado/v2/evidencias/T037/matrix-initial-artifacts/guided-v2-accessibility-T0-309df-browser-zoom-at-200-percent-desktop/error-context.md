# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V03 native browser zoom at 200 percent
- Location: tests\e2e\guided-v2-accessibility.spec.ts:162:5

# Error details

```
Error: native-zoom200-admin: axe

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
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div role=\"tablist\" aria-orientation=\"horizontal\" aria-label=\"Secciones del editor de rutas\" class=\"route-editor-module__Uwf6nG__tabList styles-module___sd3xq__tabList\" tabindex=\"0\" data-orientation=\"horizontal\" style=\"outline: none;\">",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__tabList",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div role=\"tablist\" aria-orientation=\"horizontal\" aria-label=\"Secciones del editor de rutas\" class=\"route-editor-module__Uwf6nG__tabList styles-module___sd3xq__tabList\" tabindex=\"0\" data-orientation=\"horizontal\" style=\"outline: none;\">",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__tabList",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div role=\"tablist\" aria-orientation=\"horizontal\" aria-label=\"Secciones del editor de rutas\" class=\"route-editor-module__Uwf6nG__tabList styles-module___sd3xq__tabList\" tabindex=\"0\" data-orientation=\"horizontal\" style=\"outline: none;\">",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__tabList",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<div role=\"tablist\" aria-orientation=\"horizontal\" aria-label=\"Secciones del editor de rutas\" class=\"route-editor-module__Uwf6nG__tabList styles-module___sd3xq__tabList\" tabindex=\"0\" data-orientation=\"horizontal\" style=\"outline: none;\">",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__tabList",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
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
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
          - link "Volver a rutas" [ref=e25] [cursor=pointer]:
            - /url: /panel/rutas
          - heading "Nueva ruta" [level=1] [ref=e26]
          - paragraph [ref=e27]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
        - generic [ref=e28]:
          - strong [ref=e29]: Nueva ruta
          - generic [ref=e30]: Sin guardar · Cambios sin guardar
      - button "Importar archivo de ruta" [ref=e32] [cursor=pointer]
      - generic [ref=e33]:
        - tablist "Secciones del editor de rutas" [ref=e34]:
          - tab "Datos y fuentes" [selected] [ref=e35] [cursor=pointer]
          - tab "Objetivos" [ref=e36] [cursor=pointer]
          - tab "Recorrido" [ref=e37] [cursor=pointer]
          - tab "Evaluación y repaso" [ref=e38] [cursor=pointer]
          - tab "Revisión" [ref=e39] [cursor=pointer]
        - tabpanel "Datos y fuentes" [ref=e40]:
          - generic [ref=e41]:
            - generic [ref=e42]:
              - generic [ref=e44]:
                - text: Paso 1 de 5
                - heading "Datos y fuentes" [level=2] [ref=e45]
                - paragraph [ref=e46]: Los cambios se guardan cuando confirmas el borrador.
              - group "Datos de la ruta" [ref=e47]:
                - generic [ref=e49]:
                  - generic [ref=e50]:
                    - generic [ref=e51]: Título
                    - textbox "Título" [active] [ref=e52]
                  - generic [ref=e53]:
                    - generic [ref=e54]: Tema del catálogo
                    - combobox "Tema del catálogo" [ref=e55]:
                      - option "Selecciona un tema" [selected]
                      - option "Tema T035"
                  - generic [ref=e56]:
                    - generic [ref=e57]: Nombre del tema
                    - textbox "Nombre del tema" [ref=e58]
                  - generic [ref=e59]:
                    - generic [ref=e60]: Descripción
                    - textbox "Descripción" [ref=e61]
                  - generic [ref=e62]:
                    - generic [ref=e63]: Dirigida a
                    - textbox "Dirigida a" [ref=e64]: Estudiantes
                  - generic [ref=e65]:
                    - generic [ref=e66]: Disciplina
                    - combobox "Disciplina" [ref=e67]:
                      - option "Anatomía"
                      - option "Histología"
                      - option "Embriología"
                      - option "Fisiología"
                      - option "Bioquímica"
                      - option "Farmacología"
                      - option "Patología"
                      - option "Clínica"
                      - option "General" [selected]
                  - generic [ref=e68]:
                    - generic [ref=e69]: Portada
                    - combobox "Portada" [ref=e70]:
                      - option "Pulmones"
                      - option "Corazón" [selected]
                      - option "Cráneo"
                      - option "Cuello"
                      - option "Abdomen"
                      - option "Pelvis"
                      - option "Muslo"
                      - option "Espalda"
            - generic [ref=e72]:
              - generic [ref=e73]:
                - generic [ref=e74]:
                  - heading "Fuentes" [level=2] [ref=e75]
                  - paragraph [ref=e76]: Localiza cada fragmento por sección o página y conserva su procedencia.
                - button "Añadir fuente" [ref=e77] [cursor=pointer]
              - generic [ref=e78]:
                - generic [ref=e79]:
                  - generic [ref=e80]: Buscar guías del catálogo
                  - textbox "Buscar guías del catálogo" [ref=e81]
                - button "Buscar guías" [ref=e82] [cursor=pointer]
              - paragraph [ref=e83]: Todavía no hay fuentes. Añade la primera para documentar tus objetivos.
      - generic [ref=e84]:
        - generic [ref=e85]:
          - strong [ref=e86]: Cambios sin guardar
          - generic [ref=e87]: La versión mostrada procede del servidor.
        - button "Guardar borrador" [ref=e88] [cursor=pointer]
    - navigation "Navegación móvil" [ref=e89]:
      - link "Inicio" [ref=e90] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e94] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e99] [cursor=pointer]
      - link [ref=e103] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e106]: Rutas deaprendizaje
  - alert [ref=e107]
```