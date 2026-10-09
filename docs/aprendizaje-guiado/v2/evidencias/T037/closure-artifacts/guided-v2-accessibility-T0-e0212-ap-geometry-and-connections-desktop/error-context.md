# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01 stable map geometry and connections
- Location: tests\e2e\guided-v2-accessibility.spec.ts:366:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Object {
    "reducedMotion": true,
-   "runningAnimations": 0,
+   "runningAnimations": 2,
  }
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
          - button "Material de estudio" [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=e20]:
      - banner [ref=e21]:
        - button "Expandir menú principal" [ref=e23] [cursor=pointer]
        - search "Buscar guías" [ref=e27]:
          - combobox "Buscar guías" [ref=e30]
        - heading "Aprendizaje guiado" [level=1] [ref=e32]
        - generic [ref=e33]:
          - button "Notificaciones" [ref=e35] [cursor=pointer]
          - link "Acceder" [ref=e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=e43]:
        - region "Mapa de aprendizaje" [ref=e44]:
          - generic [ref=e45]:
            - generic [ref=e46]:
              - heading "Rutas de aprendizaje" [active] [level=1] [ref=e49]
              - button "Vista de lista" [ref=e51] [cursor=pointer]
            - generic [ref=e55]:
              - region "Mapa del nivel Rutas de aprendizaje" [ref=e56]:
                - application [ref=e58]:
                  - generic [ref=e60]:
                    - generic:
                      - generic:
                        - img:
                          - img "Edge from level-origin to 77000000-0000-4000-8000-000000000120"
                      - generic:
                        - 'generic "Origen del nivel: Mis rutas" [ref=e62]':
                          - strong [ref=e66]: Mis rutas
                        - article "Tema T035, 2 rutas por objetivos · consulta su estado, 2 rutas" [ref=e68]:
                          - group [ref=e69]:
                            - generic "Opciones de Tema T035" [ref=e70] [cursor=pointer]
                          - button "Abrir Tema T035" [ref=e73] [cursor=pointer]:
                            - generic [ref=e77]:
                              - generic [ref=e78]:
                                - strong [ref=e79]: Tema T035
                                - generic [ref=e80]: Práctica
                              - generic [ref=e81]:
                                - generic [ref=e82]: 2 rutas
                                - generic [ref=e83]: 2 rutas
                              - generic "2 rutas por objetivos · consulta su estado" [ref=e84]
              - generic "Controles del mapa" [ref=e87]:
                - button "Alejar" [ref=e88] [cursor=pointer]
                - button "Restablecer zoom al 100 %" [ref=e91] [cursor=pointer]: 100 %
                - button "Acercar" [ref=e92] [cursor=pointer]
                - button "Ajustar vista" [ref=e95] [cursor=pointer]
            - generic [ref=e98]: Rutas de aprendizaje, 1 contenidos
  - alert [ref=e99]
```