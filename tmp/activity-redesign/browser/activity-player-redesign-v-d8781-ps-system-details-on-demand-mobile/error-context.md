# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 labeling stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:83:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByLabel('Punto 1: Origen')
    - locator resolved to <select>…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - element is not enabled
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - element is not enabled
    - retrying select option action
      - waiting 100ms
    162 × waiting for element to be visible and enabled
        - element is not enabled
      - retrying select option action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e4]:
    - main [ref=e5]:
      - region "Sesión de aprendizaje" [ref=e6]:
        - generic [ref=e7]:
          - generic [ref=e8]:
            - link "Volver a mi mapa" [ref=e9] [cursor=pointer]:
              - /url: /aprendizaje/mapa
            - generic [ref=e12]:
              - generic [ref=e13]: Práctica
              - heading "Tu sesión de aprendizaje" [level=1] [ref=e14]
            - group [ref=e15]:
              - button "Detalles de la sesión" [active] [ref=e16] [cursor=pointer]
          - generic [ref=e19]:
            - progressbar "Avance de la ruta" [ref=e20]
            - generic [ref=e21]: 2 de 6
        - status [ref=e22]
        - generic [ref=e23]:
          - heading "Identifica los puntos de la imagen" [level=2] [ref=e24]
          - generic [ref=e25]:
            - paragraph [ref=e26]: Elige una etiqueta para cada punto numerado.
            - generic [ref=e27]:
              - generic [ref=e28]: Ampliación de imagen
              - combobox "Ampliación de imagen" [disabled] [ref=e29]:
                - option "100 %" [selected]
                - option "150 %"
                - option "200 %"
                - option "300 %"
            - region "Área ampliada de imagen" [ref=e30]:
              - group "Imagen para responder" [disabled] [ref=e31]:
                - img "Figura sintética de origen y ramas" [ref=e32]
            - alert [ref=e33]:
              - paragraph [ref=e34]: No pudimos cargar la imagen. Tu selección se conserva sin enviar.
              - button "Reintentar imagen" [ref=e35] [cursor=pointer]
            - group "Etiquetas de los puntos numerados" [ref=e36]:
              - generic [ref=e39]:
                - text: "Punto 1: Origen"
                - 'combobox "Punto 1: Origen" [disabled] [ref=e40]':
                  - option "Elige una etiqueta" [disabled] [selected]
                  - option "Origen" [disabled]
                  - option "Resultado" [disabled]
            - button "Comprobar respuesta visual" [disabled] [ref=e42]
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]
  - alert [ref=e52]
```