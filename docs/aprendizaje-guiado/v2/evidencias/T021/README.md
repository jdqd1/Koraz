# T021 — API alumno v2 y transporte de lectura

Estado: **PARTIAL**. Implementación y comprobaciones ejecutadas: **PASS**. El criterio «todos los endpoints alumno de §8.10 responden DTO» queda pendiente para GET/POST upgrade: ambas rutas están registradas, validan entrada y propiedad de matrícula, pero devuelven 409 hasta el servicio de adopción explícita de T034. No se declara un PASS completo ocultando ese límite.

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
- GET/POST upgrade no producen aún sus DTO de éxito: devuelven conflicto para matrícula propia y ocultan matrículas ajenas. Adopción/reset/historial corresponden a T034. Este punto impide el PASS completo de aceptación T021 y debe revisarse al integrar ese servicio.
- No se ejecutó T022 ni la auditoría completa T040. Los límites de frecuencia/tamaño y la revisión profunda de autorización pertenecen a las tareas posteriores.

Se preservaron los cambios previos de T020 presentes en el checkout. No se creó commit. No se inició T022.
