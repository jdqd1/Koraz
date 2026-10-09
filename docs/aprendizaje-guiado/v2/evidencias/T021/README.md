# T021 — API alumno v2 y transporte de lectura

Estado actual: **PASS local**, con cierre de GET/POST upgrade por T034 el 04/10/2026. El registro original de T021 fue **PARTIAL**: esas rutas protegían entrada y ownership pero devolvían 409 hasta implementar la adopción. Los resultados originales siguientes se conservan como evidencia histórica; el cierre nuevo está en [T034](../T034/README.md).

## Cambios

- Rutas alumno v2 con sesión existente, validación estricta, flags comprobados en servidor, allowlist y Cache-Control private, no-store. Los flags nuevos permanecen desactivados por defecto.
- Matrícula y estado fijados a la versión matriculada. Reanudación conserva el intento existente; disponibilidad, objetivos, gates y próxima acción se calculan en servidor.
- Selección de evaluaciones congelada antes de presentar preguntas, con hash, segmentos y novedad persistidos. Feedback permitido al confirmar todas las respuestas de cada segmento; ninguna solución futura en el manifiesto.
- Integración de práctica, evaluaciones, retención, heartbeat y confirmación explícita de feedback mediante servicios ya probados. Catálogo y home v2, más transporte mixto etiquetado por engineVersion que conserva la matrícula al deduplicar rutas.
- Proxies v2 de alumno y métricas editoriales reutilizan sesión y comprobación de origen existentes; v1 mantiene sus contratos y lectores estrictos.

## Evidencias

| Comprobación | Resultado | Archivo |
| --- | --- | --- |
| Regresión T021, rutas v1, métricas T020 e intentos T015 | 67 PASS, 12 SKIP | routes-regression-final.txt |
| T021 final, incluido código real del proxy y transporte mixto | 12 PASS | focused-final.txt |
| Typecheck API | PASS | api-typecheck-final.txt |
| Typecheck web | PASS | web-typecheck-final.txt |
| Lint API | PASS | api-lint-final.txt |
| Lint web de archivos modificados | PASS | web-lint-scoped-final.txt |
| Diff y hashes de fuentes | Consultar result.json | diff-check-final.txt, source-hashes.json |

Los logs iniciales se conservan para trazabilidad, sin confundir sus fallos corregidos con los resultados finales. Las dependencias T004, T015, T017, T018, T019 y T020 tienen evidencia PASS registrada en predecessors.json.

## Excepción de alcance necesaria

Se modificó también postgres-guided-learning-v2.ts: exportación de utilidades existentes, hook opcional para preparar el snapshot dentro de la misma transacción y persistencia de novelKeys. Esto permite fijar la selección bajo el bloqueo de actor/matrícula y reanudar sin volver a seleccionar. El comportamiento por defecto del servicio se conserva. No se cambiaron esquemas v1, Better Auth, migraciones ni contratos públicos sin versión.

## Límites de lo verificado

- Fastify inject y PGlite aislado; no despliegue, activación de flags ni migración externa. Las 12 pruebas PostgreSQL omitidas requieren su entorno dedicado; no se declara nueva validación de concurrencia PostgreSQL para T021.
- La prueba BFF ejecuta el código fuente real con adaptadores de Next, sesión y upstream simulados. No es una prueba de navegador ni de red desplegada.
- El transporte mixto es optativo para futuros consumidores; no se implementó UI alumno v2. El heartbeat es conservador respecto a interacciones confirmadas en servidor. La instrumentación de interacción y el emisor de confirmación de feedback en UI quedan para las tareas de interfaz.
- El pendiente original de GET/POST upgrade quedó resuelto por T034: DTO de preview y estado confirmado, CAS, recibo durable, bloqueo de intentos, historial y reset v1→v2 comprobados con Fastify/PGlite y navegador Next/BFF real. Ver `../T034/upgrade-final-tests.txt`, `dispatch-conversion-closure.txt` y `browser-upgrade.json`. La nueva prueba de navegador usa identidad sintética; no verifica emisión BetterAuth ni producción.
- No se ejecutó T022 ni la auditoría completa T040. Los límites de frecuencia/tamaño y la revisión profunda de autorización pertenecen a las tareas posteriores.

Se preservaron los cambios previos de T020 presentes en el checkout. No se creó commit. No se inició T022.

El cierre T034 no convierte las omisiones de PostgreSQL en PASS ni resuelve
la migración histórica 0005, el timeout heredado T024, backup T041 o Hito S.
Los hashes y logs originales de T021 conservan su significado histórico;
las fuentes actuales y el cierre se registran bajo T034.
