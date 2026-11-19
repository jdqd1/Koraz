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
  - main "Sesión de aprendizaje" [ref=f11e4]:
    - generic [ref=f11e5]:
      - generic [ref=f11e6]:
        - link "Volver a la unidad" [ref=f11e7] [cursor=pointer]:
          - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=82b4af65-5226-4506-b305-e2f3e514d751&actividad=fe5f7a9b-f709-4f2d-adb0-ea34e4c30a08#actividad-fe5f7a9b-f709-4f2d-adb0-ea34e4c30a08
        - generic [ref=f11e10]:
          - generic [ref=f11e11]: Cuestionario
          - heading "Lectura estructurada F06" [level=1] [ref=f11e12]
        - group [ref=f11e13]:
          - button "Detalles de la sesión" [ref=f11e14] [cursor=pointer]
      - generic [ref=f11e17]:
        - progressbar "Avance de la ruta" [ref=f11e18]
        - generic [ref=f11e19]: 1 de 3
    - paragraph [ref=f11e20]: Progreso guardado.
    - status [ref=f11e21]:
      - generic [ref=f11e24]:
        - heading "Respuesta correcta" [level=2] [ref=f11e25]
        - paragraph [ref=f11e26]: La primera letra de esta simulación es A.
      - button "Ver resultado" [ref=f11e27] [cursor=pointer]
  - alert [ref=f11e30]: Aprendizaje guiado
```