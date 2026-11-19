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
    - element is not stable
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <a class="" href="/aprendizaje">…</a> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 100ms
    38 × waiting for element to be visible, enabled and stable
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
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - generic [ref=e29]:
          - heading "Práctica libre" [level=3] [ref=e30]
          - paragraph [ref=e31]: El resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos. Para guardar el avance de una ruta, abre su actividad guiada.
          - button "Practicar cuestionario" [ref=e32] [cursor=pointer]
          - group [ref=e33]:
            - generic "Consultar preguntas y respuestas" [ref=e34]
            - generic [ref=e35]:
              - generic [ref=e39]:
                - heading "Cuestionario" [level=3] [ref=e40]
                - paragraph [ref=e41]: 1 pregunta de repaso
              - article [ref=e43]:
                - generic [ref=e44]:
                  - generic [ref=e45]: "01"
                  - generic [ref=e46]:
                    - text: Pregunta
                    - heading "¿Qué opción aparece primero?" [level=4] [ref=e47]
                - generic [ref=e48]:
                  - generic [ref=e49]: Respuesta
                  - paragraph [ref=e52]: Primera
                - paragraph [ref=e53]: Resultado de prueba.
          - dialog [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e59]:
                - generic [ref=e60]: Cuestionario
                - heading "Guía de prueba" [level=2] [ref=e61]
              - button "Cerrar cuestionario" [ref=e62] [cursor=pointer]
            - paragraph [ref=e65]: "Práctica libre: el resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos de tu ruta."
            - generic [ref=e66]:
              - generic [ref=e67]: Pregunta 1 de 1
              - progressbar "Preguntas completadas" [ref=e68]
            - generic [ref=e69]:
              - heading "¿Qué opción aparece primero?" [level=3] [ref=e70]
              - group "Opciones de respuesta" [ref=e71]:
                - button "A Primera" [disabled] [pressed] [ref=e72] [cursor=pointer]:
                  - generic [ref=e73]: A
                  - strong [ref=e74]: Primera
                - button "B Segunda" [disabled] [ref=e77] [cursor=pointer]:
                  - generic [ref=e78]: B
                  - strong [ref=e79]: Segunda
              - status [ref=e80]:
                - generic [ref=e83]:
                  - strong [ref=e84]: Respuesta correcta
                  - paragraph [ref=e85]: Resultado de prueba.
            - button "Ver resultado" [ref=e87] [cursor=pointer]
    - navigation "Navegación móvil" [ref=e90]:
      - link "Inicio" [ref=e91] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e95] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e100] [cursor=pointer]
      - link [ref=e104] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e107]: Rutas deaprendizaje
  - button "Open Next.js Dev Tools" [ref=e113] [cursor=pointer]
  - alert [ref=e117]
```