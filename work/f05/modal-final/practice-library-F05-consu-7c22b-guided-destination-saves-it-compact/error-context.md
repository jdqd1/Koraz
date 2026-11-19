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
    - <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span>…</span> from <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> subtree intercepts pointer events
  37 × retrying click action
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
       - <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> intercepts pointer events
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
    - <nav class="mobile-primary-nav" aria-label="Navegación móvil">…</nav> intercepts pointer events
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
        - complementary "Práctica con seguimiento" [ref=e29]:
          - generic [ref=e30]:
            - strong [ref=e31]: Esta actividad está en tu ruta
            - generic [ref=e32]: Si la haces desde allí, el servidor guardará respuestas y avance. También puedes seguir usando este material libremente.
          - navigation "Rutas que incluyen esta actividad" [ref=e33]:
            - link "Resolver con seguimiento Simulación de modalidades F05 · Comprobar el orden" [ref=e34] [cursor=pointer]:
              - /url: /aprendizaje/rutas/simulacion-f05/actividades/cc27d2d8-8ce1-4f24-a1d4-15c562b8ba3b?opcion=31f305ba-b747-4bbe-b33c-038b1b04bc66
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
          - dialog [ref=e62]:
            - generic [ref=e63]:
              - generic [ref=e67]:
                - generic [ref=e68]: Cuestionario
                - heading "Guía de prueba" [level=2] [ref=e69]
              - button "Cerrar cuestionario" [ref=e70] [cursor=pointer]
            - paragraph [ref=e73]: "Práctica libre: el resultado dura hasta cerrar esta práctica. No suma XP ni programa repasos de tu ruta."
            - generic [ref=e74]:
              - generic [ref=e75]: Pregunta 1 de 1
              - progressbar "Preguntas completadas" [ref=e76]
            - generic [ref=e77]:
              - heading "¿Qué opción aparece primero?" [level=3] [ref=e78]
              - group "Opciones de respuesta" [ref=e79]:
                - button "A Primera" [disabled] [pressed] [ref=e80] [cursor=pointer]:
                  - generic [ref=e81]: A
                  - strong [ref=e82]: Primera
                - button "B Segunda" [disabled] [ref=e85] [cursor=pointer]:
                  - generic [ref=e86]: B
                  - strong [ref=e87]: Segunda
              - status [ref=e88]:
                - generic [ref=e91]:
                  - strong [ref=e92]: Respuesta correcta
                  - paragraph [ref=e93]: Resultado de prueba.
            - button "Ver resultado" [ref=e95] [cursor=pointer]
    - navigation "Navegación móvil" [ref=e98]:
      - link "Inicio" [ref=e99] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e103] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e108] [cursor=pointer]
      - link [ref=e112] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e115]: Rutas deaprendizaje
  - button "Open Next.js Dev Tools" [ref=e121] [cursor=pointer]
  - alert [ref=e125]
```