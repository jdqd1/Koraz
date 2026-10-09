# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-persistence.spec.ts >> disposable API/SQL persistence >> published routes are visible before enrollment and have no incoming root lines
- Location: tests\e2e\learning-map-persistence.spec.ts:16:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: page.goto: Test timeout of 45000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/aprendizaje/mapa", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - search "Buscar guías" [ref=e6]:
      - combobox "Buscar guías" [ref=e9]
    - heading "Koras" [level=1] [ref=e11]
    - generic [ref=e12]:
      - button "Notificaciones" [ref=e14] [cursor=pointer]
      - generic "Cargando perfil" [ref=e18]
  - main [ref=e21]:
    - region "Mapa de aprendizaje" [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - heading "Mi mapa de aprendizaje" [level=1] [ref=e27]
          - generic [ref=e28]:
            - status [ref=e29]: Abriendo…
            - button "Vista de lista" [ref=e30] [cursor=pointer]
        - generic [ref=e34]:
          - heading "Preparando tu mapa" [level=2] [ref=e35]
          - paragraph [ref=e36]: La información se confirma desde tu cuenta.
  - navigation "Navegación móvil" [ref=e38]:
    - link "Inicio" [ref=e39] [cursor=pointer]:
      - /url: /dashboard
    - link "Guías" [ref=e43] [cursor=pointer]:
      - /url: /guias
    - button "Materiales" [ref=e48] [cursor=pointer]
```