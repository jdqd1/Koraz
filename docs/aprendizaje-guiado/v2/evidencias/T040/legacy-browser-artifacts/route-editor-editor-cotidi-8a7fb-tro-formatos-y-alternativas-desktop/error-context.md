# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: route-editor.spec.ts >> editor cotidiano con transporte fixture en memoria >> contenido heredado conserva dos objetivos, cuatro formatos y alternativas
- Location: tests\e2e\route-editor.spec.ts:343:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Video', { exact: true }).last()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Video', { exact: true }).last() with timeout 10000ms
  - waiting for getByText('Video', { exact: true }).last()

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
- banner:
  - button "Expandir menú principal"
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Editor de rutas" [level=1]
  - button "Notificaciones"
  - link "Acceder":
    - /url: /acceder
- main:
  - main:
    - link "Volver a rutas":
      - /url: /panel/rutas
    - heading "Anatomía esencial del tórax" [level=1]
    - paragraph: Organiza qué aprender, elige materiales publicados y comprueba la ruta antes de enviarla.
    - button "Vista previa"
    - strong: Borrador
    - text: Versión 2 · Sin cambios pendientes
    - tablist "Secciones del editor de rutas":
      - tab "Datos"
      - tab "Actividades" [selected]
      - tab "Revisión"
    - tabpanel "Actividades":
      - region "Unidades y actividades":
        - text: Paso 2 de 3
        - heading "Unidades y actividades" [level=2]
        - paragraph: Divide la ruta en unidades y añade los materiales en el orden de estudio.
        - heading "Unidad 1 Pared torácica 2 actividades" [level=3]:
          - button "Unidad 1 Pared torácica 2 actividades" [expanded]:
            - text: Unidad 1
            - strong: Pared torácica
            - emphasis: 2 actividades
        - button "Acciones de la unidad Pared torácica"
        - region "Unidad 1 Pared torácica 2 actividades":
          - text: Nombre de la unidad
          - textbox "Nombre de la unidad":
            - /placeholder: Ej. Pared torácica
            - text: Pared torácica
          - strong: ¿Qué aprenderá el estudiante?
          - paragraph: Escribe resultados concretos y observables.
          - 'button "Ayuda: Cómo redactar objetivos"'
          - text: Objetivo 1
          - textbox "Objetivo 1":
            - /placeholder: Ej. Identificar las estructuras principales de la pared torácica
            - text: Identificar las estructuras principales de la pared torácica
          - button "Eliminar objetivo 1 de Pared torácica"
          - text: Objetivo 2
          - textbox "Objetivo 2":
            - /placeholder: Ej. Identificar las estructuras principales de la pared torácica
            - text: Explicar las relaciones del mediastino
          - button "Eliminar objetivo 2 de Pared torácica"
          - button "Añadir otro objetivo"
          - strong: Actividades
          - paragraph: Los materiales aparecen en el orden de estudio.
          - button "Añadir actividad"
          - heading "Actividad 1 Comprender la pared torácica Guía · 14 min" [level=3]:
            - button "Actividad 1 Comprender la pared torácica Guía · 14 min" [expanded]:
              - text: Actividad 1
              - strong: Comprender la pared torácica
              - emphasis: Guía · 14 min
          - region "Actividad 1 Comprender la pared torácica Guía · 14 min":
            - text: Nombre de la actividad
            - textbox "Nombre de la actividad": Comprender la pared torácica
            - text: Material recomendado
            - strong: "Pared torácica: guía visual"
            - text: Guía
            - button "Cambiar material"
            - button "Quitar actividad"
            - button "Ocultar opciones" [expanded]
            - heading "Opciones de la actividad" [level=4]
            - paragraph: Estos ajustes no cambian el material fijado salvo que elijas «Cambiar material».
            - 'button "Ayuda: Uso de la actividad"'
            - text: Uso de esta actividad
            - combobox "Uso de esta actividad":
              - option "Comprobar"
              - option "Evaluación inicial"
              - option "Integrar conocimientos" [selected]
              - option "Recordar"
              - option "Comprender"
            - checkbox "Actividad opcional"
            - text: Actividad opcional
            - group "Orden recomendado":
              - text: Orden recomendado
              - checkbox "Practicar las relaciones anatómicas"
              - text: Practicar las relaciones anatómicas
            - heading "Materiales y alternativas" [level=4]
            - paragraph: El estudiante elige una opción para completar esta misma actividad.
            - 'button "Ayuda: Alternativas equivalentes"'
            - article:
              - text: Alternativa 1
              - strong: "Pared torácica: guía visual"
              - text: Guía
              - button "Quitar alternativa 1"
              - text: Texto del botón
              - textbox "Texto del botón": Leer guía
              - text: Duración aproximada (min)
              - spinbutton "Duración aproximada (min)": "14"
              - radio "Formato recomendado" [checked]
              - text: Formato recomendado
              - paragraph: Este material tiene una configuración personalizada que se conservará al editar estos campos.
              - button "Cambiar material"
            - button "Añadir otra forma de completar esta actividad"
          - heading "Actividad 2 Practicar las relaciones anatómicas Cuestionario · 9 min" [level=3]:
            - button "Actividad 2 Practicar las relaciones anatómicas Cuestionario · 9 min":
              - text: Actividad 2
              - strong: Practicar las relaciones anatómicas
              - emphasis: Cuestionario · 9 min
          - region "Actividad 2 Practicar las relaciones anatómicas Cuestionario · 9 min"
        - button "Añadir unidad"
    - strong: Borrador al día
    - text: La última respuesta del servidor está confirmada.
    - button "Guardar borrador" [disabled]
- alert
```