# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 measures map panel, V1 activity launch and confirmed submission
- Location: tests\e2e\guided-learning-availability.spec.ts:257:5

# Error details

```
Error: expect(received).toBeDefined()

Received: undefined

Call Log:
- Timeout 12000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=f11e1]:
  - generic [ref=f11e2]:
    - complementary "Navegación principal" [ref=f11e3]:
      - navigation [ref=f11e4]:
        - generic [ref=f11e5]:
          - link "Inicio" [ref=f11e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f11e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f11e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f11e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f11e20]:
      - banner [ref=f11e21]:
        - button "Expandir menú principal" [ref=f11e23] [cursor=pointer]
        - search "Buscar guías" [ref=f11e27]:
          - combobox "Buscar guías" [ref=f11e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f11e32]
        - generic [ref=f11e33]:
          - button "Notificaciones" [ref=f11e35] [cursor=pointer]
          - button "Abrir menú de perfil de f06-desktop@example.test" [ref=f11e39] [cursor=pointer]:
            - generic [ref=f11e40]: F0
      - main "Sesión de aprendizaje" [ref=f11e41]:
        - generic [ref=f11e42]:
          - generic [ref=f11e43]:
            - link "Volver a la unidad" [ref=f11e44] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=82b4af65-5226-4506-b305-e2f3e514d751&actividad=fe5f7a9b-f709-4f2d-adb0-ea34e4c30a08#actividad-fe5f7a9b-f709-4f2d-adb0-ea34e4c30a08
            - generic [ref=f11e47]:
              - generic [ref=f11e48]: Cuestionario
              - heading "Lectura estructurada F06" [level=1] [ref=f11e49]
            - group [ref=f11e50]:
              - button "Detalles de la sesión" [ref=f11e51] [cursor=pointer]
          - generic [ref=f11e54]:
            - progressbar "Avance de la ruta" [ref=f11e55]
            - generic [ref=f11e56]: 1 de 3
        - paragraph [ref=f11e57]: Progreso guardado.
        - status [ref=f11e58]:
          - generic [ref=f11e61]:
            - heading "Respuesta correcta" [level=2] [ref=f11e62]
            - paragraph [ref=f11e63]: La primera letra de esta simulación es A.
          - button "Ver resultado" [ref=f11e64] [cursor=pointer]
  - alert [ref=f11e67]: Aprendizaje guiado
```