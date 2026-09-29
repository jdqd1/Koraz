# T016 — evidencia, gates y estados separados

Implementación de `guided-v2.0` según §8.5 y P08–P10, tras comprobar T002,
T014 y el cierre PASS de T015. La política v1 no se modifica.

## Implementación

- `evidence.ts`: replay puro de hechos del servidor; deduplicación semántica,
  cooldown de 24 h desde la última respuesta/revelado, últimas cinco familias
  elegibles distintas, puntuación sin redondear y composición de dominio.
- `policy.ts`: parámetros reutilizados del snapshot aceptado; gates con media
  simple, faltantes a cero, CORE obligatorio y disponibilidad por prerrequisitos.
- Provider: reconstruye desde respuestas append-only, snapshots privados y
  eventos; actualiza la proyección de objetivos dentro de la misma transacción
  de respuesta/ayuda/completado. `readEvidence` permite reparar una proyección
  borrada o dañada; repetirlo sin cambio conserva la versión de esa proyección.
- Estados actuales de dominio/consolidación separados de fechas históricas.
  Se conserva el logro anterior al necesitar refuerzo. Completitud y dispensa
  tienen contadores distintos; final omitido puntúa cero para el objetivo.

La dispensa se reconstruye desde un evento del servidor `activity_completed`
con `pathVersionId`, `activityKey`, `state: "dispensed"` y `reason` no vacío.
T016 calcula esa completitud; la decisión adaptativa y creación de dispensas
corresponden a tareas posteriores. No se confía en un estado de actividad o
objetivo mutable para inventar evidencia histórica.

## Verificación

`focused-tests.txt` ejecuta la suite nueva de evidencia y la regresión de
persistencia de intentos. Las pruebas PostgreSQL opcionales de esa ejecución se
omiten sin URL; se ejecutaron por separado, con servidor y conexiones reales,
en `postgres-regression-tests.txt` (19/19, incluyendo 12 carreras).

Las pruebas nuevas verifican P08–P10, exclusión de ayuda/diagnóstico/self/preview,
igualdad de replay, límites temporales 24 h / 7 días / 30 días, recuperación de
dominio, gates CORE, ramas independientes, wrappers de casos, final y retención
persistidos, reparación de cache y rollback de respuesta/progreso/evento/receipt
y evidencia ante un fallo forzado de escritura de la proyección.

La primera ejecución detectó nombres incorrectos del payload de estudio en el
fixture. Se corrigieron conforme al contrato existente; el log original se
conserva. Se eliminó una comparación redundante detectada por TypeScript tras
aislar completamente preview. No se cambiaron contratos ni umbrales.

## Directriz de diseño adicional autorizada

La [directriz vigente](../../DISENO-RUTAS.md) exige integrar v2 en la interfaz
actual de alumno y administrador, conservando su esencia y permitiendo mejoras
graduales de compatibilidad, claridad y facilidad de uso. Se incorporó también
al plan maestro y handoff originales, con sus checksums actualizados, y se
referencia desde ADR-v2 y policy-spec. `design-directive.txt` registra la
verificación documental.

## Límites

No se montaron endpoints HTTP de alumno, ni se implementó scheduler, selección
adaptativa, recompensas o UI. T017 no se inició. No se ejecutó la suite global,
staging ni producción. El fixture aislado mantiene la omisión documentada de
0005; no acredita M01 ni el runner histórico de migraciones. El diseño se fijó
documentalmente; la verificación visual corresponde a futuras tareas de UI.
