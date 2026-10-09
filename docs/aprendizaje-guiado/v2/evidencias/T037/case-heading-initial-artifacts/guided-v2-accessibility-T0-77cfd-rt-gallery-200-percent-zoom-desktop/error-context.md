# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:108:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-editor-preview]').getByRole('heading', { name: 'case-choice-1: actividad sintética', exact: true })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-editor-preview]').getByRole('heading', { name: 'case-choice-1: actividad sintética', exact: true }) with timeout 60000ms
  - waiting for locator('[data-editor-preview]').getByRole('heading', { name: 'case-choice-1: actividad sintética', exact: true })

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
    - button "Administrar":
      - img
- banner:
  - button "Expandir menú principal"
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Koras" [level=1]
  - button "Notificaciones"
  - link "Acceder":
    - /url: /acceder
- main:
  - link "Volver a rutas":
    - /url: /panel/rutas
  - heading "Ruta editorial T035" [level=1]
  - paragraph: Organiza objetivos, práctica y repaso con las fuentes de la ruta.
  - strong: Borrador
  - text: Revisión 1 · Sin cambios pendientes
  - button "Importar archivo de ruta"
  - tablist "Secciones del editor de rutas":
    - tab "Datos y fuentes"
    - tab "Objetivos"
    - tab "Recorrido"
    - tab "Evaluación y repaso"
    - tab "Revisión" [selected]
  - tabpanel "Revisión":
    - heading "Revisión editorial" [level=2]
    - paragraph: Este contenido necesita una revisión vigente antes de publicarse.
    - paragraph: La validación comprueba cobertura y fuentes. La aprobación editorial debe comprobar el contenido.
    - text: Nota de revisión o de nueva versión
    - textbox "Nota de revisión o de nueva versión"
    - button "Validar contenido"
    - button "Enviar a revisión"
    - status
    - paragraph: Comprobación local de cobertura; aún no confirma catálogo ni permisos.
    - list:
      - listitem:
        - strong: "Aviso:"
        - text: Diagnóstico limitado por una ruta con menos de cuatro objetivos.
        - paragraph: Registra esta limitación editorial.
        - button "Ir al campo"
    - text: Notas editoriales de la ruta
    - textbox "Notas editoriales de la ruta": Fixture sintético de integración.
    - region "Vista previa editorial":
      - heading "Vista previa de la ruta" [level=2]
      - status:
        - strong: Vista previa · no guarda progreso
      - paragraph: Comparte las actividades y la corrección del alumno. Los resultados y fechas de esta simulación se mantienen aislados.
      - paragraph:
        - text: "Reloj simulado:"
        - time: 4/10/2026, 8:00:00 a. m.
        - text: (America/Caracas).
      - paragraph: La sesión editorial vence en diez minutos reales. Cerrar o reiniciar descarta sus resultados.
      - button "Avanzar 1 día" [disabled]
      - button "Avanzar 7 días" [disabled]
      - button "Avanzar 30 días" [disabled]
      - button "Cerrar vista previa"
      - status
      - region "Sesión de aprendizaje":
        - button "Cerrar vista previa"
        - text: Aprendizaje guiado
        - heading "Tu sesión de aprendizaje" [level=1]
        - status: Estado simulado
        - status
        - text: Recorrido en curso Dominio por comprobar Consolidación pendiente 0 repasos pendientes 7 actividades completadas de 9
        - paragraph: "Objetivo: Práctica del objetivo actual"
        - 'heading "Etapa 1: ejemplo sintético case-choice-1: actividad sintética" [level=2]'
        - paragraph: Recupera lo aprendido con tus palabras. La explicación del paso anterior ya no está en esta pantalla.
        - group "Elige una respuesta":
          - text: Elige una respuesta
          - radio "Respuesta A"
          - text: Respuesta A
          - radio "Respuesta B"
          - text: Respuesta B
        - button "Comprobar respuesta" [disabled]
        - button "Necesito ayuda"
        - button "Consultar fuente con ayuda"
    - heading "Archivos y procedencia" [level=3]
    - paragraph: Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.
    - group "Revisar los archivos de la ruta":
      - text: "Revisar los archivos de la ruta Archivo: fixture.png"
      - 'combobox "Archivo: fixture.png"':
        - option "Selecciona un archivo revisado"
        - option "fixture.png" [selected]
      - text: Derechos de fixture.png
      - combobox "Derechos de fixture.png":
        - option "Sin verificar"
        - option "Propios" [selected]
        - option "Con licencia"
        - option "Dominio público"
      - text: Crédito de fixture.png
      - textbox "Crédito de fixture.png": Fixture del software
      - text: Texto alternativo de fixture.png
      - textbox "Texto alternativo de fixture.png": Píxel sintético para comprobar coordenadas
      - text: Huella del archivo fixture.png
      - textbox "Huella del archivo fixture.png"
      - text: Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.
    - heading "Exportar" [level=3]
    - paragraph: Descarga el contenido confirmado. Guarda primero los cambios pendientes.
    - button "Exportar paquete"
    - button "Descargar cobertura"
    - status
  - strong: Borrador al día
  - text: La versión mostrada procede del servidor.
  - button "Guardar borrador" [disabled]
- alert
```

```
Error: browserContext._wrapApiCall: file data stream has unexpected number of bytes
```