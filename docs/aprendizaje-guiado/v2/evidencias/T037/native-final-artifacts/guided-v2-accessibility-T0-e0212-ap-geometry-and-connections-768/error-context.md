# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01 stable map geometry and connections
- Location: tests\e2e\guided-v2-accessibility.spec.ts:340:5

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Ajustar vista', exact: true })
    - locator resolved to <button aria-label="Ajustar vista" class="learning-map-module__RbHqDa__iconButton">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <a class="" href="/dashboard">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <a class="" href="/dashboard">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    109 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <a class="" href="/dashboard">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Aprendizaje guiado" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - link "Acceder" [ref=e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=e22]:
      - region "Mapa de aprendizaje" [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]:
              - button "Atrás en el mapa" [ref=e27] [cursor=pointer]
              - generic [ref=e30]:
                - navigation "Ruta del mapa" [ref=e31]:
                  - button "Rutas de aprendizaje" [ref=e33] [cursor=pointer]
                - heading "Tema T035" [active] [level=1] [ref=e36]
            - button "Vista de lista" [ref=e38] [cursor=pointer]
          - generic [ref=e42]:
            - region "Mapa del nivel Tema T035" [ref=e43]:
              - generic [ref=e44]:
                - img "Conexión con el nivel anterior"
                - application [ref=e45]:
                  - generic [ref=e47]:
                    - generic:
                      - generic:
                        - img:
                          - img "Edge from level-origin to 0972d21d-0572-4df9-8e93-735a2d7ad927"
                        - img:
                          - img "Edge from level-origin to 896caf14-bbe0-40ca-83ab-05243ad6f4b0"
                      - generic:
                        - 'generic "Origen del nivel: Tema T035" [ref=e49]':
                          - button "Volver desde Tema T035" [ref=e50] [cursor=pointer]:
                            - strong [ref=e53]: Tema T035
                        - article "Ruta T035 de 200 objetivos, Ruta por comenzar · dominio por comprobar, 1 unidades" [ref=e55]:
                          - group [ref=e56]:
                            - generic "Opciones de Ruta T035 de 200 objetivos" [ref=e57] [cursor=pointer]
                          - button "Abrir Ruta T035 de 200 objetivos" [ref=e60] [cursor=pointer]:
                            - generic [ref=e64]:
                              - generic [ref=e65]:
                                - strong [ref=e66]: Ruta T035 de 200 objetivos
                                - generic [ref=e67]: Recorrido
                              - generic [ref=e68]:
                                - generic [ref=e69]: —
                                - generic [ref=e70]: 1 unidades
                              - generic "Ruta por comenzar · dominio por comprobar" [ref=e71]
                        - article "Ruta T035 pequeña, Recorrido en curso · dominio por comprobar · consolidación pendiente · 0 repasos, 1 unidades" [ref=e74]:
                          - group [ref=e75]:
                            - generic "Opciones de Ruta T035 pequeña" [ref=e76] [cursor=pointer]
                          - button "Abrir Ruta T035 pequeña" [ref=e79] [cursor=pointer]:
                            - generic [ref=e83]:
                              - generic [ref=e84]:
                                - strong [ref=e85]: Ruta T035 pequeña
                                - generic [ref=e86]: Recorrido
                              - generic [ref=e87]:
                                - generic [ref=e88]: 0 % de avance
                                - generic [ref=e89]: 1 unidades
                              - generic "Recorrido en curso · dominio por comprobar · consolidación pendiente · 0 repasos" [ref=e90]
            - generic "Controles del mapa" [ref=e93]:
              - button "Alejar" [ref=e94] [cursor=pointer]
              - button "Restablecer zoom al 100 %" [ref=e97] [cursor=pointer]: 100 %
              - button "Acercar" [ref=e98] [cursor=pointer]
              - button "Ajustar vista" [ref=e101] [cursor=pointer]
          - generic [ref=e104]: Tema T035, 2 contenidos
    - navigation "Navegación móvil" [ref=e105]:
      - link "Inicio" [ref=e106] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e110] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e115] [cursor=pointer]
      - link [ref=e119] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e122]: Rutas deaprendizaje
  - alert [ref=e123]
```