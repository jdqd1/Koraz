# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-diagnostic-xp.spec.ts >> final V1 review recovers before commit in a second tab
- Location: tests\e2e\guided-v2-diagnostic-xp.spec.ts:172:46

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('+2 XP', { exact: true })
Expected: visible
Error: strict mode violation: getByText('+2 XP', { exact: true }) resolved to 2 elements:
    1) <strong>+2 XP</strong> aka getByRole('main', { name: 'Sesión de aprendizaje' }).getByText('+2 XP')
    2) <strong>…</strong> aka getByText('+2 XP').nth(1)

Call log:
  - Expect "toBeVisible" getByText('+2 XP', { exact: true }) with timeout 12000ms
  - waiting for getByText('+2 XP', { exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - main "Sesión de aprendizaje" [ref=f1e4]:
    - generic [ref=f1e6]:
      - link "Volver al mapa" [ref=f1e7] [cursor=pointer]:
        - /url: /aprendizaje/mapa
      - generic [ref=f1e10]:
        - generic [ref=f1e11]: Repaso
        - heading "Repaso recomendado" [level=1] [ref=f1e12]
      - group [ref=f1e13]:
        - button "Detalles de la sesión" [ref=f1e14] [cursor=pointer]
    - paragraph [ref=f1e17]
    - generic [ref=f1e18]:
      - generic [ref=f1e22]: Progreso guardado
      - heading "Repaso completado" [level=2] [ref=f1e23]
      - paragraph [ref=f1e24]: Tu progreso está guardado. Continúa a tu ritmo.
      - generic [ref=f1e28]:
        - strong [ref=f1e29]: +2 XP
        - generic [ref=f1e30]: Puntos de aprendizaje nuevos
      - list [ref=f1e31]:
        - listitem [ref=f1e32]: Volví a repasar
      - region "Fechas de repaso guardadas" [ref=f1e35]:
        - heading "Repasos programados al responder" [level=3] [ref=f1e36]
        - list [ref=f1e37]:
          - listitem [ref=f1e38]:
            - time [ref=f1e39]: 4 de octubre de 2026 a las 8:10 a. m.
        - paragraph [ref=f1e40]: Puedes seguir con otra actividad. El centro de repaso confirma qué está disponible ahora.
      - generic [ref=f1e41]:
        - link "Ver repasos pendientes" [ref=f1e42] [cursor=pointer]:
          - /url: /aprendizaje/repaso
        - link "Continuar" [ref=f1e43] [cursor=pointer]:
          - /url: /aprendizaje?tab=hoy
        - link "Elegir otra actividad" [ref=f1e46] [cursor=pointer]:
          - /url: /aprendizaje?tab=rutas
  - alert [ref=f1e49]
```