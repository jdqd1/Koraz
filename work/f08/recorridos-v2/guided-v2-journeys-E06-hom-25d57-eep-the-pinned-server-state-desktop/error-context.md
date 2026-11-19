# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E06 home, real map, route, session and review keep the pinned server state
- Location: tests\e2e\guided-v2-journeys.spec.ts:167:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('5 actividades completadas de 9', { exact: true })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('5 actividades completadas de 9', { exact: true }) with timeout 60000ms
  - waiting for getByText('5 actividades completadas de 9', { exact: true })

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
  - button "Abrir menú de perfil de t035-7@example.test": T0
- main:
  - link "Todos mis repasos":
    - /url: /aprendizaje/repaso
  - heading "Repaso y práctica" [level=1]
  - text: Ruta T035 pequeña
  - region "Práctica recomendada":
    - heading "Tu siguiente paso" [level=2]
    - paragraph: 1 objetivo pendiente de repaso.
    - button "Repasar"
    - group: Ver recomendación
    - link "Consultar esta ruta":
      - /url: /aprendizaje/rutas/t035-small
    - link "Consultar otras rutas":
      - /url: /aprendizaje?tab=rutas
  - region "Tu progreso":
    - heading "Tu progreso" [level=2]
    - text: 5 de 9 actividades obligatorias completadas
    - progressbar "Actividades completadas"
    - list:
      - listitem "Actividades en curso":
        - strong: Actividades
        - text: En curso
      - listitem "Aprendizaje por comprobar":
        - strong: Lo aprendido
        - text: Por comprobar
      - listitem "Repaso a largo plazo pendiente":
        - strong: Repaso con el tiempo
        - text: Pendiente
    - text: 1 repaso pendiente
    - group: Qué significa mi progreso
  - group "Diagnóstico inicial":
    - heading "Diagnóstico inicial" [level=2]
    - text: Opcional
  - group "Comprobaciones y requisitos":
    - heading "Comprobaciones" [level=2]
  - group "Grupo de repaso":
    - heading "Repasos pendientes" [level=2]
    - text: "1"
    - list:
      - listitem:
        - strong: Aplicar el ejemplo 1
        - paragraph:
          - text: Pendiente desde
          - time: 5 oct. 2026, 8:00 a. m.
          - text: .
        - button "Repasar"
    - group: Cómo funcionan los repasos
  - group "Otras ramas disponibles":
    - heading "Otras actividades" [level=2]
  - group "Mantenimiento de objetivos":
    - heading "Agenda de repaso" [level=2]
- alert
```