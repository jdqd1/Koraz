# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:63:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Error: strict mode violation: locator('main') resolved to 2 elements:
    1) <main data-pathname="/aprendizaje/mapa" class="app-main learning-map-main">…</main> aka getByRole('main').first()
    2) <main class="learning-map-module__RbHqDa__workspace">…</main> aka getByRole('main').nth(1)

Call log:
  - Expect "toBeVisible" locator('main') with timeout 60000ms
  - waiting for locator('main')

```

# Page snapshot

```yaml
- generic [ref=f4e1]:
  - generic [ref=f4e2]:
    - complementary "Navegación principal" [ref=f4e3]:
      - navigation [ref=f4e4]:
        - generic [ref=f4e5]:
          - link "Inicio" [ref=f4e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f4e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f4e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f4e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f4e20]:
      - banner [ref=f4e21]:
        - button "Expandir menú principal" [ref=f4e23] [cursor=pointer]
        - search "Buscar guías" [ref=f4e27]:
          - combobox "Buscar guías" [ref=f4e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f4e32]
        - generic [ref=f4e33]:
          - button "Notificaciones" [ref=f4e35] [cursor=pointer]
          - link "Acceder" [ref=f4e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f4e43]:
        - main [ref=f4e44]:
          - generic [ref=f4e45]:
            - generic [ref=f4e46]:
              - heading "Rutas de aprendizaje" [active] [level=1] [ref=f4e49]
              - button "Vista de lista" [ref=f4e51] [cursor=pointer]
            - generic [ref=f4e55]:
              - region "Mapa del nivel Rutas de aprendizaje" [ref=f4e56]:
                - application [ref=f4e58]:
                  - generic [ref=f4e60]:
                    - generic:
                      - generic:
                        - img:
                          - img "Edge from level-origin to 77000000-0000-4000-8000-000000000120"
                      - generic:
                        - 'generic "Origen del nivel: Mis rutas" [ref=f4e62]':
                          - strong [ref=f4e66]: Mis rutas
                        - article "Tema T035, 2 rutas por objetivos · consulta su estado, 2 rutas" [ref=f4e68]:
                          - group [ref=f4e69]:
                            - generic "Opciones de Tema T035" [ref=f4e70] [cursor=pointer]
                          - button "Abrir Tema T035" [ref=f4e73] [cursor=pointer]:
                            - generic [ref=f4e77]:
                              - generic [ref=f4e78]:
                                - strong [ref=f4e79]: Tema T035
                                - generic [ref=f4e80]: Práctica
                              - generic [ref=f4e81]:
                                - generic [ref=f4e82]: 2 rutas
                                - generic [ref=f4e83]: 2 rutas
                              - generic "2 rutas por objetivos · consulta su estado" [ref=f4e84]
              - generic "Controles del mapa" [ref=f4e87]:
                - button "Alejar" [ref=f4e88] [cursor=pointer]
                - button "Restablecer zoom al 100 %" [ref=f4e91] [cursor=pointer]: 100 %
                - button "Acercar" [ref=f4e92] [cursor=pointer]
                - button "Ajustar vista" [ref=f4e95] [cursor=pointer]
            - generic [ref=f4e98]: Rutas de aprendizaje, 1 contenidos
  - alert [ref=f4e99]
```