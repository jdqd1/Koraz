# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E01 creates a new persisted v2 draft using UI and keyboard
- Location: tests\e2e\guided-v2-journeys.spec.ts:47:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByLabel('Tema del catálogo').locator('option')
Expected: 2
Received: 1
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" getByLabel('Tema del catálogo').locator('option') with timeout 15000ms
  - waiting for getByLabel('Tema del catálogo').locator('option')
    31 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary "Navegación principal" [ref=e3]:
      - navigation [ref=e4]:
        - generic [ref=e5]:
          - link [ref=e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link [ref=e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link [ref=e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
          - button [ref=e22] [cursor=pointer]:
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
      - main [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]:
            - link "Volver a rutas" [ref=e49] [cursor=pointer]:
              - /url: /panel/rutas
            - heading "Nueva ruta" [level=1] [ref=e50]
            - paragraph [ref=e51]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
          - generic [ref=e52]:
            - strong [ref=e53]: Nueva ruta
            - generic [ref=e54]: Sin guardar · Cambios sin guardar
        - button "Importar archivo de ruta" [ref=e56] [cursor=pointer]
        - generic [ref=e57]:
          - tablist "Secciones del editor de rutas" [ref=e58]:
            - tab "Datos y fuentes" [selected] [ref=e59] [cursor=pointer]
            - tab "Objetivos" [ref=e60] [cursor=pointer]
            - tab "Recorrido" [ref=e61] [cursor=pointer]
            - tab "Evaluación y repaso" [ref=e62] [cursor=pointer]
            - tab "Revisión" [ref=e63] [cursor=pointer]
          - tabpanel "Datos y fuentes" [ref=e64]:
            - generic [ref=e65]:
              - generic [ref=e66]:
                - generic [ref=e68]:
                  - text: Paso 1 de 5
                  - heading "Datos y fuentes" [level=2] [ref=e69]
                  - paragraph [ref=e70]: Los cambios se guardan cuando confirmas el borrador.
                - group "Datos de la ruta" [ref=e71]:
                  - generic [ref=e73]:
                    - generic [ref=e74]:
                      - generic [ref=e75]: Título
                      - textbox "Título" [active] [ref=e76]: Creación UI T035 desktop
                    - generic [ref=e77]:
                      - generic [ref=e78]: Tema del catálogo
                      - combobox "Tema del catálogo" [ref=e79]:
                        - option "Selecciona un tema" [selected]
                    - generic [ref=e80]:
                      - generic [ref=e81]: Nombre del tema
                      - textbox "Nombre del tema" [ref=e82]
                    - generic [ref=e83]:
                      - generic [ref=e84]: Descripción
                      - textbox "Descripción" [ref=e85]
                    - generic [ref=e86]:
                      - generic [ref=e87]: Dirigida a
                      - textbox "Dirigida a" [ref=e88]: Estudiantes
                    - generic [ref=e89]:
                      - generic [ref=e90]: Disciplina
                      - combobox "Disciplina" [ref=e91]:
                        - option "Anatomía"
                        - option "Histología"
                        - option "Embriología"
                        - option "Fisiología"
                        - option "Bioquímica"
                        - option "Farmacología"
                        - option "Patología"
                        - option "Clínica"
                        - option "General" [selected]
                    - generic [ref=e92]:
                      - generic [ref=e93]: Portada
                      - combobox "Portada" [ref=e94]:
                        - option "Pulmones"
                        - option "Corazón" [selected]
                        - option "Cráneo"
                        - option "Cuello"
                        - option "Abdomen"
                        - option "Pelvis"
                        - option "Muslo"
                        - option "Espalda"
              - generic [ref=e96]:
                - generic [ref=e97]:
                  - generic [ref=e98]:
                    - heading "Fuentes" [level=2] [ref=e99]
                    - paragraph [ref=e100]: Localiza cada fragmento por sección o página y conserva su procedencia.
                  - button "Añadir fuente" [ref=e101] [cursor=pointer]
                - generic [ref=e102]:
                  - generic [ref=e103]:
                    - generic [ref=e104]: Buscar guías del catálogo
                    - textbox "Buscar guías del catálogo" [ref=e105]
                  - button "Buscar guías" [disabled] [ref=e106]
                - status [ref=e107]: Cargando fuentes…
                - paragraph [ref=e108]: Todavía no hay fuentes. Añade la primera para documentar tus objetivos.
        - generic [ref=e109]:
          - generic [ref=e110]:
            - strong [ref=e111]: Cambios sin guardar
            - generic [ref=e112]: Cambios sin guardar. La revisión anterior ya no acredita esta copia.
          - button "Guardar borrador" [ref=e113] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e119] [cursor=pointer]:
    - generic [ref=e122]:
      - text: Compiling
      - generic [ref=e123]:
        - generic [ref=e124]: .
        - generic [ref=e125]: .
        - generic [ref=e126]: .
  - alert [ref=e127]
```