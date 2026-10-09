# T038 — Ampliación autorizada

Autorizada por el usuario mediante «autorizo» el 2026-10-07. Esta continuación implementa el alcance concreto propuesto abajo; los informes anteriores se conservan como initial-README.md e initial-result.json.

La ejecución de 20 usuarios durante 300 segundos sobre la ruta de 30 unidades,
200 objetivos y 1600 actividades produce 496 solicitudes, cero errores técnicos
y cero inconsistencias. El p95 de lectura es 12540.79 ms y el de respuesta
30522.26 ms; L02 exige menos de 500 y 1000 ms respectivamente. No se eliminaron
outliers. Hay 57.24 segundos adicionales de drenaje de operaciones ya iniciadas.

El perfil CPU (`baseline.cpuprofile`) identifica conversión de filas JSON,
reconstrucción de evidencia y selección entre los costes de las lecturas. Una
lectura serial de estado en cinco corridas tuvo mediana 639.11 ms. No basta
con el índice de una tabla para atribuir o resolver todo el coste observado.
La memoria libre observada fue aproximadamente 1 GiB sobre 8 GiB físicos;
no se ha demostrado que todo el fallo sea del equipo.

La ficha permite queries del proveedor y carga de formularios. Ya se agruparon
las escrituras de objetivos y se cargan campos de una actividad a la vez. Las
reglas de score, selección, agenda, acceso y contratos no se han modificado.

Se propone autorización concreta para optimizar índices de búsqueda en memoria
y reutilizar datos dentro de una misma operación en:

- `apps/api/src/guided-learning/v2/evidence.ts`
- `apps/api/src/guided-learning/v2/selection.ts`
- `apps/api/src/guided-learning/v2/routes.ts`
- Sus pruebas de evidencia, selección y rutas ya existentes en `apps/api/test/`.

Se conservarían las reglas y salidas deterministas, el reloj del servidor,
las comprobaciones actuales de acceso y los recibos idempotentes. No se propone
reducir el tamaño de la fixture, los usuarios, la duración ni los umbrales.
Después se repetirían los módulos afectados y los cinco minutos completos.

Esta ampliación no resuelve por sí sola el rechazo automático del arranque de
Next. La UI completa con BFF sigue NO VERIFICADO; la prueba aislada del componente
real con persistencia HTTP/PostgreSQL sí está ejecutada y documentada.

## Implementación autorizada

- Evidencia: índices de objetivos, explicaciones, umbrales y casos; cada hecho
  recalcula únicamente el objetivo que modifica. El replay mantiene el orden,
  la deduplicación, los timestamps históricos y las reglas anteriores.
- Selección: índices locales de actividades, respuestas, objetivos y unidades;
  el diagnóstico reutiliza el orden editorial y el grafo de esa operación.
- Contexto y proveedor: una definición privada por operación HTTP. Las mutaciones
  vuelven a leer los hechos; matrícula, bindings, estados de catálogo y bloqueos
  se comprueban en cada transacción. La inmutabilidad de versiones publicadas está
  protegida por la migración histórica 0017, que no se modificó.
- La agenda anota `reviewDue` sobre el mismo resultado del replay, evitando una
  segunda reconstrucción idéntica. No se reutiliza estado de alumno entre peticiones.
- Dos regresiones nuevas verifican timestamps de objetivos no afectados y
  revocación entre la lectura y la mutación, incluso con definición reutilizada.

`authorization.json` registra el permiso; `reference-integrity.json` y
`differential.json` documentan 72 comparaciones exactas con el código anterior.
Las trazas `authorized-operation-sql-operation-*.json` confirman una lectura de
definición por creación, respuesta y finalización. El resultado de aceptación
vigente está en `result.json`; los informes previos se conservan en
`initial-README.md` e `initial-result.json`.
