# T022 — Autorización y privacidad v2

**Estado: PASS.** Cierre documentado el 30/09/2026 (America/Caracas). Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`. Las pruebas conservan sus fechas reales en los logs.

## Resultado

La matriz S01–S08 está en PASS para los endpoints y superficies actuales de T022. Se cerraron los bloqueos de permisos del runtime, el montaje editorial y la inspección de privacidad. T023 queda como siguiente tarea y **no se inició**.

| Verificación | Resultado | Evidencia |
| --- | --- | --- |
| Seguridad en PostgreSQL real con runtime restringido | 26 PASS; el caso de navegador se ejecuta aparte | postgres-acceptance.txt |
| Chromium, Next de producción, SSR/DOM y BFF autenticado | 1 PASS; otros 26 casos no seleccionados | browser-acceptance.txt |
| Regresión API v2/v1 | 21 archivos, 297 PASS, 29 SKIP | regression-completion.txt |
| Importación/exportación después del último control de acceso | 18/18 PASS, ejecución serial | export-access-verified.txt |
| Typecheck / lint API | PASS | typecheck-acceptance.txt / lint-acceptance.txt |
| Build web de producción con secretos ficticios de prueba | PASS | web-build-canary.txt |
| Archivos reales emitidos para navegador | 59 archivos, 2 secretos ficticios comprobados, cero coincidencias | bundle-completion.json |
| Integridad de migraciones históricas / diff | 33 intactas / PASS | migration-integrity-acceptance.json / diff-check-acceptance.txt |

Los dos comandos de seguridad ejecutan, entre ambos, los **27 casos de T022**; no se presentan los casos omitidos por cada comando como aprobados en ese comando. Los otros casos PostgreSQL de la regresión requieren sus propios harness y mantienen SKIP.

## Implementación cerrada

- Crear, consultar y editar borradores ahora tienen rutas HTTP registradas en `app.ts`, capacidades resueltas en servidor, propiedad, cuerpos estrictos, CAS e idempotencia transaccional. La edición y exportación comprueban el acceso actual a los recursos vinculados.
- Preview requiere editor autorizado y propietario/capacidad global de edición. Devuelve una proyección pública del elemento inicial y problemas de validación; no entrega soluciones ni reservas. Su límite es durable: 30 solicitudes distintas por actor en 10 minutos, con reenvío idéntico tolerado. No crea matrículas, intentos, respuestas, eventos ni recompensas.
- Las once entradas editoriales están registradas y protegidas; el flag apagado rechaza el acceso. La entrada de conversión comprueba propiedad y CAS y devuelve 409 mientras T034 implementa su funcionalidad. No crea un falso borrador convertido.
- `reveal` requiere respuesta aceptada o texto construido persistido; se conserva `accepted: false` en la etapa formativa construida. Respuestas: 120 peticiones distintas/minuto con reserva durable e idempotencia.
- Rechazos con `private, no-store`, errores genéricos sin detalles de provider y origen inválido normalizado a 403 dentro de v2; política de origen v1 preservada.
- `0033_guided_v2_runtime_access.sql` proporciona funciones limitadas de bloqueo de actor y catálogo, SECURITY DEFINER con relaciones cualificadas y búsqueda fija. PUBLIC no puede ejecutarlas. Runtime no recibe escrituras de identidad/catalogo ni lectura de credenciales/storage_path.
- `0034_guided_v2_editor_audit.sql` proporciona una vista privada, filtrada a acciones editoriales v2, con CHECK OPTION. Runtime tiene SELECT e INSERT limitado en esa vista; no accede directamente a la auditoría general, no puede borrar ni insertar acciones ajenas. Anon/authenticated no leen la vista. Se preserva la tabla histórica.

Se conservaron los cambios previos T020/T021 en aplicación, configuración, métricas, provider y transporte web. `source-hashes.json` identifica el estado final de los archivos; la lista no atribuye a T022 todos los cambios anteriores de esos archivos.

## Inspección de navegador y bundle

El harness inicia el **Next de producción real** con un adaptador local de identidad sintética y la API/PGlite de pruebas. Chromium obtiene respuestas autenticadas del BFF de intento, ruta, catálogo y home antes de responder: 200 y `private, no-store`, sin soluciones, rúbricas privadas, snapshots o reservas. `browser-network-completion.json` conserva esas respuestas sintéticas.

La ruta SSR actual utiliza el renderer v1: una identidad de intento v2 se rechaza con 404. Se inspeccionaron HTML, RSC y DOM, sin datos privados; `browser-ssr.html`, `browser-dom.html` y `browser-ssr.png` conservan la evidencia. Esto certifica esa frontera existente, **no implementa ni valida el futuro renderer v2** de T028–T033.

El build se repitió con dos valores privados ficticios en BETTER_AUTH_SECRET y DATABASE_URL. Se escanearon los 59 archivos JS/map reales de `.next/static` para esos valores y marcadores del provider/SQL/soluciones: cero coincidencias. Los nombres genéricos de campos de contratos no se confunden con respuestas secretas. El script reproducible es `scan-client-bundle.cjs`; no imprime valores privados.

## Alcance y dependencias

T012 tiene PASS. T021 tiene implementationChecks PASS, permite continuar T022 y remite el éxito funcional de upgrade/adopción a T034. Sus guardias de seguridad están verificadas; su estado PARTIAL no fue cambiado. La conversión/adopción y el renderer futuro permanecen en sus tareas; no son hallazgos abiertos de autorización de los endpoints actuales.

Las bases usadas fueron locales y desechables. Los clusters PostgreSQL quedaron detenidos. La cadena del fixture excluye 0005 por su requisito histórico: no acredita M01 ni permisos/producto desplegado. No se aplicaron migraciones productivas, no se activaron flags, no se desplegó ni se creó commit.

## Historial preservado

`result-before-runtime-repair.json` conserva el FAIL original de permisos y `result-before-completion.json` el NO VERIFICADO posterior. `result.json` separa comprobaciones actuales e históricas.

- El fallo original auth_users 42501 está corregido por 0033.
- La ambigüedad SQL intermedia del bloqueo de fuente quedó corregida y sus fallos se conservan.
- El fallo editorial audit_log 42501 quedó corregido por 0034; `postgres-completion.txt` conserva la reproducción.
- La primera inspección de navegador esperaba un mensaje de recuperación; el renderer v1 realmente produce un 404. La prueba final verifica ese resultado, HTML/DOM y ausencia de datos privados, y captura el BFF v2 positivo.
- La regresión ampliada anterior tuvo 15 fallos de importación con la versión SQL anterior. La regresión nueva pasó íntegra en sus 21 archivos.
- La última importación concurrente con el build tuvo un timeout de 5000 ms; la repetición serial obtuvo 18/18. Se conservan ambos logs y no se relajó el timeout.
