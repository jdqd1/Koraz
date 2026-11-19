# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-navigation.spec.ts >> F06 V1 retains unit, activity, guide section and resource tab without duplicating work
- Location: tests\e2e\guided-learning-navigation.spec.ts:7:5

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('link', { name: 'Volver a la unidad', exact: true }) resolved to 2 elements:
    1) <a class="kAu9ea_iconButton" title="Volver a la unidad" aria-label="Volver a la unidad" href="/aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=459f066d-ef53-4095-9e48-9a31041911a3&actividad=fa47948c-cc16-4e6e-91d8-a4908494fca7&returnTo=%2Faprendizaje%2Fmapa#actividad-fa47948c-cc16-4e6e-91d8-a4908494fca7">…</a> aka getByRole('link', { name: 'Volver a la unidad', description: 'Volver a la unidad' })
    2) <a class="learning-primary-button" href="/aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=459f066d-ef53-4095-9e48-9a31041911a3&actividad=fa47948c-cc16-4e6e-91d8-a4908494fca7&returnTo=%2Faprendizaje%2Fmapa#actividad-fa47948c-cc16-4e6e-91d8-a4908494fca7">…</a> aka getByText('Volver a la unidad')

Call log:
  - waiting for getByRole('link', { name: 'Volver a la unidad', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
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
          - button "Abrir menú de perfil de f06-desktop@example.test" [ref=f1e39] [cursor=pointer]:
            - generic [ref=f1e40]: F0
      - main "Sesión de aprendizaje" [ref=f1e41]:
        - generic [ref=f1e42]:
          - generic [ref=f1e43]:
            - link "Volver a la unidad" [ref=f1e44] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=459f066d-ef53-4095-9e48-9a31041911a3&actividad=fa47948c-cc16-4e6e-91d8-a4908494fca7&returnTo=%2Faprendizaje%2Fmapa#actividad-fa47948c-cc16-4e6e-91d8-a4908494fca7
            - generic [ref=f1e47]:
              - generic [ref=f1e48]: Lectura
              - heading "Lectura estructurada F06" [level=1] [ref=f1e49]
            - group [ref=f1e50]:
              - button "Detalles de la sesión" [ref=f1e51] [cursor=pointer]
          - generic [ref=f1e54]:
            - progressbar "Avance de la ruta" [ref=f1e55]
            - generic [ref=f1e56]: 1 de 3
        - paragraph [ref=f1e57]: Progreso guardado.
        - generic [ref=f1e58]:
          - generic [ref=f1e62]: Progreso guardado
          - heading "Actividad completada" [level=2] [ref=f1e63]
          - paragraph [ref=f1e64]: Tu progreso está guardado. Continúa a tu ritmo.
          - generic [ref=f1e68]:
            - strong [ref=f1e69]: +10 XP
            - generic [ref=f1e70]: Puntos de aprendizaje nuevos
          - list [ref=f1e71]:
            - listitem [ref=f1e72]: Primera actividad
          - group [ref=f1e75]:
            - generic "Avance de la ruta +" [ref=f1e76] [cursor=pointer]
          - generic [ref=f1e77]:
            - link "Volver a la unidad" [ref=f1e78] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=459f066d-ef53-4095-9e48-9a31041911a3&actividad=fa47948c-cc16-4e6e-91d8-a4908494fca7&returnTo=%2Faprendizaje%2Fmapa#actividad-fa47948c-cc16-4e6e-91d8-a4908494fca7
            - link "Volver a mi ruta" [ref=f1e81] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f06
  - alert [ref=f1e84]: Aprendizaje guiado
```