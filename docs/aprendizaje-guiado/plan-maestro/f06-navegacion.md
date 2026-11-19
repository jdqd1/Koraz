# F06 · Continuidad de navegación y recursos

Continuación local del 10 de noviembre de 2026 sobre `434de5b`, conservando los cambios de F04 y F05. Contenido, cuentas y bases de esta verificación son sintéticos. No se publica contenido ni se modifica producción.

## Contrato y recorrido

`apps/web/src/lib/learning-navigation.ts` construye y valida los destinos de ambos reproductores. El detalle admite `leccion`, `objetivo`, `actividad`, `pestana` y un origen permitido en `returnTo`. El ancla corresponde a la actividad, al objetivo o a la unidad. Una sesión admite ese detalle como retorno, con un único origen anidado; no se admiten destinos externos, parámetros duplicados, claves desconocidas del contrato ni cadenas recursivas de retorno.

El detalle comprueba que las identidades pertenezcan a su versión y unidad. Una clave retirada vuelve a un contexto disponible y explica el cambio. No se interpreta una clave ajena como permiso de acceso. Atrás, Adelante y recarga leen el contexto de la URL; abrir la actividad y cambiar de pestaña son operaciones distintas. El foco vuelve a la actividad o a la pestaña de recursos sin sustituir el foco del teclado al recorrer las pestañas.

Los paneles del mapa muestran resumen, avance, «Abrir ruta» y, como máximo, una acción rápida confirmada del ámbito seleccionado. Conservan cierre, lista/mapa y exploración de unidades. El currículo y sus recursos viven en el detalle, que comparte estructura y pestañas para ambos motores sin inventar capacidades de V1.

Elegir una actividad disponible V1/V2 la abre o retoma mediante un botón. Los enlaces profundos antiguos V1 mantienen la confirmación explícita de apertura: leerlos o precargarlos no crea intentos. V1 verifica la opción del intento previo antes de reutilizarlo. En V2 una sesión abierta sigue teniendo prioridad; el detalle explica el bloqueo de las otras actividades. Volver conserva la sesión abierta y los hechos confirmados. Las respuestas sin enviar no se anuncian como guardadas.

El progreso V1 conserva el intento que produjo la evidencia de un paso completado. «Consultar resultado» abre ese intento sin mutaciones; las opciones del paso ofrecen «Practicar de nuevo» como acción distinta. Las matrículas históricas sin intento de evidencia no inventan un resultado. El lector de guía sigue siendo una consulta independiente del intento.

## Recursos y lectura

`GET /v1/guided-learning/paths/:slug/resources/:key` resuelve únicamente una guía de la revisión adoptada por la matrícula del usuario. Para V1 la clave identifica la opción; para V2, la fuente vinculada y expuesta por el currículo público. Se comprueban matrícula, versión, vinculación, publicación, retiro, identidad de fuente y hash. La consulta es privada y sin caché; no crea respuestas, intentos ni premios. Los cuestionarios y los ítems reservados no pasan por este lector.

El recurso devuelve documento rico o secciones de texto, identificador de revisión y localizador. El lector abre la sección indicada y conserva su posición en `seccion`; los snapshots antiguos de texto y los primeros snapshots V2 siguen siendo legibles. Una cita sin lector ni URL se presenta como referencia bibliográfica. La indisponibilidad produce un estado con regreso y reintento.

Guía libre de consulta y guía guiada comparten la representación de tablas, listas e imágenes. La proyección textual deja de sustituir al documento rico. Se respetan las secciones seleccionadas y la posición guardada por el intento. Las tablas se desplazan dentro de su contenedor en móvil. La lectura V2 con imagen utiliza la resolución autorizada existente, ligada al intento y su versión; no se habilita «Guardar lectura» antes de cargar la imagen. El mismo acceso funciona en vista previa editorial.

## Verificación

La pasada de cierre de API contiene **86/86 pruebas**, incluidas cuatro con PostgreSQL real para lectura fijada, ausencia de efectos, permisos y consulta del resultado. Tras normalizar los SHA-256 de fuente —el contrato admite mayúsculas y minúsculas— se repitieron las cuatro de PostgreSQL con un hash en mayúsculas: **4/4**. Las pruebas web finales contienen **88/88 casos** de navegación, recursos estructurados, currículo, reproductor y observación de video.

El navegador terminó con **8/8 recorridos** en Chromium, en 390 y 1440 px, usando la aplicación compilada, la API local y PostgreSQL desechable. Las comprobaciones de tamaño recorren además 320/360/430 px. No se fuerzan clics para atravesar superposiciones.

| Casos | Evidencia local |
|---|---|
| T09–T12 | Mapa → detalle/unidad → actividad → regreso; reanudación del mismo intento; sección guardada; consulta del resultado sin otro intento; claves retiradas, orígenes rechazados, recarga, historial y foco. |
| T10, T30 | El panel conserva la unidad y solo su acción rápida autorizada; los XP globales no aparecen como XP de esa unidad. Se conserva la estimación de tiempo V1 y el detalle permite descubrir las actividades completas. |
| T13–T15 | Pestañas con flechas, hit-test y ausencia de desbordamiento de página en 320/360/390/430/1440 px; mapa de 30 unidades con lista/mapa, recarga, extremos y cambios de ancho. |
| T16–T17, T24, T35, T48 | Documento fijado aunque cambie el contenido actual; tabla y lista semánticas en consulta/guiado, sección y retorno a Recursos; sin nuevos intentos/respuestas/premios; rechazo de usuarios ajenos, claves de cuestionario, fuentes retiradas e identidades que no corresponden. |
| T34, T55 | Reutilización V1 del intento y su respuesta/revelación guardadas; sesión abierta V2 conserva prioridad. Los ocho tipos V2 recorren la interfaz y persisten sus respuestas, incluidas las dos etapas de caso, escritura/revelación/autocalificación y verificación posterior. V1 recorre guía, quiz y tarjetas; para video se comprobaron las guardas del visor y la cobertura real del proveedor, sin considerar un salto al final como reproducción. |

**H19:** los dos recorridos de mapa registran nivel solicitado, IDs montados y medidas al colocar la vista en sus extremos. No se reprodujo una desaparición de unidades. Se conserva la virtualización y no se atribuye una causa al incidente observado en producción. F07 debe correlacionarlo si reaparece en el candidato; estos datos locales no equivalen a demostrar su reparación. El mapa grande de V2 también muestra el objetivo 200 y sus actividades.

**Fallos reales corregidos durante esta fase:** el retorno limitado al mapa, la pérdida de la pestaña, el intento de evidencia completado ausente y la sustitución del documento rico por texto. En móvil una tabla podía ensanchar la página y hacer inaccesible «Siguiente»; ahora su desplazamiento queda dentro de la tabla. Las pestañas del detalle respetan la cabecera y el desplazamiento de foco por teclado. Los logs anteriores conservan también fallos de selectores, una carrera en el ayudante de cierre y el uso erróneo de un fixture solo de desarrollo; esos resultados no constituyen aceptación.

Registros definitivos bajo `output/implementacion-aprendizaje-2026-11-04/`: `f06-api-cierre.txt`, `f06-recursos-ultima.txt`, `f06-web-ultima.txt`, `f06-navegador-ultima.txt`, `f06-compilacion-ultima.txt`, `f06-tipos-api-cierre.txt` y `f06-lint-*.txt`. Compilación con tipos y análisis de código terminaron correctamente. Las capturas y los adjuntos de H19 quedan en `work/f06/browser-ultima/`. La base desechable se elimina al terminar cada suite; el cierre del clúster comprueba que se conservó el inventario inicial de bases.

El cierre registrado en `f06-cierre-postgres.txt` confirmó el inventario original y detuvo el clúster que se había iniciado para esta fase. Se conservan los cambios locales anteriores y sus artefactos.

La aceptación del candidato continúa en F08. No se afirma aceptación longitudinal ni clínica. Los perfiles físicos de iPhone y Android y la prueba con Narrador quedaron aprobados por supuesto en T56. [Decisión de alcance](f07-dispositivos.md).

```powershell
# Node 24. Las variables de PostgreSQL deben apuntar exclusivamente al control desechable.
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
pnpm --filter @cediah/api exec vitest run test/learning-resource-reader-postgres.test.ts test/guided-v2-images.test.ts test/guided-v2-routes.test.ts test/guided-learning-routes.test.ts test/guided-learning-catalog.test.ts --hookTimeout=120000 --testTimeout=30000
pnpm --filter @cediah/web exec vitest run src/lib/learning-navigation.test.ts src/components/learning/structured-guide-content.test.tsx src/components/learning/v2/curriculum.test.tsx src/components/learning/map/map-helpers.test.ts src/components/learning/v2/player.test.tsx src/components/learning/v2/composition.test.tsx src/components/learning/learning-activity-visibility.test.tsx src/components/learning/activities/video-observation.test.ts
pnpm --filter @cediah/web build
pnpm --filter @cediah/web exec playwright test --config playwright.learning-navigation.config.ts --output ../../work/f06/browser-ultima
```

## Compatibilidad y siguiente fase

F06 no requiere migración. `kind` es opcional en los metadatos públicos de fuentes para leer APIs anteriores. Un lector antiguo y estricto no acepta el campo nuevo: publicar primero la web compatible y después la API, manteniendo el orden de F04/F05. Para revertir, retirar primero el campo emitido por la API. Una web nueva ante una API antigua puede presentar la consulta como no disponible; conserva la actividad guiada. Las URLs antiguas de mapa y actividad siguen admitidas. F10 debe comprobar el orden y la reversión con un candidato identificable.

F07 continúa con fallos de servicio, el incidente H31, accesibilidad operativa y rendimiento medido. F01 mantiene su revisión editorial; F08 la aceptación transversal por rol y dispositivo; F09 empieza después de F08 y F10 verifica la entrega. Las pantallas emuladas y las cuentas sintéticas no acreditan el uso en un teléfono físico ni la aceptación de producción.
