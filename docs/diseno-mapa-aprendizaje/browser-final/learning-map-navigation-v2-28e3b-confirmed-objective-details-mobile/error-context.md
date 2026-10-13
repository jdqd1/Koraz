# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-navigation.spec.ts >> v2 cards fit their signals and open the confirmed objective details
- Location: tests\e2e\learning-map-navigation.spec.ts:100:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('complementary', { name: 'Detalle de práctica por objetivos' }).getByText('Necesita refuerzo', { exact: true }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('complementary', { name: 'Detalle de práctica por objetivos' }).getByText('Necesita refuerzo', { exact: true }).first() with timeout 10000ms
  - waiting for getByRole('complementary', { name: 'Detalle de práctica por objetivos' }).getByText('Necesita refuerzo', { exact: true }).first()

```

```yaml
- banner:
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - link "Acceder":
    - /url: /acceder
- main:
  - navigation "Superficies de prueba":
    - link "map":
      - /url: /visual-fixtures/aprendizaje-v2?surface=map&estado=critical
    - link "route":
      - /url: /visual-fixtures/aprendizaje-v2?surface=route&estado=critical
    - link "review":
      - /url: /visual-fixtures/aprendizaje-v2?surface=review&estado=critical
    - link "hoy":
      - /url: /visual-fixtures/aprendizaje-v2?surface=hoy&estado=critical
    - link "rutas":
      - /url: /visual-fixtures/aprendizaje-v2?surface=rutas&estado=critical
    - link "progreso":
      - /url: /visual-fixtures/aprendizaje-v2?surface=progreso&estado=critical
    - link "session":
      - /url: /visual-fixtures/aprendizaje-v2?surface=session&estado=critical
  - region "Mapa de aprendizaje":
    - button "Atrás en el mapa":
      - img
    - heading "Práctica por objetivos" [level=1]
    - button "Vista de lista":
      - img
    - navigation "Ruta del mapa":
      - button "Rutas de aprendizaje"
      - button "Fisiología"
    - text: Recorrido completado · dominio alcanzado · consolidación pendiente · 0 repasos
    - region "Mapa del nivel Práctica por objetivos":
      - img "Conexión con el nivel anterior"
      - application:
        - img:
          - img "Edge from level-origin to lesson:unit-a"
        - img:
          - img "Edge from level-origin to lesson:unit-b"
        - button "Volver desde Práctica por objetivos":
          - img
          - strong: Práctica por objetivos
        - article "Comprender y recuperar, 0/1 objetivos dominados · refuerzo pendiente, 1 objetivo":
          - group:
            - img
          - button "Abrir Comprender y recuperar":
            - text: Objetivos
            - strong: Comprender y recuperar
            - text: 1 objetivo 0/1 objetivos dominados · refuerzo pendiente
        - article "Aplicar y comprobar, 1/1 objetivos dominados, 1 objetivo":
          - group:
            - img
          - button "Abrir Aplicar y comprobar":
            - text: Objetivos
            - strong: Aplicar y comprobar
            - text: 1 objetivo 1/1 objetivos dominados
    - button "Alejar":
      - img
    - button "Restablecer zoom al 100 %": 100 %
    - button "Acercar":
      - img
    - button "Ajustar vista":
      - img
    - text: Práctica por objetivos, 2 contenidos
    - dialog "Detalle del mapa":
      - complementary "Detalle de práctica por objetivos":
        - heading "Comprender y recuperar" [level=2]
        - button "Cerrar detalle":
          - img
        - text: Recorrido completado Dominio alcanzado Consolidación pendiente 0 repasos pendientes 1 objetivo por reforzar 6 actividades completadas de 6
        - heading "Al terminar podrás" [level=3]
        - list:
          - listitem:
            - strong: Explicar la relación entre los conceptos A y B
            - text: Necesita refuerzo · objetivo esencial Un error esencial mantiene bloqueadas las actividades que dependen de este objetivo. Requiere refuerzo. Dominio previo conservado; la evidencia actual requiere refuerzo.
        - paragraph: La siguiente acción corresponde al recorrido completo.
        - paragraph: Refuerza el objetivo esencial antes de abrir sus actividades dependientes
        - button "Reforzar"
        - link "Ver en la ruta":
          - /url: /aprendizaje/rutas/practica-por-objetivos?leccion=unit-a&returnTo=%2Faprendizaje%2Fmapa%3Fnode%3Db2800000-0000-4000-8000-000000000008%26item%3Db2800000-0000-4000-8000-000000000001%26unit%3Dunit-a
- navigation "Navegación móvil":
  - link "Inicio":
    - /url: /dashboard
  - link "Guías":
    - /url: /guias
  - button "Materiales"
  - link "Rutas de aprendizaje":
    - /url: /aprendizaje
- alert
```