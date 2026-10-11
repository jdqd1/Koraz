# T042 — reparaciones autorizadas y nueva revisión

**NO VERIFICADO: 23 PASS / 0 FAIL / 1 NO VERIFICADO (Q19).** Hito S pendiente de lector real; no se inició T043.

Bundle corregido sin cambiar reglas; equivalencia backend/CLI/bundle (23 tests). Expiración real Better Auth por API (1) y BFF Next (1). Móvil E01–E07 (7) y escritorio E02/E07 (2), cero omisiones en estas ejecuciones. Tipos API/web y ESLint focalizado exit 0. PostgreSQL 55435 desechable limpiado; bases anteriores preservadas y puertos cerrados.

Resultados: [result.json](result.json), [acta actual](../../acta-HITO-S.md), [autorización](repair-authorization.json), [preservación](preservation.json), [hashes candidatos](candidate-hashes.json).

Lector: [estado preciso](reader-status.json), [procedimiento manual preparado](reader-manual.md). Narrator se inició pero no se observó voz del producto: Computer Use bloqueó la inspección por incertidumbre sobre URL. No hubo reintento mediante otra automatización. Si el lector sigue abierto, cerrar manualmente con Narrator+Esc.

Fallos iniciales conservados: [móvil](mobile-initial.json), [BFF](auth-bff-initial.json), [arranque](cluster-initial-attempt.json); revisión anterior en acta-before-repair.md y registry-before-repair.json. Los fallos de sincronización y formato fueron corregidos en los tests; sin ampliar timeouts ni relajar aserciones.

Reproducción en raíz con PATH Node24, KORAZ_TEST_DATABASE=true y KORAZ_GUIDED_V2_TEST_DATABASE_URL=postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test. Iniciar cluster.mjs start, ejecutar serialmente los tres configs work/test/t042/playwright.{mobile,desktop,auth}.config.mts con pnpm --filter @cediah/web exec playwright test --config ../../work/test/t042/<config>. Para auth establecer T042_AUTH_RUN=true; quitarla para móvil/escritorio. Finalizar con cluster.mjs stop. No usar .env productivo. Los logs .txt conservan la salida exacta; los JSON conservan resultados y adjuntos.

Entorno manual de lector: preparado y comprobado sintácticamente, **no ejecutado**. Una inspección humana debe guardar observaciones reales; después se reevalúa T042. Los PASS locales no acreditan producción ni validación clínica.

## Inspección humana posterior (2026-10-10)

El script manual sí se ejecutó. [Observaciones](reader-manual/observations.md): nombre/rol y estados confirmados por el usuario; posteriores confirmaciones no se corroboran con el [recorrido persistido](reader-manual/persisted-manual-journey.json), que conserva solo study-1 abierto y cero respuestas. Q19 sigue NO VERIFICADO; no se congela contrato ni se inicia T043.

[Limpieza recuperada](reader-manual/cluster-cleanup.json): baseline intacto, base temporal eliminada tras atribución, PostgreSQL detenido. La invocación inicial de pnpm.cmd no estaba en PATH; usar la ruta completa del procedimiento actualizado. Los registros anteriores y las pruebas automáticas se conservan.
