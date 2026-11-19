# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-navigation.spec.ts >> F06 V1 retains unit, activity, guide section and resource tab without duplicating work
- Location: tests\e2e\guided-learning-navigation.spec.ts:7:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('La letra B sigue a A.', { exact: true })
Expected: visible
Error: strict mode violation: getByText('La letra B sigue a A.', { exact: true }) resolved to 2 elements:
    1) <span data-guide-term-path="1.0">La letra B sigue a A.</span> aka getByRole('region', { name: 'Lectura de consulta' }).getByText('La letra B sigue a A.')
    2) <span data-guide-term-path="1.0">La letra B sigue a A.</span> aka getByText('La letra B sigue a A.').nth(1)

Call log:
  - Expect "toBeVisible" getByText('La letra B sigue a A.', { exact: true }) with timeout 60000ms
  - waiting for getByText('La letra B sigue a A.', { exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e2]:
    - complementary "Navegación principal" [ref=f3e3]:
      - navigation [ref=f3e4]:
        - generic [ref=f3e5]:
          - link "Inicio" [ref=f3e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f3e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f3e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f3e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f3e20]:
      - banner [ref=f3e21]:
        - button "Expandir menú principal" [ref=f3e23] [cursor=pointer]
        - search "Buscar guías" [ref=f3e27]:
          - combobox "Buscar guías" [ref=f3e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f3e32]
        - generic [ref=f3e33]:
          - button "Notificaciones" [ref=f3e35] [cursor=pointer]
          - button "Abrir menú de perfil de f06-desktop@example.test" [ref=f3e39] [cursor=pointer]:
            - generic [ref=f3e40]: F0
      - main [ref=f3e41]:
        - link "Volver a los recursos de la unidad" [ref=f3e42] [cursor=pointer]:
          - /url: /aprendizaje/rutas/simulacion-f06?leccion=lectura&objetivo=c4a505f9-60c8-484c-9b6f-ca07183f3e29&actividad=6de33941-d461-4f97-b7e0-49ff7755b2c2&pestana=resources&returnTo=%2Faprendizaje%2Fmapa#actividad-6de33941-d461-4f97-b7e0-49ff7755b2c2
        - heading "Lectura estructurada F06" [level=1] [ref=f3e43]
        - region "Lectura de consulta" [ref=f3e44]:
          - paragraph [ref=f3e45]: Consulta · Esta lectura no cambia tu progreso ni concede puntos.
          - article [ref=f3e46]:
            - generic [ref=f3e47]:
              - heading "Segunda lectura" [level=1] [ref=f3e48]
              - paragraph [ref=f3e49]: La letra B sigue a A.
          - navigation "Secciones de consulta" [ref=f3e50]:
            - button "Anterior" [ref=f3e51] [cursor=pointer]
            - generic [ref=f3e52]: 2 de 2
            - button "Siguiente" [disabled] [ref=f3e53] [cursor=pointer]
  - alert [ref=f3e54]
```