# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 constructed_response stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:83:7

# Error details

```
ZodError: [
  {
    "code": "custom",
    "path": [
      "attempt",
      "constructedResponse"
    ],
    "message": "La comparación debe pertenecer a la respuesta activa pendiente."
  }
]
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Práctica registrada', exact: true })
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Práctica registrada', exact: true }) with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Práctica registrada', exact: true })
  - Test ended.

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
      - status: Confirmando con el servidor…
      - heading "Explica cómo se relacionan A y B" [level=2]
      - article:
        - heading "Tu respuesta" [level=3]
        - paragraph: A precede a B.
      - article:
        - heading "Respuesta modelo" [level=3]
        - paragraph: A precede a B.
      - group: Criterios para comparar +
      - group "Valora tu recuperación":
        - text: Valora tu recuperación
        - button "Volver a practicar" [disabled]
        - button "Me costó" [disabled]
        - button "Lo recuperé" [disabled]
- alert
```