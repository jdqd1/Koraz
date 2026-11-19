# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 measures cold and warm catalog navigation with request and payload budgets
- Location: tests\e2e\guided-learning-availability.spec.ts:10:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a[href="/aprendizaje/rutas/f06-navegacion"]').first()
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('a[href="/aprendizaje/rutas/f06-navegacion"]').first() with timeout 60000ms
  - waiting for locator('a[href="/aprendizaje/rutas/f06-navegacion"]').first()

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
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - button "Abrir menú de perfil de f06-desktop@example.test": F0
- main:
  - text: Aprendizaje guiado
  - heading "Elige cómo avanzar, sin perder el rumbo." [level=1]
  - paragraph: Rutas cortas que conectan comprensión, práctica y repaso. Tú decides qué actividad abrir.
  - navigation "Secciones de Aprendizaje guiado":
    - link "Hoy":
      - /url: /aprendizaje?tab=hoy
    - link "Rutas":
      - /url: /aprendizaje?tab=rutas
    - link "Progreso":
      - /url: /aprendizaje?tab=progreso
  - region "Rutas disponibles":
    - text: Explorar
    - heading "Rutas disponibles" [level=2]
    - paragraph: Abre la ficha completa antes de inscribirte.
    - article:
      - link "Abrir ruta Simulación de navegación F06":
        - /url: /aprendizaje/rutas/simulacion-f06
        - text: En curso Simulación F06
        - heading "Simulación de navegación F06" [level=2]
        - paragraph: Material sintético para verificar el recorrido
        - text: 30 unidades 3 min aprox. Ver ruta
    - article:
      - link "Abrir ruta Repaso simulado F03":
        - /url: /aprendizaje/rutas/repaso-f03
        - text: Simulación F03
        - heading "Repaso simulado F03" [level=2]
        - paragraph: Simulación de repaso con reloj controlado
        - text: 1 unidad 5 min aprox. Ver ruta
    - article:
      - link "Abrir ruta Ruta T035 pequeña":
        - /url: /aprendizaje/rutas/t035-small
        - text: Tema T035
        - heading "Ruta T035 pequeña" [level=2]
        - paragraph: Fixture de software sin contenido clínico real.
        - text: 1 unidades Ver ruta
    - article:
      - link "Abrir ruta Ruta T035 de 200 objetivos":
        - /url: /aprendizaje/rutas/t035-large
        - text: Tema T035
        - heading "Ruta T035 de 200 objetivos" [level=2]
        - paragraph: Fixture de software sin contenido clínico real.
        - text: 1 unidades Ver ruta
    - article:
      - link "Abrir ruta Diagnóstico y XP":
        - /url: /aprendizaje/rutas/xp-admission
        - text: Tema T035
        - heading "Diagnóstico y XP" [level=2]
        - paragraph: Fixture de software sin contenido clínico real.
        - text: 1 unidades Ver ruta
    - article:
      - link "Abrir ruta Simulación de actualización":
        - /url: /aprendizaje/rutas/f02-versiones
        - text: Tema T035
        - heading "Simulación de actualización" [level=2]
        - paragraph: Fixture de software sin contenido clínico real.
        - text: 1 unidades Ver ruta
- alert
```