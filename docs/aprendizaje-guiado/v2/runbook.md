# Operación y recuperación de guided-v2

Estado: simulacro T041 local; consultar [evidencias/T041/result.json](evidencias/T041/result.json) para el resultado final y las mediciones. Este documento prepara una operación futura; no registra un despliegue ni habilita producción. Fecha de cierre: 09/10/2026, America/Caracas.

## Condiciones previas

Identificar la revisión de API/web, las migraciones pendientes y los checksums de `public.cediah_schema_migrations`. Conservar los dos archivos `0017_*`. La cadena activa es `database/migrations`; no usar la cadena histórica `supabase/migrations`. No editar una migración aplicada.

Comprobar el modo del catálogo histórico: `DATABASE_LEGACY_CONTENT_MODE=empty` solo corresponde a una instalación nueva sin catálogo heredado y cuya exclusión de `0005_restore_legacy_content.sql` esté registrada. No seleccionar `empty` para omitir un error en una DB existente. El simulacro utiliza ese modo explícito para sus datos sintéticos.

Mantener disponible un backend compatible con `guided-v1` y `guided-v2.0`, incluidas matrículas fijadas a versión. Un binario que interpreta toda versión como v1 no es un rollback aceptable. Fijar requisitos de ventana de mantenimiento, retención, RPO y RTO con el propietario antes de operar un entorno real. Los tiempos de este ensayo no son un SLA.

## Flags y comportamiento

| Variable de API | Uso |
|---|---|
| `GUIDED_LEARNING_ENABLED=true` | Conserva rutas y sesiones v1. Mantenerlo durante el mantenimiento de v2. |
| `GUIDED_LEARNING_V2_ENABLED=false` | Mantenimiento de v2: consultas privadas de matrículas existentes; mutaciones v2 devuelven 503 `guided_v2_maintenance`. Conserva datos, versiones e historial. |
| `GUIDED_LEARNING_V2_NEW_ENROLLMENTS=false` | Congela nuevas matrículas v2 con 403 `new_enrollments_disabled`; mantiene acceso a matrículas existentes cuando v2 está activa. |
| `GUIDED_LEARNING_V2_ALLOWLIST=<UUIDs separados por comas>` | Restringe v2 a actores de prueba autorizados. No restringe v1. Vacía significa sin restricción adicional, no denegación total. |

La API lee estas variables al arrancar: aplicar los cambios mediante reinicio controlado de instancias y verificar todas ellas. El simulacro reinicia la API usando `readEnvironment` y `buildApp` reales; no sustituye el comportamiento con mocks. Mantener los flags de mapa y restantes funciones según el entorno; no desactivar globalmente aprendizaje como sustituto del interruptor v2.

## Orden de habilitación reversible

1. Guardar inventario de versión, conteos, hashes y ledger/exclusiones de migraciones. Preparar un backup PostgreSQL custom y verificar su SHA-256; ensayar restauración en otra DB. Los archivos de storage requieren un inventario/backup independiente: el dump SQL conserva sus referencias, no los objetos del bucket.
2. **Migración:** con admisión v2 cerrada y v2 en mantenimiento, aplicar los archivos pendientes con el migrador existente, en orden, por conexión administrativa que soporte advisory locks de sesión. No usar un pool transaccional para ejecutar el runner con locks de sesión. Comparar checksums y comprobar permisos/grants. No ejecutar automáticamente contra el `.env` habitual.
3. **Backend compatible:** desplegar una API capaz de leer ambas versiones, con aprendizaje general habilitado, v2 apagada y nuevas matrículas v2 deshabilitadas. Comprobar health, v1 y datos v2 conservados.
4. **Web:** desplegar la web compatible con el dispatch de ambos motores y el modo de mantenimiento. Comprobar ruta y sesión v1; historial y aviso de mantenimiento v2; no aceptar un fallback a v1 ante 401/403/503.
5. **Allowlist:** fijar una lista no vacía de cuentas de prueba, activar v2 y mantener admisión cerrada. Probar lectura/reanudación de una matrícula existente; actor excluido recibe 403; v1 continúa. Si no hay matrículas de prueba, habilitar admisión solo dentro de esa allowlist y volver a cerrarla al terminar la comprobación.
6. **Admisión:** después de aceptar los resultados, ampliar explícitamente la allowlist o dejarla vacía para acceso general y habilitar nuevas matrículas. Verificar matrícula, respuesta, receipt, recarga, agenda y ausencia de duplicados. Registrar actor, revisión y momento del cambio.

Ante un fallo en cualquier paso, detener su expansión y aplicar el procedimiento de incidente. Este orden es un procedimiento preparado, no evidencia de despliegues cloud realizados.

## Incidente y rollback

1. Registrar síntoma, SHA, hora y alcance sin cookies/tokens/respuestas privadas en logs. Conservar el diff y los logs del incidente.
2. Cerrar `GUIDED_LEARNING_V2_NEW_ENROLLMENTS`. Si el fallo afecta escrituras o ejecución, poner `GUIDED_LEARNING_V2_ENABLED=false` y reiniciar las instancias. Mantener `GUIDED_LEARNING_ENABLED=true` para v1.
3. Verificar por HTTP: nuevas matrículas y writes v2 bloqueadas; consultas privadas v2 conservan versión/historial; v1 sigue abriendo sesiones y guardando progreso. Comparar hashes para demostrar que el mantenimiento no escribe progreso, agenda, eventos ni recompensas v2.
4. Si falla una migración no aplicada, su transacción debe revertir DDL, DML y ledger. Inspeccionar estado/checksums antes de corregir. Si el archivo ya fue aplicado, reparar mediante una migración nueva.
5. Preferir fix forward. Si hace falta revertir aplicación, usar únicamente la última revisión compatible con ambos motores y el esquema vigente; probarla en un clon primero. No ejecutar down migrations destructivas, borrar tablas o cambiar matrículas para ocultar el fallo.
6. Restaurar el backup en una **DB distinta**, conservando la DB del incidente para diagnóstico. Verificar integridad y sesiones antes de proponer un cambio de conexión. Un cambio real de tráfico requiere reconciliar escrituras posteriores al backup y aprobar su ventana/pérdida de datos; este ensayo no autoriza ese cambio.
7. Repetir la habilitación por backend compatible, web, allowlist y admisión. Registrar estado y resultados del incidente; no declarar recuperación por un `exit 0` aislado.

## Simulacro reproducible T041

Usar Node 24 y el pnpm existente. No requiere descargar dependencias. Los scripts no cargan `.env`. Solo aceptan PostgreSQL marcado como desechable, `koraz_test`, loopback `127.0.0.1:55435` y DB de control `koraz_guided_v2_control_test`; cada DB creada lleva nombre aleatorio `koraz_guided_v2_test_<32 hex>`.

Desde la raíz, en PowerShell:

```powershell
$env:KORAZ_TEST_DATABASE = 'true'
node work/test/t041/cluster.mjs start
pnpm.cmd --filter @cediah/web exec playwright test --config ../../work/test/t041/playwright.config.mts
node work/test/t041/cluster.mjs stop
git diff --check
```

Para comprobar solo API/DB, después de `start`, ejecutar `pnpm.cmd --filter @cediah/api exec tsx ../../work/test/t041/recovery.mts` y después `stop`. No ejecutar simultáneamente ambos modos. La variante Playwright arranca además Next en 31041, API en 41041 y control de test en 41042. El endpoint de control solo existe en el script de pruebas y no forma parte del servidor de producto.

Antes de repetir, conservar el dossier anterior fuera de su ruta de salida para mantener la evidencia histórica. `cluster.mjs start` registra el baseline y propiedad del arranque para esa ejecución. `stop` compara el inventario de DB previo y posterior y solo detiene el cluster si lo arrancó T041. No borra su directorio de datos ni DB preexistentes. Si se interrumpe abruptamente el proceso, inspeccionar `owned-databases.json` y conexiones antes de cualquier limpieza; no usar comodines para borrar bases.

## Qué demuestra el ensayo

- Instalación hasta 0034 y datos sintéticos v1/v2 creados con proveedores/API reales: usuarios, matrículas, versiones, historial, intentos terminados/abiertos, respuestas, agenda, fuentes, bindings y recompensas.
- Backup custom, aplicación real de `0035_guided_v2_media_access.sql` con datos existentes, y replay tras restauración. 0034 ya está instalada al preparar el fixture porque el editor actual requiere su vista de auditoría.
- Una migración sintética en un directorio temporal crea DDL y modifica usuarios antes de provocar división por cero. El runner real revierte todo y no registra el archivo fallido.
- Un incidente confirmado en la DB sintética altera nombre y fecha de repaso; los hashes lo detectan. El backup anterior restaura los valores originales en una segunda DB.
- Comparación de **todas** las tablas de `public` y `private`: conteo y SHA-256 de filas JSONB ordenadas; además DDL/grants y secuencias. Solo se normalizan los nonces aleatorios de `pg_dump` al comparar DDL. El ledger posterior a migración tiene timestamps distintos entre bases y se compara por nombre/checksum, conservando intacto el resto de los datos.
- HTTP real de los flags: mantenimiento, admisión y allowlist. UI/Next/BFF/API/PostgreSQL para restauración y continuidad; consultar el reporte de navegador para los casos efectivamente aprobados.

## Evidencia y límites

Consultar [backup](evidencias/T041/backup.json), [restauración y tiempos](evidencias/T041/restore.json), [checks de API/DB](evidencias/T041/checks.json), [Playwright](evidencias/T041/playwright.json) y [limpieza](evidencias/T041/cluster-cleanup.json). El resultado consolidado y los fallos de preparación conservados se describen en [README T041](evidencias/T041/README.md).

Identidad sintética; no se comprueba emisión/firma de sesiones Better Auth. No se restauran objetos remotos de storage, ni se prueba un proveedor cloud, failover multirregión, producción, eficacia educativa o aceptación Hito S/T042. La salida hablada de lector de pantalla pendiente en T040 sigue fuera de T041. El backup del dossier contiene solo fixtures sintéticos.
