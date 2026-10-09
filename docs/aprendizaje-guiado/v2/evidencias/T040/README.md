# T040 — regresión funcional y compatibilidad

**Estado: PASS LOCAL de regresión técnica.** La reparación de los dos tests heredados fue autorizada expresamente por el usuario y verificada. No hay fallos pendientes en los resultados locales efectivos. La aceptación integral sigue sin acreditarse: V04 hablado no inspeccionado; M04-restauración corresponde a T041. T041 no se inició.

SHA base: `11737fd84562ee5a65e9ef124442b82f9aa16785`. SHA final: `327d8cc42f7bf22741b8d29cd68d03cf970235f2`. HEAD avanzó durante la ejecución inicial e incluyó trabajo intermedio; T040 no creó commits. No hubo despliegue. Los cambios anteriores se preservaron por hashes.

| Comprobación | Resultado efectivo |
|---|---|
| Contratos, build completo, typecheck, lint | PASS; lint/typecheck web repetidos tras la reparación |
| API, 60 archivos | 593 PASS, 0 FAIL, 3 omitidos |
| Web, 62 archivos | 483 PASS, 0 FAIL |
| E2E guided-v2, escritorio/móvil | 20 PASS, 0 FAIL, 6 omitidos |
| Legacy mapa/editor | 63 PASS, 0 FAIL, 1 omitido |
| Reparación focal de editor | 26 unitarios PASS y 4 casos navegador PASS |
| Editor 200 objetivos/1600 actividades | 2 PASS, 0 FAIL |
| L01/L02 | PASS; p95 estado 237.16 ms, respuesta 532.20 ms |

Los conteos efectivos reemplazan cada archivo Vitest o cada caso Playwright por su última ejecución; no suman repeticiones. El nuevo test agrega un único caso al total web anterior de 482. Las omisiones siguen explícitas y no cuentan como PASS. [Conteos completos](counts-and-omissions.json).

## Reparación autorizada

[Autorización](repair-authorization.json), [propuesta](REPARACION-LEGADO-PROPUESTA.md), [reporte unitario](web-editor-repair-final.json) y [reporte navegador](playwright-editor-repair-final.json).

- El fixture off-page ofrece primero el cuestionario elegible; la guía fijada continúa fuera de la primera página. Las assertions de paginación permanecen intactas.
- El caso heredado conserva objetivos, guía y propósito integrate, y exige ausencia visible de Video según la política vigente desde antes de T001.
- Un test nuevo modifica el título, pasa por modelo/serialización/guardar/leer y compara los cuatro objetos completos de opciones: guide, video, quiz y flashcards. Conserva configuraciones, identidades, objetivos y propósitos, y comprueba el avance exacto de editVersion. La política de videos del producto no cambia.

Los cuatro FAIL heredados originales permanecen en los reportes crudos y en [el cierre anterior](before-authorized-repair/README.md). La [comparación con T001](baseline-compatibility.json) describe el estado anterior a esta reparación. El primer intento del test nuevo falló por usar versión 1 en vez de 7; el primer arranque Playwright duplicó servidores por la fusión de configuración. Ambos intentos se conservan. La ejecución final usa Node 24.19.0, mismo timeout/retries y solo Next dev con transporte fixture en memoria.

## Evidencia conservada y límites

La pasada global inicial y sus repeticiones de API, E2E v2, mapa persistente, carga y editor grande siguen vigentes: no se cambió lógica del producto. API auth/roles/catálogo/contenidos/storage están incluidos. La carga real PostgreSQL/HTTP mantiene 20 usuarios, 300 s, pool20 y 4264 peticiones sin errores técnicos o de consistencia. Los 82 reportes axe no presentan serious/critical y las 72 geometrías no presentan overflow. Los detalles y límites están en [result.json](result.json), [accesibilidad](accessibility-summary.json), [manifiestos](manifest-summary.json) y [cierre inicial](before-authorized-repair/README.md).

El navegador legacy usa Fastify/PGlite; los dos casos reparados usan transporte en memoria. La evidencia de locks de PostgreSQL corresponde únicamente a las suites independientes identificadas. Los E2E v2 y la carga usan PostgreSQL desechable real. No se acredita salida hablada de lector de pantalla, emisión/firma real de Better Auth, dispositivos físicos, certificación WCAG integral, eficacia educativa, Hito S/T042, staging o producción. M04-restauración se ensaya en T041, sin anticiparla en T040.

[Preservación](preservation.json): 6668 archivos iniciales, 11 cambios autorizados, cero faltantes o añadidos fuera del dossier. Diez archivos de tests/harness y solo la entrada T040 del registro; ningún cambio de comportamiento de producción. [Registro](repair-registry-mutation.json) conserva las demás fichas. [Limpieza SQL inicial](database-cleanup-verification.json) conserva DB preexistentes; esta reparación no creó DB persistentes. [Servicios](services-final.json): puertos de prueba sin listeners. Lockfile y SQL anterior preservados.

La siguiente ficha es **T041**. `acceptanceComplete:false` se mantiene para distinguir este PASS LOCAL de la aceptación integral del sistema.
