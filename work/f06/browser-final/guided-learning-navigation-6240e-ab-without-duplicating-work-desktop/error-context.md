# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-navigation.spec.ts >> F06 V1 retains unit, activity, guide section and resource tab without duplicating work
- Location: tests\e2e\guided-learning-navigation.spec.ts:7:5

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Ver resumen', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e2]:
    - complementary "Navegación principal" [ref=f3e3]:
      - navigation [ref=f3e4]:
        - generic [ref=f3e5]:
          - link "Inicio" [ref=f3e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f3e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f3e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f3e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f3e20]:
      - banner [ref=f3e21]:
        - button "Expandir menú principal" [ref=f3e23] [cursor=pointer]
        - search "Buscar guías" [ref=f3e27]:
          - combobox "Buscar guías" [ref=f3e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f3e32]
        - generic [ref=f3e33]:
          - button "Notificaciones" [ref=f3e35] [cursor=pointer]
          - button "Abrir menú de perfil de f06-desktop@example.test" [ref=f3e39] [cursor=pointer]:
            - generic [ref=f3e40]: F0
      - main "Sesión de aprendizaje" [ref=f3e41]:
        - generic [ref=f3e42]:
          - generic [ref=f3e43]:
            - link "Volver a la unidad" [ref=f3e44] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=5ab20ca5-e67f-49cb-863a-06ecf3927aec&actividad=6c1669a7-09d2-4184-94fc-11919d89a889&returnTo=%2Faprendizaje%2Fmapa#actividad-6c1669a7-09d2-4184-94fc-11919d89a889
            - generic [ref=f3e47]:
              - generic [ref=f3e48]: Cuestionario
              - heading "Lectura estructurada F06" [level=1] [ref=f3e49]
            - group [ref=f3e50]:
              - button "Detalles de la sesión" [ref=f3e51] [cursor=pointer]
          - generic [ref=f3e54]:
            - progressbar "Avance de la ruta" [ref=f3e55]
            - generic [ref=f3e56]: 2 de 3
        - paragraph [ref=f3e57]: Progreso guardado.
        - status [ref=f3e58]:
          - generic [ref=f3e61]:
            - heading "Respuesta correcta" [level=2] [ref=f3e62]
            - paragraph [ref=f3e63]: La primera letra de esta simulación es A.
          - button "Ver resultado" [ref=f3e64] [cursor=pointer]
  - alert [ref=f3e67]: Aprendizaje guiado
```