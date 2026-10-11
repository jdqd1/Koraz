# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery.spec.ts >> M04 restored v2 displays maintenance and preserves all data
- Location: ..\..\work\test\t041\recovery.spec.ts:7:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-engine-version="guided-v2"]')
Expected: visible
Error: strict mode violation: locator('[data-engine-version="guided-v2"]') resolved to 2 elements:
    1) <main data-engine-version="guided-v2" class="learning-main learning-path-detail">…</main> aka getByRole('main')
    2) <main data-engine-version="guided-v2" class="learning-main learning-path-detail">…</main> aka getByText('Todas las rutasTema T035Ruta').nth(1)

Call log:
  - Expect "toBeVisible" locator('[data-engine-version="guided-v2"]') with timeout 30000ms
  - waiting for locator('[data-engine-version="guided-v2"]')
    2 × locator resolved to <main data-engine-version="guided-v2" class="learning-main learning-path-detail">…</main>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
      - link "Todas las rutas" [ref=e23] [cursor=pointer]:
        - /url: /aprendizaje?tab=rutas
      - generic [ref=e27]:
        - generic [ref=e28]: Tema T035
        - heading "Ruta v2 T041" [level=1] [ref=e29]
        - paragraph [ref=e30]: Fixture de software sin contenido clínico real.
        - generic [ref=e31]: 1 unidades
        - generic "Estado confirmado de la ruta" [ref=e33]:
          - generic [ref=e34]: Recorrido en curso
          - generic [ref=e35]: Dominio por comprobar
          - generic [ref=e36]: Consolidación pendiente
          - generic [ref=e37]: 0 repasos pendientes
          - generic [ref=e38]: 5 actividades completadas de 9
        - paragraph [ref=e40]: Ruta en mantenimiento; tu versión y tu historial se conservan.
      - region [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - text: Mapa de la ruta
            - heading "Qué aprenderás" [level=2] [ref=e45]
          - paragraph [ref=e46]: La práctica disponible depende de la evidencia confirmada de tus objetivos.
        - group [ref=e48]:
          - generic "1 Unidad 1 Unidad T035 1 objetivo" [ref=e49] [cursor=pointer]:
            - generic [ref=e50]: "1"
            - generic [ref=e51]:
              - generic [ref=e52]: Unidad 1
              - strong [ref=e53]: Unidad T035
              - emphasis [ref=e54]: 1 objetivo
          - generic [ref=e57]:
            - strong [ref=e58]: Al terminar podrás
            - list [ref=e59]:
              - listitem [ref=e60]:
                - strong [ref=e61]: Aplicar el ejemplo 1
                - generic [ref=e62]: Dominado · objetivo esencial
      - status [ref=e63]:
        - paragraph [ref=e64]: Ruta en mantenimiento. Tu versión y tu historial se conservan; la práctica y las actualizaciones están pausadas.
      - region "Historial de versiones" [ref=e65]:
        - generic [ref=e66]:
          - heading "Tu historial" [level=2] [ref=e67]
          - list [ref=e68]:
            - listitem [ref=e69]: Versión 1
    - navigation "Navegación móvil" [ref=e70]:
      - link "Inicio" [ref=e71] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e75] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e80] [cursor=pointer]
      - link [ref=e84] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e87]: Rutas deaprendizaje
  - alert [ref=e88]
```