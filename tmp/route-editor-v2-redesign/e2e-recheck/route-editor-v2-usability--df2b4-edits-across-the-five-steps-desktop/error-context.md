# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: route-editor-v2-usability.spec.ts >> new route stays focused on essentials and keeps edits across the five steps
- Location: tests\e2e\route-editor-v2-usability.spec.ts:17:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: getByLabel('Objetivos evaluados', { exact: true })
Expected: focused
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeFocused" getByLabel('Objetivos evaluados', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('Objetivos evaluados', { exact: true })

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
    - link "Rutas de aprendizaje":
      - /url: /panel/rutas
    - heading "Crea una ruta" [level=1]
    - paragraph: De la guía a la práctica, paso a paso.
    - text: Nueva ruta
    - button "Importar archivo de ruta"
    - tablist "Secciones del editor de rutas":
      - tab "Datos y fuentes":
        - strong: Datos y fuentes
        - text: Título y material de estudio
      - tab "Objetivos":
        - strong: Objetivos
        - text: 1 objetivos · 1 unidades
      - tab "Recorrido":
        - strong: Actividades
        - text: 1 actividades
      - tab "Evaluación y repaso" [selected]:
        - strong: Evaluación
        - text: 1 evaluaciones
      - tab "Revisión":
        - strong: Revisión
        - text: Comprobar y publicar
    - tabpanel "Evaluación y repaso":
      - text: Paso 4 de 5
      - heading "Comprueba lo aprendido" [level=2]
      - paragraph: Elige una evaluación y vincula sus preguntas.
      - text: Tipo de evaluación
      - combobox "Tipo de evaluación":
        - option "Diagnóstico"
        - option "Comprobación de unidad"
        - option "Comprobación acumulativa"
        - option "Evaluación final" [selected]
        - option "Retención a 7 días"
        - option "Retención a 30 días"
      - button "Añadir evaluación"
      - paragraph: Usa preguntas exclusivas para la evaluación final y el repaso a 7 y 30 días.
      - group:
        - text: −
        - strong: Evaluación final
        - text: 0 objetivos · 0 preguntas
        - heading "Evaluación final" [level=3]
        - button "Eliminar evaluación 1"
        - group "Configurar Evaluación final":
          - text: Configurar Evaluación final Después de la unidad
          - combobox "Después de la unidad":
            - option "Sin unidad específica" [selected]
            - option "Primera unidad"
          - text: Objetivos evaluados
          - checkbox "Identificar las estructuras principales"
          - text: Identificar las estructuras principales Banco de preguntas
          - paragraph: "No disponible: falta banco de preguntas para estos objetivos y esta evaluación."
          - paragraph: 0 familias seleccionadas.
          - group: Umbral y justificación editorial
      - heading "Objetivos para repasar" [level=3]
      - group "Plan de repaso":
        - text: Plan de repaso
        - checkbox "Identificar las estructuras principales"
        - text: Identificar las estructuras principales
      - paragraph: La cobertura local no presenta incidencias. El servidor verificará las fuentes y los permisos.
    - strong: Cambios sin guardar
    - text: Cambios sin guardar. La revisión anterior ya no acredita esta copia.
    - button "Atrás"
    - button "Guardar borrador"
    - button "Continuar"
- alert
```