# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 measures V1 activity launch and confirmed submission
- Location: tests\e2e\guided-learning-availability.spec.ts:306:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://127.0.0.1:31035/aprendizaje/sesiones/55bad94b-fef5-4ebf-9992-120bdc3926c1?returnTo=%2Faprendizaje%2Frutas%2Fsimulacion-f06%3Fleccion%3Dlectura%26objetivo%3D2993485d-e0e4-4a23-90c9-d4396b71cfaa%26actividad%3D3b6485cf-e6ae-451b-be64-28b178a13755%23actividad-3b6485cf-e6ae-451b-be64-28b178a13755"
Received: "http://127.0.0.1:31035/aprendizaje/sesiones/24603f65-7df3-45dd-9e07-aef8c76d1dfb?returnTo=%2Faprendizaje%2Frutas%2Fsimulacion-f06%3Fleccion%3Dlectura%26objetivo%3D2993485d-e0e4-4a23-90c9-d4396b71cfaa%26actividad%3D3b6485cf-e6ae-451b-be64-28b178a13755%23actividad-3b6485cf-e6ae-451b-be64-28b178a13755"
Timeout:  12000ms

Call log:
  - Expect "toHaveURL" with timeout 12000ms
    27 × locator resolved to <html lang="es" class="fnwInq_variable" data-scroll-behavior="smooth">…</html>
       - unexpected value "http://127.0.0.1:31035/aprendizaje/sesiones/24603f65-7df3-45dd-9e07-aef8c76d1dfb?returnTo=%2Faprendizaje%2Frutas%2Fsimulacion-f06%3Fleccion%3Dlectura%26objetivo%3D2993485d-e0e4-4a23-90c9-d4396b71cfaa%26actividad%3D3b6485cf-e6ae-451b-be64-28b178a13755%23actividad-3b6485cf-e6ae-451b-be64-28b178a13755"

```

```yaml
- main "Sesión de aprendizaje":
  - link "Volver a la unidad":
    - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=2993485d-e0e4-4a23-90c9-d4396b71cfaa&actividad=3b6485cf-e6ae-451b-be64-28b178a13755#actividad-3b6485cf-e6ae-451b-be64-28b178a13755
  - text: Cuestionario
  - heading "Lectura estructurada F06" [level=1]
  - group:
    - button "Detalles de la sesión"
  - progressbar "Avance de la ruta"
  - text: 1 de 3
  - paragraph
  - text: Pregunta 1 de 1
  - 'heading "Simulación F06: ¿qué letra aparece primero?" [level=2]'
  - group "Elige una respuesta":
    - text: Elige una respuesta
    - radio "A"
    - text: A
    - radio "B"
    - text: B
  - button "Comprobar" [disabled]
- alert: Aprendizaje guiado
```