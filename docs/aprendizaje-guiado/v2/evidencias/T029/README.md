# T029 — Player base, recuperación y feedback

**Aceptación: PASS local de T029, incluida la ampliación autorizada.**
Fecha local: 03/10/2026. Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`.
Solicitud: «continua con t029»; ampliación autorizada por «ok, hazlo».
T013, T015 y T028 mantienen sus alcances documentados. T030 no iniciado.

## Resultado

Player integrado en el dispatcher v2 y AppShell existentes, con study, elección
única, respuesta corta y respuesta construida. La explicación y las fuentes
del paso anterior desaparecen del DOM de recuperación. El progreso, el resultado,
el avance y la etapa construida proceden del servidor.

La respuesta construida sigue texto → guardar → comparar → autorreporte.
GET recupera el texto propio y la etapa enviada después de recargar. Solo tras
reveal autorizado devuelve modelo y rúbrica; la comparación también sobrevive
a recarga. Al avanzar, el manifiesto retira esa etapa. El autorreporte mantiene
score null y no acredita dominio. La transacción rechaza reveal antes de enviar
y durante evaluación, igual que la frontera HTTP.

El feedback y el historial confirmado incluyen fuentes de la versión fijada:
título, cita, localizador, fragmento y URL HTTPS opcional. La proyección usa
feedback.sourceKeys y una allowlist explícita; excluye fuentes no vinculadas y
metadatos editoriales. Mostrar fuentes después de responder no registra ayuda
ni cambia assisted=false. Las evaluaciones conservan la corrección diferida
hasta entregar cada segmento.

Los campos sources y constructedResponse son adiciones opcionales del DTO
para aceptar recibos históricos; los manifiestos actuales entregan su estado.
No se expone el objeto editorial completo ni se usa almacenamiento cliente
para determinar modelo, rúbrica o progreso. sessionStorage conserva únicamente
la solicitud pendiente y su clave para repetir exactamente un envío incierto.
El player valida identidad, versión, respuesta aceptada, nextStep y etapa.

## Verificación final

| Comprobación | Resultado |
|---|---|
| Build de contratos con Node 24.19.0 | PASS |
| Suite web completa | 410 PASS / 54 archivos |
| Contratos, persistencia, evaluación, HTTP y seguridad API | 72 PASS / 19 SKIP / 5 archivos |
| Fuentes fijadas tras publicación nueva, regresión HTTP final | 12 PASS / 1 archivo |
| Typecheck web y API; lint de archivos cambiados | PASS |
| Chromium + Next local + HTTP mocks tipados | PASS, flujos de recuperación, fuentes, comparación y reintento |
| Geometría responsive | PASS: 360×800, 390×844, 768×1024, 1440×900; sin overflow horizontal |
| Teclado y foco | PASS en interacción inspeccionada |
| Axe | Sin serious/critical en estados short_answer inspeccionados |
| git diff --check | PASS |

Evidencia vigente en `ampliacion/`: `contracts-build.txt`,
`web-suite-final.txt`, `api-focused-isolated.txt`,
`api-version-pinning-final.txt`, typecheck/lint finales,
`browser-checks.json`, `browser-check.cjs` y capturas.
Inspección visual de feedback desktop, comparación desktop y respuesta móvil.

La primera pasada API concurrente con navegador/suite web agotó los 5 segundos
de un test de 12 objetivos reservados. `api-focused-final.txt` conserva ese FAIL.
La repetición aislada pasó sin aumentar timeout ni cambiar assertions;
la regresión HTTP posterior también pasó. No se declara solucionado el timeout
API distinto heredado de T024.

## Alcance y preservación

La ampliación de contratos, manifests, provider y routes está documentada en
`AMPLIACION-PROPUESTA.md`. Los únicos ajustes de conexión frontend fuera de
los glob literales son el montaje en session-entry y el wrapper QA de desarrollo,
con guardia NODE_ENV. Se mantienen v1, migraciones, flags y política de grading.
Sin instalación de dependencias, commit ni despliegue.

SHA256 de la línea base inicial: 439/449 archivos previos conservan sus bytes;
los diez cambios corresponden al alcance T029 y la ampliación. Línea base al
autorizar: 445/456 intactos; once archivos previstos modificados.
Los nuevos archivos del player y manifests se registran aparte en hashes finales.
El FAIL previo y sus motivos permanecen en `ampliacion/result-before.json`,
`README-before.md` y los logs originales. Los tests de caracterización se
transformaron en comprobaciones de aceptación; no se rebajaron los requisitos.

## Límites pendientes

Los 19 SKIP de API requieren PostgreSQL independiente; PGlite acredita
persistencia secuencial, sin atribuirle bloqueos/grants de PostgreSQL real.
El navegador usa mocks HTTP stateful validados por contratos. Los tests HTTP API
usan Fastify/PGlite, y la regresión BFF ejecuta el transporte con adaptadores;
esto no acredita el recorrido completo autenticado de T035.

Auditoría completa axe/lector de pantalla y zoom nativo T037 NO VERIFICADOS.
La comprobación CSS zoom 200 % es exploratoria. Tampoco se verifican en este
cierre revisión clínica, carga, staging, producción ni Hito S.
T021 mantiene su pendiente upgrade; el timeout heredado T024 sigue abierto.
T030 queda como siguiente tarea, sin iniciarse.

