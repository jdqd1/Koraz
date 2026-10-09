# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-map-persistence.spec.ts >> disposable API/SQL persistence >> opens a published lesson, launches its guide and returns to the same place
- Location: tests\e2e\learning-map-persistence.spec.ts:57:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/aprendizaje\/sesiones\//
Received string:  "http://localhost:3000/aprendizaje/mapa?node=d12c0adb-ea41-49d7-ac88-d73402cd56a7&item=d8b41a1a-4f1c-443d-b072-011f04e2c937&unit=leccion-1"
Timeout: 30000ms

Call log:
  - Expect "toHaveURL" with timeout 30000ms
    56 × locator resolved to <html lang="es" class="__variable_83fcfa" data-scroll-behavior="smooth">…</html>
       - unexpected value "http://localhost:3000/aprendizaje/mapa?node=d12c0adb-ea41-49d7-ac88-d73402cd56a7&item=d8b41a1a-4f1c-443d-b072-011f04e2c937&unit=leccion-1"

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
  - region "Mapa de aprendizaje":
    - button "Atrás en el mapa":
      - img
    - navigation "Ruta del mapa":
      - button "Rutas de aprendizaje"
      - img
      - button "Tema E2E"
      - img
    - heading "Bloque E2E" [level=1]
    - text: 0 % · 0/2 esenciales
    - button "Vista de lista":
      - img
    - region "Mapa del nivel Bloque E2E":
      - img "Conexión con el nivel anterior"
      - application:
        - img:
          - img "Edge from level-origin to lesson:leccion-1"
        - img:
          - img "Edge from level-origin to lesson:leccion-2"
        - button "Volver desde Bloque E2E":
          - img
          - strong: Bloque E2E
        - article "Lección E2E 1, No iniciado, 1 actividades":
          - group:
            - img
          - button "Abrir Lección E2E 1":
            - strong: Lección E2E 1
            - text: No iniciado 0 %
        - article "Lección E2E 2, No iniciado, 1 actividades":
          - group:
            - img
          - button "Abrir Lección E2E 2":
            - strong: Lección E2E 2
            - text: No iniciado 0 %
    - button "Alejar":
      - img
    - button "Restablecer zoom al 100 %": 100 %
    - button "Acercar":
      - img
    - button "Ajustar vista":
      - img
    - complementary "Lección Lección E2E 1":
      - heading "Lección E2E 1" [level=2]
      - text: 0 % · 0/1 esenciales
      - paragraph: Contenido sintético para comprobar el mapa.
      - button "Cerrar lección":
        - img
      - tablist "Detalle de lección":
        - tab "Actividades" [selected]
        - tab "Recursos"
      - tabpanel:
        - list:
          - listitem:
            - text: "1"
            - strong: Actividad E2E 1
            - text: Esencial
            - button "Leer guía · Guía · 1 min"
      - paragraph: Siguiente actividad esencial pendiente
      - strong: Actividad E2E 1
      - button "Comenzar lección":
        - text: Comenzar lección
        - img
      - status
      - link "Ver en la ruta":
        - /url: /aprendizaje/rutas/bloque-e2e?leccion=leccion-1
    - text: Bloque E2E, 2 contenidos
- alert
```