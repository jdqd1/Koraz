# T033 — Preview editorial compartido

Estado de cierre: **PASS LOCAL**. Alcance local, fecha 2026-10-04, America/Caracas.
Base: `d609e66ba82cdc9b40392a5bb525e5808b47d305`; árbol inicialmente limpio.
Dependencias T027, T029, T030, T031 y T032: PASS según sus `result.json`.

## Autorización y alcance

Petición del usuario: «continua con t033». El handoff se empleó como especificación
de esa tarea, sin iniciar sus tareas siguientes. El usuario autorizó expresamente
los siete archivos de `AMPLIACION-PROPUESTA.md`, la conexión de `assetStorage` en
`apps/api/src/app.ts` y la reparación del selector impuro de CSS en
`route-editor.module.css`. Las tres autorizaciones están aplicadas.

## Resultado implementado

El paso Revisión del editor abre una sesión efímera, exclusiva del actor editorial,
con perfiles principiante, diagnóstico correcto y error CORE, reloj simulado y
exploración de actividades/evaluaciones. El banner identifica que no guarda progreso.
Reutiliza `V2Player`, los ocho renderers y las funciones puras de manifiesto,
corrección, evidencia, selección y agenda. `preservation.json` confirma que estas
funciones y la política no cambiaron.

Las operaciones del player, sus reintentos y las imágenes pasan exclusivamente por
contratos/BFF editoriales. El almacenamiento de progreso del cliente está desactivado.
El simulador mantiene sus respuestas, recibos y agenda en memoria del servidor,
vence a los diez minutos reales y revalida permisos/propiedad en cada solicitud.
Las imágenes se resuelven desde bindings y catálogo autorizados, con URL firmada
de 60 segundos. La apertura conserva el recibo editorial preexistente de validación;
no genera matrícula, intento, respuesta, evento de aprendizaje ni recompensa.

## Verificación

- Contratos: build PASS con Node 24.19.0; `contracts-node24.txt`.
- API: typecheck PASS, 50 pruebas en preview/selección/corrección y 7 pruebas de
  almacenamiento editorial PASS; `api-final-checks.txt`, `api-editor-storage-closure.txt`.
- Preview API final: 9/9 PASS, incluido repaso tras avanzar el reloj,
  permisos, CAS, idempotencia, reservas, revocación de imagen y expiración;
  `api-preview-closure.txt`.
- Web: typecheck PASS y regresión final 476/476, 60 archivos, ejecutada con
  un worker; `web-final-checks.txt`, `web-suite-serial-closure.txt`.
- ESLint de los archivos modificados: PASS, cero avisos;
  `api-lint-closure.txt`, `web-lint-closure.txt`.
- Navegador: PASS, 9 comprobaciones de recorrido; estudio, elección/ayuda/error,
  respuesta corta, caso por etapas, respuesta construida/revelado/autoexamen,
  relaciones, secuencia e imagen. Reloj +7 días, perfil CORE y retorno del foco.
  Cero solicitudes a endpoints de alumno y cero errores de página. Conteos de
  30 tablas iguales antes/después, excluyendo exclusivamente el recibo editorial
  de validación. A 1440/768/375/320 px no hay desbordamiento horizontal del
  preview ni del documento; axe grave/crítico: 0 en el área de preview.
  Evidencias: `browser-preview.json`, `browser-preview-csp.txt`,
  `preview-image-desktop.png` y `preview-mobile.png`.
- HTTP del harness: PASS, provider y definición reales; `http-preview-closure.txt`.
- `git diff --check`: PASS.

El harness usa Next/webpack en 31033, Fastify y provider reales en 41033, PGlite
aislado, identidad sintética y catálogo sintético de ocho tipos. La imagen se sirve
mediante una URL sintética firmada por el resolver de prueba y se intercepta su
contenido; no acredita storage externo. Configuración local necesaria:
`API_BASE_URL=http://127.0.0.1:41033` y
`NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN=https://t033-media.example.test`.

## Incidencias reparadas y límites

Se reparó una carrera real al cambiar de actividad: el nuevo intento podía montar
el transporte del intento anterior. El transporte se identifica ahora por intento.
La compilación detectó el selector CSS impuro preexistente y se corrigió con la
autorización indicada. Las iteraciones también corrigieron el catálogo/estado del
fixture, la sincronización de hidratación, un locator de relaciones y el dominio
de media del harness. Los logs de intentos anteriores no sustituyen al cierre final.
La ejecución web paralela se interrumpió por lentitud; la repetición serial completa
es la evidencia de regresión final.

NO VERIFICADO: PostgreSQL independiente/concurrencia/grants, emisión BetterAuth,
storage externo, zoom nativo, lector de pantalla y auditoría integral T037,
recorrido completo del alumno T035, Hito S, aceptación clínica y producción.
Se conserva el timeout de regresión API heredado de T024 como bloqueo de aceptación
global. Los 404 de autenticación del shell y catálogo de archivos en el harness
sintético no acreditan esos flujos. No hubo deploy ni commit.

**T034 no iniciada.** Archivos finales y hashes: `source-hashes.json`.
