# F04 · Recompensas y conciliación

Continuación local del 7–8 de noviembre de 2026 sobre `434de5b`. Datos sintéticos y bases PostgreSQL desechables; sin cambios de datos, contenido o despliegues de producción.

## Reglas vigentes

Los XP reconocen hechos distintos en cada motor. Completar una lectura V1 sí puede premiar el cumplimiento; en V2 leer no acredita recuperación objetiva. El saldo total reúne ambos motores. El límite de 20 solo afecta `review_applied`, no los premios de actividad, unidad, ruta u objetivo.

| Motor / hecho | Evento / categoría | Cantidad | Límite y deduplicación |
|---|---|---:|---|
| V1, primera actividad esencial no diagnóstica | `step_completed` → `activity_check`, `activity_recall` o `activity_understand` | Cuestionario 15; tarjetas/guía 10; video observado 10 o autodeclarado 2 | Identidad de recompensa + versión; completar un paso ya completado no genera otro premio. |
| V1, unidad completa | `unit_completed` | 20 | Ruta + clave estable de unidad + versión pedagógica. |
| V1, ruta completa | `route_completed` | 50 | Ruta + versión publicada. |
| V1, primeros hitos | Primera actividad, primer repaso y primera unidad | 0 | Una clave por hito y alumno; son reconocimientos, no XP adicionales. |
| V1, repaso elegible | `review_applied` | Hasta 2, incluso si la respuesta necesita refuerzo | Solo primera ronda con calendario aplicado, fuera del reintento corto. Ítem + versión de memoria + versión previa del calendario; presupuesto diario compartido. |
| V2, primera recuperación objetiva | `v2_objective_recalled` | 5 | Versión de ruta + objetivo + tipo de logro. |
| V2, primer dominio | `v2_objective_mastered` | 10 | Misma deduplicación; evidencia reconstruida por el servidor. |
| V2, primera consolidación | `v2_objective_consolidated` | 15 | Misma deduplicación; abrir una evaluación no la acredita. |
| V2, práctica correcta de mantenimiento | `response_accepted` → `review_applied` | Hasta 2 | Respuesta objetiva previa, al menos 10 min, sin ayuda; una familia/objetivo/versión de ruta por fecha local. |
| V2, corregir un error previo | `response_accepted` → `review_applied` | Hasta 5 | Mismos requisitos y presupuesto. Puede coincidir con un primer logro objetivo, que pertenece a otra categoría. |
| V2, lectura, autocalificación o práctica asistida | Respuesta registrada | Sin premio de práctica objetiva | El progreso formativo se conserva. Un diagnóstico de admisión no concede XP ni dominio. |

Las dos entradas de respuesta adquieren `learning-rewards:<alumno>` antes de bloquear el intento o el calendario. La categoría diaria usa la fecha local confirmada por el servidor. Desde 19 se concede como máximo 1; desde 20, cero. Los recibos conservan clave y cuerpo: repetirlos no repite el hecho y reutilizar una clave con otro cuerpo se rechaza.

## Correcciones de este tramo

- **Cierre concurrente V1.** Dos últimas lecturas podían contar los pasos antes de ver el commit de la otra y omitir los premios de unidad y ruta. La prueba retiene temporalmente la fila de matrícula con `FOR NO KEY UPDATE` para reproducir ambas transacciones superpuestas. El [registro anterior al arreglo](../../../output/implementacion-aprendizaje-2026-11-04/f04-carrera-antes.txt) conserva el fallo. La finalización explícita y el guardado de video que puede completar automáticamente usan ahora el bloqueo común antes de bloquear el intento.
- **Resumen V1 después de recargar.** El manifiesto devuelve los premios vinculados al intento por los eventos del servidor. El reproductor los restaura y los sustituye al recibir un manifiesto más nuevo. Los recibos antiguos sin el campo siguen admitidos y conservan la acumulación por clave.
- **Cero confirmado V2.** El manifiesto conserva `earnedXp: 0`; antes se omitía por una comprobación de valor verdadero/falso. El resumen explica el cero de diagnóstico y lectura, y muestra la política de repetición/tope cuando no hay otro premio. V1 muestra un cero solo cuando el servidor suministra la lista de premios. No se atribuye una causa específica de asistencia o tope a un recibo que no la contiene.
- **Avance no lineal.** La prueba completa primero la tercera lectura y comprueba el identificador del paso completado, antes de terminar las otras dos simultáneamente.

## Verificación

La [suite de respuestas completas](../../../apps/api/test/learning-xp-responses-postgres.test.ts) entra por HTTP para responder y finalizar. Su preparación V2 crea un intento congelado mediante el servicio transaccional: la selección de actividades se verifica en las suites de rutas y navegador, no en esa preparación.

Prueba 0/18/19/20 XP, mantenimiento y corrección de error, conciliación del ledger con Inicio y estado V2, XP de ruta y sesión, recarga V1/V2, repetición de claves y rechazo de cuerpos distintos. Las carreras en ambos órdenes mantienen cuatro solicitudes simultáneas (dos envíos y sus duplicados) en conexiones PostgreSQL distintas. El caso de lecturas verifica premio único, progreso no lineal y ausencia de nuevos XP al releer. La [suite de recompensas](../../../apps/api/test/learning-rewards-postgres.test.ts) cubre además la unicidad concurrente de los tres logros V2; esa prueba de logros llama a las funciones de recompensa y no sustituye las pruebas de elegibilidad de evidencia.

Los recorridos de navegador de diagnóstico y repaso se ejecutan con PostgreSQL y pantallas emuladas de 390/1440 px. Recuperan envíos desde otra pestaña, concilian el saldo, recargan el resumen y verifican que un diagnóstico aprobado no premie dominio ni XP. La revisión editorial F01, los recorridos completos de F08 y la entrega F10 permanecen separados.

Resultados finales:

- [API: 107 pruebas aprobadas](../../../output/implementacion-aprendizaje-2026-11-04/f04-api.txt), sin omisiones. Incluyen catálogo V1, diagnóstico, práctica V2, evidencia, límites y concurrencia.
- [PostgreSQL: 18 pruebas aprobadas](../../../output/implementacion-aprendizaje-2026-11-04/f04-postgres.txt), repetidas sobre los archivos finales, sin omisiones. Son parte de las 107 anteriores, no 18 casos adicionales.
- [Web: 35 pruebas aprobadas](../../../output/implementacion-aprendizaje-2026-11-04/f04-web.txt). La prueba nueva verifica la restauración del premio y distingue lista vacía confirmada de recibo antiguo sin datos. Su primera aserción se ajustó para ignorar los comentarios de separación de texto que añade React al HTML de servidor.
- [Navegador: 10 recorridos aprobados](../../../output/implementacion-aprendizaje-2026-11-04/f04-navegador.txt), cinco en escritorio y cinco en móvil emulado. Los 503 y tiempos agotados de identidad del registro son fallos inyectados deliberadamente por las pruebas de recuperación.
- [Compilación web y tipos](../../../output/implementacion-aprendizaje-2026-11-04/f04-compilacion.txt), [tipos de API](../../../output/implementacion-aprendizaje-2026-11-04/f04-tipos-api.txt), ESLint [API](../../../output/implementacion-aprendizaje-2026-11-04/f04-lint-api.txt) y [web](../../../output/implementacion-aprendizaje-2026-11-04/f04-lint-web.txt): correctos. Los registros vacíos de ESLint corresponden a una ejecución sin errores ni advertencias.

Para repetir con Node 24 y el clúster local de pruebas iniciado en `127.0.0.1:55435`:

```powershell
$env:KORAZ_TEST_DATABASE = 'true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL = 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
pnpm --filter @cediah/contracts build
pnpm --filter @cediah/api exec vitest run test/learning-xp-responses-postgres.test.ts test/learning-rewards-postgres.test.ts test/guided-learning-catalog.test.ts test/guided-v2-routes.test.ts test/guided-v2-evidence.test.ts --maxWorkers=1 --testTimeout=30000
pnpm --filter @cediah/web exec vitest run src/components/learning/activities/review-activity.test.tsx src/components/learning/v2/player.test.tsx --maxWorkers=1
pnpm --filter @cediah/web build
pnpm --filter @cediah/web exec playwright test --config playwright.learning-xp.config.ts --output ../../tmp/f04-browser --reporter=list
```

Cada ejecutor PostgreSQL crea y elimina su base desechable. La regresión de carrera usa bloqueos observados en `pg_stat_activity`, sin depender de una pausa arbitraria para simular concurrencia. Los premios de unidad/ruta se probaron concurrentemente por HTTP; los tres tipos de logro V2 se probaron concurrentemente en las funciones de recompensa y su elegibilidad en la suite de evidencia.

## Compatibilidad y anomalías históricas

No hace falta una migración de base de datos. `LearningAttempt.awards` es opcional para aceptar respuestas guardadas de la API anterior. Por los contratos estrictos, desplegar primero el lector web compatible y después la API que emite el campo. Para revertir, retirar primero la emisión de la API antes de volver a una web anterior. El cambio no recalcula ni borra premios históricos.

Una revisión posterior de anomalías debe ser independiente: consultar por alumno/fecha los acumulados `review_applied` superiores a 20; contrastar premios con eventos e intentos y buscar rutas/unidades completas sin premio. Congelar un informe con IDs, fecha local, versión y diferencia esperada. Revisar cada discrepancia y acordar una compensación trazable antes de escribir. No restar saldos ni recrear eventos de alumnos automáticamente durante el despliegue. Este tramo no ejecuta ese análisis sobre producción.

## Relevo

F04 queda verificada en el entorno local para su alcance de recompensas. La conciliación y el avance por IDs de T30 están probados; la reconciliación transversal de todas las pantallas de ruta continúa en F05. La evidencia no constituye aceptación de producción ni una prueba en dispositivo físico.

Siguiente trabajo técnico: F05, catálogo, contadores y resumen comunes. Revisar T04–T06, T08, T23–T24, T30–T31, T44–T46 y T54; en particular consulta/práctica/retorno, conjuntos de actividades visibles y denominadores. Conservar la separación entre progreso, dominio y XP, y las garantías de recuperación y deduplicación verificadas aquí.
