# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:92:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Guardando…', { exact: true })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Guardando…', { exact: true }) with timeout 60000ms
  - waiting for getByText('Guardando…', { exact: true })

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
  - link "Acceder":
    - /url: /acceder
- main:
  - region "Sesión de aprendizaje":
    - link "Volver a mi aprendizaje":
      - /url: /aprendizaje?tab=hoy
    - text: Aprendizaje guiado
    - heading "Tu sesión de aprendizaje" [level=1]
    - status: Pendiente de confirmar
    - status: Confirmando con el servidor…
    - paragraph: Hay una solicitud pendiente de confirmar. El servidor debe confirmar su resultado antes de continuar.
    - button "Reintentar solicitud pendiente" [disabled]
    - text: Recorrido en curso Dominio por comprobar Consolidación pendiente 0 repasos pendientes 2 actividades completadas de 9
    - paragraph: "Objetivo: Práctica del objetivo actual"
    - 'heading "choice-1: actividad sintética" [level=2]'
    - paragraph: Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.
    - group "Elige una respuesta":
      - text: Elige una respuesta
      - radio "Respuesta A" [disabled]
      - text: Respuesta A
      - radio "Respuesta B" [checked] [disabled]
      - text: Respuesta B
    - button "Comprobar respuesta" [disabled]
    - button "Necesito ayuda" [disabled]
    - button "Consultar fuente con ayuda" [disabled]
- alert
```