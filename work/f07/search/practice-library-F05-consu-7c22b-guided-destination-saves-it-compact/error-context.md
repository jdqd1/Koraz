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
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Aprendizaje guiado" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - button "Abrir menú de perfil de lector@example.test" [ref=e18] [cursor=pointer]:
          - generic [ref=e19]: LE
    - main [ref=e20]:
      - link "Volver a la unidad" [ref=e21] [cursor=pointer]:
        - /url: /aprendizaje/rutas/simulacion-f05?leccion=unidad&objetivo=8c47259e-f61b-420c-8bbe-338db2a6b3db&actividad=3d6ac7ad-2b99-4465-8bba-1778b45286f5#actividad-3d6ac7ad-2b99-4465-8bba-1778b45286f5
      - generic [ref=e24]:
        - generic [ref=e25]: Actividad elegida
        - heading "Comprobar el orden" [level=1] [ref=e26]
        - paragraph [ref=e27]: Abre tu actividad para estudiar con seguimiento. Tu progreso se guarda al responder.
        - link "Consultar resultado" [ref=e28] [cursor=pointer]:
          - /url: /aprendizaje/sesiones/a812a537-eaf0-48ce-bbc6-42afe70991cd?returnTo=%2Faprendizaje%2Frutas%2Fsimulacion-f05%3Fleccion%3Dunidad%26objetivo%3D8c47259e-f61b-420c-8bbe-338db2a6b3db%26actividad%3D3d6ac7ad-2b99-4465-8bba-1778b45286f5%23actividad-3d6ac7ad-2b99-4465-8bba-1778b45286f5
        - paragraph [ref=e31]
    - navigation "Navegación móvil" [ref=e32]:
      - link "Inicio" [ref=e33] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e37] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e42] [cursor=pointer]
      - link [ref=e46] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e49]: Rutas deaprendizaje
  - alert [ref=e50]
```