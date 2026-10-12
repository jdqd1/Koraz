# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 case-wrapper stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:90:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Tu sesión de aprendizaje' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Tu sesión de aprendizaje' }) with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Tu sesión de aprendizaje' })

```

```yaml
- banner:
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - button "Abrir menú de perfil de t029@example.test": T0
- main:
  - status: Cargando manifiesto confirmado de prueba…
- navigation "Navegación móvil":
  - link "Inicio":
    - /url: /dashboard
  - link "Guías":
    - /url: /guias
  - button "Materiales"
  - link "Rutas de aprendizaje":
    - /url: /aprendizaje
```