# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 preserves resource section, attempt and catalog context across temporary failures
- Location: tests\e2e\guided-learning-availability.spec.ts:100:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert').filter({ hasText: 'No pudimos cargar tus rutas de práctica por objetivos' })
Expected: visible
Timeout: 12000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('alert').filter({ hasText: 'No pudimos cargar tus rutas de práctica por objetivos' }) with timeout 12000ms
  - waiting for getByRole('alert').filter({ hasText: 'No pudimos cargar tus rutas de práctica por objetivos' })

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