# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-performance.spec.ts >> F07 measures V2 create, resume and confirmed answer without duplicate progress
- Location: tests\e2e\guided-learning-performance.spec.ts:49:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://127.0.0.1:31035/aprendizaje/sesiones/fce5bafb-6cb0-4954-9df8-2f706f84cbcd?returnTo=%2Faprendizaje%2Frutas%2Ft035-small%3Fleccion%3Dunit%26objetivo%3Dobjective-1%26actividad%3Dchoice-1%23actividad-choice-1"
Received: "http://127.0.0.1:31035/aprendizaje/sesiones/fce5bafb-6cb0-4954-9df8-2f706f84cbcd?returnTo=%2Faprendizaje%2Frutas%2Ft035-small%3Fleccion%3Dunit%26objetivo%3Dobjective-1%23objetivo-objective-1"
Timeout:  12000ms

Call log:
  - Expect "toHaveURL" with timeout 12000ms
    27 × locator resolved to <html lang="es" class="fnwInq_variable" data-scroll-behavior="smooth">…</html>
       - unexpected value "http://127.0.0.1:31035/aprendizaje/sesiones/fce5bafb-6cb0-4954-9df8-2f706f84cbcd?returnTo=%2Faprendizaje%2Frutas%2Ft035-small%3Fleccion%3Dunit%26objetivo%3Dobjective-1%23objetivo-objective-1"

```

```yaml
- complementary "Navegación principal":
  - navigation:
    - link "Inicio":
      - /url: /dashboard
      - img
    - link "Aprendizaje guiado":
      - /url: /aprendizaje
      - img
    - link "Materias":
      - /url: /asignaturas
      - img
    - button "Material de estudio":
      - img
- banner:
  - button "Expandir menú principal"
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - button "Abrir menú de perfil de f07-performance-desktop-0@example.test": F0
- main:
  - region "Sesión de aprendizaje":
    - link "Volver a la unidad":
      - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1#objetivo-objective-1
    - text: Práctica
    - heading "Tu sesión de aprendizaje" [level=1]
    - group:
      - button "Detalles de la sesión"
    - progressbar "Avance de la ruta"
    - text: 2 de 9
    - status
    - 'heading "choice-1: actividad sintética" [level=2]'
    - group "Elige una respuesta":
      - text: Elige una respuesta
      - radio "Respuesta A"
      - text: Respuesta A
      - radio "Respuesta B"
      - text: Respuesta B
    - button "Necesito ayuda": Pista
    - button "Consultar fuente con ayuda": Fuente
    - button "Comprobar respuesta" [disabled]
- alert: Aprendizaje guiado
```