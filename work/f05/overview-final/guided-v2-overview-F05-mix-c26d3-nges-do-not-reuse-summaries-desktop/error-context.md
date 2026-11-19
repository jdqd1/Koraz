# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-overview.spec.ts >> F05 mixed routes reconcile Inicio, Hoy and Progreso; account changes do not reuse summaries
- Location: tests\e2e\guided-v2-overview.spec.ts:3:5

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('region', { name: 'Mis rutas por objetivos' }).getByRole('link', { name: 'Abrir mi ruta' })
    - locator resolved to <a class="learning-primary-button" href="/aprendizaje/rutas/f02-versiones?leccion=unit">Abrir mi ruta</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <small aria-hidden="true">1</small> from <div class="dashboard-learning" aria-label="Aprendizaje guiado">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <small aria-hidden="true">1</small> from <div class="dashboard-learning" aria-label="Aprendizaje guiado">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    108 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <small aria-hidden="true">1</small> from <div class="dashboard-learning" aria-label="Aprendizaje guiado">…</div> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - button "Material de estudio" [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=e20]:
      - banner [ref=e21]:
        - button "Expandir menú principal" [ref=e23] [cursor=pointer]
        - search "Buscar guías" [ref=e27]:
          - combobox "Buscar guías" [ref=e30]
        - heading "Inicio" [level=1] [ref=e32]
        - generic [ref=e33]:
          - button "Notificaciones" [ref=e35] [cursor=pointer]
          - button "Abrir menú de perfil de f03-desktop@example.test" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: F0
      - main [ref=e41]:
        - heading "Inicio" [level=1] [ref=e42]
        - generic [ref=e43]:
          - region [ref=e44]:
            - heading "Seguir leyendo" [level=2] [ref=e46]
            - link "Descubre una guía para empezar a leer Explorar guías" [ref=e47] [cursor=pointer]:
              - /url: /guias
              - generic [ref=e51]: Descubre una guía para empezar a leer
              - generic [ref=e52]: Explorar guías
          - generic "Aprendizaje guiado" [ref=e55]:
            - region [ref=e56]:
              - generic [ref=e57]:
                - heading "Ruta de aprendizaje" [level=2] [ref=e58]
                - link "Ver todas" [ref=e59] [cursor=pointer]:
                  - /url: /aprendizaje?tab=rutas
              - article [ref=e62]:
                - generic [ref=e63]:
                  - generic [ref=e64]:
                    - generic [ref=e65]: En curso
                    - heading "Repaso simulado F03" [level=3] [ref=e69]
                    - paragraph [ref=e70]: 0 de 1 actividades obligatorias completadas
                  - generic [ref=e71]:
                    - progressbar "Progreso de Repaso simulado F03" [ref=e72]
                    - strong [ref=e74]: 0%
                - list "Progreso por actividades" [ref=e78]:
                  - listitem [ref=e79]:
                    - generic [aria-hidden] [ref=e81]: "1"
                    - emphasis [aria-hidden] [ref=e82]: Ahora
                    - generic [ref=e83]: "Recordar letras: actividad actual"
          - region "Mis rutas por objetivos" [ref=e84]:
            - heading "Mis rutas por objetivos" [level=2] [ref=e85]
            - article [ref=e86]:
              - heading [level=3] [ref=e87]:
                - link "Simulación de actualización" [ref=e88] [cursor=pointer]:
                  - /url: /aprendizaje/rutas/f02-versiones
              - generic "Estado confirmado de la ruta" [ref=e89]:
                - generic [ref=e90]: Actividades en curso
                - generic [ref=e93]: Aprendizaje por comprobar
                - generic [ref=e96]: Repaso a largo plazo pendiente
                - generic [ref=e99]: 1 repaso pendiente
                - generic [ref=e102]: 3 de 9 actividades obligatorias completadas
              - paragraph [ref=e103]: Evaluación diferida vencida
              - link "Abrir mi ruta" [ref=e104] [cursor=pointer]:
                - /url: /aprendizaje/rutas/f02-versiones?leccion=unit
          - region [ref=e105]:
            - heading "Repaso" [level=2] [ref=e107]
            - article [ref=e108]:
              - generic [ref=e113]:
                - strong [ref=e114]: Preguntas y tarjetas
                - generic [ref=e115]: 2 ítems pendientes
              - link "Ver repasos pendientes" [ref=e116] [cursor=pointer]:
                - /url: /aprendizaje/repaso
          - region [ref=e119]:
            - generic [ref=e120]:
              - heading "Agregadas recientemente" [level=2] [ref=e121]
              - link "Ver todas" [ref=e122] [cursor=pointer]:
                - /url: /guias
            - list [ref=e125]:
              - listitem [ref=e126]:
                - link "Sin materia Guía T035" [ref=e127] [cursor=pointer]:
                  - /url: /guias/t035-guide?tipo=guide
                  - generic [ref=e131]:
                    - generic [ref=e132]: Sin materia
                    - strong [ref=e133]: Guía T035
                  - generic [aria-hidden] [ref=e134]: Guía de estudio
  - alert [ref=e137]
```