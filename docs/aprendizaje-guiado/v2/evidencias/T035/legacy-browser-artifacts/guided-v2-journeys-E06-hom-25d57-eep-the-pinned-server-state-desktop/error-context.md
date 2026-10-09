# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E06 home, real map, route, session and review keep the pinned server state
- Location: tests\e2e\guided-v2-journeys.spec.ts:123:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText('Ruta T035 pequeña', { exact: true }).first()
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" getByText('Ruta T035 pequeña', { exact: true }).first() with timeout 15000ms
  - waiting for getByText('Ruta T035 pequeña', { exact: true }).first()
  - Protocol error (Runtime.callFunctionOn): Internal server error, session closed.

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary "Navegación principal" [ref=f1e3]:
      - navigation [ref=f1e4]:
        - generic [ref=f1e5]:
          - link [ref=f1e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link [ref=f1e9] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button [ref=f1e14] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f1e17]:
      - banner [ref=f1e18]:
        - button "Abrir menú principal" [ref=f1e20] [cursor=pointer]
        - search "Buscar guías" [ref=f1e24]:
          - combobox "Buscar guías" [ref=f1e27]
        - heading "Koras" [level=1] [ref=f1e29]
        - generic [ref=f1e30]:
          - button "Notificaciones" [ref=f1e32] [cursor=pointer]
          - generic "Cargando perfil" [ref=f1e36]
      - main [ref=f1e39]:
        - generic [ref=f1e41]:
          - generic [ref=f1e42]: Aprendizaje guiado
          - heading "Elige cómo avanzar, sin perder el rumbo." [level=1] [ref=f1e45]
          - paragraph [ref=f1e46]: Rutas cortas que conectan comprensión, práctica y repaso. Tú decides qué actividad abrir.
        - navigation "Secciones de Aprendizaje guiado" [ref=f1e47]:
          - link "Hoy" [ref=f1e48] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
          - link "Rutas" [ref=f1e49] [cursor=pointer]:
            - /url: /aprendizaje?tab=rutas
          - link "Progreso" [ref=f1e50] [cursor=pointer]:
            - /url: /aprendizaje?tab=progreso
        - alert [ref=f1e51]:
          - text: No pudimos cargar tus rutas de práctica por objetivos.
          - link "Reintentar" [ref=f1e52] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
        - region [ref=f1e53]:
          - generic [ref=f1e55]:
            - text: Tu sesión
            - heading "Para hoy" [level=2] [ref=f1e56]
          - generic [ref=f1e57]:
            - generic [ref=f1e59]:
              - generic [ref=f1e63]:
                - heading "Empieza con una ruta" [level=2] [ref=f1e64]
                - paragraph [ref=f1e65]: Explora los temas y elige libremente cuál comenzar.
              - link "Elegir una ruta" [ref=f1e66] [cursor=pointer]:
                - /url: /aprendizaje?tab=rutas
            - complementary "Resumen de aprendizaje" [ref=f1e67]:
              - generic [ref=f1e69]:
                - text: Tu panorama
                - heading "Señales separadas" [level=2] [ref=f1e70]
              - generic [ref=f1e73]:
                - generic [ref=f1e74]:
                  - term [ref=f1e75]: Pasos pendientes
                  - definition [ref=f1e78]: "0"
                - generic [ref=f1e79]:
                  - term [ref=f1e80]: Repasos vencidos
                  - definition [ref=f1e83]: "0"
                - generic [ref=f1e84]:
                  - term [ref=f1e85]: Puntos de aprendizaje
                  - definition [ref=f1e88]: "0"
              - region [ref=f1e89]:
                - generic [ref=f1e93]:
                  - heading "Constancia" [level=3] [ref=f1e94]
                  - paragraph [ref=f1e95]: La meta semanal es opcional y nunca penaliza una pausa.
              - button "Ajustar aprendizaje" [ref=f1e96] [cursor=pointer]
              - link "Elegir otra actividad" [ref=f1e99] [cursor=pointer]:
                - /url: /aprendizaje?tab=rutas
  - button "Open Next.js Dev Tools" [ref=f1e107] [cursor=pointer]
  - alert [ref=f1e111]
```