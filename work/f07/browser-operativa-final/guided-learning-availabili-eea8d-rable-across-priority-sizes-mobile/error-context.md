# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 keeps the answer, feedback and exit operable across priority sizes
- Location: tests\e2e\guided-learning-availability.spec.ts:15:5

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Finalizar sesión', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - main [ref=f1e4]:
    - region "Sesión de aprendizaje" [ref=f1e5]:
      - generic [ref=f1e6]:
        - generic [ref=f1e7]:
          - link "Volver a la unidad" [ref=f1e8] [cursor=pointer]:
            - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1&actividad=constructed-1#actividad-constructed-1
          - generic [ref=f1e11]:
            - generic [ref=f1e12]: Práctica
            - heading "Tu sesión de aprendizaje" [level=1] [ref=f1e13]
          - group [ref=f1e14]:
            - button "Detalles de la sesión" [ref=f1e15] [cursor=pointer]
        - generic [ref=f1e18]:
          - progressbar "Avance de la ruta" [ref=f1e19]
          - generic [ref=f1e20]: 2 de 9
      - status [ref=f1e21]: Sesión completada y guardada.
      - generic [ref=f1e22]:
        - heading "Sesión completada" [active] [level=2] [ref=f1e26]
        - paragraph [ref=f1e27]: Tu progreso está guardado. Continúa a tu ritmo.
        - paragraph [ref=f1e28]: "Ganaste 0 XP · Total: 0 XP"
        - paragraph [ref=f1e29]: Esta sesión no generó un premio nuevo. Los logros ya premiados no se duplican y el repaso comparte un límite diario de 20 XP.
        - link "Ver repasos pendientes" [ref=f1e30] [cursor=pointer]:
          - /url: /aprendizaje/repaso
        - button "Siguiente actividad" [ref=f1e32] [cursor=pointer]
        - group [ref=f1e35]:
          - generic "Respuestas confirmadas +" [ref=f1e36] [cursor=pointer]
          - text: +
        - group [ref=f1e37]:
          - generic "Progreso y próximos repasos +" [ref=f1e38] [cursor=pointer]
        - link "Volver a la unidad" [ref=f1e39] [cursor=pointer]:
          - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1&actividad=constructed-1#actividad-constructed-1
  - alert [ref=f1e42]: Aprendizaje guiado
```