# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-persistence.spec.ts >> disposable API/SQL persistence >> opens a published lesson, launches its guide and returns to the same place
- Location: tests\e2e\learning-map-persistence.spec.ts:57:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Abrir Tema E2E', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Aprendizaje guiado" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - link "Acceder" [ref=e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=e22]:
      - region "Mapa de aprendizaje" [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - heading "Mi mapa de aprendizaje" [level=1] [ref=e28]
            - button "Vista de lista" [ref=e30] [cursor=pointer]
          - alert [ref=e33]:
            - text: No pudimos confirmar la solicitud. Reintenta con conexión.
            - button "Reintentar" [ref=e34] [cursor=pointer]
            - button "Ir a mi mapa" [ref=e35] [cursor=pointer]
          - generic [ref=e37]:
            - heading "No pudimos abrir el mapa" [level=2] [ref=e38]
            - paragraph [ref=e39]: La información se confirma desde tu cuenta.
    - navigation "Navegación móvil" [ref=e41]:
      - link "Inicio" [ref=e42] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e46] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e51] [cursor=pointer]
      - link [ref=e55] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e58]: Rutas deaprendizaje
  - button "Open Next.js Dev Tools" [ref=e64] [cursor=pointer]
  - alert [ref=e68]
```