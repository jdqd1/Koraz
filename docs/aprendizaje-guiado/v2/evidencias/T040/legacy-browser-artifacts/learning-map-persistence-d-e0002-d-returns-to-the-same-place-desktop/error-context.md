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
  - generic [ref=e2]:
    - complementary "Navegación principal" [ref=e3]:
      - navigation [ref=e4]:
        - generic [ref=e5]:
          - link "Inicio" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=e20]:
      - banner [ref=e21]:
        - button "Expandir menú principal" [ref=e23] [cursor=pointer]
        - search "Buscar guías" [ref=e27]:
          - combobox "Buscar guías" [ref=e30]
        - heading "Aprendizaje guiado" [level=1] [ref=e32]
        - generic [ref=e33]:
          - button "Notificaciones" [ref=e35] [cursor=pointer]
          - link "Acceder" [ref=e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=e43]:
        - region "Mapa de aprendizaje" [ref=e44]:
          - generic [ref=e45]:
            - generic [ref=e46]:
              - heading "Mi mapa de aprendizaje" [level=1] [ref=e49]
              - button "Vista de lista" [ref=e51] [cursor=pointer]
            - alert [ref=e54]:
              - text: No pudimos confirmar la solicitud. Reintenta con conexión.
              - button "Reintentar" [ref=e55] [cursor=pointer]
              - button "Ir a mi mapa" [ref=e56] [cursor=pointer]
            - generic [ref=e58]:
              - heading "No pudimos abrir el mapa" [level=2] [ref=e59]
              - paragraph [ref=e60]: La información se confirma desde tu cuenta.
  - button "Open Next.js Dev Tools" [ref=e67] [cursor=pointer]
  - alert [ref=e71]
```