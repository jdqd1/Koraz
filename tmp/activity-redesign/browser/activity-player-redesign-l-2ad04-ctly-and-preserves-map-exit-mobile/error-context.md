# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> lost writes retry once with the same identity; next activity starts directly and preserves map exit
- Location: tests\e2e\activity-player-redesign.spec.ts:131:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Pista', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Pista', exact: true }) with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Pista', exact: true })

```

```yaml
- main:
  - main:
    - region "Sesión de aprendizaje":
      - link "Volver a mi mapa":
        - /url: /aprendizaje/mapa
      - text: Práctica
      - heading "Tu sesión de aprendizaje" [level=1]
      - group:
        - button "Detalles de la sesión"
      - progressbar "Avance de la ruta"
      - text: 2 de 6
      - status: Consulta registrada por el servidor. Esta actividad se practica con ayuda.
      - heading "¿Qué concepto precede a B?" [level=2]
      - text: Tu respuesta
      - textbox "Tu respuesta": A
      - paragraph: 1 / 240 caracteres
      - button "Necesito ayuda" [pressed]: Pista
      - button "Consultar fuente con ayuda": Fuente
      - status:
        - heading "Pista Ocultar ayuda" [level=3]:
          - text: Pista
          - button "Ocultar ayuda"
        - paragraph: Identifica el origen antes de relacionar el resultado.
        - text: Práctica con ayuda
      - button "Comprobar respuesta"
- alert
```