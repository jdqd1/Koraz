# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E02 editorial preview has no learner effects, then publishes with current approval
- Location: tests\e2e\guided-v2-journeys.spec.ts:89:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText('Publicada', { exact: true })
Expected: visible
Received: hidden
Timeout:  60000ms

Call log:
  - Expect "toBeVisible" getByText('Publicada', { exact: true }) with timeout 60000ms
  - waiting for getByText('Publicada', { exact: true })
    119 × locator resolved to <span class="_sd3xq_statusBadge">Publicada</span>
        - unexpected value "hidden"

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
  - heading "Ruta corregida T042 mobile" [level=1]
  - button "Importar archivo de ruta": Importar
  - tablist "Secciones del editor de rutas":
    - tab "Datos y fuentes":
      - strong: Datos
    - tab "Objetivos":
      - strong: Objetivos
    - tab "Recorrido":
      - strong: Práctica
    - tab "Evaluación y repaso":
      - strong: Evaluar
    - tab "Revisión" [selected]:
      - strong: Revisar
  - tabpanel "Revisión":
    - heading "Revisión de la ruta" [level=2]
    - text: Revisión vigente
    - term: Unidades
    - definition: "1"
    - term: Objetivos
    - definition: "1"
    - term: Actividades
    - definition: "16"
    - term: Evaluaciones
    - definition: "5"
    - status: La revisión de este contenido está al día.
    - button "Comprobar ruta"
    - button "Crear nueva versión"
    - status: El estado de la ruta se actualizó.
    - paragraph: Estos pendientes corresponden al borrador. Comprobar ruta también revisa las fuentes y tus permisos.
    - region "Pendientes de la ruta":
      - heading "Por completar" [level=3]
      - text: 1 sugerencia
      - group:
        - text: ›
        - strong: Evaluación y repaso
        - text: "1"
        - list:
          - listitem:
            - heading "Revisa la evaluación inicial Sugerencia" [level=4]
            - paragraph: Esta ruta tiene menos de 4 objetivos y su evaluación inicial es más corta. Indica esta limitación en las notas de revisión.
            - button "Añadir nota"
    - group:
      - text: +
      - strong: Cambios de la nueva versión
    - group:
      - text: +
      - strong: Notas editoriales
    - region "Vista previa editorial":
      - heading "Vista previa de la ruta" [level=2]
      - status:
        - strong: Vista previa · no guarda progreso
      - paragraph: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
      - text: Perfil de vista previa
      - combobox "Perfil de vista previa":
        - option "Principiante" [selected]
        - option "Diagnóstico correcto"
        - option "Error CORE"
      - button "Abrir vista previa"
      - status
    - group:
      - text: +
      - strong: Archivos y derechos
      - text: 1 archivos vinculados
    - heading "Exportar" [level=3]
    - paragraph: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
    - button "Exportar paquete"
    - button "Descargar cobertura"
    - status
  - strong: Borrador al día
  - button "Atrás"
  - button "Guardar borrador" [disabled]: Guardar
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