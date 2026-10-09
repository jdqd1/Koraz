# T039 — PASS LOCAL

Propietario: «revisado y aprobado». Hash exacto `d9f35d39a769027998be0eeb17113e89f0e637af0b353c5bd1378ee77a59cf12`. Aprobación sobre expediente completo: 59/59 actividades CORE, 3/3 componentes de caso, 418 segmentos en alcance general, 3 referencias y 4 fragmentos. No es una auditoría independiente de los libros ni una identidad clínica profesional atribuida al revisor. C03 no aplica (0 assets).

La API registró in_review→approved→published con cuenta local delegada; reviewedContentHash coincide con la aprobación humana. Validación bound ready=true/0 issues. Exportación publicada idéntica al paquete aprobado. Base PGlite desechada al terminar; no publicación en producción.

Dos recorridos reales de rutas de alumno por HTTP loopback: principiante y error CORE/refuerzo. Matrícula, respuestas, feedback trazable, checkpoint/final, persistencia, replay idempotente y reinicio de aplicación/reanudación verificados. Retención7/30 con reloj controlado.

Evidencia principal: aprobacion-propietario.json en piloto; publication-receipt.json, approved-bound-validation.json, publication-check.json, learner-beginner.json, learner-reinforcement.json, published-server-transcript.json. La reproducción inicial permanece en publication-check-before-case-fix.json y published-server-transcript-before-case-fix.json.

- Guía fijada como snapshot local de fragmentos; revisión original de producción no expuesta
- Fuentes y exactitud aprobadas por declaración del propietario; no cotejo independiente de pasajes de libros
- Autenticación técnica de test; Better Auth real no verificado
- PGlite en memoria; PostgreSQL independiente no verificado
- Frontend/browser completo, Hito S, staging y producción fuera de esta evidencia

Se respeta la ficha y se conserva la baseline anterior. No se inicia T040.

Corrección mínima de selección de casos completados aplicada en apps/api/src/guided-learning/v2/routes.ts, autorizada expresamente por el propietario con «si». Registro y hashes antes/después: scope-authorization.json. El paquete aprobado conserva su hash.
