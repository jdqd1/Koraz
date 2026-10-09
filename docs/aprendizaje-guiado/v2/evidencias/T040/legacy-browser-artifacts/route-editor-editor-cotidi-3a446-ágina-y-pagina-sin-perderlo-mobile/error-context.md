# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: route-editor.spec.ts >> editor cotidiano con transporte fixture en memoria >> mantiene material fijado fuera de la primera página y pagina sin perderlo
- Location: tests\e2e\route-editor.spec.ts:161:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('listitem')
Expected: 1
Received: 0
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" getByRole('listitem') with timeout 10000ms
  - waiting for getByRole('listitem')
    23 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - banner [aria-hidden]:
        - generic:
          - search:
            - combobox
        - generic:
          - heading [level=1]: Editor de rutas
        - generic:
          - generic:
            - button
          - generic:
            - link:
              - /url: /acceder
      - main:
        - generic:
          - main:
            - generic [aria-hidden]:
              - generic:
                - link:
                  - /url: /panel/rutas
                  - text: Volver a rutas
                - heading [level=1]: Anatomía esencial del tórax
                - paragraph: Organiza qué aprender, elige materiales publicados y comprueba la ruta antes de enviarla.
              - generic:
                - button: Vista previa
                - generic:
                  - strong: Borrador
                  - generic: Versión 1 · Sin cambios pendientes
            - generic [aria-hidden]:
              - tablist:
                - tab: Datos
                - tab [selected]: Actividades
                - tab: Revisión
              - tabpanel:
                - region:
                  - generic:
                    - generic:
                      - text: Paso 2 de 3
                      - heading [level=2]: Unidades y actividades
                      - paragraph: Divide la ruta en unidades y añade los materiales en el orden de estudio.
                  - generic:
                    - generic:
                      - generic:
                        - heading [level=3]:
                          - button [expanded]:
                            - generic:
                              - generic: Unidad 1
                              - strong: Pared torácica
                              - emphasis: 2 actividades
                        - button
                      - region:
                        - generic:
                          - generic: Nombre de la unidad
                          - textbox:
                            - /placeholder: Ej. Pared torácica
                            - text: Pared torácica
                        - generic:
                          - generic:
                            - strong: ¿Qué aprenderá el estudiante?
                            - paragraph: Escribe resultados concretos y observables.
                          - button
                        - generic:
                          - generic:
                            - generic:
                              - generic: Objetivo 1
                              - textbox:
                                - /placeholder: Ej. Identificar las estructuras principales de la pared torácica
                                - text: Identificar las estructuras principales de la pared torácica
                            - button
                        - button: Añadir otro objetivo
                        - generic:
                          - generic:
                            - strong: Actividades
                            - paragraph: Los materiales aparecen en el orden de estudio.
                          - button: Añadir actividad
                        - generic:
                          - generic:
                            - heading [level=3]:
                              - button [expanded]:
                                - generic:
                                  - generic: Actividad 1
                                  - strong: Comprender la pared torácica
                                  - emphasis: Guía · 14 min
                            - region:
                              - generic:
                                - generic: Nombre de la actividad
                                - textbox: Comprender la pared torácica
                              - generic:
                                - generic:
                                  - generic: Material recomendado
                                  - strong: "Pared torácica: guía visual"
                                  - generic: Guía
                                - button: Cambiar material
                              - generic:
                                - button: Quitar actividad
                              - generic:
                                - button: Más opciones
                          - generic:
                            - heading [level=3]:
                              - button:
                                - generic:
                                  - generic: Actividad 2
                                  - strong: Practicar las relaciones anatómicas
                                  - emphasis: Cuestionario · 9 min
                            - region
                  - button: Añadir unidad
            - generic:
              - generic:
                - strong: Borrador al día
                - generic: La última respuesta del servidor está confirmada.
              - button [disabled] [aria-hidden]: Guardar borrador
      - navigation [aria-hidden]:
        - link:
          - /url: /dashboard
          - generic: Inicio
        - link:
          - /url: /guias
          - generic: Guías
        - generic:
          - button:
            - generic: Materiales
        - link:
          - /url: /aprendizaje
          - generic: Rutas de aprendizaje
  - button "Open Next.js Dev Tools" [ref=e6] [cursor=pointer]
  - alert
  - dialog [ref=e11]:
    - banner [ref=e12]:
      - heading "Añadir actividad a Pared torácica" [level=2] [ref=e13]
      - paragraph [ref=e14]: Elige un material publicado de la biblioteca para usarlo en esta actividad.
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Buscar por título
          - searchbox "Buscar por título" [active] [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: Formato
          - combobox "Formato" [ref=e22]:
            - option "Todos" [selected]
            - option "Tarjetas"
            - option "Guía"
            - option "Cuestionario"
        - generic [ref=e23]:
          - generic [ref=e24]: Tema
          - combobox "Tema" [ref=e25]:
            - option "Todos" [selected]
            - option "Anatomía"
        - button "Buscar" [ref=e26] [cursor=pointer]
      - generic [ref=e29]:
        - strong [ref=e30]: Todavía no hay materiales publicados.
        - paragraph [ref=e31]: Crea y publica uno en Contenido para añadirlo aquí.
        - link "Abrir Contenido" [ref=e32] [cursor=pointer]:
          - /url: /panel/contenido
      - button "Cargar más" [ref=e33] [cursor=pointer]
    - contentinfo [ref=e34]:
      - button "Cancelar" [ref=e35] [cursor=pointer]
      - button "Añadir a Pared torácica" [disabled] [ref=e36]
```