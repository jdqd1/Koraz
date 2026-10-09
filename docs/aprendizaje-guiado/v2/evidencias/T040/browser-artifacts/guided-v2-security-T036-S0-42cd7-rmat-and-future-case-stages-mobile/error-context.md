# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-security.spec.ts >> T036 S03 SSR, DOM, RSC and BFF hide solutions for every scored format and future case stages
- Location: tests\e2e\guided-v2-security.spec.ts:25:5

# Error details

```
Test timeout of 240000ms exceeded.
```

```
Error: response.text: Test timeout of 240000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f15e1]:
  - generic [ref=f15e3]:
    - banner [ref=f15e4]:
      - search "Buscar guías" [ref=f15e6]:
        - combobox "Buscar guías" [ref=f15e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f15e11]
      - generic [ref=f15e12]:
        - button "Notificaciones" [ref=f15e14] [cursor=pointer]
        - link "Acceder" [ref=f15e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=f15e22]:
      - region "Sesión de aprendizaje" [ref=f15e23]:
        - generic [ref=f15e24]:
          - link "Volver a mi aprendizaje" [ref=f15e25] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
          - generic [ref=f15e26]:
            - text: Aprendizaje guiado
            - heading "Tu sesión de aprendizaje" [level=1] [ref=f15e27]
          - status [ref=f15e28]: Estado del servidor
        - status [ref=f15e29]
        - generic "Estado confirmado de la ruta" [ref=f15e30]:
          - generic [ref=f15e31]: Recorrido en curso
          - generic [ref=f15e32]: Dominio por comprobar
          - generic [ref=f15e33]: Consolidación pendiente
          - generic [ref=f15e34]: 0 repasos pendientes
          - generic [ref=f15e35]: 8 actividades completadas de 9
        - generic [ref=f15e36]:
          - paragraph [ref=f15e37]: "Objetivo: Práctica del objetivo actual"
          - 'heading "Etapa 1: ejemplo sintético case-choice-1: actividad sintética" [active] [level=2] [ref=f15e38]'
          - paragraph [ref=f15e39]: Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.
          - generic [ref=f15e40]:
            - group "Elige una respuesta" [ref=f15e41]:
              - generic [ref=f15e43] [cursor=pointer]:
                - radio "Respuesta A" [ref=f15e44]
                - generic [ref=f15e45]: Respuesta A
              - generic [ref=f15e46] [cursor=pointer]:
                - radio "Respuesta B" [ref=f15e47]
                - generic [ref=f15e48]: Respuesta B
            - button "Comprobar respuesta" [disabled] [ref=f15e49]
          - generic [ref=f15e50]:
            - button "Necesito ayuda" [ref=f15e51] [cursor=pointer]
            - button "Consultar fuente con ayuda" [ref=f15e52] [cursor=pointer]
    - navigation "Navegación móvil" [ref=f15e53]:
      - link "Inicio" [ref=f15e54] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f15e58] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f15e63] [cursor=pointer]
      - link [ref=f15e67] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f15e70]: Rutas deaprendizaje
  - alert [ref=f15e71]
```