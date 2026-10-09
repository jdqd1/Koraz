# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:107:5

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Matcher error: received value must be a number or bigint

Received has value: undefined
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e3]:
    - banner [ref=f1e4]:
      - search "Buscar guías" [ref=f1e6]:
        - combobox "Buscar guías" [ref=f1e9]
      - heading "Koras" [level=1] [ref=f1e11]
      - generic [ref=f1e12]:
        - button "Notificaciones" [ref=f1e14] [cursor=pointer]
        - link "Acceder" [ref=f1e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=f1e22]:
      - generic [ref=f1e23]:
        - generic [ref=f1e24]:
          - link "Volver a rutas" [ref=f1e25] [cursor=pointer]:
            - /url: /panel/rutas
          - heading "Ruta editorial T035" [level=1] [ref=f1e26]
          - paragraph [ref=f1e27]: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
        - generic [ref=f1e28]:
          - strong [ref=f1e29]: Borrador
          - generic [ref=f1e30]: Revisión 2 · Sin cambios pendientes
      - button "Importar archivo de ruta" [ref=f1e32] [cursor=pointer]
      - generic [ref=f1e33]:
        - tablist "Secciones del editor de rutas" [ref=f1e34]:
          - tab "Datos y fuentes" [ref=f1e35] [cursor=pointer]
          - tab "Objetivos" [ref=f1e36] [cursor=pointer]
          - tab "Recorrido" [ref=f1e37] [cursor=pointer]
          - tab "Evaluación y repaso" [ref=f1e38] [cursor=pointer]
          - tab "Revisión" [selected] [ref=f1e39] [cursor=pointer]
        - tabpanel "Revisión" [ref=f1e40]:
          - generic [ref=f1e41]:
            - generic [ref=f1e42]:
              - heading "Revisión editorial" [level=2] [ref=f1e43]
              - paragraph [ref=f1e44]: Este contenido necesita una revisión vigente antes de publicarse.
              - paragraph [ref=f1e45]: La validación comprueba cobertura y fuentes. La aprobación editorial debe comprobar el contenido.
              - generic [ref=f1e46]:
                - generic [ref=f1e47]: Nota de revisión o de nueva versión
                - textbox "Nota de revisión o de nueva versión" [ref=f1e48]
              - generic [ref=f1e49]:
                - button "Validar contenido" [ref=f1e50] [cursor=pointer]
                - button "Enviar a revisión" [ref=f1e51] [cursor=pointer]
              - status
              - paragraph [ref=f1e52]: Comprobación local de cobertura; aún no confirma catálogo ni permisos.
              - list [ref=f1e53]:
                - listitem [ref=f1e54]:
                  - strong [ref=f1e55]: "Aviso:"
                  - text: Diagnóstico limitado por una ruta con menos de cuatro objetivos.
                  - paragraph [ref=f1e56]: Registra esta limitación editorial.
                  - button "Ir al campo" [ref=f1e57] [cursor=pointer]
              - generic [ref=f1e58]:
                - generic [ref=f1e59]: Notas editoriales de la ruta
                - textbox "Notas editoriales de la ruta" [ref=f1e60]: Fixture sintético de integración.
            - region "Vista previa editorial" [ref=f1e61]:
              - heading "Vista previa de la ruta" [level=2] [ref=f1e62]
              - status [ref=f1e63]:
                - strong [ref=f1e64]: Vista previa · no guarda progreso
              - paragraph [ref=f1e65]: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
              - generic [ref=f1e66]:
                - paragraph [ref=f1e67]:
                  - text: "Reloj simulado:"
                  - time [ref=f1e68]: 4/10/2026, 8:00:00 a. m.
                  - text: (America/Caracas).
                - paragraph [ref=f1e69]: La sesión editorial vence en diez minutos reales. Cerrar o reiniciar descarta sus resultados.
                - generic [ref=f1e70]:
                  - button "Avanzar 1 día" [disabled] [ref=f1e71]
                  - button "Avanzar 7 días" [disabled] [ref=f1e72]
                  - button "Avanzar 30 días" [disabled] [ref=f1e73]
                  - button "Cerrar vista previa" [ref=f1e74] [cursor=pointer]
                - status
                - region "Sesión de aprendizaje" [ref=f1e76]:
                  - generic [ref=f1e77]:
                    - button "Cerrar vista previa" [ref=f1e78] [cursor=pointer]
                    - generic [ref=f1e79]:
                      - text: Aprendizaje guiado
                      - heading "Tu sesión de aprendizaje" [level=1] [ref=f1e80]
                    - status [ref=f1e81]: Estado simulado
                  - status [ref=f1e82]
                  - generic "Estado confirmado de la ruta" [ref=f1e83]:
                    - generic [ref=f1e84]: Recorrido en curso
                    - generic [ref=f1e85]: Dominio por comprobar
                    - generic [ref=f1e86]: Consolidación pendiente
                    - generic [ref=f1e87]: 0 repasos pendientes
                    - generic [ref=f1e88]: 1 actividades completadas de 9
                  - generic [ref=f1e89]:
                    - paragraph [ref=f1e90]: "Objetivo: Práctica del objetivo actual"
                    - 'heading "constructed-1: actividad sintética" [active] [level=2] [ref=f1e91]'
                    - paragraph [ref=f1e92]: Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.
                    - generic [ref=f1e94]:
                      - generic [ref=f1e95]: Explica con tus palabras
                      - textbox "Explica con tus palabras" [ref=f1e96]
                      - paragraph [ref=f1e97]: La comparación es formativa; tu valoración no acredita dominio.
                      - button "Guardar mi respuesta" [disabled] [ref=f1e98]
                    - generic [ref=f1e99]:
                      - button "Necesito ayuda" [ref=f1e100] [cursor=pointer]
                      - button "Consultar fuente con ayuda" [ref=f1e101] [cursor=pointer]
            - generic [ref=f1e102]:
              - heading "Archivos y procedencia" [level=3] [ref=f1e103]
              - paragraph [ref=f1e104]: Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.
              - group "Revisar los archivos de la ruta" [ref=f1e105]:
                - generic [ref=f1e107]:
                  - generic [ref=f1e108]:
                    - generic [ref=f1e109]: "Archivo: fixture.png"
                    - 'combobox "Archivo: fixture.png" [ref=f1e110]':
                      - option "Selecciona un archivo revisado"
                      - option "fixture.png" [selected]
                  - generic [ref=f1e111]:
                    - generic [ref=f1e112]: Derechos de fixture.png
                    - combobox "Derechos de fixture.png" [ref=f1e113]:
                      - option "Sin verificar"
                      - option "Propios" [selected]
                      - option "Con licencia"
                      - option "Dominio público"
                  - generic [ref=f1e114]:
                    - generic [ref=f1e115]: Crédito de fixture.png
                    - textbox "Crédito de fixture.png" [ref=f1e116]: Fixture del software
                  - generic [ref=f1e117]:
                    - generic [ref=f1e118]: Texto alternativo de fixture.png
                    - textbox "Texto alternativo de fixture.png" [ref=f1e119]: Píxel sintético para comprobar coordenadas
                  - generic [ref=f1e120]:
                    - generic [ref=f1e121]: Huella del archivo fixture.png
                    - textbox "Huella del archivo fixture.png" [ref=f1e122]
                    - generic [ref=f1e123]: Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.
            - generic [ref=f1e124]:
              - heading "Exportar" [level=3] [ref=f1e125]
              - paragraph [ref=f1e126]: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
              - generic [ref=f1e127]:
                - button "Exportar paquete" [ref=f1e128] [cursor=pointer]
                - button "Descargar cobertura" [ref=f1e129] [cursor=pointer]
              - status
      - generic [ref=f1e130]:
        - generic [ref=f1e131]:
          - strong [ref=f1e132]: Borrador al día
          - generic [ref=f1e133]: La versión mostrada procede del servidor.
        - button "Guardar borrador" [disabled] [ref=f1e134]
    - navigation "Navegación móvil" [ref=f1e135]:
      - link "Inicio" [ref=f1e136] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f1e140] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f1e145] [cursor=pointer]
      - link [ref=f1e149] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f1e152]: Rutas deaprendizaje
  - alert [ref=f1e153]
```