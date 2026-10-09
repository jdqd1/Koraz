# T040 — propuesta para las cuatro incompatibilidades heredadas

Estado: preparada, NO aplicada. SHA: `11737fd84562ee5a65e9ef124442b82f9aa16785`.

Los dos casos de `route-editor.spec.ts` fallan en escritorio y móvil. El código relevante, los dos tests y la primera página del fixture coinciden con T001, normalizando CRLF/LF (`baseline-compatibility.json`). El commit `1f9f434` del 25-09-2026 estableció que los videos no se ofrecen ni muestran como alternativas en este editor.

La ficha T040 prohíbe «cambiar criterio de PASS». El segundo cambio siguiente modifica una expectativa explícita, por lo que necesita autorización del propietario para reconciliarla con la política ya existente.

Cambios propuestos, limitados a fixtures y tests:

1. En `editor-fixtures.ts`, la primera página `off-page` contiene el cuestionario elegible (`editorFixtureResources[1]`) en lugar del recurso exclusivamente de video (`[2]`). La guía fijada sigue fuera de esa página. El test de paginación y sus assertions quedan intactos.
2. En el test heredado, conservar objetivos, guía y uso `integrate`; exigir ausencia de la alternativa Video, conforme a la política existente. Añadir una comprobación de guardar/leer en `editor-fixtures.test.ts` que demuestre que se conservan exactamente `guide`, `video`, `quiz`, `flashcards`, sus configuraciones e identidades. Ocultar video no debe borrar sus datos.

Verificación prevista: ambos casos de navegador en escritorio y móvil, suite unitaria del fixture/modelo/serialización, lint/typecheck web. Sin modificación del comportamiento del producto, contratos, migraciones ni política de videos. Sin T041.

Hasta recibir autorización, los cuatro fallos permanecen FAIL y no se suman a los PASS.
