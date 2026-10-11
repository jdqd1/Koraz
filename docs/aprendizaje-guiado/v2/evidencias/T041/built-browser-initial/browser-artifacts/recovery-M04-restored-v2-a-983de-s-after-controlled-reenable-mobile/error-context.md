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
  - generic [ref=f1e3]:
    - banner [ref=f1e4]:
      - search "Buscar guías" [ref=f1e6]:
        - combobox "Buscar guías" [ref=f1e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f1e11]
      - generic [ref=f1e12]:
        - button "Notificaciones" [ref=f1e14] [cursor=pointer]
        - link "Acceder" [ref=f1e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=f1e22]:
      - region "Sesión de aprendizaje" [ref=f1e23]:
        - generic [ref=f1e24]:
          - link "Volver a mi aprendizaje" [ref=f1e25] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
          - generic [ref=f1e26]:
            - text: Aprendizaje guiado
            - heading "Tu sesión de aprendizaje" [level=1] [ref=f1e27]
          - status [ref=f1e28]: Estado del servidor
        - status [ref=f1e29]: Respuesta confirmada y guardada.
        - generic "Estado confirmado de la ruta" [ref=f1e30]:
          - generic [ref=f1e31]: Recorrido en curso
          - generic [ref=f1e32]: Dominio por comprobar
          - generic [ref=f1e33]: Consolidación pendiente
          - generic [ref=f1e34]: 0 repasos pendientes
          - generic [ref=f1e35]: 1 actividades completadas de 9
        - generic [ref=f1e36]:
          - heading "Respuestas guardadas" [active] [level=2] [ref=f1e37]
          - paragraph [ref=f1e38]: Confirma el cierre para consultar el resultado de la sesión.
          - button "Finalizar sesión" [ref=f1e39] [cursor=pointer]
    - navigation "Navegación móvil" [ref=f1e40]:
      - link "Inicio" [ref=f1e41] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f1e45] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f1e50] [cursor=pointer]
      - link [ref=f1e54] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f1e57]: Rutas deaprendizaje
  - alert [ref=f1e58]
```