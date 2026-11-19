# F07 · Disponibilidad, rapidez y acceso operativo

## Alcance de dispositivos · 19 de noviembre

T56 queda aprobado por supuesto por decisión del usuario. La aprobación abarca Safari en iPhone y Chrome en Android físicos, y el Narrador de Windows. [Registro de T56](f07-dispositivos.md).

## Medición del detalle · 18 de noviembre

Se midió desde el clic hasta que la acción del detalle estuvo visible y habilitada en el candidato local `9gnLrC-gUCiB0-nxwdu8Q`. Cada serie contiene 30 aperturas por perfil, con recursos del navegador reutilizables. El presupuesto es de 800 ms en p75 y 1.500 ms en p95.

| Registro de Playwright | Escritorio p75 / p95 | Móvil emulado p75 / p95 |
|---|---:|---:|
| Sin traza | 367 / 383 ms | 417 / 439 ms |
| Con traza | 414 / 2.201 ms | 461 / 1.732 ms |

La serie sin trazas cumplió ambos umbrales. Con trazas, el p95 los excedió en ambos perfiles. La diferencia entre ejecuciones no permite atribuir toda la demora al registro. Las métricas de campo siguen pendientes. [Resultados de la repetición](../../../output/implementacion-aprendizaje-2026-11-04/f07-detalle-sintraza17.txt) · [Percentiles y directorios de muestras](../../../output/implementacion-aprendizaje-2026-11-04/f07-percentiles-17.json).

## Continuación del 17 de noviembre

Al salir de una pregunta de opción múltiple V2 y retomarla desde la acción recomendada, el servidor recuperaba el mismo intento. El enlace «Volver a la unidad» perdía la actividad y apuntaba al objetivo general. La corrección resuelve la actividad desde el manifiesto de ese intento y la sitúa en el currículo de la matrícula y revisión confirmadas. Para una variante accesible usa la actividad de origen. Cuando la actividad ya tiene respuesta y falta cerrar el intento, usa la última respuesta aceptada. [Reproducción anterior al cambio](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-v2-smoke-2.txt).

El control final de Next.js detuvo la compilación con 16.4.1. El registro de npm identificó dos avisos de caché aplicables hasta 16.4.4. Se actualizaron Next.js y su configuración ESLint a 16.4.6. Pasaron la instalación con el archivo de bloqueo y la compilación de producción con TypeScript. El identificador de esta compilación local es `RQOEjnnZ7PIzJovzGaK8V`. [Instalación](../../../output/implementacion-aprendizaje-2026-11-04/f07-instalacion-17.txt) · [Compilación](../../../output/implementacion-aprendizaje-2026-11-04/f07-compilacion-17.txt).

El cronómetro del navegador comienza en el evento de clic. Detecta el control de destino visible y habilitado y registra la siguiente oportunidad de pintado mediante `requestAnimationFrame`. En el panel con datos disponibles, la serie del 11 de noviembre dio 56 ms p75 en escritorio y 77 ms en móvil emulado, con 30 repeticiones por perfil. En diez primeras aperturas por perfil dio 328 y 327 ms. El valor anterior de 351 ms incluía la preparación del clic y la espera de Playwright. [Muestras del panel](../../../work/f07/browser-eventos/).

Para repetir la serie nueva, usar el PostgreSQL desechable y las variables `KORAZ_TEST_DATABASE` y `KORAZ_GUIDED_V2_TEST_DATABASE_URL` de la sección de repetición. Con la web compilada, ejecutar en PowerShell desde la raíz:

```powershell
$env:F07_PERFORMANCE='true'
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --output ../../work/f07/browser-v2-final17
Remove-Item Env:F07_PERFORMANCE
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'measures V1 activity|payload budgets|measures map panel' --output ../../work/f07/browser-v1-final17
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'measures V1 activity|measures the usable route detail|preserves resource' --output ../../work/f07/browser-retorno-final17
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'usable route detail' --trace off --output ../../work/f07/browser-detalle-sintraza17
node work/f07/summarize-17.mjs work/f07/browser-v2-final17 work/f07/browser-v1-final17 work/f07/browser-retorno-final17 work/f07/browser-detalle-sintraza17
```

V2 usa una cuenta de simulación por recorrido y prepara la misma pregunta mediante la API pública. En cada perfil, diez recorridos entran directamente al detalle y treinta llegan desde el catálogo. Los recursos del navegador pueden reutilizarse. En cada recorrido se abre un intento, se vuelve a la unidad, se retoma, se responde y se cierra. La prueba exige el mismo destino de regreso, contadores sin cambios al retomar, una respuesta persistida y la actividad completada en el estado de la matrícula.

Pasaron los 80 recorridos V2. Tras navegar desde el catálogo, los p75/p95 en milisegundos fueron los siguientes. La simulación móvil incluyó un primer intento de lectura de identidad que agotó el tiempo de espera. El recorrido terminó correctamente. [Prueba V2](../../../output/implementacion-aprendizaje-2026-11-04/f07-v2-final17.txt).

| Operación V2 | Escritorio p75 / p95 | Móvil emulado p75 / p95 |
|---|---:|---:|
| Abrir | 442 / 519 | 589 / 725 |
| Retomar | 388 / 432 | 566 / 796 |
| Confirmar | 168 / 215 | 179 / 237 |

El catálogo alcanzó 696/756 ms en escritorio y 402/430 ms en móvil desde el clic en un enlace ya interactivo (p75/p95). Hubo un máximo de 857 ms en escritorio y 2.382 ms en móvil. Las dos lecturas de aprendizaje por carga directa se mantuvieron en ambos perfiles. El panel con datos disponibles quedó en 78 ms p75 en escritorio y 79 ms en móvil. En primeras aperturas dio 483 y 380 ms. El detalle de escritorio registró 1.444/1.607 ms con el cronómetro externo de Playwright. Las mediciones históricas de catálogo muestran demoras tanto antes como después del clic. La compilación y el método de medición cambiaron, por lo que la diferencia entre series no permite atribuir una causa única.

En esa misma compilación, el recorrido V1 reprodujo un segundo defecto en ambos perfiles. Después de completar un cuestionario, iniciar una nueva práctica y salir, el botón volvía a crear un intento. La evidencia de la primera finalización ocupaba el único campo que recibía el detalle. Ahora el detalle solicita además los intentos abiertos por opción para esa matrícula y revisión. «Consultar resultado» conserva la evidencia de finalización y «Retomar actividad» usa la práctica abierta de la opción elegida. Los lectores anteriores reciben la respuesta habitual. El cambio no requiere migración. [Reproducción V1 y mediciones iniciales](../../../output/implementacion-aprendizaje-2026-11-04/f07-v1-final17.txt).

La compilación final local `9gnLrC-gUCiB0-nxwdu8Q` pasó los seis recorridos de navegador. V1 completó 40 prácticas por perfil. Cada recuperación conservó el intento abierto, el enlace de consulta conservó el resultado original y cada práctica produjo exactamente una respuesta. Desde la unidad ya cargada, los p95 de abrir, retomar y confirmar fueron 407, 392 y 141 ms en escritorio y 438, 383 y 113 ms en móvil emulado. La lectura anterior y la ampliada conservaron la evidencia de los tres pasos de la matrícula. Una cuenta distinta recibió 404 al solicitar el progreso ampliado. Pasaron 32 pruebas web, 13 de API, los tipos de API y la compilación de contratos y web. [Navegador](../../../output/implementacion-aprendizaje-2026-11-04/f07-retorno-final17.txt) · [Compatibilidad](../../../output/implementacion-aprendizaje-2026-11-04/f07-compatibilidad-17.json) · [Web](../../../output/implementacion-aprendizaje-2026-11-04/f07-unidad-17.txt) · [API](../../../output/implementacion-aprendizaje-2026-11-04/f07-rutas-api-17.txt) · [Compilación final](../../../output/implementacion-aprendizaje-2026-11-04/f07-compilacion-final17.txt).

## Antecedentes del 10 y 11 de noviembre

Trabajo local del 10 y 11 de noviembre de 2026 sobre `434de5b` con los cambios acumulados de F04–F06. Las pruebas de navegador usan la compilación de producción, una API local y PostgreSQL desechable con usuarios y rutas sintéticos.

## H31 · Incidente histórico del 4 de noviembre

Render sitúa `85236119f603d04053498356eb66ecf08b5dcc04` como la revisión de referencia de web y API entre los despliegues del 29 de octubre y el 7 de noviembre, hora de Caracas. Los metadatos de E34 y E74 permitieron consultar dos ventanas de 150 segundos. La API registró cuatro lecturas de identidad con HTTP 200 cerca de E34 (77–1198 ms) y dos cerca de E74 (65–74 ms). La consulta de aplicación de la web no devolvió entradas en esas ventanas. La captura del navegador carece de una referencia con la que vincular la solicitud fallida a esas lecturas. H31 sigue **NO VERIFICADO**. [Trazas saneadas e historial consultado](../../../output/implementacion-aprendizaje-2026-11-04/f07-h31-trazas-saneadas.json).

Para incidentes nuevos, buscar en la web `auth/me unavailable` con la referencia mostrada al alumno y en la API `Identity read completed` con esa misma referencia. Cada lectura tiene además su propio ID. El registro guarda estado, etapa y duración. Con ello se puede distinguir un fallo de transporte de un fallo del proveedor de identidad, lectura de roles o validación. La primera lectura recuperable admite un segundo intento tras 150 ms, con 2.500 ms como límite por lectura. Un 401 confirmado pide acceso de nuevo y conserva el enlace de aprendizaje. Un 403 se comunica como falta de permiso. Una respuesta HTTP 200 incompatible ofrece reintento manual con referencia. La consulta de identidad y su reintento usan la misma sesión.

## Recuperación y consultas

- El catálogo conserva los resultados del otro motor cuando uno falla y reintenta en la misma pestaña. Una lectura de consulta conserva la sección y el enlace de vuelta. Un intento que no se pudo leer vuelve a pedir su estado guardado con el mismo destino.
- El detalle V1 mantiene visibles sus materiales cuando falta progreso confirmado. Abrir actividades y cambiar preferencias requiere recuperar ese progreso. El detalle V2 ofrece el reintento de estado desde la misma unidad y pestaña. El enlace de actividad V1 distingue un servicio temporalmente indisponible de un recurso inexistente.
- El catálogo V2 admite `includeState=true`. La misma página devuelve las fichas y los estados autorizados de sus matrículas. La web comprueba la correspondencia entre matrícula y revisión antes de mostrar el estado. La API preselecciona las versiones V2, limita el cálculo de estados a la página y comprueba una ficha adicional para emitir el cursor. La pestaña Rutas prescinde de los resúmenes de Hoy. Las lecturas repetidas en el mismo render reutilizan el resultado mediante React; los estados privados mantienen `no-store`.
- La API anterior admite la consulta habitual y la web reintenta sin el parámetro opcional ante su rechazo HTTP 400. La autorización se comprueba en el motor que sirve la lectura. La consulta legacy seguida de V2 se mantiene para enlaces sin motor ante 404 o discrepancia explícita. 401, 403, un 409 distinto o un 5xx no autorizan probar el otro motor.

## Mediciones de laboratorio

Se usó Chromium 153.0.8010.12, Windows 11, Intel i3-1305U y conexión local sin límites artificiales de red o CPU. Los perfiles fueron 1440 × 900 y móvil emulado de 390 × 664. La base tenía tres matrículas V2 para el perfil medido, incluida una ruta sintética de 200 objetivos. Cada carga directa incluye una petición de documento con el mismo navegador y sus recursos reutilizables. Las navegaciones internas parten de Hoy para abrir Rutas y de Rutas para abrir el detalle. El reloj de la medición va hasta que la ficha o la acción está visible y habilitada. El p95 de una serie de 12 es su máximo.

| Operación y perfil | Muestras | p75 | p95 |
|---|---:|---:|---:|
| Catálogo, carga directa en escritorio, antes | 12 | 951 ms | 1.968 ms |
| Catálogo, carga directa en escritorio, después | 12 | 740 ms | 1.074 ms |
| Catálogo, navegación interna en escritorio, antes | 12 | 1.126 ms | 1.325 ms |
| Catálogo, navegación interna en escritorio, después | 30 | 1.117 ms | 3.897 ms |
| Catálogo, carga directa en móvil emulado, después | 12 | 695 ms | 991 ms |
| Catálogo, navegación interna en móvil emulado, después | 30 | 551 ms | 1.030 ms |
| Detalle, carga directa en escritorio / móvil | 12 por perfil | 591 / 657 ms | 651 / 758 ms |
| Detalle, navegación interna en escritorio / móvil | 30 por perfil | 671 / 721 ms | 1.250 / 1.140 ms |

El detalle queda dentro del presupuesto de 800 ms p75 y 1.500 ms p95 en ambos perfiles locales. El catálogo pasó de siete a dos lecturas de aprendizaje por navegación, incluidas las páginas V1 y V2. Los cuerpos de esas lecturas sumaron 122.439 → 121.348 bytes sin comprimir en la comparación de escritorio. Las cuatro muestras más lentas del catálogo interno en escritorio duraron 3,7–5,6 s y su lectura V2 duró 310–327 ms. Queda por aislar la demora entre el clic y la llegada al estado utilizable. [Línea base](../../../work/f07/baseline-medida/guided-learning-availabili-92afc-request-and-payload-budgets-desktop/catalog-measurements.json) · [Muestras del candidato](../../../work/f07/browser-mediciones/).

El panel de una lección del mapa V1 se midió en diez cargas directas y treinta aperturas repetidas por perfil. En las repeticiones, el p75/p95 fue 277/456 ms en escritorio y 351/392 ms en móvil emulado. El p75 móvil superó el objetivo de 300 ms. En cargas directas el p75 fue de 538 y 533 ms. El cronómetro incluyó la operación de clic de Playwright y la espera del enlace «Abrir ruta». [Muestras del panel](../../../work/f07/browser-interacciones-final/).

El cuestionario V1 registró 40 intentos nuevos y 40 respuestas por perfil, con diez recorridos que partieron de una carga directa y treinta desde la vuelta a la unidad. Cada intento produjo una respuesta confirmada.

| Operación V1, escritorio / móvil | p75 | p95 |
|---|---:|---:|
| Abrir actividad, carga directa | 995 / 1.013 ms | 1.027 / 1.030 ms |
| Abrir actividad, ruta ya cargada | 241 / 456 ms | 959 / 951 ms |
| Confirmar respuesta, carga directa | 199 / 217 ms | 299 / 240 ms |
| Confirmar respuesta, ruta ya cargada | 195 / 185 ms | 210 / 197 ms |

Las dos series de apertura y confirmación V1 quedan dentro de 1.500 ms p75 y 3.000 ms p95 en los perfiles locales. El p75 entre el clic y el cambio de estado del botón fue de 1–2 ms en el DOM. Queda por medir el pintado de ese estado y el tiempo de retomar un intento. [Muestras de envíos](../../../work/f07/browser-envios/) · [Prueba de persistencia](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-envios.txt).

Al completar una actividad V2, el contador confirmó cuatro de nueve actividades tanto al volver al detalle como al abrir el catálogo. La apertura de esa actividad tardó 1.004 ms en escritorio y 2.481 ms en móvil emulado. La confirmación de la respuesta tardó 216 y 208 ms. Se trata de una observación por perfil. Los percentiles de apertura y confirmación V2 y las mediciones de campo de LCP, INP y CLS quedan pendientes.

## Verificación local

Pasaron 102 pruebas de API y 91 web, la compilación de producción, los tipos y el análisis de los archivos modificados. Las pruebas de API incluyeron el lector de recursos con PostgreSQL, respuestas de identidad y roles, estados del catálogo y autorización por cuenta y revisión. [API](../../../output/implementacion-aprendizaje-2026-11-04/f07-api-final.txt) · [Web](../../../output/implementacion-aprendizaje-2026-11-04/f07-web-final.txt) · [Compilación](../../../output/implementacion-aprendizaje-2026-11-04/f07-compilacion-verificada.txt).

La respuesta breve se comprobó a 320 × 740, 360 × 800, 390 × 844, 430 × 932, 844 × 390, 390 × 420, 1024 × 768, 1280 × 800, 1440 × 900 y 1920 × 1080. El botón de comprobar conservó 52 px de alto y recibió la interacción en los diez tamaños. El foco avanzó de la respuesta a la ayuda, al resultado, al cierre y a la actividad de origen. El resultado pasó el conjunto de reglas automatizadas de axe ejercitado. El caso de 390 × 420 simula alto reducido. La prueba de teclado virtual real pertenece a T56. [Geometría y capturas](../../../work/f07/browser-mediciones/) · [Navegador y mediciones](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-mediciones.txt).

La búsqueda comprobó «sintetica» y «sintética», flecha, Escape, recuperación de foco y apertura con Enter en los tres tamaños. La consulta y la práctica libre dejaron intactos los contadores del intento guiado. La actividad guiada guardó una respuesta y actualizó el progreso. Cada proyecto volvió a crear la cuenta y la matrícula sintéticas para evitar reutilizar el intento ya completado por otro tamaño. [Móvil](../../../output/implementacion-aprendizaje-2026-11-04/f07-busqueda-mobile.txt) · [Compacto](../../../output/implementacion-aprendizaje-2026-11-04/f07-busqueda-compact.txt) · [Escritorio](../../../output/implementacion-aprendizaje-2026-11-04/f07-busqueda-desktop.txt).

Los recorridos de recuperación forzaron HTTP 503 en identidad, catálogo, progreso V1, estado V2, lectura e intento. Confirmaron el mismo enlace al volver a acceder y el mismo intento y sección al reintentar. La regresión de repaso V1 pasó los cuatro casos de respuesta interrumpida antes o después de confirmar, en los dos perfiles. La segunda pestaña recuperó el recibo, el calendario y los XP sin duplicar la respuesta. También se forzaron sesión vencida, respuesta de identidad incompatible y espera agotada. [Recuperación](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-regresion.txt) · [Repaso en PostgreSQL](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-regresion-cierre.txt).

H19 se volvió a ejercer con 30 unidades, alternancia mapa/lista, recarga y cuatro tamaños. Se montaron entre seis y siete nodos en los extremos y se registraron dos lecturas de resumen y ocho de nivel en cada recorrido. Las unidades esperadas siguieron accesibles. El incidente histórico queda por reproducir. [Mapa de escritorio](../../../work/f07/browser-regresion-cierre/guided-learning-navigation-ce052-ut-disabling-virtualization-desktop/h19-map-snapshots.json) · [Mapa móvil emulado](../../../work/f07/browser-regresion-cierre/guided-learning-navigation-ce052-ut-disabling-virtualization-mobile/h19-map-snapshots.json).

El editor reserva espacio para la barra móvil cuando desplaza un control al enfocarlo. En Edge con zoom nativo al 200 %, el campo de título conserva foco y acceso en sus cuatro esquinas. Se corrigieron los dos textos que axe señaló por contraste insuficiente y se ajustó el nivel de los encabezados de revisión. Pasaron cinco recorridos aplicables de editor, con cierre y retorno del foco en diálogos, ordenación, relaciones y alternativa de texto para imagen. El zoom nativo se ejecutó una vez en escritorio. [Regresión de accesibilidad](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-accesibilidad.txt) · [Foco con zoom](../../../work/f07/browser-accesibilidad/guided-v2-accessibility-T0-309df-browser-zoom-at-200-percent-desktop/native-focus.json).

WebKit 26.6 en Windows, con perfil móvil emulado, pasó los tres recorridos de respuesta, recuperación de catálogo/lectura/intento y recuperación de identidad. La prueba sirvió la web local por HTTPS con el certificado sintético del fixture para ejercitar la misma política de contenido de la compilación. [WebKit](../../../output/implementacion-aprendizaje-2026-11-04/f07-navegador-webkit-final.txt).

Cuatro pruebas adicionales ejecutaron el extractor y la consulta SQL de búsqueda. [Búsqueda en la API](../../../output/implementacion-aprendizaje-2026-11-04/f07-busqueda-api.txt).

## Repetición y relevo

Usar Node 24, las dependencias del repositorio y el control desechable. Cada invocación de navegador crea una base nueva. Mantener separadas las invocaciones de medición para evitar que una actividad anterior cambie las precondiciones.

```powershell
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
pnpm --filter @cediah/contracts build
pnpm --filter @cediah/web build
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'payload budgets|answer, feedback'
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'measures map panel|measures V1 activity'
$env:F07_REGRESSION='true'
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'preserves resource|correlates the retry|final V1 review|H19 records|V02/V05|V02 tab order|native browser zoom'
Remove-Item Env:F07_REGRESSION
$env:F07_WEBKIT='true'
pnpm --filter @cediah/web exec playwright test --config playwright.learning-availability.config.ts --grep 'preserves resource|correlates the retry|answer, feedback'
Remove-Item Env:F07_WEBKIT
```

Repetir la medición del panel móvil emulado desde el evento del navegador y localizar la demora del catálogo interno de escritorio. Completar los presupuestos de rendimiento pendientes sobre el candidato antes de la aceptación de F08. H31 conserva su estado NO VERIFICADO y H19 queda por reproducir. Si el fallo de identidad vuelve a ocurrir en un candidato con estas trazas, registrar hora, superficie y referencia para correlacionar web y API.

F07 no requiere migración. Las comprobaciones de compatibilidad y reversión de F04–F06 siguen en F10. F08 exige la matriz transversal del candidato con alumno y editor. F01 mantiene su revisión editorial y F10 la verificación de entrega.

El cierre comprobó el inventario inicial de bases y detuvo el clúster desechable iniciado para F07. [Cierre PostgreSQL](../../../output/implementacion-aprendizaje-2026-11-04/f07-cierre-postgres.txt).
