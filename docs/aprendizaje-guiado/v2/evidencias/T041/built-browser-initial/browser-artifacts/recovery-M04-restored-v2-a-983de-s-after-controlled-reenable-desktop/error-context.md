# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery.spec.ts >> M04 restored v2 active session resumes after controlled reenable
- Location: ..\..\work\test\t041\recovery.spec.ts:36:5

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Ver cierre de sesión', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary "Navegación principal" [ref=f1e3]:
      - navigation [ref=f1e4]:
        - generic [ref=f1e5]:
          - link "Inicio" [ref=f1e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f1e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f1e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f1e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f1e20]:
      - banner [ref=f1e21]:
        - button "Expandir menú principal" [ref=f1e23] [cursor=pointer]
        - search "Buscar guías" [ref=f1e27]:
          - combobox "Buscar guías" [ref=f1e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f1e32]
        - generic [ref=f1e33]:
          - button "Notificaciones" [ref=f1e35] [cursor=pointer]
          - link "Acceder" [ref=f1e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f1e43]:
        - region "Sesión de aprendizaje" [ref=f1e44]:
          - generic [ref=f1e45]:
            - link "Volver a mi aprendizaje" [ref=f1e46] [cursor=pointer]:
              - /url: /aprendizaje?tab=hoy
            - generic [ref=f1e47]:
              - text: Aprendizaje guiado
              - heading "Tu sesión de aprendizaje" [level=1] [ref=f1e48]
            - status [ref=f1e49]: Estado del servidor
          - status [ref=f1e50]: Respuesta confirmada y guardada.
          - generic "Estado confirmado de la ruta" [ref=f1e51]:
            - generic [ref=f1e52]: Recorrido en curso
            - generic [ref=f1e53]: Dominio por comprobar
            - generic [ref=f1e54]: Consolidación pendiente
            - generic [ref=f1e55]: 0 repasos pendientes
            - generic [ref=f1e56]: 1 actividades completadas de 9
          - generic [ref=f1e57]:
            - heading "Respuestas guardadas" [active] [level=2] [ref=f1e58]
            - paragraph [ref=f1e59]: Confirma el cierre para consultar el resultado de la sesión.
            - button "Finalizar sesión" [ref=f1e60] [cursor=pointer]
  - alert [ref=f1e61]
```