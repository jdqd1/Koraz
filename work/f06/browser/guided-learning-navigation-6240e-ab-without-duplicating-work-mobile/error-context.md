# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-navigation.spec.ts >> F06 V1 retains unit, activity, guide section and resource tab without duplicating work
- Location: tests\e2e\guided-learning-navigation.spec.ts:7:5

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Siguiente', exact: true })
    - locator resolved to <button type="button">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button disabled type="button">…</button> intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button disabled type="button">…</button> intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <td class="rich-guide-table-cell">…</td> from <article>…</article> subtree intercepts pointer events
  - retrying click action
    - waiting 100ms
    27 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="rich-guide-document">…</div> from <article>…</article> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="rich-guide-document">…</div> from <article>…</article> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button disabled type="button">…</button> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <td class="rich-guide-table-cell">…</td> from <article>…</article> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="rich-guide-document">…</div> from <article>…</article> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button disabled type="button">…</button> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main "Sesión de aprendizaje" [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "Volver a la unidad" [ref=e7] [cursor=pointer]:
          - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=459f066d-ef53-4095-9e48-9a31041911a3&actividad=fa47948c-cc16-4e6e-91d8-a4908494fca7&returnTo=%2Faprendizaje%2Fmapa#actividad-fa47948c-cc16-4e6e-91d8-a4908494fca7
        - generic [ref=e10]:
          - generic [ref=e11]: Lectura
          - heading "Lectura estructurada F06" [level=1] [ref=e12]
        - group [ref=e13]:
          - button "Detalles de la sesión" [ref=e14] [cursor=pointer]
      - generic [ref=e17]:
        - progressbar "Avance de la ruta" [ref=e18]
        - generic [ref=e19]: 0 de 3
    - paragraph [ref=e20]
    - generic [ref=e21]:
      - article [ref=e22]:
        - generic [ref=e23]: Sección 1 de 2
        - generic [ref=e24]:
          - heading "Tabla de letras" [level=1] [ref=e25]
          - table [ref=e27]:
            - rowgroup [ref=e28]:
              - row [ref=e29]:
                - columnheader [ref=e30]:
                  - paragraph [ref=e31]: Letra
                - columnheader [ref=e32]:
                  - paragraph [ref=e33]: Orden
              - row [ref=e34]:
                - cell [ref=e35]:
                  - paragraph [ref=e36]: A
                - cell [ref=e37]:
                  - paragraph [ref=e38]: Primera
          - list [ref=e39]:
            - listitem [ref=e40]:
              - paragraph [ref=e41]: A precede a B
          - img "Imagen sintética de la guía" [ref=e42]
      - navigation "Navegar secciones de la guía" [ref=e43]:
        - button "Anterior" [disabled] [ref=e44] [cursor=pointer]
        - button "Siguiente" [ref=e47] [cursor=pointer]
      - button "Terminé esta lectura" [ref=e51] [cursor=pointer]
  - alert [ref=e54]: Aprendizaje guiado
```