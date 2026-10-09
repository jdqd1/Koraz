# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: overflow-diagnostic.spec.mts >> inspect review overflow at narrow doubled text
- Location: ..\..\docs\aprendizaje-guiado\v2\evidencias\T037\overflow-diagnostic.spec.mts:3:1

# Error details

```
TimeoutError: locator.waitFor: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('heading', { name: 'Control editorial', exact: true }) to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Koras" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - link "Acceder" [ref=e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - link "Volver a rutas" [ref=e25] [cursor=pointer]:
            - /url: /panel/rutas
          - heading "Ruta editorial T035" [level=1] [ref=e26]
          - paragraph [ref=e27]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
        - generic [ref=e28]:
          - strong [ref=e29]: Borrador
          - generic [ref=e30]: Revisión 1 · Sin cambios pendientes
      - button "Importar archivo de ruta" [ref=e32] [cursor=pointer]
      - generic [ref=e33]:
        - tablist "Secciones del editor de rutas" [ref=e34]:
          - tab "Datos y fuentes" [ref=e35] [cursor=pointer]
          - tab "Objetivos" [ref=e36] [cursor=pointer]
          - tab "Recorrido" [ref=e37] [cursor=pointer]
          - tab "Evaluación y repaso" [ref=e38] [cursor=pointer]
          - tab "Revisión" [active] [selected] [ref=e39] [cursor=pointer]
        - tabpanel "Revisión" [ref=e40]:
          - generic [ref=e41]:
            - generic [ref=e42]:
              - heading "Revisión editorial" [level=2] [ref=e43]
              - paragraph [ref=e44]: Este contenido necesita una revisión vigente antes de publicarse.
              - paragraph [ref=e45]: La validación comprueba cobertura y fuentes. La aprobación editorial debe comprobar el contenido.
              - generic [ref=e46]:
                - generic [ref=e47]: Nota de revisión o de nueva versión
                - textbox "Nota de revisión o de nueva versión" [ref=e48]
              - generic [ref=e49]:
                - button "Validar contenido" [ref=e50] [cursor=pointer]
                - button "Enviar a revisión" [ref=e51] [cursor=pointer]
              - status
              - paragraph [ref=e52]: Comprobación local de cobertura; aún no confirma catálogo ni permisos.
              - list [ref=e53]:
                - listitem [ref=e54]:
                  - strong [ref=e55]: "Aviso:"
                  - text: Diagnóstico limitado por una ruta con menos de cuatro objetivos.
                  - paragraph [ref=e56]: Registra esta limitación editorial.
                  - button "Ir al campo" [ref=e57] [cursor=pointer]
              - generic [ref=e58]:
                - generic [ref=e59]: Notas editoriales de la ruta
                - textbox "Notas editoriales de la ruta" [ref=e60]: Fixture sintético de integración.
            - region "Vista previa editorial" [ref=e61]:
              - heading "Vista previa de la ruta" [level=2] [ref=e62]
              - status [ref=e63]:
                - strong [ref=e64]: Vista previa · no guarda progreso
              - paragraph [ref=e65]: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
              - generic [ref=e66]:
                - text: Perfil de vista previa
                - combobox "Perfil de vista previa" [ref=e67]:
                  - option "Principiante" [selected]
                  - option "Diagnóstico correcto"
                  - option "Error CORE"
              - button "Abrir vista previa" [ref=e68] [cursor=pointer]
              - status
            - generic [ref=e69]:
              - heading "Archivos y procedencia" [level=3] [ref=e70]
              - paragraph [ref=e71]: Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.
              - group "Revisar los archivos de la ruta" [ref=e72]:
                - generic [ref=e74]:
                  - generic [ref=e75]:
                    - generic [ref=e76]: "Archivo: fixture.png"
                    - 'combobox "Archivo: fixture.png" [ref=e77]':
                      - option "Selecciona un archivo revisado"
                      - option "fixture.png" [selected]
                  - generic [ref=e78]:
                    - generic [ref=e79]: Derechos de fixture.png
                    - combobox "Derechos de fixture.png" [ref=e80]:
                      - option "Sin verificar"
                      - option "Propios" [selected]
                      - option "Con licencia"
                      - option "Dominio público"
                  - generic [ref=e81]:
                    - generic [ref=e82]: Crédito de fixture.png
                    - textbox "Crédito de fixture.png" [ref=e83]: Fixture del software
                  - generic [ref=e84]:
                    - generic [ref=e85]: Texto alternativo de fixture.png
                    - textbox "Texto alternativo de fixture.png" [ref=e86]: Píxel sintético para comprobar coordenadas
                  - generic [ref=e87]:
                    - generic [ref=e88]: Huella del archivo fixture.png
                    - textbox "Huella del archivo fixture.png" [ref=e89]
                    - generic [ref=e90]: Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.
            - generic [ref=e91]:
              - heading "Exportar" [level=3] [ref=e92]
              - paragraph [ref=e93]: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
              - generic [ref=e94]:
                - button "Exportar paquete" [ref=e95] [cursor=pointer]
                - button "Descargar cobertura" [ref=e96] [cursor=pointer]
              - status
      - generic [ref=e97]:
        - generic [ref=e98]:
          - strong [ref=e99]: Borrador al día
          - generic [ref=e100]: La versión mostrada procede del servidor.
        - button "Guardar borrador" [disabled] [ref=e101]
    - navigation "Navegación móvil" [ref=e102]:
      - link "Inicio" [ref=e103] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e107] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e112] [cursor=pointer]
      - link [ref=e116] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=e119]: Rutas deaprendizaje
  - alert [ref=e120]
```