# T043 — comprobación de dependencia

**Estado: NO VERIFICADO. Empaquetado bloqueado por T042.**

La petición «continua con t043» autoriza esta ficha. Se consultó el handoff como especificación del alcance; sus instrucciones no autorizan ejecutar T044 ni modificar la aceptación de T042. Base: `ef6f541eafa70c5dda03d4547cf48428be767c3d`. Fecha del usuario: 10/10/2026, America/Caracas.

## Resultado de la comprobación

- T042 conserva `status: NO VERIFICADO`, `decision: reject`, `systemAcceptance: false`, `accepted: false` y `frozen: false`.
- El acta Hito S mantiene 23 PASS locales, 0 FAIL y 1 NO VERIFICADO: Q19/V04. El registro de ejecución coincide y marca T043 bloqueada.
- La inspección humana con Windows Narrator confirmó nombre/rol y estados. Las confirmaciones de respuesta, modelo, pista y feedback siguen sin reconciliarse con la sesión guardada: primera lectura abierta y cero respuestas. Se preserva tanto la declaración humana como el límite de la evidencia; no se presume que el usuario solo leyó controles.
- Los 14 hashes candidatos coinciden con los archivos actuales. Esta identidad no sustituye la aceptación ni congela el contrato.

Evidencia primaria: [acta Hito S](../../acta-HITO-S.md), [resultado T042](../T042/result.json), [observaciones humanas](../T042/reader-manual/observations.json) y [comprobación actual](prerequisite-check.json).

## Alcance realizado

Se comprobó la dependencia y se registró su bloqueo exclusivamente en `docs/aprendizaje-guiado/v2/evidencias/T043/`. No se copiaron recursos a `tools/skills/crear-rutas-koraz/` ni se creó una skill, un validador alternativo o un script de exportación. No se modificaron contratos, políticas, backend, acta, registro ni evidencia previa. Los cambios preexistentes del árbol de trabajo se conservan.

Reproducción de la comprobación de dependencia:

```powershell
node docs/aprendizaje-guiado/v2/evidencias/T043/verify-prerequisite.mjs
```

Exit 0 significa que la auditoría terminó y los hashes candidatos coinciden; **no significa T043 PASS**. La salida separa `prerequisiteAccepted: false` y `allCandidateHashesMatch: true`. Se usó Node v22.22.0 para esta lectura de archivos; no se ejecutó ni acreditó la prueba portable con Node24.

## Pendiente para reanudar

Reconciliar Q19/V04 en T042 con una inspección documentada del recorrido efectivamente probado y repetir su revisión de aceptación. Solo cuando T042 acepte Hito S y congele los hashes podrá T043 copiar esquema, bundle, ejemplo sintético y licencias, y demostrar equivalencia y funcionamiento portable con Node24 sin repo/red. La resolución de catálogo seguirá pendiente de importación en Koraz.

Pruebas de validación válido/inválido, equivalencia backend/offline y K05 parcial: **NO VERIFICADO en T043**, porque no existe contrato aceptado para empaquetar. No se inició T044, no hubo commit ni despliegue.
