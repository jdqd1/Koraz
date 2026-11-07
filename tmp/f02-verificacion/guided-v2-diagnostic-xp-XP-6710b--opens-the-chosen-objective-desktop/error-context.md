# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-diagnostic-xp.spec.ts >> XP enable a diagnostic; passing opens the chosen objective
- Location: tests\e2e\guided-v2-diagnostic-xp.spec.ts:4:41

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Finalizar sesión', exact: true })

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
          - button "Material de estudio" [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=e20]:
      - banner [ref=e21]:
        - button "Expandir menú principal" [ref=e23] [cursor=pointer]
        - search "Buscar guías" [ref=e27]:
          - combobox "Buscar guías" [ref=e30]
        - heading "Aprendizaje guiado" [level=1] [ref=e32]
        - generic [ref=e33]:
          - button "Notificaciones" [ref=e35] [cursor=pointer]
          - button "Abrir menú de perfil de xp-success@example.test" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: XP
      - main [ref=e41]:
        - region "Sesión de aprendizaje" [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]:
              - link "Volver a mi mapa" [ref=e45] [cursor=pointer]:
                - /url: /aprendizaje/mapa
              - generic [ref=e48]:
                - generic [ref=e49]: Evaluación
                - heading "Diagnóstico para avanzar" [level=1] [ref=e50]
              - group [ref=e51]:
                - button "Detalles de la sesión" [ref=e52] [cursor=pointer]
            - generic [ref=e55]:
              - progressbar "Avance de la ruta" [ref=e56]
              - generic [ref=e57]: 0 de 15
          - status [ref=e58]: Respuesta confirmada y guardada.
          - alert [ref=e59]:
            - paragraph [ref=e60]: Pendiente de confirmar. Reintenta para recuperar el resultado antes de continuar.
            - button "Reintentar solicitud pendiente" [ref=e61] [cursor=pointer]
  - alert [ref=e62]
```