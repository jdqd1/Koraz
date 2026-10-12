# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: route-editor-v2-usability.spec.ts >> editing collapsed options preserves the package and saves the confirmed version
- Location: tests\e2e\route-editor-v2-usability.spec.ts:53:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 77

- Array []
+ Array [
+   Object {
+     "description": "Ensure the main landmark is at top level",
+     "help": "Main landmark should not be contained in another landmark",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/landmark-main-is-top-level?application=playwright",
+     "id": "landmark-main-is-top-level",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "role": "main",
+             },
+             "id": "landmark-is-top-level",
+             "impact": "moderate",
+             "message": "The main landmark is contained in another landmark.",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   The main landmark is contained in another landmark.",
+         "html": "<main class=\"route-editor-module__Uwf6nG__editor styles-module___sd3xq__editor\" data-editor-surface=\"true\" data-engine-version=\"guided-v2\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           ".route-editor-module__Uwf6nG__editor",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+   Object {
+     "description": "Ensure the document has at most one main landmark",
+     "help": "Document should not have more than one main landmark",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/landmark-no-duplicate-main?application=playwright",
+     "id": "landmark-no-duplicate-main",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "page-no-duplicate-main",
+             "impact": "moderate",
+             "message": "Document has more than one main landmark",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<main class=\"app-main\" data-pathname=\"/visual-fixtures/editor-rutas-v2\">",
+                 "target": Array [
+                   ".app-main",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Document has more than one main landmark",
+         "html": "<main class=\"route-editor-module__Uwf6nG__editor styles-module___sd3xq__editor\" data-editor-surface=\"true\" data-engine-version=\"guided-v2\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           ".route-editor-module__Uwf6nG__editor",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary "Navegación principal" [ref=f1e3]:
      - navigation [ref=f1e4]:
        - generic [ref=f1e5]:
          - link "Inicio" [ref=f1e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f1e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f1e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f1e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f1e20]:
      - banner [ref=f1e21]:
        - button "Expandir menú principal" [ref=f1e23] [cursor=pointer]
        - search "Buscar guías" [ref=f1e27]:
          - combobox "Buscar guías" [ref=f1e30]
        - heading "Editor de rutas" [level=1] [ref=f1e32]
        - generic [ref=f1e33]:
          - button "Notificaciones" [ref=f1e35] [cursor=pointer]
          - link "Acceder" [ref=f1e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f1e43]:
        - main [ref=f1e44]:
          - generic [ref=f1e45]:
            - generic [ref=f1e46]:
              - link "Rutas de aprendizaje" [ref=f1e47] [cursor=pointer]:
                - /url: /panel/rutas
              - heading "Ruta editada con el nuevo flujo" [level=1] [ref=f1e50]
              - paragraph [ref=f1e51]: De la guía a la práctica, paso a paso.
            - generic [ref=f1e52]:
              - generic [ref=f1e53]: Borrador
              - button "Importar archivo de ruta" [ref=f1e54] [cursor=pointer]
          - generic [ref=f1e57]:
            - tablist "Secciones del editor de rutas" [ref=f1e58]:
              - tab "Datos y fuentes" [selected] [ref=f1e59] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e60]: "1"
                - generic [ref=f1e61]:
                  - strong [ref=f1e62]: Datos y fuentes
                  - generic [ref=f1e63]: Título y material de estudio
              - tab "Objetivos" [ref=f1e64] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e65]: "2"
                - generic [ref=f1e66]:
                  - strong [ref=f1e67]: Objetivos
                  - generic [ref=f1e68]: 1 objetivos · 1 unidades
              - tab "Recorrido" [ref=f1e69] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e70]: "3"
                - generic [ref=f1e71]:
                  - strong [ref=f1e72]: Actividades
                  - generic [ref=f1e73]: 8 actividades
              - tab "Evaluación y repaso" [ref=f1e74] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e75]: "4"
                - generic [ref=f1e76]:
                  - strong [ref=f1e77]: Evaluación
                  - generic [ref=f1e78]: 1 evaluaciones
              - tab "Revisión" [ref=f1e79] [cursor=pointer]:
                - generic [aria-hidden] [ref=f1e80]: "5"
                - generic [ref=f1e81]:
                  - strong [ref=f1e82]: Revisión
                  - generic [ref=f1e83]: Comprobar y publicar
            - tabpanel "Datos y fuentes" [ref=f1e85]:
              - generic [ref=f1e86]:
                - generic [ref=f1e87]:
                  - generic [ref=f1e89]:
                    - text: Paso 1 de 5
                    - heading "Empieza con tu guía" [level=2] [ref=f1e90]
                    - paragraph [ref=f1e91]: Dale un nombre y elige el tema que van a estudiar.
                  - group "Datos de la ruta" [ref=f1e92]:
                    - generic [ref=f1e94]:
                      - generic [ref=f1e95]:
                        - generic [ref=f1e96]: Título
                        - textbox "Título" [ref=f1e97]:
                          - /placeholder: Ej. Vascularización del abdomen
                          - text: Ruta editada con el nuevo flujo
                      - generic [ref=f1e98]:
                        - generic [ref=f1e99]: Tema del catálogo
                        - combobox "Tema del catálogo" [ref=f1e100]:
                          - option "Tema sintético" [selected]
                      - generic [ref=f1e101]:
                        - generic [ref=f1e102]: Descripción
                        - textbox "Descripción" [ref=f1e103]:
                          - /placeholder: ¿Qué aprenderá el estudiante en esta ruta?
                          - text: Ejemplo para verificar guardado y recuperación del editor.
                    - group [ref=f1e104]:
                      - generic "+ Presentación de la ruta Audiencia, disciplina, portada y nombre del tema" [ref=f1e105] [cursor=pointer]:
                        - text: +
                        - generic [ref=f1e106]:
                          - strong [ref=f1e107]: Presentación de la ruta
                          - generic [ref=f1e108]: Audiencia, disciplina, portada y nombre del tema
                      - option "Anatomía"
                      - option "Histología"
                      - option "Embriología"
                      - option "Fisiología"
                      - option "Bioquímica"
                      - option "Farmacología"
                      - option "Patología"
                      - option "Clínica"
                      - option "General" [selected]
                      - option "Pulmones"
                      - option "Corazón" [selected]
                      - option "Cráneo"
                      - option "Cuello"
                      - option "Abdomen"
                      - option "Pelvis"
                      - option "Muslo"
                      - option "Espalda"
                - generic [ref=f1e109]:
                  - generic [ref=f1e110]:
                    - generic [ref=f1e111]:
                      - generic [ref=f1e112]:
                        - heading "Material de estudio" [level=2] [ref=f1e113]
                        - paragraph [ref=f1e114]: Añade la guía o referencia que sustenta la ruta.
                      - button "Añadir fuente" [ref=f1e115] [cursor=pointer]
                    - group [ref=f1e116]:
                      - generic [ref=f1e117] [cursor=pointer]:
                        - text: +
                        - strong [ref=f1e119]: Buscar en el catálogo
                    - paragraph [ref=f1e120]: No hay guías disponibles con esta búsqueda.
                  - region "Fuente 1" [ref=f1e121]:
                    - group [ref=f1e122]:
                      - generic "+ Guía sintética Guía del catálogo" [ref=f1e123] [cursor=pointer]:
                        - text: +
                        - generic [ref=f1e124]:
                          - strong [ref=f1e125]: Guía sintética
                          - generic [ref=f1e126]: Guía del catálogo
                      - option "Guía del catálogo" [selected]
                      - option "Referencia bibliográfica"
                      - option "Selecciona una guía con revisión"
                      - option "Vínculo guardado · Guía sintética" [selected]
                      - text: +
                      - option "Fuente aportada" [selected]
                      - option "Verificada editorialmente"
                      - option "Pendiente de verificar"
          - generic [ref=f1e127]:
            - generic [ref=f1e128]:
              - strong [ref=f1e129]: Borrador al día
              - generic [ref=f1e130]: Paso 1 de 5 · Revisión 2
            - generic [ref=f1e131]:
              - button "Guardar borrador" [disabled] [ref=f1e132]
              - button "Continuar" [ref=f1e133] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f1e141] [cursor=pointer]
  - alert [ref=f1e145]
```