# F03 · Repaso, refuerzo y retención

Continuación del 7 de noviembre de 2026 sobre `6d3a398`, con datos sintéticos y PostgreSQL desechable. No se modificó contenido ni progreso de producción.

## Transiciones verificadas

| Caso | Antes de este tramo | Resultado local |
|---|---|---|
| T18 · A falla, B sigue | El servidor ya separaba la pasada del vencimiento; faltaba recorrer dos tarjetas con reloj controlado. | A queda atendida, B se puede responder y el resumen conserva las dos fechas tras recargar. |
| T19–T21 · Reaparición | La política existente era 10 min, 10 min y luego 24 h. | A 599.999 ms no se ofrece el ítem; a 600.000 ms se abre una sesión nueva con el anverso ocultando la respuesta. El tercer fallo aplaza 24 h. No hay espera obligatoria en la pantalla. |
| T22 · Sesión abierta | V2 conservaba la recomendación; Inicio V1 omitía los intentos de repaso sin paso de ruta. | El centro ofrece el intento V1 abierto, sin ofrecer otro bloque en esa entrada. Conserva la recomendación V2 y vuelve al siguiente paso tras cerrar su sesión. No cambia el comportamiento de idempotencia ni la aceptación de intentos históricos. |
| T23 · Conteos | La entrada común solo enlazaba la primera ruta V2 y abría el lanzador V1. | Recorre el catálogo paginado y muestra cada ruta inscrita. V1 cuenta ítems; mantenimiento y evaluaciones de 7/30 días cuentan objetivos por categoría. Explica el solapamiento y el máximo de diez ítems por bloque. |
| T25–T26 · Retención y ausencia | La política ya separaba dominio, refuerzo y medición diferida. | Las suites de API y PostgreSQL confirman fechas reales de aceptación, separación mínima de siete días, ausencia sin fallos inventados y ayuda/autocalificación sin extensión objetiva. |
| T52 · Reloj y zona | Elegibilidad con reloj del servidor; formato con la zona del usuario. | Las pruebas cubren cambio de zona sin reescribir eventos, medianoche local y equivalencia UTC al cambiar horario estacional. PostgreSQL real prueba la extensión única en el límite móvil de 24 h y respuestas concurrentes. |
| Compatibilidad de tarjetas | Una pregunta con identidad pero sin `memoryVersion` podía proyectar un valor `undefined`: la huella calculada difería de la representación JSONB guardada y el selector la descartaba. | La proyección usa la versión inicial 1. Una regresión verifica huella persistida y reutilización de la revisión. No se reescribieron revisiones históricas ni se hizo una reparación masiva. |

## Comportamiento del centro

`/aprendizaje/repaso` reúne preguntas/tarjetas y rutas por objetivos. Las fechas y los conteos se calculan desde las respuestas del servidor. Una ruta con estado ausente o de otra matrícula/versión muestra un aviso, nunca un cero inventado. Un fallo parcial del catálogo conserva las rutas cargadas y señala que faltan otras.

Inicio y Hoy enlazan al centro común. Los resúmenes V1/V2 permiten volver a los bloques pendientes. V1 muestra las fechas guardadas al responder, también al recargar; el centro vuelve a consultar la elegibilidad vigente. «Actualizar repasos» hace una petición nueva, conservando la duración elegida.

Los tiempos de 5/10/20 minutos son estimaciones. Los bloques V1 tienen un máximo de 5/10/10 ítems, respectivamente. V2 conserva sus sesiones por objetivo y su prioridad del servidor; no se suman preguntas y objetivos ni se mezclan sus recibos.

## Evidencia reproducible

- [API y selección: 106 pruebas](../../../output/implementacion-aprendizaje-2026-11-04/f03-api.txt).
- [Identidad y catálogo: 32 pruebas](../../../output/implementacion-aprendizaje-2026-11-04/f03-identidad.txt); 25 son regresiones de catálogo repetidas tras corregir la compatibilidad.
- [Calendario: 36 pruebas](../../../output/implementacion-aprendizaje-2026-11-04/f03-scheduler-postgres.txt). Incluye las ocho pruebas de transacciones en PostgreSQL real. Los dos casos omitidos son las variantes de concurrencia PGlite, ejecutadas con PostgreSQL.
- [Web: 39 pruebas](../../../output/implementacion-aprendizaje-2026-11-04/f03-web.txt).
- [Navegador y PostgreSQL: cuatro recorridos](../../../output/implementacion-aprendizaje-2026-11-04/f03-navegador.txt), con viewports 390 y 1440 px.
- [Regresión del reproductor: 21 recorridos](../../../output/implementacion-aprendizaje-2026-11-04/f03-regresion.txt) en 320, 390 y 1440 px: último ítem, resumen, teclado, versiones, destinos y ayuda.
- [Compilación web y tipos](../../../output/implementacion-aprendizaje-2026-11-04/f03-compilacion.txt).
- [ESLint y tipos de API](../../../output/implementacion-aprendizaje-2026-11-04/f03-estatico.txt): salida correcta y cero advertencias en los archivos modificados.

Con Node 24, el clúster local de prueba en `127.0.0.1:55435`, `KORAZ_TEST_DATABASE=true` y `KORAZ_GUIDED_V2_TEST_DATABASE_URL=postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test`:

```powershell
pnpm --filter @cediah/web build
pnpm --filter @cediah/web exec playwright test --config playwright.review-center.config.ts
pnpm --filter @cediah/api exec vitest run --testTimeout=30000 test/review-scheduler.test.ts test/guided-learning-catalog.test.ts test/guided-v2-selection.test.ts test/guided-v2-routes.test.ts test/learning-content-identity.test.ts
```

La configuración del navegador crea y elimina su propia base. Las pruebas de concurrencia del calendario disponen además del ejecutor aislado `docs/aprendizaje-guiado/v2/evidencias/T018/run-postgres-concurrency.ps1`, en el puerto 55418.

## Alcance de cierre y relevo

La implementación de repaso queda verificada localmente con datos sintéticos y pantallas emuladas. T24 (consulta libre, práctica y retorno al lector) sigue asignado a F05 en la matriz; este tramo no acredita ese recorrido. La aceptación por rol/dispositivo sobre el candidato desplegado sigue en F08 y la liberación en F10. No se hizo observación longitudinal de 30 días ni una auditoría de revisiones históricas afectadas por la compatibilidad.

Siguiente trabajo técnico: F04, inventariar reglas de XP y repetir T27–T30/T53 sobre PostgreSQL real. Partir de las pruebas de recompensas existentes, comprobar saldo residual 19→20 y carreras V1/V2 con conexiones independientes, y conciliar ledger, saldo total, ruta y sesión. Mantener abiertas la revisión editorial F01 y las aceptaciones transversales.
