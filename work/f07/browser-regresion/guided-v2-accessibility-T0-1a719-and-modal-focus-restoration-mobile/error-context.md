# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02 tab order, field reachability and modal focus restoration
- Location: tests\e2e\guided-v2-accessibility.spec.ts:323:5

# Error details

```
TimeoutError: locator.focus: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Volver a rutas', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Koras" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - button "Abrir menú de perfil de t035-1@example.test" [ref=e18] [cursor=pointer]:
          - generic [ref=e19]: T0
    - region "Editor de ruta" [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - link "Volver a rutas de aprendizaje" [ref=e23] [cursor=pointer]:
            - /url: /panel/rutas
          - heading "Nueva ruta" [level=1] [ref=e26]
        - button "Importar archivo de ruta" [ref=e28] [cursor=pointer]:
          - generic [ref=e31]: Importar
      - generic [ref=e32]:
        - tablist "Secciones del editor de rutas" [ref=e33]:
          - tab "Datos y fuentes" [selected] [ref=e34] [cursor=pointer]:
            - strong [ref=e35]: Datos
          - tab "Objetivos" [ref=e36] [cursor=pointer]:
            - strong [ref=e37]: Objetivos
          - tab "Recorrido" [ref=e38] [cursor=pointer]:
            - strong [ref=e39]: Práctica
          - tab "Evaluación y repaso" [ref=e40] [cursor=pointer]:
            - strong [ref=e41]: Evaluar
          - tab "Revisión" [ref=e42] [cursor=pointer]:
            - strong [ref=e43]: Revisar
        - tabpanel "Datos y fuentes" [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]:
              - heading "Datos de la ruta" [level=2] [ref=e49]
              - group "Datos de la ruta" [ref=e50]:
                - generic [ref=e52]:
                  - generic [ref=e53]:
                    - generic [ref=e54]: Título
                    - textbox "Título" [ref=e56]:
                      - /placeholder: Ej. Vascularización del abdomen
                  - generic [ref=e57]:
                    - generic [ref=e58]: Tema del catálogo
                    - combobox "Tema del catálogo" [ref=e60]:
                      - option "Selecciona un tema" [selected]
                      - option "Simulación F03"
                      - option "Simulación F06"
                      - option "Tema T035"
                  - generic [ref=e61]:
                    - generic [ref=e62]: Descripción
                    - textbox "Descripción" [ref=e64]:
                      - /placeholder: ¿Qué aprenderá el estudiante en esta ruta?
                  - generic [ref=e65]:
                    - generic [ref=e66]: Disciplina
                    - combobox "Disciplina" [ref=e68]:
                      - option "Anatomía"
                      - option "Histología"
                      - option "Embriología"
                      - option "Fisiología"
                      - option "Bioquímica"
                      - option "Farmacología"
                      - option "Patología"
                      - option "Clínica"
                      - option "General" [selected]
              - region "Vista previa de la ruta" [ref=e69]:
                - generic [ref=e70]:
                  - strong [ref=e71]: Nombre de la ruta
                  - paragraph [ref=e72]: La descripción de tu ruta aparecerá aquí.
                  - text: General
            - generic [ref=e74]:
              - generic [ref=e75]:
                - heading "Fuentes de estudio 0" [level=2] [ref=e76]:
                  - text: Fuentes de estudio
                  - generic [ref=e77]: "0"
                - button "Añadir fuente" [ref=e78] [cursor=pointer]
              - group [ref=e82]:
                - generic [ref=e83] [cursor=pointer]:
                  - text: +
                  - strong [ref=e85]: Buscar una guía
              - generic [ref=e86]:
                - heading "Añade el material de estudio" [level=3] [ref=e89]
                - paragraph [ref=e90]: Usa una guía del catálogo o una referencia externa para respaldar el contenido de la ruta.
      - generic [ref=e91]:
        - generic "Cambios sin guardar" [ref=e92]:
          - strong [ref=e93]: Cambios sin guardar
        - generic [ref=e94]:
          - button "Guardar borrador" [ref=e95] [cursor=pointer]
          - button "Continuar" [ref=e98] [cursor=pointer]
    - navigation "Navegación móvil" [ref=e101]:
      - link "Inicio" [ref=e102] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e106] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e111] [cursor=pointer]
      - link [ref=e115] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e118]: Rutas deaprendizaje
  - alert [ref=e119]
```