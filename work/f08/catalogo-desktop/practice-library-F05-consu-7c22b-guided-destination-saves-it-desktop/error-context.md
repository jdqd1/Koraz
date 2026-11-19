# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-library.spec.ts >> F05 consultation and free practice preserve guided progress; the guided destination saves it
- Location: tests\e2e\practice-library.spec.ts:57:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.getAttribute: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('navigation', { name: 'Rutas que incluyen esta actividad' }).getByRole('link')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - button "Material de estudio" [expanded] [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=e20]:
      - banner [ref=e21]:
        - button "Expandir menú principal" [ref=e23] [cursor=pointer]
        - search "Buscar guías" [ref=e27]:
          - combobox "Buscar guías" [ref=e30]
        - heading "Cuestionarios" [level=1] [ref=e32]
        - generic [ref=e33]:
          - button "Notificaciones" [ref=e35] [cursor=pointer]
          - button "Abrir menú de perfil de lector@example.test" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: LE
      - main [ref=e41]:
        - article [ref=e42]:
          - generic [ref=e43]:
            - navigation "Volver a Abdomen" [ref=e44]:
              - link "Volver a Abdomen" [ref=e45] [cursor=pointer]:
                - /url: /asignaturas/anatomia?tipo=quiz&tema=Abdomen
            - heading "Guía de prueba" [level=2] [ref=e49]
          - generic [ref=e50]:
            - heading "Práctica libre" [level=3] [ref=e51]
            - paragraph [ref=e52]: El resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos. Para guardar el avance de una ruta, abre su actividad guiada.
            - button "Practicar cuestionario" [active] [ref=e53] [cursor=pointer]
            - group [ref=e54]:
              - generic "Consultar preguntas y respuestas" [ref=e55]
              - generic [ref=e56]:
                - generic [ref=e60]:
                  - heading "Cuestionario" [level=3] [ref=e61]
                  - paragraph [ref=e62]: 1 pregunta de repaso
                - article [ref=e64]:
                  - generic [ref=e65]:
                    - generic [ref=e66]: "01"
                    - generic [ref=e67]:
                      - text: Pregunta
                      - heading "¿Qué opción aparece primero?" [level=4] [ref=e68]
                  - generic [ref=e69]:
                    - generic [ref=e70]: Respuesta
                    - paragraph [ref=e73]: Primera
                  - paragraph [ref=e74]: Resultado de prueba.
  - alert [ref=e75]
```