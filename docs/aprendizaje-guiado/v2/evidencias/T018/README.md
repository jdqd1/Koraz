# T018 — PASS

Base: `c6dfa69466ee9cb61cf28d8b78177f6e7dd7ca84`. Dependencias T008 y T016 comprobadas en sus `result.json`.

`scheduleReviewV2` calcula la agenda desde respuestas aceptadas por el servidor, con reloj UTC, intervalos `[1,3,7,14,30]`, ampliación máxima una vez cada 24 horas y refuerzo 10 min / 10 min / 1 día. Cada objetivo tiene una sola fila por usuario y versión de ruta. Diagnóstico, lectura y preview no crean deuda. Ayuda, respuestas parciales y autorreportes hard/good no aumentan estabilidad; again programa refuerzo. La corrección parcial se obtiene del feedback privado del evaluador sin cambiar la evidencia binaria de dominio.

La agenda se reconstruye con las respuestas y snapshots persistidos dentro de la misma transacción bloqueada que confirma la respuesta. Reenvíos no duplican efectos ni alteran versiones de cache estables. La sesión corresponde al intento persistido; sus respuestas permiten contar los reintentos. Los hitos nacen del primer dominio, conservan sus fechas históricas y separan medición aceptada de éxito/consolidación. Una primera medición tardía retrasa la segunda hasta al menos siete días después. `reviewDueV2` calcula atraso y prioridad de retención sin convertir ausencia en fallo.

## Validación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Scheduler puro | 17/17 PASS | scheduler-acceptance.txt |
| Persistencia PGlite | 6/6 PASS | scheduler-acceptance.txt |
| PostgreSQL independiente | 8/8 PASS | scheduler-acceptance.txt |
| Dominio, intentos y selección | 64/64 PASS | regression-final.txt |
| Regresión PostgreSQL T015 | 19/19 PASS | postgres-attempts-regression.txt |
| Contratos, typecheck, lint, diff | PASS | logs correspondientes; result.json |

Las dos pruebas concurrentes se omiten solamente en PGlite y se ejecutan en PostgreSQL. El harness confirma dos PID distintos esperando un bloqueo antes de liberar las mutaciones: comprueba ampliación única en el límite exacto de 24 h y prioridad del fallo frente al acierto. Una excepción forzada al escribir agenda comprueba rollback de respuesta, evento, recibo, progreso, cache y versión de intento.

Reproducción desde la raíz, con PostgreSQL portátil ya disponible:

```powershell
& docs/aprendizaje-guiado/v2/evidencias/T018/run-postgres-concurrency.ps1 `
  -PostgresBin 'C:\Users\josed\.codex\tmp\koraz-t015-postgres\pgsql\bin'
```

El harness crea una base nueva en `127.0.0.1:55418/koraz_t018_test`, exige marcador de test, rechaza tablas existentes y detiene el servidor al terminar. No usa `DATABASE_URL`. Los directorios temporales se conservan detenidos para inspección.

## Alcance y límites

Además de los tres archivos de la ficha, se añadió una línea de limpieza al fixture de `guided-v2-attempts.test.ts`: elimina la agenda antes de eliminar las respuestas referenciadas. Es un ajuste necesario de la regresión, conserva todas sus assertions y no cambia la política ni las FK. Los errores iniciales de fixtures y sus reparaciones quedan registrados en los logs anteriores.

No se modificaron migraciones ni el scheduler v1. No se desplegó ni se verificó UI, staging o producción. La cadena aislada omite la migración histórica 0005 como los fixtures anteriores; no acredita M01 ni el runner de checksums. No se ejecutó la suite global reservada para T040.

Un archivo ajeno de layout del mapa apareció durante la ejecución y se conservó intacto. T019 no se inició. El resultado estructurado, comandos, límites y hashes están en `result.json`.
