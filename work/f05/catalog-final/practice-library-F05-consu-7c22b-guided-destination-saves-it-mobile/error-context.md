# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-library.spec.ts >> F05 consultation and free practice preserve guided progress; the guided destination saves it
- Location: tests\e2e\practice-library.spec.ts:57:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('dialog').getByRole('button', { name: /resultado/i })
    - locator resolved to <button type="button" class="is-primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <a class="" href="/aprendizaje">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  36 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <a class="" href="/aprendizaje">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <a class="" href="/aprendizaje">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Cuestionarios" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - button "Abrir menú de perfil de lector@example.test" [ref=e18] [cursor=pointer]:
          - generic [ref=e19]: LE
    - main [ref=e20]:
      - article [ref=e21]:
        - generic [ref=e22]:
          - navigation "Volver a Abdomen" [ref=e23]:
            - link "Volver a Abdomen" [ref=e24] [cursor=pointer]:
              - /url: /asignaturas/anatomia?tipo=quiz&tema=Abdomen
          - heading "Guía de prueba" [level=2] [ref=e28]
        - complementary "Práctica con seguimiento" [ref=e29]:
          - generic [ref=e30]:
            - strong [ref=e31]: Esta actividad está en tu ruta
            - generic [ref=e32]: Si la haces desde allí, el servidor guardará respuestas y avance. También puedes seguir usando este material libremente.
          - navigation "Rutas que incluyen esta actividad" [ref=e33]:
            - link "Resolver con seguimiento Simulación de modalidades F05 · Comprobar el orden" [ref=e34] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f05/actividades/b921962d-4b39-4948-bce7-e7cedb8dd173?opcion=8a3f052b-1fb7-4da1-949d-c59ecdfac00d
              - generic [ref=e35]: Resolver con seguimiento
              - generic [ref=e36]: Simulación de modalidades F05 · Comprobar el orden
        - generic [ref=e37]:
          - heading "Práctica libre" [level=3] [ref=e38]
          - paragraph [ref=e39]: El resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos. Para guardar el avance de una ruta, abre su actividad guiada.
          - button "Practicar cuestionario" [ref=e40] [cursor=pointer]
          - group [ref=e41]:
            - generic "Consultar preguntas y respuestas" [ref=e42]
            - generic [ref=e43]:
              - generic [ref=e47]:
                - heading "Cuestionario" [level=3] [ref=e48]
                - paragraph [ref=e49]: 1 pregunta de repaso
              - article [ref=e51]:
                - generic [ref=e52]:
                  - generic [ref=e53]: "01"
                  - generic [ref=e54]:
                    - text: Pregunta
                    - heading "¿Qué opción aparece primero?" [level=4] [ref=e55]
                - generic [ref=e56]:
                  - generic [ref=e57]: Respuesta
                  - paragraph [ref=e60]: Primera
                - paragraph [ref=e61]: Resultado de prueba.
    - navigation "Navegación móvil" [ref=e62]:
      - link "Inicio" [ref=e63] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e67] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e72] [cursor=pointer]
      - link [ref=e76] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e79]: Rutas deaprendizaje
  - button "Open Next.js Dev Tools" [ref=e85] [cursor=pointer]
  - alert [ref=e89]
  - dialog [active] [ref=e90]:
    - banner [ref=e91]:
      - generic [ref=e95]:
        - generic [ref=e96]: Cuestionario
        - heading "Guía de prueba" [level=2] [ref=e97]
      - button "Cerrar cuestionario" [ref=e98] [cursor=pointer]
    - paragraph [ref=e101]: "Práctica libre: el resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos de tu ruta."
    - generic [ref=e102]:
      - generic [ref=e103]: Pregunta 1 de 1
      - progressbar "Preguntas completadas" [ref=e104]
    - generic [ref=e105]:
      - heading "¿Qué opción aparece primero?" [level=3] [ref=e106]
      - group "Opciones de respuesta" [ref=e107]:
        - button "A Primera" [ref=e108] [cursor=pointer]:
          - generic [ref=e109]: A
          - strong [ref=e110]: Primera
        - button "B Segunda" [ref=e111] [cursor=pointer]:
          - generic [ref=e112]: B
          - strong [ref=e113]: Segunda
```