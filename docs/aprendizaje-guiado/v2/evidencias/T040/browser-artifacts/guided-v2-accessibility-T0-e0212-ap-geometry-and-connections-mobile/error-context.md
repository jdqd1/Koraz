# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01 stable map geometry and connections
- Location: tests\e2e\guided-v2-accessibility.spec.ts:365:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.react-flow__node')
Expected: 3
Received: 4
Timeout:  60000ms

Call log:
  - Expect "toHaveCount" locator('.react-flow__node') with timeout 60000ms
  - waiting for locator('.react-flow__node')
    121 × locator resolved to 4 elements
        - unexpected value "4"

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
                          - img "Edge from level-origin to b628f96f-7145-47a4-a634-fa3305aef49b"
                        - img:
                          - img "Edge from level-origin to f77ffcbb-e454-41cc-bb2c-fe12ebdd08ee"
                        - img:
                          - img "Edge from level-origin to 86b6a05b-c04e-427a-b6ca-481d1ccdd56c"
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
                        - article "Ruta editorial T035, Ruta por comenzar · dominio por comprobar, 1 unidades" [ref=e93]:
                          - group [ref=e94]:
                            - generic "Opciones de Ruta editorial T035" [ref=e95] [cursor=pointer]
                          - button "Abrir Ruta editorial T035" [ref=e98] [cursor=pointer]:
                            - generic [ref=e102]:
                              - generic [ref=e103]:
                                - strong [ref=e104]: Ruta editorial T035
                                - generic [ref=e105]: Recorrido
                              - generic [ref=e106]:
                                - generic [ref=e107]: —
                                - generic [ref=e108]: 1 unidades
                              - generic "Ruta por comenzar · dominio por comprobar" [ref=e109]
            - generic "Controles del mapa" [ref=e112]:
              - button "Alejar" [ref=e113] [cursor=pointer]
              - button "Restablecer zoom al 100 %" [ref=e116] [cursor=pointer]: 100 %
              - button "Acercar" [ref=e117] [cursor=pointer]
              - button "Ajustar vista" [ref=e120] [cursor=pointer]
          - generic [ref=e123]: Tema T035, 3 contenidos
    - navigation "Navegación móvil" [ref=e124]:
      - link "Inicio" [ref=e125] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e129] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e134] [cursor=pointer]
      - link [ref=e138] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e141]: Rutas deaprendizaje
  - alert [ref=e142]
```