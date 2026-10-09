# T038 — Ampliación autorizada: definiciones publicadas entre peticiones

**Autorizada por el usuario mediante «autorizo» el 2026-10-07 e implementada.**
La autorización anterior cubría «reutilizar datos dentro de una misma operación».
Esta ampliación, también autorizada, añade reutilización entre operaciones HTTP.
Las cifras del párrafo siguiente corresponden a la fase previa a esta caché.

La carga completa, con la misma fixture SHA-256 y 300 segundos, baja el p95 de
estado de 12540,79 a 1985,32 ms y el de respuesta de 30522,26 a 4889,25 ms. Conserva
cero errores técnicos y de consistencia, pero L02 sigue FAIL. Las trazas confirman
que ya se lee la definición una sola vez por operación. El perfil de lecturas
seriales muestra costes de JSON, esquemas, GC e índices; no cuantifica por sí solo
el beneficio de una caché ni atribuye todo el fallo a memoria/hardware.

## Cambio autorizado e implementado

- Guardar únicamente definiciones publicadas, validadas e inmutables y sus índices
  estructurales. Alcance por cliente de base de datos, separado de otras bases.
- Máximo de ocho versiones, presupuesto de 8 MiB de JSON codificado y TTL de
  60 segundos, con expulsión LRU. Estos límites son de la caché; no alteran los
  umbrales de aceptación ni las reglas del alumno.
- Leer metadatos de versión en cada operación; cotejar id, policy, estado,
  edit_version y updated_at. Una versión inexistente, no publicada o diferente
  no usa la entrada. Conservar la protección de inmutabilidad de PostgreSQL.
- Mantener frescas matrícula, bindings, accesibilidad del catálogo, respuestas,
  eventos, evidencias, agenda, permisos, reloj y recibos. Mantener todos los locks.
- Reutilizar índices de actividades/objetivos y orden del grafo únicamente para
  el objeto de definición inmutable. Recalcular toda entrada que dependa del alumno.

Archivos autorizados: `apps/api/src/providers/postgres-guided-learning-v2.ts`,
`apps/api/src/guided-learning/v2/routes.ts`,
`apps/api/src/guided-learning/v2/selection.ts` y sus pruebas existentes autorizadas
de evidencia, selección y rutas; script de rendimiento y evidencias T038.

Se añaden pruebas de aislamiento entre bases/versiones, expulsión/TTL,
revocación pese a caché caliente, borrado de versión y equivalencia de salidas.
Se repiten regresiones y la carga exacta de cinco minutos. Si el entorno sigue
limitando una aceptación demostrable, se conservaría FAIL/NO VERIFICADO y se
mediría en un host de prueba comparable; no se cambiaría el umbral ni se iniciaría T039.

