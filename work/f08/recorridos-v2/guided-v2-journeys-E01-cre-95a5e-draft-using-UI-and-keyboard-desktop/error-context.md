# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E01 creates a new persisted v2 draft using UI and keyboard
- Location: tests\e2e\guided-v2-journeys.spec.ts:58:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByLabel('Tema del catálogo').locator('option')
Expected: 2
Received: 3
Timeout:  60000ms

Call log:
  - Expect "toHaveCount" getByLabel('Tema del catálogo').locator('option') with timeout 60000ms
  - waiting for getByLabel('Tema del catálogo').locator('option')
    118 × locator resolved to 3 elements
        - unexpected value "3"

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - button "Administrar" [ref=e22] [cursor=pointer]:
            - generic [aria-hidden]: Administrar
    - generic [ref=e25]:
      - banner [ref=e26]:
        - button "Expandir menú principal" [ref=e28] [cursor=pointer]
        - search "Buscar guías" [ref=e32]:
          - combobox "Buscar guías" [ref=e35]
        - heading "Koras" [level=1] [ref=e37]
        - generic [ref=e38]:
          - button "Notificaciones" [ref=e40] [cursor=pointer]
          - button "Abrir menú de perfil de t035-1@example.test" [ref=e44] [cursor=pointer]:
            - generic [ref=e45]: T0
      - region "Editor de ruta" [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]:
            - link "Volver a rutas de aprendizaje" [ref=e49] [cursor=pointer]:
              - /url: /panel/rutas
            - heading "Nueva ruta" [level=1] [ref=e52]
          - button "Importar archivo de ruta" [ref=e54] [cursor=pointer]
        - generic [ref=e58]:
          - tablist "Secciones del editor de rutas" [ref=e59]:
            - tab "Datos y fuentes" [selected] [ref=e60] [cursor=pointer]:
              - strong [ref=e61]: Datos y fuentes
            - tab "Objetivos" [ref=e62] [cursor=pointer]:
              - strong [ref=e63]: Objetivos
              - generic [ref=e64]: "0"
            - tab "Recorrido" [ref=e65] [cursor=pointer]:
              - strong [ref=e66]: Actividades
              - generic [ref=e67]: "0"
            - tab "Evaluación y repaso" [ref=e68] [cursor=pointer]:
              - strong [ref=e69]: Evaluación
              - generic [ref=e70]: "0"
            - tab "Revisión" [ref=e71] [cursor=pointer]:
              - strong [ref=e72]: Revisión
          - tabpanel "Datos y fuentes" [ref=e74]:
            - generic [ref=e75]:
              - generic [ref=e76]:
                - heading "Datos de la ruta" [level=2] [ref=e78]
                - group "Datos de la ruta" [ref=e79]:
                  - generic [ref=e81]:
                    - generic [ref=e82]:
                      - generic [ref=e83]: Título
                      - textbox "Título" [active] [ref=e85]:
                        - /placeholder: Ej. Vascularización del abdomen
                        - text: Creación UI T035 desktop
                    - generic [ref=e86]:
                      - generic [ref=e87]: Tema del catálogo
                      - combobox "Tema del catálogo" [ref=e89]:
                        - option "Selecciona un tema" [selected]
                        - option "Simulación F03"
                        - option "Tema T035"
                    - generic [ref=e90]:
                      - generic [ref=e91]: Descripción
                      - textbox "Descripción" [ref=e93]:
                        - /placeholder: ¿Qué aprenderá el estudiante en esta ruta?
                    - generic [ref=e94]:
                      - generic [ref=e95]: Disciplina
                      - combobox "Disciplina" [ref=e97]:
                        - option "Anatomía"
                        - option "Histología"
                        - option "Embriología"
                        - option "Fisiología"
                        - option "Bioquímica"
                        - option "Farmacología"
                        - option "Patología"
                        - option "Clínica"
                        - option "General" [selected]
                - region "Vista previa de la ruta" [ref=e98]:
                  - generic [ref=e99]:
                    - strong [ref=e100]: Creación UI T035 desktop
                    - paragraph [ref=e101]: La descripción de tu ruta aparecerá aquí.
                    - text: General
              - generic [ref=e103]:
                - generic [ref=e104]:
                  - heading "Fuentes de estudio 0" [level=2] [ref=e105]:
                    - text: Fuentes de estudio
                    - generic [ref=e106]: "0"
                  - button "Añadir fuente" [ref=e107] [cursor=pointer]
                - group [ref=e111]:
                  - generic [ref=e112] [cursor=pointer]:
                    - text: +
                    - strong [ref=e114]: Buscar una guía
                - generic [ref=e115]:
                  - heading "Añade el material de estudio" [level=3] [ref=e118]
                  - paragraph [ref=e119]: Usa una guía del catálogo o una referencia externa para respaldar el contenido de la ruta.
        - generic [ref=e120]:
          - generic "Cambios sin guardar" [ref=e121]:
            - strong [ref=e122]: Cambios sin guardar
          - generic [ref=e123]:
            - button "Guardar borrador" [ref=e124] [cursor=pointer]
            - button "Continuar" [ref=e126] [cursor=pointer]
  - alert [ref=e129]
```