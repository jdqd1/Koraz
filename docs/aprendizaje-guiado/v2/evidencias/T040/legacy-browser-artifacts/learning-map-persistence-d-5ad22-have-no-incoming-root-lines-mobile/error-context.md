# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-persistence.spec.ts >> disposable API/SQL persistence >> published routes are visible before enrollment and have no incoming root lines
- Location: tests\e2e\learning-map-persistence.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Abrir Tema E2E', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Abrir Tema E2E', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: 'Abrir Tema E2E', exact: true })

```

```yaml
- banner:
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - link "Acceder":
    - /url: /acceder
- main:
  - region "Mapa de aprendizaje":
    - heading "Mi mapa de aprendizaje" [level=1]
    - status: Abriendo…
    - button "Vista de lista":
      - img
    - heading "Preparando tu mapa" [level=2]
    - paragraph: La información se confirma desde tu cuenta.
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