# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 image_target stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:91:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^Comprobar/ })
    - locator resolved to <button disabled type="submit" class="learning-primary-button">Comprobar respuesta visual</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    166 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

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
                  - button "Detalles de la sesión" [ref=e55] [cursor=pointer]
              - generic [ref=e58]:
                - progressbar "Avance de la ruta" [ref=e59]
                - generic [ref=e60]: 2 de 6
            - status [ref=e61]
            - generic [ref=e62]:
              - heading "Señala el origen en la imagen" [level=2] [ref=e63]
              - generic [ref=e64]:
                - paragraph [ref=e65]: Toca la imagen para señalar tu respuesta.
                - paragraph [ref=e66]: Origen
                - generic [ref=e67]:
                  - generic [ref=e68]: Ampliación de imagen
                  - combobox "Ampliación de imagen" [ref=e69]:
                    - option "100 %" [selected]
                    - option "150 %"
                    - option "200 %"
                    - option "300 %"
                - region "Área ampliada de imagen" [ref=e70]:
                  - group "Imagen para responder" [active] [ref=e71]:
                    - img "Figura sintética de origen y ramas" [ref=e72]
                - status [ref=e73]: Aún no has seleccionado un punto.
                - group [ref=e74]:
                  - generic "Ajustar el punto seleccionado +" [ref=e75] [cursor=pointer]
                - button "Comprobar respuesta visual" [disabled] [ref=e77]
  - button "Open Next.js Dev Tools" [ref=e83] [cursor=pointer]
  - alert [ref=e87]
```