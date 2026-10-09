# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-persistence.spec.ts >> disposable API/SQL persistence >> published route is shared while spatial state stays account scoped
- Location: tests\e2e\learning-map-persistence.spec.ts:34:7

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
          - button "Abrir menú de perfil de student.map@example.test" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: ST
      - main [ref=e41]:
        - region "Mapa de aprendizaje" [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]:
              - heading "Mi mapa de aprendizaje" [level=1] [ref=e47]
              - generic [ref=e48]:
                - status [ref=e49]: Abriendo…
                - button "Vista de lista" [ref=e50] [cursor=pointer]
            - generic [ref=e54]:
              - heading "Preparando tu mapa" [level=2] [ref=e55]
              - paragraph [ref=e56]: La información se confirma desde tu cuenta.
  - button "Open Next.js Dev Tools" [ref=e63] [cursor=pointer]:
    - generic [ref=e66]:
      - text: Compiling
      - generic [ref=e67]:
        - generic [ref=e68]: .
        - generic [ref=e69]: .
        - generic [ref=e70]: .
  - alert [ref=e71]
```