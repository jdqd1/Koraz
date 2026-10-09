# T040 — regresión funcional y compatibilidad

**Estado: PARCIAL LOCAL.** Regresión técnica verificada: PASS LOCAL SIN REGRESIONES NUEVAS DETECTADAS. La aceptación integral no se acredita: lector de pantalla hablado no inspeccionado y restauración de backup reservada a T041. T041 no se inició.

SHA base: `11737fd84562ee5a65e9ef124442b82f9aa16785`. SHA final: `327d8cc42f7bf22741b8d29cd68d03cf970235f2`. HEAD avanzó durante la ejecución e incluyó parte del trabajo intermedio. T040 no creó ese commit; el dossier también registra cambios aún sin confirmar. La preservación compara contenido, independientemente del movimiento de Git. No hubo despliegue.

| Comprobación | Resultado final |
|---|---|
| Contratos, build completo, typecheck, lint | PASS |
| API, 60 archivos | 593 PASS, 0 FAIL, 3 omitidos |
| Web, 62 archivos | 482 PASS, 0 FAIL |
| E2E guided-v2, escritorio/móvil | 20 PASS, 0 FAIL, 6 omitidos |
| Legacy mapa/editor | 59 PASS, 4 FAIL, 1 omitido |
| Editor 200 objetivos/1600 actividades | 2 PASS, 0 FAIL |
| L01/L02 | PASS; p95 estado 237.16 ms, respuesta 532.20 ms |

Los conteos finales combinan una pasada global con repeticiones de los archivos/casos afectados; no suman ejecuciones duplicadas. Los logs iniciales FAIL se conservan en `*-exit.json`, `api-test.json`, `playwright.json` y `playwright-legacy.json`. Las omisiones y cada resultado individual figuran en [counts-and-omissions.json](counts-and-omissions.json).

## Compatibilidad heredada

Persisten 4 fallos preexistentes. Los dos tests, los campos del fixture y el código relevante coinciden con T001 (CRLF/LF normalizado), anterior al desarrollo v2. Exigen mostrar videos que la política del commit 1f9f434 ocultó antes de T001. No se modificó esa política ni se convirtió FAIL en PASS. Véanse [comparación](baseline-compatibility.json) y [propuesta pendiente](REPARACION-LEGADO-PROPUESTA.md).

- desktop: route-editor.spec.ts > editor cotidiano con transporte fixture en memoria > mantiene material fijado fuera de la primera página y pagina sin perderlo
- desktop: route-editor.spec.ts > editor cotidiano con transporte fixture en memoria > contenido heredado conserva dos objetivos, cuatro formatos y alternativas
- mobile: route-editor.spec.ts > editor cotidiano con transporte fixture en memoria > mantiene material fijado fuera de la primera página y pagina sin perderlo
- mobile: route-editor.spec.ts > editor cotidiano con transporte fixture en memoria > contenido heredado conserva dos objetivos, cuatro formatos y alternativas

El harness antiguo carecía de proveedor v2: la consulta complementaria del mapa retornaba 503. Se inyectaron el esquema y proveedor reales, con v2 apagada. La consulta real pasa a catálogo vacío 200. El primer recheck dev registra además esperas de compilación; la persistencia final utiliza el Next ya construido y conserva 45 s por caso y 10 s por expectation. No se cambiaron criterios, timeouts ni retries.

## Reparaciones y pruebas

- Reloj controlado solo en el harness de imágenes: conserva las comparaciones completas de recibos. Un caso adicional avanza un segundo y exige recomendación actualizada con una sola respuesta y un solo evento.
- Selectores de recorridos limitados a su región accesible y cardinalidad exacta del mapa calculada desde publicación real. No se sustituyeron por asserts permisivos.
- Script de carga permite evidencia T040 además de T038; escenario y umbrales originales intactos. Carga real PostgreSQL/HTTP: 20 usuarios, 300 s, pool20; 4264 peticiones, cero errores técnicos/consistencia.
- Editor grande: cero formularios iniciales y máximo uno abierto; edición conservada al cerrar, guardar y recargar por BFF real; foco de error y anchos 320/360/390/768/1024/1440.

La API inicial tuvo 590 PASS/2 FAIL/3 omitidos y la web 482 PASS. Tras reparar solo tests/harness, se reejecutaron sus suites afectadas. T001 registró API 230 PASS/1 timeout (repetición focal PASS) y web 236 PASS; ese timeout no reapareció. Auth, roles, catálogo, contenidos, rutas y storage legacy están incluidos en la API global actual. PostgreSQL opt-in habilitó las suites independientes T015/T018/T022/T036; las tres omisiones API son explícitas, no éxitos. La emisión real de cookies Better Auth sigue fuera de la evidencia sintética.

El navegador legacy usa Fastify y SQL PGlite; no acredita locks de PostgreSQL. Los E2E v2 y la carga usan PostgreSQL desechable real, y las suites API independientes quedan identificadas por separado. T040 modificó siete archivos de tests/harness y solo su entrada del registro; no modificó código de producción.

## Evidencia y límites

[Resultado estructurado](result.json), [conteos y omisiones](counts-and-omissions.json), [accesibilidad](accessibility-summary.json), [manifiestos](manifest-summary.json), [carga](regression-final-load.json), [preservación](preservation.json), [limpieza SQL](database-cleanup-verification.json), [servicios detenidos](services-final.json).

La matriz P/I/S/M/E/V/L detallada está en `result.json`. M04-restauración corresponde al ensayo T041 y no se ejecutó anticipadamente. V04 acredita árbol de accesibilidad, sin salida hablada. No se acredita eficacia educativa, certificación WCAG, Hito S, staging o producción.

Se conservaron las bases preexistentes por nombre y OID, se eliminaron únicamente las tres bases legacy creadas por T040 y los harness cerraron sus DB temporales. Los clusters iniciados por T040 se detuvieron; los directorios se conservaron. El lockfile, SQL aplicado y archivos ajenos mantienen sus hashes iniciales.
