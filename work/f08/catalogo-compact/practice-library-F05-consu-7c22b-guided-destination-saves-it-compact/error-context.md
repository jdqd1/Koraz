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
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Cuestionarios" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - button "Abrir menú de perfil de lector@example.test" [ref=e18] [cursor=pointer]:
          - generic [ref=e19]: LE
    - main [ref=e20]:
      - article [ref=e21]:
        - generic [ref=e22]:
          - navigation "Volver a Abdomen" [ref=e23]:
            - link "Volver a Abdomen" [ref=e24] [cursor=pointer]:
              - /url: /asignaturas/anatomia?tipo=quiz&tema=Abdomen
          - heading "Guía de prueba" [level=2] [ref=e28]
        - generic [ref=e29]:
          - heading "Práctica libre" [level=3] [ref=e30]
          - paragraph [ref=e31]: El resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos. Para guardar el avance de una ruta, abre su actividad guiada.
          - button "Practicar cuestionario" [active] [ref=e32] [cursor=pointer]
          - group [ref=e33]:
            - generic "Consultar preguntas y respuestas" [ref=e34]
            - generic [ref=e35]:
              - generic [ref=e39]:
                - heading "Cuestionario" [level=3] [ref=e40]
                - paragraph [ref=e41]: 1 pregunta de repaso
              - article [ref=e43]:
                - generic [ref=e44]:
                  - generic [ref=e45]: "01"
                  - generic [ref=e46]:
                    - text: Pregunta
                    - heading "¿Qué opción aparece primero?" [level=4] [ref=e47]
                - generic [ref=e48]:
                  - generic [ref=e49]: Respuesta
                  - paragraph [ref=e52]: Primera
                - paragraph [ref=e53]: Resultado de prueba.
    - navigation "Navegación móvil" [ref=e54]:
      - link "Inicio" [ref=e55] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e59] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e64] [cursor=pointer]
      - link [ref=e68] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e71]: Rutas deaprendizaje
  - alert [ref=e72]
```