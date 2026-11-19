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
  - generic [ref=f1e2]:
    - complementary "Navegación principal" [ref=f1e3]:
      - navigation [ref=f1e4]:
        - generic [ref=f1e5]:
          - link "Inicio" [ref=f1e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f1e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f1e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f1e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f1e20]:
      - banner [ref=f1e21]:
        - button "Expandir menú principal" [ref=f1e23] [cursor=pointer]
        - search "Buscar guías" [ref=f1e27]:
          - combobox "Buscar guías" [ref=f1e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f1e32]
        - generic [ref=f1e33]:
          - button "Notificaciones" [ref=f1e35] [cursor=pointer]
          - button "Abrir menú de perfil de t035-26@example.test" [ref=f1e39] [cursor=pointer]:
            - generic [ref=f1e40]: T0
      - main [ref=f1e41]:
        - region "Sesión de aprendizaje" [ref=f1e42]:
          - generic [ref=f1e43]:
            - generic [ref=f1e44]:
              - link "Volver a la unidad" [ref=f1e45] [cursor=pointer]:
                - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1&actividad=constructed-1#actividad-constructed-1
              - generic [ref=f1e48]:
                - generic [ref=f1e49]: Práctica
                - heading "Tu sesión de aprendizaje" [level=1] [ref=f1e50]
              - group [ref=f1e51]:
                - button "Detalles de la sesión" [ref=f1e52] [cursor=pointer]
            - generic [ref=f1e55]:
              - progressbar "Avance de la ruta" [ref=f1e56]
              - generic [ref=f1e57]: 2 de 9
          - status [ref=f1e58]: Sesión completada y guardada.
          - generic [ref=f1e59]:
            - heading "Sesión completada" [active] [level=2] [ref=f1e63]
            - paragraph [ref=f1e64]: Tu progreso está guardado. Continúa a tu ritmo.
            - paragraph [ref=f1e65]: "Ganaste 0 XP · Total: 0 XP"
            - paragraph [ref=f1e66]: Esta sesión no generó un premio nuevo. Los logros ya premiados no se duplican y el repaso comparte un límite diario de 20 XP.
            - link "Ver repasos pendientes" [ref=f1e67] [cursor=pointer]:
              - /url: /aprendizaje/repaso
            - button "Siguiente actividad" [ref=f1e69] [cursor=pointer]
            - group [ref=f1e72]:
              - generic "Respuestas confirmadas +" [ref=f1e73] [cursor=pointer]
              - text: +
            - group [ref=f1e74]:
              - generic "Progreso y próximos repasos +" [ref=f1e75] [cursor=pointer]
            - link "Volver a la unidad" [ref=f1e76] [cursor=pointer]:
              - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1&actividad=constructed-1#actividad-constructed-1
  - alert [ref=f1e79]: Aprendizaje guiado
```