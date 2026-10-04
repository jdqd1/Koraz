# T023 — Estado y transporte del editor v2

**Resultado: PASS. Fecha: 30/09/2026.** Base de ejecución: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`.

Se implementó el modelo, reducer, serializador, transporte y shell editorial v2. Las rutas v2 existentes se abren en `/panel/rutas/[pathId]`, guardan mediante el BFF web y conservan definición, bindings y versión al recargar. Las rutas v1 siguen usando su editor anterior.

Este cierre corresponde únicamente a T023. T024 no se inició. Las cinco secciones están presentes, con edición mínima de título/descripción y resúmenes del contenido existente. Los formularios de objetivos, unidades, actividades, assets y los flujos de importación/revisión/publicación corresponden a T024–T027; esta evidencia no acredita esas capacidades ni el Hito S.

## Alcance y autorización

- Petición del usuario: `continua con t023`.
- Ficha consultada: `C:/Users/josed/Documents/Codex/2026-09-26/act-a-como-arquitecto-principal-de-2/outputs/koraz-rutas-aprendizaje/HANDOFF-EJECUTOR.md`, T023 y directriz de diseño vigente.
- Dependencias verificadas en sus `result.json`: **T004 PASS** y **T009 PASS**.
- La ficha permite la subcarpeta `editor/v2`, el shell/facade compartidos y tests colocados junto a los módulos. Para conectar el guardado real se identificó la ausencia del proxy editorial v2 y del loader por motor. Se consultó esa ampliación concreta y el usuario respondió: **«Sí, incluir la conexión web mínima»**.
- Esa ampliación añade POST/GET/PATCH editoriales al BFF existente, un loader por motor y su dispatch en la página de edición. Una fixture accesible solo en desarrollo permite verificar estados y continuidad visual sin datos del usuario.
- No se modificaron reducer/serialización v1, estilos globales, contratos, backend, migraciones, políticas, permisos o dependencias. `state-before.txt` registra los cambios preexistentes de T020–T022; se preservaron. En `guided-learning-api.ts` se añadió exclusivamente el loader editorial por motor sobre el trabajo previo.

## Comportamiento implementado

- El borrador contiene el paquete portable y bindings tipados; la confirmación del servidor se mantiene separada. Las claves locales de objetos portables no requieren fabricar identificadores del catálogo. Los UUID generados en transporte son claves de idempotencia, y los identificadores persistidos proceden de la API.
- El serializador construye explícitamente los inputs permitidos: paquete, bindings y `expectedVersion` cuando corresponde. No envía actor, estado, hashes, aprobaciones ni datos de runtime como inputs de edición.
- El guardado es explícito. CAS utiliza la revisión confirmada; durante una solicitud se bloquean ediciones y envíos duplicados. Una respuesta perdida conserva cuerpo y clave para reintentar. Tras crear, el controlador confirma mediante GET antes de borrar la recuperación, y no repite un POST que ya devolvió identificadores.
- La recuperación en `sessionStorage` se limita a actor/ruta/versión, valida estructura, tamaño y antigüedad, y nunca sustituye la autoridad del servidor. Se ofrece antes de editar o guardar. Si la revisión cambió, la copia puede descargarse sin aplicarla sobre la versión nueva.
- Un 409 conserva el borrador y bloquea más guardados. La UI permite descargarlo y después abrir la versión guardada. La copia también está protegida al salir mediante diálogo interno y `beforeunload`.
- Las cinco secciones son Datos y fuentes, Objetivos, Recorrido, Evaluación y repaso, y Revisión. Cualquier edición vuelve obsoleta la revisión visual. El estilo reutiliza el módulo del editor anterior, con ajustes locales para las cinco pestañas y la barra móvil.
- El loader consulta v2 únicamente cuando el endpoint v1 devuelve el error explícito `engine_version_mismatch`. Un 401, 403, 404, 503 u otro 409 no habilita ese fallback. El BFF reutiliza sesión y validación de origen, propaga idempotencia y devuelve `Cache-Control: private, no-store`.

## Aceptación

| Criterio T023 | Resultado y evidencia |
| --- | --- |
| Editar → guardar → recargar mantiene datos | PASS. Tests del controlador con todas las ocho familias; integración HTTP con provider y almacenamiento aislado; navegador en la página real, PATCH 200, revisión 4 y título conservado tras recarga. |
| 409 preserva copia local | PASS. Tests, conflicto real tras una edición remota y copia local conservada. Descarga JSON efectiva verificada con ocho actividades. La UI abre la versión guardada después de conservarla. |
| v1 usa el editor existente | PASS. Dispatch SSR y loader probados; baseline visual previa conservada. No se alteró su modelo/serializador. |
| Cambios invalidan revisión visual | PASS. Modelo/reducer y test de revisión; el indicador del shell depende del borrador y del hash confirmado. |
| Modelo/reducer/serializer/transport y cinco secciones | PASS. Contratos estrictos, protección de campos del servidor y estados publicados; cobertura de transporte, recuperación, CAS y dispatch. |

## Comprobaciones ejecutadas

Runtime usado: Node **24.19.0** ya disponible y pnpm.cmd **11.19.0**. No hubo instalaciones ni actualizaciones.

| Comando o comprobación | Resultado | Evidencia |
| --- | --- | --- |
| `pnpm.cmd --filter @cediah/contracts build` | PASS, exit 0 | `contracts-build.txt` |
| `pnpm.cmd --filter @cediah/web test -- --maxWorkers=1` | PASS, exit 0: **45 archivos, 286 tests** | `web-test.txt` |
| `pnpm.cmd --filter @cediah/web exec vitest run src/components/learning/editor/v2/editor-model.test.ts src/components/learning/editor/v2/editor-controller.test.ts src/components/learning/editor/v2/editor-web.test.ts --maxWorkers=1` | PASS, exit 0: **3 archivos, 25 tests** tras los ajustes finales de dispatch/navegación/descarga | `focused-closure.txt` |
| `pnpm.cmd --filter @cediah/web typecheck` | PASS, exit 0 en la fuente final | `typecheck-closure.txt` |
| ESLint de los archivos web afectados, `--max-warnings=0` | PASS, exit 0 en la fuente final; salida vacía | `lint-closure.txt` |
| Vitest del harness HTTP aislado, comando inferior | PASS, exit 0: **1 test integrado** | `http-integration.txt` |
| Chromium con Next dev, página real y BFF reales | PASS para guardado/recarga/409 y checks visuales descritos abajo | Capturas y JSON de navegador |
| `git diff --check` | PASS, exit 0 | `diff-check.txt` |
| SHA-256 de las 21 fuentes afectadas | PASS, sin diferencias al cierre | `source-hashes.json`, `closure-verification.json` |

El lint se ejecutó sobre este alcance:

```powershell
pnpm.cmd --filter @cediah/web exec eslint src/components/learning/editor/v2 src/components/learning/editor/editor-shell.tsx src/components/learning/editor/learning-route-editor-facade.tsx src/app/api/v2/editor/learning-paths 'src/app/panel/rutas/[pathId]/page.tsx' src/app/visual-fixtures/editor-rutas-v2 src/lib/server/guided-learning-api.ts --max-warnings=0
```

La suite completa precedió los últimos ajustes de navegación, descarga, precedencia del dispatch y etiquetas de errores. La suite enfocada volvió a pasar tras los ajustes de comportamiento; después solo cambió el texto de las etiquetas de error, validado con typecheck y lint finales. No se presenta una repetición de toda la suite sobre ese último cambio de texto.

Harness reproducible, sin variables de conexión de producción:

```powershell
$env:PATH = 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
pnpm.cmd --filter @cediah/web exec vitest run --root 'D:/Jose (Datos)/Medicina/CEDIAH/Web' --config 'D:/Jose (Datos)/Medicina/CEDIAH/Web/docs/aprendizaje-guiado/v2/evidencias/T023/vitest.http.config.mts'
```

`T023_BROWSER_HOLD=true` es opcional y mantiene el servidor loopback hasta 15 minutos para QA de navegador. Se usó en la ejecución guardada; por eso su duración incluye esa espera y no constituye una medición de rendimiento. El harness usa Fastify/editor routes y provider reales, PGlite aislado, catálogo sintético y cookie de prueba. Comprueba crear, editar, persistir el paquete completo/bindings, replay idempotente, conflicto CAS y ausencia de filas de pasos v1. El QA posterior usó Next en loopback, el loader/BFF reales y la misma identidad sintética.

## Evidencia de navegador

- `editor-v1-before.png`: baseline del editor existente inspeccionada antes del cambio.
- `editor-v2-real-desktop.png`: página real después de guardar y recargar, revisión 4. `browser-bff-save.json` registra la solicitud PATCH y respuesta 200; `actual-storage-after-ui.json` confirma título, revisión y ocho actividades en almacenamiento.
- `editor-v2-real-conflict.png`: edición remota seguida de PATCH 409, con borrador local visible y preservado.
- `local-conflict-copy.json` y `download-verification.json`: JSON efectivamente descargado por Chromium desde el conflicto sintético, copiado de la carpeta de descargas del sistema y parseado; ocho actividades, título local, motor y revisión base correctos. La espera de evento de descarga de la herramienta expiró aunque el archivo sí se descargó; se verificó el resultado en disco.
- `browser-conflict-reload.txt` y `editor-v2-after-conflict-reload.png`: después de descargar, «Abrir versión guardada» restablece el título confirmado y deja cero cambios pendientes.
- `editor-v2-recovery-offer.png` y `browser-recovery.txt`: salir conservando copia, volver, recuperar el título local y guardarlo explícitamente.
- `browser-geometry-keyboard.json`: 360×800, 390×844, 768×1024 y 1440×900, sin desbordamiento de página y con cinco pestañas; flechas/Enter y End/Enter cambian de sección, con foco visible. Las pestañas usan activación manual: mover foco no activa la sección hasta Enter.
- `editor-v2-real-mobile.png`: barra de guardado separada de la navegación móvil. Se corrigió el solapamiento detectado en la captura intermedia `editor-v2-mobile.png` mediante CSS local.
- `browser-empty.txt`: estado vacío legible; también se observó el estado de carga del editor y se verificaron conflictos/errores. Los estados publicados y de fallo de transporte tienen cobertura de modelo/controlador.
- `browser-zoom-200-emulated.json` y `editor-v2-zoom-200-emulated.png`: reflow equivalente al 200% emulado mediante 720×450 CSS px, DPR 2 sobre 1440×900 físicos, sin desbordamiento. **El zoom nativo del navegador no está verificado.**

## Límites y registros históricos

- PASS acredita T023 en entorno local. No acredita producción, sesiones reales, concurrencia de PostgreSQL, eficacia clínica ni aceptación del sistema completo.
- La integración usa PGlite e identidad sintética. La migración histórica 0005 se excluye por su dependencia de identidad legacy; no constituye validación M01.
- La matriz completa de accesibilidad, axe y lector de pantalla pertenece a T037. Se verificaron aquí teclado, foco y reflow, con el límite de zoom anterior.
- El lanzador de creación/importación v2 y los formularios editoriales completos quedan para sus fichas. El modelo y el controlador permiten claves locales y creación, probada por HTTP, sin adelantar esos flujos de UI.
- Se conservan `lint-first.txt` (dos errores de actualización de estado en efecto, corregidos con stores externos) y `http-startup-first.txt` (config relativa de Vitest, corregida con rutas absolutas). Ningún timeout ni assertion se relajó. Las capturas intermedias no sustituyen las finales.
- Los servidores temporales en 3100 y 4102 están detenidos; cookie sintética y overrides de viewport/zoom retirados. No se desplegó, publicó ni creó commit.

**Siguiente ficha propuesta: T024, pendiente de instrucción del usuario.**
