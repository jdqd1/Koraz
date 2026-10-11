# T041 — recuperación y rollout reversible

**PASS LOCAL**, 09/10/2026 (America/Caracas). M04 íntegro en el simulacro aislado. SHA base: `ef6f541eafa70c5dda03d4547cf48428be767c3d`; SHA final: `ef6f541eafa70c5dda03d4547cf48428be767c3d`. T042 no se inició.

## Resultado

Backup custom con datos sintéticos v1/v2; restauración en una DB PostgreSQL distinta. Coinciden conteos y SHA-256 de las **67 tablas** de public/private, DDL/grants y secuencias antes de repetir migraciones. Se restauran 9 usuarios, 5 matrículas con 5 registros de historial, 4 intentos v1, 7 intentos v2, 10 respuestas v1, 5 respuestas v2, 10 estados de repaso v1 y 1 agenda v2; además fuentes, bindings, eventos y recompensas.

La migración real 0035 se aplica sobre datos existentes y después del restore. El runner rechaza una migración sintética con división por cero y revierte su DDL/DML/ledger. Un incidente confirmado en el fixture altera nombre y agenda; los hashes detectan ambos cambios y el backup restaura los valores anteriores. El ledger se verifica por nombre/checksum; timestamps de aplicaciones independientes difieren de forma esperada.

| Verificación | Resultado |
|---|---|
| API/DB y flags reales | 10 comprobaciones PASS |
| Navegador Next → BFF → Fastify → PostgreSQL | 6 PASS, 0 FAIL, 0 omitidas; escritorio y móvil |
| Mantenimiento v2 | Ruta avisa mantenimiento; consultas privadas y mutaciones bloqueadas no cambian ninguna tabla |
| v1 con v2 apagada | Ruta/sesión restauradas; lectura completada desde UI y conservada al recargar |
| Rehabilitación v2 | Sesión abierta restaurada, respuesta/cierre desde UI y persistencia tras recarga |
| Admisión y allowlist | Nuevas matrículas bloqueadas sin impedir matrículas existentes; v1 continúa |
| Limpieza | Solo DB propias eliminadas; inventario previo preservado; cluster propio detenido |
| Preservación | Cero cambios de código de producto o migraciones; solo entradas T034/T041 del registro |

Backup: 364416 bytes, SHA-256 `072701bec3d16733cff85da55b804836f8e99d65919698f7472aad32546c8961`. Tiempos observados: backup 0.403 s; comando de restauración 0.910 s. No son objetivos de producción ni tiempo total de recuperación.

## Entregables

[Runbook](../../runbook.md), [resultado](result.json), [restore](restore.json), [conteos/hashes originales](before-backup.json), [conteos/hashes restaurados](restored-before-migrations.json), [API/DB](api-result.json), [navegador](playwright.json), [limpieza DB](database-cleanup.json), [cluster](cluster-cleanup.json), [preservación](preservation.json). Scripts reproducibles en `work/test/t041/`.

La [reconciliación](registry-reconciliation.json) refleja el PASS/local ya existente de T034; no reescribe su evidencia histórica ni declara cerrados otros hitos. T040 queda intacta. [Autorización](authorization.json).

## Intentos iniciales y límites

Se conservan todos los fallos de preparación: esquema inicial sin la vista de 0034 requerida por el editor actual; propósito v1 incorrecto; preguntas sin identidades estables; cierre redundante de quiz v1 que ya se completa al responder; assertion de disponibilidad aplicada a un DTO de intento que no contiene ese campo. Son ajustes al fixture/harness, sin alterar reglas del producto. El reintento intermedio tras cambiar itemId aún falló por la identidad faltante y también se conserva.

La primera pasada de navegador con Next dev agotó 120 s al recargar la ruta y se interrumpió tras limpiar sus DB; [log](browser-initial.txt) y `initial-browser-run/` conservan la traza. La pasada final usa el build existente, el mismo timeout y cero retries; no suma repeticiones a los seis PASS. Next start emite un aviso por output standalone; el servidor y los seis recorridos funcionaron.

- Local disposable PostgreSQL; synthetic identity, no real Better Auth session issuance/signature.
- SQL references and synthetic local media only; no backup/restore of external storage objects.
- No production/staging deployment or measured production RPO/RTO.
- T040 spoken screen-reader inspection remains outside T041; Hito S/T042 is not accepted.

No hubo commit ni despliegue. Siguiente ficha: **T042**, sin iniciar.

## Ajustes finales del harness

La primera pasada con build tuvo 3 PASS y 3 FAIL, conservados en `built-browser-initial/`: la lectura study pasa directamente al cierre, y el streaming mantuvo temporalmente un DOM oculto que colisionó con el locator. Se corrigieron las expectativas para comprobar el flujo y la superficie visibles; no cambiaron producto, timeout ni retries. La limpieza final espera el receipt de las DB de esa ejecución antes de terminar el servidor. Typecheck estricto del harness PASS tras explicitar LearningAttempt; el primer diagnóstico también se conserva. La pasada final de seis casos es la única contada como resultado efectivo.
