# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-navigation.spec.ts >> F06 H19 records map nodes through list, reload and resizing without disabling virtualization
- Location: tests\e2e\guided-learning-navigation.spec.ts:127:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Abrir Lectura y comprobación', exact: true })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Abrir Lectura y comprobación', exact: true }) with timeout 60000ms
  - waiting for getByRole('button', { name: 'Abrir Lectura y comprobación', exact: true })

```

```yaml
- banner:
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - button "Abrir menú de perfil de f06-desktop@example.test": F0
- main:
  - region "Mapa de aprendizaje":
    - button "Atrás en el mapa":
      - img
    - heading "Simulación de navegación F06" [level=1]
    - button "Vista de lista":
      - img
    - navigation "Ruta del mapa":
      - button "Rutas de aprendizaje"
    - text: 67 % de avance
    - region "Mapa del nivel Simulación de navegación F06":
      - img "Conexión con el nivel anterior"
      - application:
        - img:
          - img "Edge from level-origin to lesson:contenido-24"
        - img:
          - img "Edge from level-origin to lesson:contenido-25"
        - img:
          - img "Edge from level-origin to lesson:contenido-26"
        - img:
          - img "Edge from level-origin to lesson:contenido-27"
        - img:
          - img "Edge from level-origin to lesson:contenido-28"
        - button "Volver desde Simulación de navegación F06":
          - img
          - strong: Simulación de navegación F06
        - article "Contenido 24, Sin actividades, 0 actividades":
          - group:
            - img
          - button "Abrir Contenido 24":
            - text: Sin actividades
            - strong: Contenido 24
            - text: —
        - article "Contenido 25, Sin actividades, 0 actividades":
          - group:
            - img
          - button "Abrir Contenido 25":
            - text: Sin actividades
            - strong: Contenido 25
            - text: —
        - article "Contenido 26, Sin actividades, 0 actividades":
          - group:
            - img
          - button "Abrir Contenido 26":
            - text: Sin actividades
            - strong: Contenido 26
            - text: —
        - article "Contenido 27, Sin actividades, 0 actividades":
          - group:
            - img
          - button "Abrir Contenido 27":
            - text: Sin actividades
            - strong: Contenido 27
            - text: —
        - article "Contenido 28, Sin actividades, 0 actividades":
          - group:
            - img
          - button "Abrir Contenido 28":
            - text: Sin actividades
            - strong: Contenido 28
            - text: —
    - button "Alejar":
      - img
    - button "Restablecer zoom al 100 %": 100 %
    - button "Acercar":
      - img
    - button "Ajustar vista":
      - img
    - text: Simulación de navegación F06, 30 contenidos
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