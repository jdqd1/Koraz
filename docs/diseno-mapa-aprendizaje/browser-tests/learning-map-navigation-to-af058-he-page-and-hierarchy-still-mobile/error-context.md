# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-navigation.spec.ts >> touch scrolling starts on a card and leaves the page and hierarchy still
- Location: tests\e2e\learning-map-navigation.spec.ts:7:5

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 578
Received:    582
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
            - heading "Mi mapa de aprendizaje" [active] [level=1] [ref=e28]
            - button "Vista de lista" [ref=e30] [cursor=pointer]
          - generic [ref=e33]:
            - generic [ref=e34]: 6 rutas
            - generic "15 de 124 actividades esenciales completadas" [ref=e35]: 12 % de avance
          - generic [ref=e39]:
            - region "Mapa del nivel Mi mapa de aprendizaje" [ref=e40]:
              - application [ref=e42]:
                - generic [ref=e44]:
                  - generic:
                    - generic:
                      - img:
                        - img "Edge from level-origin to b1000000-0000-4000-8000-000000000001"
                      - img:
                        - img "Edge from level-origin to b1000000-0000-4000-8000-000000000002"
                      - img:
                        - img "Edge from level-origin to b1000000-0000-4000-8000-000000000003"
                      - img:
                        - img "Edge from level-origin to b1000000-0000-4000-8000-000000000004"
                      - img:
                        - img "Edge from level-origin to b1000000-0000-4000-8000-000000000005"
                      - img:
                        - img "Edge from level-origin to b1000000-0000-4000-8000-000000000006"
                    - generic:
                      - 'generic "Origen del nivel: Mis rutas" [ref=e46]':
                        - strong [ref=e50]: Mis rutas
                      - article "Anatomía, En progreso, 8 bloques" [ref=e52]:
                        - group [ref=e53]:
                          - generic "Opciones de Anatomía" [ref=e54] [cursor=pointer]
                        - button "Abrir Anatomía" [ref=e57] [cursor=pointer]:
                          - generic "En progreso" [ref=e62]
                          - generic [ref=e63]:
                            - strong [ref=e65]: Anatomía
                            - generic [ref=e66]:
                              - generic [ref=e67]: 12 %
                              - generic [ref=e68]: 8 bloques
                      - article "Bioquímica, No iniciado, 8 bloques" [ref=e74]:
                        - group [ref=e75]:
                          - generic "Opciones de Bioquímica" [ref=e76] [cursor=pointer]
                        - button "Abrir Bioquímica" [ref=e79] [cursor=pointer]:
                          - generic "No iniciado" [ref=e84]
                          - generic [ref=e85]:
                            - strong [ref=e87]: Bioquímica
                            - generic [ref=e88]:
                              - generic [ref=e89]: 0 %
                              - generic [ref=e90]: 8 bloques
                      - article "Fisiología, No iniciado, 8 bloques" [ref=e95]:
                        - group [ref=e96]:
                          - generic "Opciones de Fisiología" [ref=e97] [cursor=pointer]
                        - button "Abrir Fisiología" [ref=e100] [cursor=pointer]:
                          - generic "No iniciado" [ref=e105]
                          - generic [ref=e106]:
                            - strong [ref=e108]: Fisiología
                            - generic [ref=e109]:
                              - generic [ref=e110]: 0 %
                              - generic [ref=e111]: 8 bloques
                      - article "Histología, No iniciado, 8 bloques" [ref=e116]:
                        - group [ref=e117]:
                          - generic "Opciones de Histología" [ref=e118] [cursor=pointer]
                        - button "Abrir Histología" [ref=e121] [cursor=pointer]:
                          - generic "No iniciado" [ref=e126]
                          - generic [ref=e127]:
                            - strong [ref=e129]: Histología
                            - generic [ref=e130]:
                              - generic [ref=e131]: 0 %
                              - generic [ref=e132]: 8 bloques
                      - article "Farmacología, No iniciado, 8 bloques" [ref=e137]:
                        - group [ref=e138]:
                          - generic "Opciones de Farmacología" [ref=e139] [cursor=pointer]
                        - button "Abrir Farmacología" [ref=e142] [cursor=pointer]:
                          - generic "No iniciado" [ref=e147]
                          - generic [ref=e148]:
                            - strong [ref=e150]: Farmacología
                            - generic [ref=e151]:
                              - generic [ref=e152]: 0 %
                              - generic [ref=e153]: 8 bloques
                      - article "Medicina clínica, No iniciado, 8 bloques" [ref=e158]:
                        - group [ref=e159]:
                          - generic "Opciones de Medicina clínica" [ref=e160] [cursor=pointer]
                        - button "Abrir Medicina clínica" [ref=e163] [cursor=pointer]:
                          - generic "No iniciado" [ref=e168]
                          - generic [ref=e169]:
                            - strong [ref=e171]: Medicina clínica
                            - generic [ref=e172]:
                              - generic [ref=e173]: 0 %
                              - generic [ref=e174]: 8 bloques
            - generic "Controles del mapa" [ref=e179]:
              - button "Alejar" [ref=e180] [cursor=pointer]
              - button "Restablecer zoom al 100 %" [ref=e183] [cursor=pointer]: 100 %
              - button "Acercar" [ref=e184] [cursor=pointer]
              - button "Ajustar vista" [ref=e188] [cursor=pointer]
          - generic [ref=e191]: Mi mapa de aprendizaje, 6 contenidos
    - navigation "Navegación móvil" [ref=e192]:
      - link "Inicio" [ref=e193] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e197] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e202] [cursor=pointer]
      - link [ref=e206] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e209]: Rutas deaprendizaje
  - button "Open Next.js Dev Tools" [ref=e215] [cursor=pointer]
  - alert [ref=e219]
```