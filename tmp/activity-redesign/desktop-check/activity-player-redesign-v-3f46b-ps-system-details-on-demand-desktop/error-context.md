# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 match stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:90:7

# Error details

```
Error: locator.selectOption: Error: Element is not a <select> element
Call log:
  - waiting for getByRole('combobox').first()
    - locator resolved to <input value="" type="search" role="combobox" autocomplete="off" aria-expanded="false" aria-haspopup="dialog" aria-autocomplete="list" aria-label="Buscar guías" placeholder="Buscar guías" aria-controls="global-content-search-panel"/>
  - attempting select option action
    - waiting for element to be visible and enabled

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
        - main [ref=e44]:
          - region "Sesión de aprendizaje" [ref=e45]:
            - generic [ref=e46]:
              - generic [ref=e47]:
                - link "Volver a mi mapa" [ref=e48] [cursor=pointer]:
                  - /url: /aprendizaje/mapa
                - generic [ref=e51]:
                  - generic [ref=e52]: Práctica
                  - heading "Tu sesión de aprendizaje" [level=1] [ref=e53]
                - group [ref=e54]:
                  - button "Detalles de la sesión" [active] [ref=e55] [cursor=pointer]
              - generic [ref=e58]:
                - progressbar "Avance de la ruta" [ref=e59]
                - generic [ref=e60]: 2 de 6
            - status [ref=e61]
            - generic [ref=e62]:
              - heading "Relaciona cada concepto con su función" [level=2] [ref=e63]
              - generic [ref=e64]:
                - group "Relaciona cada elemento" [ref=e65]:
                  - paragraph [ref=e67]: Usa cada opción una vez.
                  - generic [ref=e68]:
                    - generic [ref=e70]:
                      - generic [ref=e71]: Concepto A
                      - generic [aria-hidden] [ref=e72]: →
                      - combobox "Concepto A" [ref=e73]:
                        - option "Elige una relación" [selected]
                        - option "Origen"
                        - option "Resultado"
                    - generic [ref=e75]:
                      - generic [ref=e76]: Concepto B
                      - generic [aria-hidden] [ref=e77]: →
                      - combobox "Concepto B" [ref=e78]:
                        - option "Elige una relación" [selected]
                        - option "Origen"
                        - option "Resultado"
                - status [ref=e79]: 0 de 2 relaciones seleccionadas
                - generic [ref=e81]:
                  - button "Necesito ayuda" [ref=e82] [cursor=pointer]: Pista
                  - button "Consultar fuente con ayuda" [ref=e85] [cursor=pointer]: Fuente
                - button "Comprobar relaciones" [disabled] [ref=e89]
  - button "Open Next.js Dev Tools" [ref=e95] [cursor=pointer]
  - alert [ref=e99]
```