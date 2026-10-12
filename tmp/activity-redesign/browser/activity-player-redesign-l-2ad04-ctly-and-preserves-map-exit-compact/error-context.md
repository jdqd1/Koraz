# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> lost writes retry once with the same identity; next activity starts directly and preserves map exit
- Location: tests\e2e\activity-player-redesign.spec.ts:138:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.fill: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByLabel('Tu respuesta', { exact: true })
    - waiting for "http://127.0.0.1:3100/visual-fixtures/aprendizaje-v2?surface=player&estado=short_answer" navigation to finish...
    - navigated to "http://127.0.0.1:3100/visual-fixtures/aprendizaje-v2?surface=player&estado=short_answer"

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - search "Buscar guías" [ref=f1e6]:
      - combobox "Buscar guías" [ref=f1e9]
    - heading "Aprendizaje guiado" [level=1] [ref=f1e11]
    - generic [ref=f1e12]:
      - button "Notificaciones" [ref=f1e14] [cursor=pointer]
      - button "Abrir menú de perfil de t029@example.test" [ref=f1e18] [cursor=pointer]:
        - generic [ref=f1e19]: T0
  - main [ref=f1e20]:
    - status [ref=f1e21]: Cargando manifiesto confirmado de prueba…
  - navigation "Navegación móvil" [ref=f1e22]:
    - link "Inicio" [ref=f1e23] [cursor=pointer]:
      - /url: /dashboard
    - link "Guías" [ref=f1e27] [cursor=pointer]:
      - /url: /guias
    - button "Materiales" [ref=f1e32] [cursor=pointer]
    - link [ref=f1e36] [cursor=pointer]:
      - /url: /aprendizaje
      - generic [ref=f1e39]: Rutas deaprendizaje
```