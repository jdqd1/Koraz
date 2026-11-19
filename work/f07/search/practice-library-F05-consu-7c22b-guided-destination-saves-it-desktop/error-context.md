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
  - waiting for getByRole('button', { name: 'Comenzar actividad', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - button "Material de estudio" [expanded] [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=e20]:
      - banner [ref=e21]:
        - button "Expandir menú principal" [ref=e23] [cursor=pointer]
        - search "Buscar guías" [ref=e27]:
          - combobox "Buscar guías" [ref=e30]
        - heading "Aprendizaje guiado" [level=1] [ref=e32]
        - generic [ref=e33]:
          - button "Notificaciones" [ref=e35] [cursor=pointer]
          - button "Abrir menú de perfil de lector@example.test" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: LE
      - main [ref=e41]:
        - link "Volver a la unidad" [ref=e42] [cursor=pointer]:
          - /url: /aprendizaje/rutas/simulacion-f05?leccion=unidad&objetivo=8c47259e-f61b-420c-8bbe-338db2a6b3db&actividad=3d6ac7ad-2b99-4465-8bba-1778b45286f5#actividad-3d6ac7ad-2b99-4465-8bba-1778b45286f5
        - generic [ref=e45]:
          - generic [ref=e46]: Actividad elegida
          - heading "Comprobar el orden" [level=1] [ref=e47]
          - paragraph [ref=e48]: Abre tu actividad para estudiar con seguimiento. Tu progreso se guarda al responder.
          - link "Consultar resultado" [ref=e49] [cursor=pointer]:
            - /url: /aprendizaje/sesiones/a812a537-eaf0-48ce-bbc6-42afe70991cd?returnTo=%2Faprendizaje%2Frutas%2Fsimulacion-f05%3Fleccion%3Dunidad%26objetivo%3D8c47259e-f61b-420c-8bbe-338db2a6b3db%26actividad%3D3d6ac7ad-2b99-4465-8bba-1778b45286f5%23actividad-3d6ac7ad-2b99-4465-8bba-1778b45286f5
          - paragraph [ref=e52]
  - alert [ref=e53]
```