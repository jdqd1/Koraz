# F05 · Catálogo, contadores y resumen

Continuación local del 8 de noviembre de 2026 sobre `434de5b`, conservando los cambios locales de F04. Se usan identidades y materiales sintéticos y bases PostgreSQL desechables. No se modifica ni despliega producción.

## Proyección y conjuntos

- **V1:** `LearningHome.activePath` admite `pathHref` y `steps` opcionales. Cada paso público contiene únicamente ID, título y estado confirmado, y pertenece al conjunto esencial de la matrícula. Inicio utiliza esos IDs; una respuesta antigua sin `steps` conserva el contador agregado y no inventa estados individuales. El adaptador no atribuye dominio, consolidación ni exenciones a V1.
- **V2:** se mantienen `completedActivities`, `dispensedActivities` y `plannedRequiredActivities`. El total corresponde a las actividades iniciales obligatorias, excluyendo opcionales, refuerzo y etapas internas de casos. Las cubiertas por diagnóstico se muestran aparte y no pasan a «realizadas». Los logros y los XP conservan sus reglas propias. La ayuda del resumen explica el denominador.
- **Ámbito:** la recomendación de Inicio pertenece a la matrícula anunciada. «Continuar mi ruta» no se sustituye por el repaso global. La meta de XP de una unidad no toma un diagnóstico de otra unidad. La carga común de rutas recorre todas las páginas, deduplica y comprueba matrícula y revisión antes de asociar estado.
- **Disponibilidad:** errores de catálogo y de estado se muestran explícitamente; no se confunden con ausencia de matrícula. Las respuestas personales usan la sesión y `no-store`, sin almacenar estado entre peticiones. Progreso conserva puntos y constancia para cuentas con solo V2.

## Fallos corregidos

1. Inicio pintaba los primeros N pasos como completados. Ahora representa los pasos guardados por ID y omite el diagrama individual cuando una API anterior no proporciona identidades.
2. Las matrículas V2 no aparecían en Inicio. Ahora tienen su resumen y un destino real a la ruta/unidad. Los dos motores comparten un contenedor de flujo para evitar que sus controles se superpongan en escritorio.
3. La consulta V1 de Inicio incluía matrículas V2. Si una de ellas era la más reciente, podía producir `activePath: null` aunque hubiera una V1 activa. Se filtra por motor antes de calcular el resumen y se elimina el corte silencioso de 50 matrículas. La prueba de navegador reprodujo el fallo y la API tiene una regresión específica.
4. Las guías embebidas en videos se descartaban en las entradas global y por materia. La unión conserva guías nativas, el acompañante publicado más reciente y guías embebidas; hereda las materias del video y deduplica de forma determinista. `/guias/:slug` puede leer una guía embebida autorizada. Los cuestionarios y tarjetas mantienen la proyección paginada de F01.
5. El catálogo de metadatos cortaba listas sin informar del resto. La API añade `nextOffset`; el lector completo pagina sin convertir errores en éxito parcial. Las materias también cargan todos sus metadatos y acompañantes. Los JSON antiguos con arreglos nulos no derriban el catálogo.
6. La búsqueda extraía todas las cadenas del documento, incluidos tokens del editor. Web y API comparten un extractor semántico; la migración `0039_semantic_content_search.sql` corrige también el índice, sin añadir soluciones ni identificadores internos. El combobox permite recorrer enlaces con flechas, abrirlos con Enter y cerrar con Escape conservando el foco.
7. Consulta y práctica libre explican su alcance. Los modales no prometen XP o calendario de ruta y devuelven el foco al lanzador. La consulta de una guía también ofrece las actividades guiadas de la revisión autorizada. Abrir el destino de una actividad conserva «Comenzar actividad»: consultar o hacer prefetch no crea intentos.
8. Al consultar primero las respuestas y abrir después la práctica en móvil, la navegación inferior podía tapar «Ver resultado». El cuestionario nativo ahora abre su modal mediante un portal al documento, como los acompañantes de guías/videos, y la capa del diálogo queda por encima de la navegación. La regresión ejercita el botón con clic normal, sin forzar interacciones.

## Evidencia

Las pruebas de API entran por HTTP o por el proveedor transaccional y contrastan datos persistidos. Los recorridos de navegador usan Chromium y pantallas emuladas; no constituyen aceptación en teléfonos físicos ni del despliegue.

| Casos | Comprobación |
|---|---|
| T04–T06 | Reconciliación por IDs, conjunto obligatorio, exenciones separadas, títulos públicos y compatibilidad con snapshots antiguos. Suites de catálogo, evidencia V2, currículo y adaptadores de resumen. |
| T08, T23, T30 | Inicio/Hoy/Progreso con solo V2 y cuenta mixta, enlace anunciado, puntos comunes y repaso por categoría. Caso PostgreSQL no lineal y recorridos de resumen. |
| T24, T46 | Mismo cuestionario en consulta, práctica libre y ruta: los dos primeros no crean intentos/respuestas/recompensas; la actividad guiada guarda una respuesta y el paso. Cierre del modal y foco. |
| T31 | Diagnóstico aprobado/reprobado, recuperación de la respuesta, acceso sin inventar dominio/XP y lectura posterior. Regresión integrada de F02/F04. |
| T44 | Unión global/materia, guía vinculada, guía embebida, publicación, visibilidad y más de 1.000 registros; páginas y conteos de cuestionarios/tarjetas. |
| T45 | Texto rico, tildes, ausencia de tokens editoriales en índice y fragmento; flechas, Enter, Escape y foco en navegador. |
| T54 | Peticiones sucesivas de usuarios distintos, revisión no coincidente, cambio de cuenta con aplicación cargada y regresión de adopción/recibos. |

API: **109 casos distintos aprobados**, contando la suite inicial de 108 y la nueva regresión de matrícula mixta; tras esa corrección se repitieron los dos archivos afectados (**37/37**, sin omisiones). Web: **60/60** pruebas de componentes/proyección. Logs: `f05-api.txt`, `f05-api-regresion.txt`, `f05-web.txt`, en `output/implementacion-aprendizaje-2026-11-04/`.

Comandos desde la raíz, con Node 24 y las dependencias del repositorio. Para PostgreSQL, `KORAZ_TEST_DATABASE=true` y `KORAZ_GUIDED_V2_TEST_DATABASE_URL` deben apuntar al control **desechable**, nunca a producción. Los helpers crean y destruyen sus bases por ejecución:

```powershell
pnpm --filter @cediah/api exec vitest run test/practice-catalog-postgres.test.ts test/learning-xp-responses-postgres.test.ts test/guided-learning-catalog.test.ts test/guided-v2-routes.test.ts test/guided-v2-evidence.test.ts test/content-search-postgres.test.ts --hookTimeout=120000
pnpm --filter @cediah/web exec vitest run src/components/learning/route-summary.test.tsx src/lib/server/learning-overview.test.ts src/lib/study-catalog.test.ts src/lib/content-search.test.ts src/lib/server/learning-review-center.test.ts src/components/learning/v2/curriculum.test.tsx src/components/learning/v2/player.test.tsx
pnpm --filter @cediah/web build
pnpm --filter @cediah/web exec playwright test --config playwright.learning-discovery.config.ts
$env:KORAZ_PRACTICE_PRODUCTION='true'
pnpm --filter @cediah/api exec tsx test/helpers/learning-discovery-server.ts
```

La configuración de descubrimiento ejecuta 14 recorridos de resumen/diagnóstico/recuperación/adopción en 390 y 1440 px; la de catálogo ejecuta 18 en 320, 390 y 1440 px. Ambas utilizan `next start` después de compilar. Las capturas y trazas quedan bajo `work/f05/`; son evidencia técnica local. Los registros `f05-resumen-antes.txt` y `f05-navegador-modal.txt` conservan reproducciones previas a las correcciones; no representan el resultado final. Un primer arranque PGlite concurrente superó su límite de 30 s; el archivo se repitió con 120 s de arranque y pasó todos sus casos.

## Compatibilidad

La migración 0039 sustituye funciones del índice y recalcula `search_vector`; no cambia contenido, respuestas, matrículas ni premios. Debe aplicarse antes de verificar la búsqueda nueva. El coste del recálculo y el bloqueo de escritura de la tabla requieren medirse sobre el candidato de F10.

Los campos de Inicio son opcionales para leer respuestas antiguas. Los lectores estrictos anteriores no admiten los nuevos campos: publicar primero la web compatible y luego la API emisora, conservando el orden de F04. El lector completo del catálogo muestra indisponibilidad explícita hasta recibir una API con `nextOffset`; no presenta una lista truncada como completa. Para revertir, retirar primero los campos nuevos de Inicio desde la API antes de volver a la web anterior. La búsqueda anterior es compatible con el índice semántico, por lo que revertir la web/API no exige revertir 0039. La reversión operativa del despliegue se comprueba en F10.

## Siguiente fase

F06: continuidad de navegación entre mapa, detalle y reproductor; contexto de unidad/objetivo/actividad/pestaña/origen; retorno tras modal y enlaces profundos; recursos y formatos pendientes. Conservar las reglas y denominadores aquí definidos. F01 sigue abierta por revisión editorial; F08 requiere la aceptación transversal del candidato y F10 la entrega verificable.
