# Plan maestro de experiencia de aprendizaje Koraz

**Actualizado el 6 de noviembre de 2026. Hay cambios implementados en el código local de `main`. La aceptación funcional y la entrega a producción siguen pendientes.** Para continuar en otra conversación, empezar por el relevo que sigue.

**Prioridad vigente:** funcionamiento en móvil y escritorio. El rediseño visual se ejecuta después de superar la aceptación funcional. Tablet queda diferida por decisión del usuario.

**Orden de trabajo:** F00–F08 corrigen y validan funcionamiento; F09 unifica y refina el diseño tomando V2 como referencia; F10 verifica la entrega. Las propuestas de diseño de la sección 4 no autorizan adelantar F09.

Capturas y navegación: 3 y 4 de noviembre de 2026, America/Caracas. Consolidación del plan: 4 de noviembre de 2026. Producto observado: [koraz.app](https://koraz.app). Repositorio revisado: `D:\Jose (Datos)\Medicina\CEDIAH\Web`, rama `main`, commit local `85236119f603d04053498356eb66ecf08b5dcc04`.

En este plan, V1 y V2 corresponden a las versiones llamadas B1 y B2 por el usuario: Peritoneo y Vascularización del abdomen, respectivamente.

Accesos: [hallazgos](#3-hallazgos-trazables) · [fases](#7-fases-de-implementación-y-puertas-de-salida) · [pruebas](#8-pruebas-y-evidencias-de-aceptación) · [archivos](#12-mapa-técnico-para-localizar-el-trabajo).

Las secciones de auditoría describen lo observado el 3 y el 4 de noviembre. El estado de implementación posterior se registra por separado.

## 0. Relevo por fases · 6 de noviembre de 2026

**Especificaciones del usuario.** Cuando un recorrido necesite material, se puede crear contenido ficticio coherente para la ruta. Identificarlo como simulación, darle un objetivo, instrucciones y una respuesta o criterio de logro verificable, y mantenerlo reproducible en el entorno de pruebas. La aceptación técnica puede avanzar con esos materiales. La publicación de contenido médico para alumnos conserva su revisión editorial y sus fuentes.

**Entrega solicitada.** Al finalizar la implementación, Koraz debe quedar completamente funcional y listo para producción. F10 exige un candidato identificable, los recorridos esenciales de alumno y editor aprobados en móvil y escritorio, compatibilidad de migraciones y reversión comprobada, y evidencia de los casos de aceptación del plan. Un fallo que impida estudiar, recuperar el progreso, calificar o publicar correctamente mantiene abierta la entrega. Registrar por separado la preparación del candidato y la verificación del despliegue efectivo.

**Cómo continuar.** Trabajar una fase por conversación. Al terminarla, actualizar aquí los cambios, las pruebas que pasaron, los bloqueos y el primer paso de la siguiente sesión. Si una fase requiere una decisión editorial o evidencia externa, dejarla abierta con ese requisito explícito. F09 comienza después de la aceptación funcional móvil y de escritorio en F08.

**Próximo trabajo técnico.** Continuar con F02 en el entorno aislado. Empezar por la última respuesta de repaso V1 y el diagnóstico V2. Cortar la conexión antes del envío y después de que el servidor lo acepte, recargar y reintentar desde otra pestaña. Comparar el recibo, el progreso y el saldo de XP. La simulación ya permite recorrer Peritoneo de principio a fin. La aceptación editorial de F01 permanece abierta para la liberación.

### F01 · candidato verificado el 6 de noviembre

| Recorrido | Resultado |
|---|---|
| Peritoneo V1 | La [simulación](../../docs/aprendizaje-guiado/plan-maestro/peritoneo-simulacion.json) reconstruye las seis asociaciones esenciales de la v3 auditada. El candidato conserva las revisiones de guía y tarjetas de la primera unidad. Reemplaza el cuestionario de cuello en U1 por cinco preguntas de peritoneo. En U2, una guía de maqueta, cinco tarjetas y un cuestionario de cinco preguntas sustituyen los tres enlaces incorrectos. La segunda unidad tiene un objetivo nuevo y criterios de logro comprobables. |
| Publicación y matrícula | Al clonar una edición cambian los ID de opción. La API ahora impide enviar a revisión, aprobar o publicar si el mismo paso conserva el material retirado de una edición anterior. La copia intacta señaló los cuatro pasos. La corregida pasó el flujo de publicación en PostgreSQL desechable. Una matrícula con una guía completada siguió fijada a v3 hasta adoptar v4. El intento histórico siguió disponible y el alumno terminó con 6/6 pasos y 100 %. [Prueba reproducible](../../apps/api/test/peritoneo-candidate-postgres.test.ts). |
| Cuestionarios libres | La lectura de las dos revisiones identificó cinco preguntas con respuestas repetidas y una sexta con dos descripciones compatibles y sin explicación. La [propuesta para los dos bancos](../../docs/aprendizaje-guiado/plan-maestro/cuestionarios-candidatos.json) relaciona cada pregunta con su ítem histórico y especifica consigna, tres opciones, clave, explicación y fuentes. Sus seis preguntas pasan el contrato de publicación. El calificador acepta exactamente una opción en cada una. |
| Diagnóstico abdominal V2 | Se recorrió por HTTP la admisión a «retorno portal» con el paquete abdominal 3 y con la copia candidata 4, usando el mismo texto y las mismas respuestas restantes. En la revisión 3, `cava-r1` recibió 0 y el objetivo pidió refuerzo. En la candidata, recibió 1 y el objetivo se habilitó. El recibo incluyó la fuente localizada, conservó el resultado al reintentar y mantuvo el saldo de XP. [Prueba de diagnóstico](../../apps/api/test/guided-v2-routes.test.ts). |

**Verificación local.** Pasaron 90 pruebas en cinco archivos de API que cubren ambas rutas, catálogo, editor y calificación. Se repitieron con éxito seis recorridos de Chromium a 320, 390 y 1440 px con datos de interfaz controlados. Verifican los destinos de los pasos visibles y distinguen pista y fuente. Pasaron los tipos, la compilación y ESLint de la API. La revisión Peritoneo v4 se publicó únicamente dentro de la prueba y se eliminó con su base al terminar. La reconstrucción conserva las asociaciones auditadas y utiliza contenido de estudio simulado. En V2 se usaron los textos del paquete fijado, sus cinco fuentes y una identidad de estudiante de prueba.

**Cómo repetir la prueba de Peritoneo.** Desde la raíz del repositorio, con Node 24 y el servidor local de pruebas iniciado en el puerto 55435, ejecutar en PowerShell:

```powershell
$env:KORAZ_TEST_DATABASE = 'true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL = 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
pnpm --filter @cediah/api exec vitest run test/peritoneo-candidate-postgres.test.ts
```

**Aceptación antes de liberar.** Revisar los seis ítems propuestos, los cuatro destinos, las variantes de `cava-r1` y la pertinencia de pistas y fuentes en las ediciones destinadas a alumnos. Llevar esas ediciones al candidato de preproducción y recorrerlas en móvil y escritorio con cuentas de alumno y editor. Estas verificaciones siguen abiertas. Las evidencias anteriores se conservan a continuación como referencia histórica.

### Continuación de F01 · candidato local del 5 de noviembre

Base de esta continuación: `1d9e2b8`. El commit local que contiene esta sección y sus pruebas se titula `fix(aprendizaje): separa la autoría de tarjetas y cuestionarios`.

| Caso | Evidencia de esta sesión | Requisito de cierre pendiente |
|---|---|---|
| T01/T03 · Identidad y formatos | La prueba del proveedor ejercita los cuatro identificadores bloqueados. Un recurso válido se puede abrir y un intento anterior sigue siendo legible tras retirar un recurso. El componente muestra los pasos esenciales de video solo, video con cuestionario y material ausente. | Verificar cada destino y objetivo en la revisión editorial de Peritoneo. |
| T02/T42 · Autoría y publicación | El editor común de cuestionarios independientes, guías y videos conserva las opciones y sus identificadores. El autor elige la correcta. Se puede guardar un borrador anterior con duplicados para repararlo. El envío a revisión enfoca el campo, incluso en una pregunta cerrada. La validación reconoce equivalencias de Unicode y espacios, y marcadores explícitos de prueba como el observado en E51. Las tarjetas se guardan como frente y reverso. | Reemplazar o reconvertir las preguntas reales identificadas por editorial. La validación automática cubre defectos concretos del texto. La pertinencia de los distractores y las fuentes requiere revisión humana. |
| T06 · Currículo V2 | El paquete acepta un título público opcional. Las actividades que carecen de título muestran formato de acción y objetivo público. Si ambos coinciden, se añade su posición en el grupo. El detalle y la recomendación emplean el mismo nombre. Una prueba HTTP comprueba la exclusión de consignas privadas, soluciones y reservas, incluso de un diagnóstico con título propio. | Al desplegar, actualizar el lector web antes de que la API envíe títulos opcionales. El validador del repositorio está regenerado. La distribución externa congelada de la skill requiere su propio proceso de actualización para importar paquetes con el campo nuevo. |
| T43 · Respuestas breves | La regresión lee la copia local del paquete abdominal revisión 3, verifica las precondiciones de la propuesta y comprueba las variantes de sus nueve respuestas breves. La frase observada pasa en la copia candidata revisión 4 y los errores cercanos siguen fallando. Un diagnóstico HTTP sintético con estas variantes comprueba el resultado, el acceso al objetivo, el saldo de XP y el dominio. | Aprobar las variantes y comprobar el recibo del diagnóstico en la ruta revisada con un estudiante. |
| T49 · Ayuda | El servidor rechaza una pista ausente sin registrar asistencia. El reintento de una pista válida devuelve el mismo recibo y deja un solo evento. La respuesta queda marcada como asistida. | Validar editorialmente la pista y la fuente de cada ítem señalado, y repetir con la revisión candidata. |

**Ejecuciones locales.** Pasaron [134 pruebas de API y contratos](../implementacion-aprendizaje-2026-11-04/f01-api.txt) y [47 pruebas web](../implementacion-aprendizaje-2026-11-04/f01-web.txt). La suite para concurrencia T015 omitió 12 casos que exigen otra instancia dedicada. Los [33 recorridos de Chromium](../implementacion-aprendizaje-2026-11-04/f01-navegador.txt) cubren tres anchos, 320, 390 y 1440 px. Nueve recorren el editor con PostgreSQL desechable, incluidas la reparación, reapertura, publicación y práctica por un estudiante sintético. En móvil se reprodujo y corrigió la superposición del menú inferior con los botones de guardar. Los recorridos restantes ejercitan la biblioteca y las regresiones de repaso y actualización ya existentes. Pasaron además [seis recorridos de T01/T03 y T49](../implementacion-aprendizaje-2026-11-04/f01-matriz-navegador.txt) en esos mismos anchos, con una ruta sintética y respuestas de ayuda controladas. Verificaron los enlaces de cada proyección, el estado del paso retirado, la ausencia del botón de pista y la consulta separada de pista y fuente. Pasaron también el análisis estático web, los tipos del workspace y la [compilación de API y web](../implementacion-aprendizaje-2026-11-04/f01-compilacion.txt).

| Fase | Avance de este chat | Trabajo abierto |
|---|---|---|
| F00 · Línea base | Se identificaron las seis actividades esenciales de Peritoneo v3, sus revisiones y el diagnóstico abdominal V2. Se verificó el despliegue web de referencia y se prepararon pruebas reproducibles con datos sintéticos y una base PostgreSQL aislada. | Completar los perfiles de prueba restantes y correlacionar el incidente H31 con trazas del servicio. La revisión de la API que atendió el incidente sigue sin verificar. |
| F01 · Contenido | H01/H03. El candidato conserva los pasos esenciales y bloquea únicamente cuatro opciones mal vinculadas. Los videos válidos pueden abrirse. H02. La validación y la calificación detectan opciones con texto repetido en los flujos afectados. H25. Se reprodujo el rechazo de la respuesta de ilíacas y se probó una propuesta de dos variantes explícitas. H30. Una pista ausente deja de ofrecerse y la API evita registrar ayuda por ella. | Hacen falta materiales y objetivos revisados, preguntas resolubles y aprobación clínica de las variantes. T06 y el enfoque del editor se verificaron en la continuación de F01. Falta probar la nueva revisión con un estudiante cuando exista. F01 queda abierta. |
| F02 · Intentos | H24. El último ítem de repaso V1 conserva su resultado y ofrece «Ver resumen». H18. Consultar una actualización V2 solo lee la vista previa. Recuperar una adopción pendiente exige una acción separada. | Completar el recorrido de recarga, desconexión antes y después de guardar, doble pestaña, adopción real en pruebas y resultados de diagnóstico. |
| F03 · Repaso | H05. El fallo V1 termina su turno en la pasada. El servidor controla el vencimiento y las reapariciones cortas entre sesiones. | Centro común de repaso, calendario tras recarga y casos de ausencia, zona horaria y retención de 7/30 días. |
| F04 · XP | H06. Ambos motores comparten el bloqueo por alumno. V1 concede solo el saldo diario restante. Probadas las bases 0, 18, 19 y 20 y las carreras de las funciones de recompensa en ambos órdenes con conexiones independientes. | Repetir la carrera desde las dos entradas completas de respuesta y conciliar los saldos de usuario, ruta y sesión. |
| F05 · Catálogo | H26/H27. Bibliotecas general y por materia comparten la selección publicada de cuestionarios y flashcards, incluidos los de guías y videos. Se deduplican antes de paginar. El cuestionario libre ofrece práctica y consulta separadas. | Validar los datos publicados con el candidato y una cuenta de estudiante, completar contadores comunes V1/V2, caché, búsqueda y modos de acceso restantes. |
| F06–F08 · Navegación y aceptación | Hay pruebas locales de recorridos concretos en móvil y escritorio. | F06 navegación completa y conservación del contexto. F07 recuperación de fallos, accesibilidad y rendimiento. F08 aceptación funcional por rol y dispositivo. |
| F09–F10 · Diseño y entrega | Pendientes. | Tras F08, unificar el diseño. Validar el candidato desplegado, documentar reversión y comprobar producción como capa independiente. |

### Decisiones y materiales que debe conservar el próximo chat

- Peritoneo v3, revisión `665b6833-b180-4020-a206-75d251470c37`. U1 «Actividad 4» y U2 «Actividad 1» apuntan al cuestionario «Triángulos del cuello». U2 «Actividad 2» y «Actividad 3» apuntan al video «Hombro». La contención local usa los cuatro identificadores de opción. La guía y las tarjetas de Peritoneo siguen disponibles. El detalle de los identificadores y revisiones está en la [consulta de identidad editorial](../implementacion-aprendizaje-2026-11-04/identidad-editorial-2026-11-05.json).
- La revisión fijada del cuestionario de cuello tiene 3 de 3 preguntas con opciones repetidas. El cuestionario de la guía de Peritoneo tiene 2 de 3. Editorial debe definir distractores distintos o reconvertir las preguntas en tarjetas de consulta y publicar una revisión nueva.
- Vascularización del abdomen, publicación 2, paquete 3, actividad `cava-r1`. En la copia de prueba se acepta «Las venas ilíacas comunes derecha e izquierda» y se siguen rechazando los negativos cercanos. La [propuesta de revisión 4](../../docs/aprendizaje-guiado/plan-maestro/cava-r1.propuesta.patch.json) sigue pendiente de aprobación editorial. Se preservó el historial de calificaciones.
- **Candidato anterior a esta continuación, guardado en `main` local, commit `12e237200064400acc616f98b6868051e80dadb2`.** La base inspeccionada y el despliegue web de referencia de `koraz.app` corresponden a `85236119f603d04053498356eb66ecf08b5dcc04`. El despliegue web observado fue `dpl_CaREXkhVjWiwhYHWnHjPCrQdCTnW`. Las consultas de identificación a producción fueron de lectura. La migración [0038](../../database/migrations/0038_study_catalog_runtime_read.sql) se aplicó únicamente en bases desechables y concede al rol de la API lectura de las columnas de materias necesarias para el catálogo.

### Verificación del tramo

| Ámbito | Resultado al cierre | Alcance que se probó |
|---|---:|---|
| [API y contratos](../implementacion-aprendizaje-2026-11-04/api-cierre.txt) | 126 pasaron, 12 omitidas | Doce archivos de pruebas. Incluyen catálogo y revisiones V1, intentos V2, reglas de calificación, pistas, repaso y paridad del validador portátil con la API. Las 12 omitidas pertenecen a T015, que requiere su instancia PostgreSQL dedicada. |
| [PostgreSQL aislado](../implementacion-aprendizaje-2026-11-04/postgres-cierre.txt) | 9 pasaron | Seis pruebas del límite de XP, incluidas carreras con conexiones diferentes, y tres de catálogo. Se comprobó el rol de la API, la unión de materias, la deduplicación y la paginación. Todas las bases temporales de los casos se eliminaron y el servidor local de pruebas se detuvo. |
| [Componentes web](../implementacion-aprendizaje-2026-11-04/web-cierre.txt) | 43 pasaron | Cinco archivos que cubren pantallas de actividad, resultado final de repaso, reproductor, consulta de actualización y proyecciones de práctica. |
| [Navegador](../implementacion-aprendizaje-2026-11-04/browser-integracion.txt) | 24 pasaron | Ocho casos en cada ancho de Chromium (320, 390 y 1440 px). Biblioteca → materia → tema → cuestionario → resultado → regreso, búsqueda y apertura de flashcards, bloqueo de una pregunta ambigua, último ítem de repaso y consulta de actualización. |
| [Compilación](../implementacion-aprendizaje-2026-11-04/compilacion-cierre.txt) y [análisis de código](../implementacion-aprendizaje-2026-11-04/lint-cierre.txt) | Correctos | Compilaron los contratos, la API y la web. La validación de tipos y las reglas de código terminaron correctamente. |

Las pruebas de biblioteca usaron las páginas reales, la API local, un estudiante sintético y PostgreSQL. Las pruebas de último ítem y actualización usaron respuestas controladas. En el navegador se emuló el tamaño de pantalla. Quedan por verificar un dispositivo físico, un estudiante real en un despliegue candidato y las comprobaciones de F08.

Se pueden repetir los recorridos con el [ejecutor local de biblioteca](../../work/test/plan-maestro/bibliotecas.mts) y la [configuración de navegador](../../apps/web/playwright.functional.config.ts). El ejecutor exige la base desechable indicada por la protección de pruebas. La propuesta editorial, la aplicación de la migración en producción y cualquier publicación de rutas son decisiones separadas.

Para una futura entrega, comprobar la compatibilidad entre la web y la API durante el cambio de versión. El catálogo requiere la migración 0038 y el nuevo servicio de práctica. La vista de actividad debe aceptar el campo opcional `hasHint` antes de que la API empiece a enviarlo. El validador portátil se regeneró con Zod 4.6.6, la versión fijada en el proyecto, y se comprobó que entrega el mismo resultado que la API.

## 1. Resultado de la auditoría

La experiencia tiene una base aprovechable: mapa con navegación por niveles, alternativa en lista, rutas V2 organizadas por unidades y objetivos, sesiones recuperables y lógica de aprendizaje respaldada por el servidor. Sin embargo, el recorrido está fragmentado entre dos diseños de ruta, dos entradas a repaso y varios niveles de navegación. Además, se encontraron problemas concretos que deben corregirse antes de considerar satisfactoria la experiencia principal.

Los de mayor prioridad son:

1. Una actividad de Peritoneo anuncia video, abre un cuestionario de cuello y contiene opciones idénticas calificadas de forma diferente. El problema también aparece en otra actividad de la ruta y en el cuestionario libre de la guía.
2. El repaso V1 repite inmediatamente un fallo y, al finalizar el último ítem, deja el cuerpo de la pantalla vacío hasta recargar.
3. El diagnóstico V2 rechazó «Las venas ilíacas comunes derecha e izquierda», aunque su explicación identifica las ilíacas comunes como la respuesta. La calificación por igualdad textual necesita una revisión editorial y pruebas de equivalencias.
4. Una unidad V1 muestra 1/3 actividades esenciales y solo una fila visible. El filtro de videos existe en código; falta confirmar los registros concretos que componen ese denominador.
5. Las bibliotecas generales de cuestionarios y flashcards aparecen vacías, mientras Anatomía permite entrar a esos materiales.
6. Hay una condición de código capaz de superar el límite compartido de XP de repaso al combinar V1/V2. No se reprodujo un saldo indebido en la cuenta.
7. Durante la ampliación apareció «No pudimos conectar» en varias superficies autenticadas. El acceso se recuperó; falta identificar la causa del backend.

También funcionaron la recuperación de una respuesta V2 tras un corte de red, la persistencia de posición en flashcards y lectura V1, el cierre del cuestionario normal, el diagnóstico aprobado sin regalar dominio ni XP, y el regreso mapa → detalle → atrás en escritorio. El plan conserva estas garantías y evita reemplazarlas al unificar interfaces.

La solución propuesta convierte el **detalle de la ruta en el espacio principal de estudio**, con la apariencia moderna de V2. El mapa conserva su función de orientación y su panel pasa a ser un resumen. V1 y V2 compartirán componentes, navegación y lenguaje visual; sus motores conservarán sus reglas y datos hasta que exista una migración independiente, explícita y validada.

### 1.1 Cómo leer las evidencias

| Marca | Significado | Lo que no demuestra |
|---|---|---|
| **OBSERVADO** | Estado o interacción vistos en la cuenta autenticada durante esta auditoría. | Que todos los usuarios, roles o rutas tengan el mismo problema. |
| **CÓDIGO** | Comportamiento o condición identificados en el commit local. | Que esa revisión sea la desplegada, ni que se haya ejecutado el caso completo en producción. |
| **PRUEBA LOCAL** | Resultado real de una suite existente, ejecutada en este trabajo. | Persistencia real, integración completa, accesibilidad o aceptación en producción. |
| **RIESGO POR VALIDAR** | Hipótesis con indicios y una comprobación propuesta. | Un defecto confirmado o una causa raíz demostrada. |
| **PROPUESTA** | Comportamiento, contrato, diseño o umbral que debe implementar y verificar el ejecutor. | Funcionalidad ya disponible. |

Prioridades: **P1** bloquea la liberación del flujo afectado por pérdida de coherencia, inaccesibilidad de una acción o error de lógica; **P2** afecta comprensión, continuidad o eficiencia; **P3** es refinamiento. No se atribuye un incidente clínico ni una exposición pública general a partir de esta cuenta.

### 1.2 Alcance y límites

Se recorrieron Inicio, Catálogo, Hoy, Progreso, mapa y lista, niveles, paneles V1/V2, detalle de Peritoneo y Vascularización del abdomen, currículo, cuestionarios, flashcards, repaso V1/V2, agenda, diagnóstico de admisión, lectura guiada y libre, materias, bibliotecas, búsqueda, recursos y consulta de actualización de versión. Se inspeccionaron notificaciones, ajustes de aprendizaje y seguridad de la cuenta sin modificar preferencias ni credenciales.

La cuenta mostraba explícitamente **Administrador**. La aceptación con un estudiante de permisos mínimos sigue pendiente. No se extrapola publicación, visibilidad o permisos de esta cuenta a todos los estudiantes.

La primera pasada E01–E33 no envió respuestas. La ampliación E34–E80 sí ejercitó respuestas correctas e incorrectas, calificaciones, finalizaciones, recarga y una interrupción temporal de red autorizadas por la petición de probar el funcionamiento. **La auditoría modificó el progreso de la cuenta; no fue exclusivamente de lectura.**

| Estado de la cuenta | Antes de las pruebas de respuesta | Último estado confirmado |
|---|---|---|
| XP total | 182 | **186** |
| XP de Vascularización del abdomen | 20 | **22** |
| Actividades de esa ruta | 16/34 | **18/34** |
| Peritoneo V1 | 4/6 | **4/6**, última comprobación al cerrar sus actividades |
| Sistema porta | Requería diagnóstico o conocimientos previos | Diagnóstico aprobado; **1/9** actividades completadas |
| Retención arterial | Evaluación pendiente | Se envió un fallo deliberado; luego se hizo refuerzo con ayuda. La agenda quedó con próximo repaso el 5 de noviembre a las 11:28, según estado observado. |

Los +4 XP corresponden a +2 de una respuesta V2 y +2 del repaso V1. Rehacer actividades V1 ya completadas no aumentó su contador; aprobar el diagnóstico y completar la lectura V2 no añadieron XP. El diagnóstico fallido y el aprobado son hechos reales de prueba guardados en la cuenta. No se borraron respuestas ni se intentó revertir el historial. Se completaron las sesiones de prueba descritas; no se afirma haber limpiado sesiones anteriores ajenas al recorrido.

El modo sin conexión se restauró y el tamaño temporal del navegador se devolvió al original. No se cambió código, configuración persistente, contenido editorial, versión adoptada, contraseña, preferencias ni publicación.

**Cobertura de dispositivos:** emulación de viewport, principalmente 390 × 844 y 1440 × 900; comprobaciones adicionales a 320 × 740. La inspección anterior a 768 × 1024 se conserva como antecedente, **fuera del alcance prioritario actual**. Emulación no equivale a iPhone/Android físico ni acredita Safari o teclado virtual real.

**No verificado en vivo:** respuesta construida con revelación/autocalificación, imagen interactiva y video con seguimiento completo; no eran el siguiente contenido elegible accesible en estos recorridos. Sí se inspeccionaron sus contratos y/o pruebas locales. Tampoco se verificaron paso real de 7/30 días, carreras con PostgreSQL real, adopción de otra revisión, cambios de credenciales, cierre de todas las sesiones, publicación editorial, lector de pantalla ni todos los roles y rutas. No se hizo una revisión médica exhaustiva ni una auditoría integral de seguridad. Las fases y la matriz convierten estas brechas en verificaciones explícitas; no se declaran aprobadas.

### 1.3 Cómo utilizar este plan

El modelo ejecutor debe empezar por F00, reproducir sobre el estado vigente y avanzar por las dependencias de la sección 7. H01–H32 son hallazgos; T01–T60 son pruebas futuras de aceptación, salvo cuando se indique una ejecución real en la sección 8. Las condiciones observadas pueden haber cambiado después de esta fecha. Un resultado local verde no cierra por sí solo un hallazgo de producción.

## 2. Recorrido observado

Las capturas corresponden a esta ejecución. La tabla E01–E33 describe la primera pasada y conserva sus límites en ese momento; la ampliación posterior aparece en 2.2. El anexo visual contiene una selección representativa y un índice de archivos.

| Paso | Acción y evidencia | Salud general | Resultado y límite |
|---|---|---|---|
| 01 | Abrir Inicio. E01 `01-inicio.jpg`. | Con fricción | Peritoneo aparece con 4/6; falta un acceso directo visible que lleve al punto de estudio. El resumen de repaso no integra claramente V2. |
| 02 | Entrar en Aprendizaje. E02 `02-aprendizaje.jpg`. | Funcional, jerarquía ambigua | Se llega al mapa con Anatomía y Peritoneo anatómico. Se mezclan contenedores y nombres de rutas sin suficiente diferenciación visual. |
| 03 | Abrir Anatomía → Abdomen. E03. | Funcional | Aparecen cuatro unidades conectadas. Se preserva la estructura del recorrido. |
| 04 | Seleccionar Retorno sistémico y VCI. E04. | Con fricción | El panel contiene currículo completo y el acceso al detalle es pequeño. Compite con la pantalla destinada a estudiar. |
| 05 | Cambiar a Recursos en el panel V2. E05. | Confuso | El desplazamiento vuelve arriba; aparecen puntos y un diagnóstico de otra unidad. La relación con la selección se pierde. |
| 06 | Abrir el detalle V2. E06. | Mejor base visual | «Abdomen» necesita un subtítulo para explicar la ruta. Los bloques de acción y progreso ocupan mucho espacio antes de las unidades. |
| 07 | Buscar unidades en el detalle. E07. | Con fricción | Hace falta desplazarse a través de indicadores antes de llegar al contenido de estudio. |
| 08 | Revisar actividades V2. E08. | Confuso | Nombres como «Relacionar conceptos» se repiten. Conviven «10 actividades» y «8/9» sin explicar el conjunto contado. |
| 09 | Abrir la actividad pendiente V2. E09. | Parcialmente verificado | Se muestra una pregunta que menciona un esquema, sin imagen visible. No se respondió ni se calificó. |
| 10 | Abrir detalles de sesión. E10. | Funcional, jerarquía mejorable | Se distinguen 182 XP totales y +0 XP en la sesión; no es por sí mismo un error contable. |
| 11 | Abrir Unidad 2 de Peritoneo desde el mapa. E11. | Defectuoso | «Ver video · Cuestionario» no permite anticipar qué se abrirá. Se ofrece continuar una actividad ya marcada como completada. |
| 12 | Abrir esa actividad. E12. | Defectuoso | Aparece «Triángulos del cuello», con dos opciones «Esternocleidomastoideo» y una opción de prueba. No se envió respuesta. |
| 13 | Volver y revisar Recursos V1. E13. | Defectuoso / intermitente | Se repite la actividad bajo Recursos. Una vez se vio el mapa sin nodos de unidades; más tarde se recuperó. No hay causa raíz confirmada de esa desaparición. |
| 14 | Abrir detalle V1 de Peritoneo. E14. | Inconsistente | Diseño anterior, cabecera extensa, antetítulo y texto explicativo. «Pausar» tiene demasiado protagonismo. |
| 15 | Revisar Unidad 2 en detalle. E15. | Defectuoso | 1/3 esenciales y una sola fila visible. El objetivo contiene «esta es una prueba de unidades varias». |
| 16 | Abrir flashcards desde el detalle. E16. | Con fricción | Se interpone otra pantalla de inicio antes de comenzar; usa lenguaje sobre confirmación del servidor. |
| 17 | Iniciar flashcards a 390 × 844. E17. | Funcional | Se ve tarjeta 1 de 3. La cabecera añade progreso global de ruta, que compite con el de la sesión. |
| 18 | Revelar la tarjeta. E18. | Funcional, limitado | Se muestra «membrana serosa» y cuatro grados de recuerdo. Se guardó la revelación; no se pulsó una calificación. |
| 19 | Abrir repaso general. E19. | Fragmentado | Entrada V1 con 5/10/20 minutos y un enlace aparte hacia V2. «Repasar flashcards» no describe todos los ítems posibles. |
| 20 | Iniciar ese repaso. E20. | Defectuoso | Aparece un cuestionario sobre cuello con dos opciones idénticas. No se respondió. |
| 21 | Abrir repaso V2. E21. | Con fricción | Hay dos objetivos pendientes y una sesión abierta que se debe retomar. Las categorías de pendiente no se entienden a primera vista. |
| 22 | Consultar agenda de retención. E22. | Útil, densa | Fechas de 7/30 días y estado de los objetivos. Exceso de texto técnico. El vencimiento no se trató como un fallo inventado. |
| 23 | Revisar detalle V2 a 390 × 844. E23. | Con fricción | La primera pantalla está dominada por progreso y XP; las unidades quedan fuera de vista. |
| 24 | Abrir recursos V2. E24. | Incompleto | Se listan fuentes y localizadores repetidos, pero no hay un vínculo visible para leer la guía citada. |
| 25 | Revisar panel V1 móvil. E25. | Con fricción | Hoja de pantalla casi completa; «Ver en la ruta» queda pequeño y al final. |
| 26 | Cerrar panel móvil con Escape. E26. | Funcional | Se vuelve al mapa sin un solapamiento aparente en esa anchura. |
| 27 | Activar vista de lista. E27. | Funcional | Alternativa útil al mapa. Debe conservarse y compartir los mismos datos y acciones. |
| 28 | Revisar mapa a 320 × 740. E28. | Parcialmente funcional | No hubo desbordamiento horizontal de documento; algunas etiquetas y migas quedan comprimidas o cortadas. |
| 29 | Abrir panel V2 a 320 × 740. E29. | Con fricción | XP ocupa mucho alto antes de las actividades. La composición no prioriza el resumen ni la ruta completa. |
| 30 | Abrir panel V2 a 768 × 1024. E30. | Defectuoso | La combinación de panel lateral y barra inferior tapa el pie del panel. |
| 31 | Verificar geometría y punto de clic. E31. | Defectuoso, confirmado | «Retomar sesión» ocupa y=964–1012; su centro alcanza «Rutas de aprendizaje». El documento no tiene scroll adicional que lo resuelva. |
| 32 | Abrir guía a 1440 × 900. E32. | Funcional, parcial | Lector con secciones y navegación. «Terminé la lectura» está disponible en la primera sección: es autodeclaración, no evidencia de dominio; no se completó. |
| 33 | Pulsar «Revisar actualización». E33. | Mensaje incorrecto | La consulta informa «No se pudo adoptar otra versión», aunque solo se solicitó una vista previa. No se adoptó una versión. |

### 2.1 Comprobaciones adicionales

- Las pestañas V2 respondieron a flecha derecha; las V1 no cambiaron con esa tecla. Hace falta verificar roles, foco y comportamiento completo con tecnología de asistencia.
- Una sesión V2 abierta pasó a ser la recomendación prioritaria. Esta protección no debe eliminarse con un cambio visual; falta una explicación clara y una política de salida que preserve el trabajo.
- En el mapa ya existen virtualización, memorias de navegación y una vista alternativa. Su sustitución indiscriminada podría empeorar rendimiento y continuidad.
- Se midió **una sola navegación** a repaso V2: TTFB 127 ms, DOMContentLoaded 1.892 ms y evento load 1.905 ms. No son medidas de LCP ni INP ni percentiles representativos. El JSON conserva la muestra y tiempos de recursos; no permite afirmar que toda la plataforma sea lenta o rápida.

### 2.2 Ampliación funcional solicitada por el usuario

La columna «Salud» evalúa el recorrido observado, no acredita todas sus variantes. La sesión comenzó con datos de aprendizaje preexistentes.

| Paso | Acción / evidencias | Salud | Resultado observado |
|---|---|---|---|
| 34 | Abrir Catálogo y Reintentar. E34–E35. | Intermitente | «No pudimos conectar»; recuperó después de Reintentar. No se capturó el error HTTP original. |
| 35 | Recorrer Hoy, abrir/cerrar ajustes y revisar Progreso. E36–E38. | Con incoherencias | Se recorrieron completos. Hoy separa V1/V2 y «Continuar mi ruta» apunta a repaso; Progreso reproduce el objetivo de prueba. Ajustes sin guardar cambios. |
| 36 | Responder V2 sin red, recargar y reintentar. E39–E41. | Funcional | Conservó solicitud pendiente, no adelantó el progreso; tras recuperar red aceptó una vez. 16→17/34, +2 XP, cierre y recarga persistidos. El radio se desmarcó visualmente al recargar aunque el envío seguía recuperable. |
| 37 | Fallar deliberadamente una evaluación diferida. E42–E44. | Lógica conservadora; contexto insuficiente | Error confirmado, 0 XP, refuerzo a +10 min. La entrada genérica no explicaba claramente que era retención de 7 días. La agenda mostró que se realizó 22,6 días después del primer dominio, sin fingir que ocurrió al día 7. |
| 38 | Completar flashcards V1 y recargar entre tarjetas. E45. | Funcional | «Otra vez» en actividad normal avanzó a la siguiente tarjeta; no reprodujo el bucle de repaso. Recarga conservó tarjeta 2 sin revelar. Rehacer la actividad dejó 4/6 y no duplicó premio. |
| 39 | Responder mal dos veces un repaso V1. E46–E48. | Defectuoso | Dos opciones con el mismo texto; la segunda se calificó incorrecta. El mismo ítem reapareció de inmediato en rondas 2 y 3. Explicación de prueba. |
| 40 | Finalizar último ítem del repaso. E49–E50. | Defectuoso | El cuerpo quedó vacío, sin resumen ni siguiente acción. Recargar recuperó «Repaso completado». La respuesta de la última ronda no tuvo feedback visible; no se infiere su calificación a partir de la captura vacía. |
| 41 | Completar cuestionario V1 normal. E51–E53. | Cierre funcional; contenido defectuoso | 3/3 y cierre correctos; la posición persistió tras recargar. Todas las preguntas tenían opciones duplicadas y explicaciones de prueba. En el corte breve de red de este caso no se capturó el estado pendiente: no equivale a la prueba offline V2. |
| 42 | Leer secciones 1→2, recargar y terminar lectura V1. E54–E55. | Persistencia funcional; contenido degradado | Conservó 2/11. La tabla se aplanó a texto con barras. «Terminé esta lectura» cerró desde la sección 2: es autodeclaración, no lectura demostrada de once secciones ni dominio. |
| 43 | Diagnóstico V2: relaciones, texto breve, secuencia. E56–E58. | Defectuoso por calificación | Unicidad de relaciones y controles de ordenación funcionaron. La respuesta breve equivalente a la explicación recibió 0; las otras recibieron 1. Resultado reprobado, sin restar XP ni conceder acceso. |
| 44 | Revisar cooldown y hacer refuerzo con ayuda. E60–E61. | Política conservadora; pista pobre | Se respetó el cooldown. Pista genérica, fuente consultable y relaciones correctas con ayuda; 0 XP, sin dominio ficticio y próximo repaso confirmado al día siguiente. |
| 45 | Notificaciones, perfil y seguridad. E62. | Inspección parcial satisfactoria | Notificaciones vacías y cierre con Escape. Rol Administrador. Seguridad accesible; no se cambiaron contraseña ni sesiones. |
| 46 | Bibliotecas generales de cuestionarios/flashcards. E63–E64. | Defectuoso | Ambas aparecen vacías. El contraste por materia demuestra que sí hay materiales accesibles en la misma cuenta. |
| 47 | Buscar materia y abrir Anatomía. E65–E66. | Funcional | «anatomia» encuentra Anatomía/Neuroanatomía sin necesitar tilde; Anatomía muestra 100 guías, 2 flashcards y 2 cuestionarios. Los cuestionarios se abren desde sus temas. |
| 48 | Cuestionario directo de base del cráneo. Registro DOM; E67 descartada como evidencia visual. | Modalidad ambigua | Muestra 44 preguntas con respuestas expuestas, sin contestación interactiva. Es el renderer actual de consulta; no se declara roto por no ser examen, pero «Cuestionario» promete una modalidad diferente a otras entradas. |
| 49 | Flashcards fuera de ruta. E68. | Funcional | Enter revela, Siguiente cambia de tarjeta y restablece anverso. Aviso distingue práctica libre del guardado guiado. |
| 50 | Búsqueda global «peritoneo». E69. | Con fallos | Resultados con tokens técnicos del documento. Clic abre la guía; ArrowDown/Enter en el campo no navega. No se concluye que Tab o toda navegación por teclado sean imposibles. |
| 51 | Guía libre, índice, salto de sección y recursos. E70–E71. | Funcional | Índice despliega y salta a sección; tabla rica legible. No se cambiaron favoritos, fuente ni resaltados. |
| 52 | Cuestionario libre de la guía. E72–E73. | Contenido defectuoso; cierre funcional | Q2: A y B son «Parietal y visceral», B incorrecta. Q3 también duplica opciones. Resultado 2/3=67%; volver cierra modal y conserva la sección de lectura, aunque no necesariamente el mismo píxel de scroll. |
| 53 | Volver a rutas, Inicio y Guías. E74. | Intermitente | «No pudimos conectar» persistió tras un reintento. HTML/recursos y get-session respondieron 200; esto no prueba salud de /v1/auth/me. Más tarde se recuperó el acceso a la ruta. |
| 54 | Repetir diagnóstico después del cooldown. E75–E76. | Funcional en esta variante | Rotó las preguntas: dos relaciones y un caso de opción. Aprobado, acceso a Sistema porta, 0 XP, progreso 17/34. La pregunta breve no reapareció: no se retestó su equivalencia ni se dio por corregida. |
| 55 | Abrir y completar lectura V2 de Sistema porta. E77–E78. | Guardado funcional; transición larga | 17→18/34, 186 XP. «Continuar a la práctica» aún requiere finalizar y elegir la siguiente actividad. Solo se habilitó el siguiente ejemplo; no se forzó el acceso a formatos posteriores. |
| 56 | En escritorio: mapa → unidad → detalle → Atrás. E79 y DOM. | Funcional en esta repetición | El enlace llevó leccion=porta; Atrás recuperó panel y cuatro nodos. Lista y mapa mostraron las mismas unidades; recarga conservó el nivel. H19 no se reprodujo de nuevo, pero no se declara solucionado. |
| 57 | Verificar estado final y restaurar navegador. E80. | Funcional | 18/34, 186 XP, 22 XP de ruta. Se devolvió viewport original y se dejó la ruta accesible. |

## 3. Hallazgos trazables

### H01 — Identidad de actividad y contenido incoherentes · P1

**Evidencia:** OBSERVADO E11–E12, E15 y E51–E53. La actividad 4 de la unidad 1 también abrió el cuestionario de cuello. Una actividad de Peritoneo se llama «Ver video», lleva etiqueta Cuestionario y abre contenido de cuello. En código, el nombre editorial del paso se combina con la proyección elegida.

**Impacto:** el estudiante no sabe qué va a realizar y puede estudiar un tema ajeno a la unidad. Cambiar solamente el icono o sustituir «video» por «cuestionario» no corrige una asociación de contenido equivocada.

**Acción:** inspeccionar la cadena ruta → versión → unidad → paso/actividad → opción → activo/ítem. Identificar si existe una asociación errónea, un nombre desactualizado o una proyección alternativa válida. Corregir mediante revisión editorial versionada; conservar intentos e historial. Mientras un contenido confirmado inválido no pueda usarse correctamente, mostrar una indisponibilidad explícita en el ámbito afectado y una alternativa válida si existe. No retirar rutas completas por inferencia.

**Verificación y cierre:** fases F01; pruebas T01–T03. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H02 — Preguntas y objetivos con datos de prueba · P1

**Evidencia:** OBSERVADO E12, E15, E20, E46, E51, E72–E73. Opciones duplicadas, textos como `asdasdas`/`dasdasd` y un objetivo de prueba. En la guía libre, ambas opciones de la pregunta 2 dicen «Parietal y visceral»: elegir B se marca incorrecto; A aparece como correcta. No es solo un defecto cosmético. No se verificó el alcance de acceso fuera de la cuenta utilizada.

**Acción:** inventario dirigido de materiales accesibles al estudiante; validación editorial previa a publicación sobre opciones duplicadas, respuestas resolubles, referencias, objetivos y restos de pruebas. La normalización de duplicados debe conservar distinciones médicas significativas. Una alerta por semejanza requiere revisión; no reescribir preguntas médicas automáticamente.

**Verificación y cierre:** fases F01; pruebas T01–T02, T42. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H03 — Actividades esenciales invisibles · P1

**Evidencia:** OBSERVADO E15: 1/3 esenciales y una sola fila. CÓDIGO: `learning-path-screen.tsx` y `lesson-detail-panel.tsx` filtran opciones `video` y omiten pasos sin otras opciones.

**Distinción:** el filtro está confirmado; atribuir los dos pasos ausentes concretos a ese filtro requiere inspeccionar sus datos. Tampoco se ha demostrado que sean reproducibles o estén retirados legítimamente.

**Acción:** ningún paso obligatorio desaparece por falta de renderer. Mostrarlo con estado disponible, sustituido, dispensado o no disponible, según confirmación del servidor. Si debe dejar de ser obligatorio, resolverlo mediante contrato editorial/versionado; nunca ajustar solo el denominador visual.

**Verificación y cierre:** fases F01, F05; pruebas T03–T04. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H04 — Acción de continuación tapada en tablet · Diferido

**Alcance:** hallazgo real de la primera pasada, diferido por la prioridad posterior del usuario. No bloquea por sí solo la entrega móvil/escritorio. Si el mismo defecto aparece en uno de los dispositivos prioritarios, ese caso sí será bloqueante.

**Evidencia:** OBSERVADO E30–E31 y `geometria-tablet.json`. A 768 × 1024 el pie queda debajo de la barra inferior. El mapa cambia a panel lateral desde 768 px; otros ajustes de navegación cubren rangos diferentes.

**Acción:** una única regla de espacio útil que incluya cabecera, navegación inferior y safe area. Panel como rejilla con cabecera, cuerpo desplazable y pie dentro del área disponible; evitar restas de alto desconectadas entre canvas y panel.

**Verificación y cierre:** alcance tablet diferido; ver sección 9. La variante tablet de T14 solo se exige cuando se reactive ese alcance. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H05 — Repaso V1 encadena el mismo fallo · P1

**Evidencia:** CÓDIGO en `postgres-learning-activities.ts`: `sessionRetry` mantiene el ítem sin finalizar y el índice vuelve al primero no finalizado. En `review-activity.tsx` se reutiliza la revelación guardada del mismo ítem. En la ampliación se enviaron dos fallos y el mismo ítem reapareció inmediatamente en rondas 2 y 3 (E46–E48). La repetición inmediata queda observada; el caso de adelantarse a otros ítems nuevos y la revelación de una flashcard repetida requieren pruebas específicas.

**Impacto:** un ítem puede reaparecer inmediatamente antes de otro nuevo y con la respuesta ya revelada, contradiciendo el intervalo de refuerzo y la recuperación de memoria que se pretende evaluar.

**Acción:** diferenciar respuesta aceptada, ítem terminado para la pasada actual y reaparición elegible. Programar la reaparición con hora del servidor; avanzar por otros ítems elegibles. Si no queda ninguno, cerrar la pasada con el repaso pendiente anunciado. No bloquear diez minutos la pantalla ni convertir el refuerzo en nueva evidencia de dominio por proximidad.

**Verificación y cierre:** fases F03; pruebas T18–T21. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H06 — Tope de XP de repaso inconsistente entre motores · P1

**Evidencia:** CÓDIGO en `rewards.ts`: V2 usa `min(base, max(0, 20 - total))`; V1 usa `total >= 20 ? 0 : 2` sobre la misma categoría diaria `review_applied`. Una secuencia mixta que alcance 19 deja que V1 sume 2. Es una condición aritmética verificable, no un saldo indebido observado en esta cuenta.

**Acción:** aplicar límite residual común dentro de una transacción y protección de concurrencia compartida por ambos caminos. No basta con cambiar la fórmula si cada motor serializa mediante un bloqueo distinto. No recalcular ni retirar XP históricos automáticamente.

**Verificación y cierre:** fases F04; pruebas T27–T29. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H07 — La navegación pierde el lugar de estudio · P2

**Evidencia:** OBSERVADO E06–E09, E14–E18. Desde la unidad se llega a la cabecera general; desde el reproductor se regresa al mapa o a la base de la ruta, sin recuperar siempre la unidad. CÓDIGO: el retorno validado actual está centrado en URLs de mapa y la pantalla V1 no recibe el mismo contexto que V2. Contraprueba de la ampliación: el enlace V2 con `leccion=porta` sí abrió la unidad correcta, y Atrás restauró el mapa con su panel; se debe conservar ese camino funcional. El problema no ocurre en todas las transiciones.

**Acción:** contexto explícito de origen con ruta, unidad, objetivo, actividad, pestaña y ancla. Regreso del reproductor al detalle de la unidad por defecto; acceso secundario al mapa con su contexto conservado. Validación estricta de destinos internos.

**Verificación y cierre:** fases F06; pruebas T09–T12. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H08 — Dos diseños para una misma función · P2

**Evidencia:** OBSERVADO E06/E23 frente a E14/E15. CÓDIGO: despacho a `V2PathScreen` o `LearningPathScreen`.

**Acción:** una pantalla de ruta y una biblioteca de componentes basadas en V2, con adaptadores de presentación V1/V2. La interfaz del estudiante no mostrará B1/B2 ni detalles del motor. Una capacidad ausente no se simula ni genera estados de dominio ficticios.

**Verificación y cierre:** fases F06, F09; pruebas T05–T08. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H09 — El panel del mapa compite con el detalle · P2

**Evidencia:** OBSERVADO E04–E05, E25, E29. Actividades y Recursos duplican el currículo; «Ver ruta completa» o «Ver en la ruta» es poco visible.

**Acción:** panel de resumen: nombre de unidad, estado, avance pertinente, siguiente acción y botón principal «Abrir ruta». Un acceso secundario puede retomar la acción recomendada válida. Retirar del panel las listas completas y las pestañas Actividades/Recursos; trasladarlas al detalle común.

**Verificación y cierre:** fases F06, F09; pruebas T09–T10. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H10 — Cabeceras redundantes y baja densidad útil · P2

**Evidencia:** OBSERVADO E06–E07, E14, E16, E19, E23. Antetítulo, título genérico, subtítulo y grandes métricas desplazan el estudio.

**Acción:** título único y autosuficiente. «Vascularización del abdomen», «Peritoneo», «Repasos pendientes», «Drenaje venoso gonadal» son ejemplos de títulos; los dos últimos requieren que correspondan al contenido editorial real. Datos de sesión, estado y tipo se presentan como etiquetas funcionales separadas, sin reconstruir una pila de antetítulo/título/subtítulo.

**Verificación y cierre:** fases F09; pruebas T07, T13. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H11 — Actividades V2 indistinguibles · P2

**Evidencia:** OBSERVADO E08. CÓDIGO: títulos generados solo por `kind` y `scaffold`; el DTO público no contiene un título editorial específico.

**Acción:** incorporar metadatos públicos seguros, como `displayTitle`, y una etiqueta de formato independiente. No usar el enunciado de la pregunta, respuesta, rúbrica privada ni ítem reservado como título. Compatibilidad con versiones antiguas mediante un fallback claro dentro de su objetivo.

**Verificación y cierre:** fases F01, F05, F09; pruebas T05–T06, T35. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H12 — Contadores con distintos conjuntos y unidades · P2

**Evidencia:** OBSERVADO E03/E08: unidades con 8+10+10+8 actividades frente a progreso global 16/34; una unidad muestra 10 y 8/9. CÓDIGO: la cifra total visible puede incluir remediales, mientras el progreso filtra obligatorias no remediales.

**Distinción:** no se ha demostrado que el servidor sume mal; se comparan conjuntos distintos sin etiquetarlos. También es válido que actividades completadas y objetivos comprobados difieran.

**Acción:** separar «Actividades obligatorias», «Práctica adicional», «Objetivos comprobados» y «Repasos pendientes». Usar el mismo conjunto identificable para lista y contador. Exponer exenciones como tales, no como trabajo realizado.

**Verificación y cierre:** fases F05; pruebas T04, T23, T30. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H13 — Inicio no resume la experiencia completa · P2

**Evidencia:** OBSERVADO E01/E19/E21 y E36/E38: Hoy y Progreso ya se recorrieron completos; «Continuar mi ruta» en Hoy llevó al repaso V1; CÓDIGO: resumen y repaso del dashboard dependen del hogar V1 y CSS oculta el enlace de ruta. Un indicador secuencial usa cantidad completada e índice, lo que puede representar mal un avance no lineal.

**Acción:** resumen común de matrículas y acciones de ambos motores. «Continuar» debe llevar a la ruta activa y unidad pertinente. Avance por identidad real de actividades, no por pintar los primeros N elementos. No sumar tarjetas, ítems y objetivos como si fueran la misma unidad.

**Verificación y cierre:** fases F05, F06; pruebas T08, T23, T30. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H14 — Repaso dividido y promesas imprecisas · P2

**Evidencia:** OBSERVADO E19–E22. Una entrada dice flashcards pero abre cuestionario; V2 usa otra superficie. Dos objetivos pendientes y un ítem en el lote pueden corresponder a mantenimiento y retención diferentes.

**Acción:** centro común «Repasos pendientes», con categorías comprensibles y conteos por unidad real. Planificar la sesión desde el servidor respetando motor, versión y prioridad. Si no puede mezclarse una sesión, ofrecer bloques sucesivos bajo la misma interfaz. 5/10/20 minutos deben ser estimaciones explícitas, no una promesa falsa basada en un máximo de ítems.

**Verificación y cierre:** fases F03, F05; pruebas T22–T26. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H15 — XP y diagnóstico ajenos a la unidad seleccionada · P2

**Evidencia:** OBSERVADO E05 y CÓDIGO en `motivation.tsx`: si no encuentra una colocación de la unidad, recurre a otra disponible. Puede aparecer información de Sistema porta en el panel de VCI.

**Acción:** el resumen de unidad solo muestra su estado. Una oferta de otra unidad se rotula con su destino y vive en el ámbito de ruta, fuera del resumen contextual. Distinguir XP totales, de ruta y de sesión.

**Verificación y cierre:** fases F05, F06; pruebas T10, T30–T31. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H16 — Recursos sin lectura y soporte visual incompleto · P2

**Evidencia:** OBSERVADO E24: fuente sin vínculo accionable y localizadores repetidos. E09 menciona un esquema sin imagen, lo que exige revisión editorial. CÓDIGO en el renderer `study.tsx`: si hay `assetKey`, muestra que el recurso visual no está disponible en ese visor.

**Distinción:** la referencia verbal a un esquema no prueba por sí sola que falte un archivo. Tampoco se verificó en vivo una lectura V2 con ese `assetKey` concreto.

**Acción:** diferenciar material para estudiar de cita bibliográfica; enlazar un lector/versionado cuando el recurso exista y los permisos lo permitan. Mostrar una sola referencia legible. Resolver imágenes mediante acceso autorizado existente o una extensión compatible; nunca incluir rutas de almacenamiento privadas ni materiales de evaluación reservados.

**Verificación y cierre:** fases F01, F06; pruebas T16–T17, T35. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H17 — Sesión abierta sin suficiente contexto de salida · P2

**Evidencia:** OBSERVADO E09/E21: retomar domina otras acciones y no se observó una pausa de estudio claramente explicada.

**Acción:** «Guardar y volver» conserva la sesión abierta; «Retomar sesión» explica qué se retoma. Salir de la pantalla no es abandonar ni completar. Cambiar de actividad con sesión abierta solo será posible si el servidor ofrece una transición segura; de lo contrario, explicar el bloqueo y ofrecer la recuperación. Una eventual opción de abandono será explícita y no borrará hechos aceptados.

**Verificación y cierre:** fases F02, F06; pruebas T11–T12, T32–T34. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H18 — Error de consulta presentado como adopción fallida · P2

**Evidencia:** OBSERVADO E33; CÓDIGO `upgrade.tsx` reutiliza el mensaje de adopción ante un 409 de vista previa. `upgrade-client.tsx` sí separa GET de consulta y POST de adopción.

**Acción:** mensajes y recuperación por operación. Consultar: «No pudimos consultar la actualización», con motivo accionable si está confirmado. Adoptar: estado confirmado o pendiente de recuperar, conservando la misma solicitud idempotente.

**Verificación y cierre:** fases F02; pruebas T36. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H19 — Pérdida intermitente de nodos al volver · P2, por reproducir

**Evidencia:** OBSERVADO una vez en E13; el mapa volvió a mostrar nodos después. No se atribuye el fallo a virtualización, caché ni ResizeObserver sin prueba.

**Acción:** reproducir secuencia mapa → actividad → regreso, con cambios de tamaño, contenedores, unidad y caché. Capturar nivel solicitado, resultado autorizado, IDs montados, medidas y desplazamiento, sin datos sensibles.

**Verificación y cierre:** fases F06, F07; pruebas T15, T37. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H20 — Posibles costes de carga redundantes · P2, por medir

**Evidencia:** CÓDIGO: detección de motor con una consulta legacy seguida de V2; catálogo obtiene estado por ruta V2; navegación y foco provocan varias lecturas. OBSERVADO: una muestra temporal, insuficiente para percentiles.

**Acción:** trazar antes de optimizar; resolver el motor por metadatos autorizados, agrupar estados cuando convenga y deduplicar solicitudes del mismo ámbito. Preservar aislamiento por usuario, invalidación, versiones y prioridad del servidor. Conservar la virtualización existente salvo evidencia de un defecto.

**Verificación y cierre:** fases F07; pruebas T37–T39. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H21 — Accesibilidad inconsistente · P2 funcional

**Evidencia:** OBSERVADO: pestañas V1 sin navegación por flechas, etiquetas comprimidas a 320 px y botón cubierto en tablet. V2 sí cambió de pestaña con flecha; Escape cerró el panel móvil.

**Acción:** componentes comunes para pestañas, foco y estados. Objetivos táctiles cómodos, nombre accesible completo, icono más texto y color redundante. Verificar lector de pantalla y contraste con herramientas, no solo con capturas.

**Verificación y cierre:** fases F06, F07; pruebas T13–T14, T40, T45. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H22 — Lanzamiento y lenguaje añaden trabajo al estudiante · P2

**Evidencia:** OBSERVADO E16/E19/E22 y E77–E78. Paso de «Comenzar» después de elegir actividad y textos sobre servidor, listas congeladas y mecanismos internos. En lectura V2, «Continuar a la práctica» llevó a «Respuestas guardadas», luego «Finalizar sesión» y después «Siguiente actividad»; no abrió directamente la práctica que promete.

**Acción:** un clic para abrir/retomar una actividad cuando no haga falta elegir duración o modalidad. Para crear un intento, usar una acción explícita, nunca una mutación por precarga de enlace. Reservar detalles técnicos para diagnóstico interno; en producto usar «Progreso guardado», «Volver a la unidad», «Próximo repaso».

**Verificación y cierre:** fases F02, F06; pruebas T09, T11, T32, T47. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H23 — Consultar una actividad completada se confunde con volver a evaluarla · P2

**Evidencia:** OBSERVADO: filas completadas V1 aún ofrecen continuar; varias completadas V2 no ofrecen una consulta distinguible de un nuevo intento.

**Acción:** diferenciar «Consultar» de «Practicar de nuevo». Consultar usa materiales autorizados y no crea respuestas, premios ni dominio. Repetir requiere elegibilidad del servidor; una evaluación reservada no se convierte en biblioteca abierta.

**Verificación y cierre:** fases F02, F05, F06; pruebas T17, T24, T34–T35. Se exige la conducta descrita en la acción y evidencia de la puerta de salida correspondiente.

### H24 — El último ítem de repaso V1 deja la pantalla vacía · P1

**Evidencia:** OBSERVADO E49–E50. Después de contestar la tercera ronda, solo quedaron cabecera y «Progreso guardado». Recargar mostró el resumen final. CÓDIGO: ReviewActivity obtiene el ítem de currentIndex y retorna null antes de procesar feedback cuando ya no hay ítem. ActivityShell, simultáneamente, oculta el panel de completado mientras hay feedback. Ambas decisiones dejan un estado sin cuerpo visible.

**Acción:** modelar explícitamente feedback final y resumen, sin depender de que exista un siguiente ítem. Conservar el feedback del recibo y una transición «Ver resumen». Una finalización confirmada nunca puede producir una pantalla vacía. Evitar “arreglarlo” descartando la última respuesta o adelantando un cierre local no confirmado.

**Verificación y cierre:** F02; T41. Cubrir último ítem correcto/incorrecto, quiz/flashcard de repaso, con y sin reaparición, recarga y recibo duplicado. La pantalla siempre ofrece resultado o recuperación accionable.

### H25 — Respuesta breve equivalente rechazada en diagnóstico · P1

**Evidencia:** OBSERVADO E58 y recibo resumido. Pregunta: «Sin ayuda: ¿qué venas se unen para formar VCI?». Respuesta enviada: «Las venas ilíacas comunes derecha e izquierda». La explicación del propio sistema dice que la confluencia de ilíacas comunes forma la VCI, pero acceptedResponses guardó puntuaciones [1,0,1]. CÓDIGO: normalizeShortAnswer conserva acentos, negación y unidades; gradeShortAnswer exige igualdad completa con alguno de acceptedAnswers.

**Interpretación:** no basta con cambiar la normalización general. El contrato de igualdad exacta puede ser deliberado, pero las variantes editoriales de esta pregunta son insuficientes para su consigna. El fallo produce un bloqueo diagnóstico injustificado para esa formulación. El segundo diagnóstico aprobado rotó preguntas y no refuta este hallazgo.

**Acción:** revisar aliases aceptados y alcance de cada consigna con responsable del contenido; validar paráfrasis previsibles y negativos cercanos. Preferir términos/acotaciones claras y aliases explícitos revisados. Si una respuesta requiere explicación libre, usar el tipo de actividad adecuado con su política de verificación. No aceptar cualquier frase que contenga una palabra correcta ni introducir un corrector generativo global como parche. Conservar evaluaciones históricas y crear una corrección versionada con tratamiento explícito de intentos afectados.

**Verificación y cierre:** F01; T43. La frase observada y variantes aprobadas son aceptadas; negaciones, arterias por venas, lateralidad o unidades equivocadas siguen fallando. El diagnóstico mantiene las reglas de acceso y ausencia de dominio/XP automático.

### H26 — Bibliotecas vacías aunque existen materiales por materia · P1 de descubrimiento

**Evidencia:** OBSERVADO E63–E66 en la misma cuenta. /asignaturas?tipo=quiz y tipo=flashcards indican que no hay materiales; Anatomía muestra dos de cada tipo y permite abrirlos. CÓDIGO: la página global solicita kind a getPublishedStudyCatalog; el backend filtra content_items.kind antes de que getStudySummaryCatalog proyecte quizzes/flashcards embebidos en guías. La consulta por materia sí obtiene los contenedores y permite la proyección.

**Acción:** definir el catálogo por capacidad de estudio y permisos, no solo por el tipo del contenedor. Resolver proyecciones en el origen de datos o con una consulta compatible que incluya contenedores pertinentes; paginar y deduplicar por identidad de recurso/proyección. No convertir “traer los primeros 1.000 elementos” en solución definitiva. Diferenciar error de carga de vacío real.

**Verificación y cierre:** F05; T44. El conjunto global equivale a la unión autorizada por materias para cada tipo, con conteos/paginación correctos. Probar materiales nativos y embebidos, sin duplicar una guía y su video vinculado.

### H27 — «Cuestionario» significa consulta o práctica según la entrada · P2

**Evidencia:** el contenido directo de base del cráneo presenta preguntas y respuestas abiertas; el quiz de la guía abre un modal interactivo; la ruta crea intentos y registra progreso. Las flashcards libres sí explican el ámbito del guardado (E68).

**Acción:** distinguir «Consultar preguntas», «Practicar» y actividad de ruta, mediante acciones y etiquetas funcionales. Ofrecer el mismo componente interactivo cuando el material sea apto, manteniendo un modo de consulta explícito. No convertir un banco de respuestas en una evaluación reservada, ni prometer XP/retención de la práctica libre. El contexto de ruta debe preservarse si el usuario entra a la versión guiada.

**Verificación y cierre:** F02/F05/F06; T24, T46. Cada modalidad anuncia y produce su efecto real; cerrar práctica libre no altera los contadores guiados ni impide regresar al material.

### H28 — La búsqueda expone tokens técnicos y no opera como sugiere el combobox · P2

**Evidencia:** OBSERVADO E69: fragmentos con «doc», «heading», «paragraph», «text», «highlight», «listItem». CÓDIGO: content-search.ts del API recorre recursivamente todos los valores string del JSON, incluidos tipos y marcas; la implementación web tiene un extractor de texto rico más específico. El campo declara combobox, pero el manejador inspeccionado solo atiende Escape; ArrowDown/Enter no seleccionaron un resultado en la prueba.

**Acción:** extracción semántica compatible con el esquema, compartida o contractualmente equivalente entre API y web. Excluir metadatos del editor y no indexar respuestas reservadas fuera del alcance permitido. Implementar navegación por resultados y foco, o adoptar un patrón accesible de búsqueda con enlaces que no prometa interacción inexistente.

**Verificación y cierre:** F05/F07; T45. Snippets legibles, búsqueda con/sin tilde, Escape, Tab y la interacción de teclado elegida; la prueba debe cubrir el extractor realmente usado por el servidor.

### H29 — La guía pierde estructura dentro de la actividad V1 · P2 funcional

**Evidencia:** E54 muestra una tabla convertida en párrafo con separadores verticales; la misma guía libre conserva tabla y jerarquía (E71). La posición de sección sí persistió.

**Acción:** mantener estructura semántica de tablas, listas, imágenes y énfasis mediante renderer seguro compatible con el snapshot del intento. Reutilizar el lector cuando sea viable sin reemplazar su versión fijada por una guía “más reciente”. No insertar HTML sin sanitizar. Preservar progreso de sección y retorno.

**Verificación y cierre:** F01/F06; T16, T48. Mismo significado y relaciones de celdas en guía libre/guiada; lectura navegable en móvil y teclado; recarga conserva sección.

### H30 — Se registra ayuda al ofrecer una pista genérica · P2 pedagógico

**Evidencia:** en el refuerzo arterial, Pista mostró «Revisa el enunciado y las relaciones clave». El intento pasó a ser asistido; Fuente sí mostró contenido pertinente. CÓDIGO: fallback de hint cuando no existe hints[0].

**Acción:** una actividad que ofrece Pista debe tener una pista editorial útil. Si no existe, omitir/deshabilitar esa ayuda con explicación mínima, sin crear un evento de ayuda vacía; la consulta de fuente sigue su política. No deshacer asistencia real ni dar XP/dominio retroactivo por una decisión de UI.

**Verificación y cierre:** F01/F02; T49. Pista útil y disponible registra ayuda una vez; pista inexistente no se presenta como ayuda válida. Respuestas con ayuda mantienen las restricciones del motor.

### H31 — Fallo intermitente de acceso al área autenticada · P1 de disponibilidad, causa pendiente

**Evidencia:** E34 recuperó con Reintentar; E74 afectó ruta, Inicio y Guías y no recuperó en el primer reintento. Más tarde el acceso funcionó. El documento y assets devolvieron 200 y no hubo error útil de consola; esto no equivale a observar la solicitud server-to-server. No se perdió la sesión autenticada ni se demostró caída global.

**CÓDIGO:** AuthenticatedAppLayout muestra ese estado cuando getCurrentUser devuelve unavailable; puede deberse a respuesta no 200 de /v1/auth/me o a validación fallida del DTO. Esta es una localización del punto de decisión, no la causa de producción confirmada.

**Acción:** correlación interna sin datos personales entre UI, servidor web y API; registrar tipo de fallo, estado, latencia y etapa de validación. Reintento acotado para lectura recuperable, sin bucles ni logout por indisponibilidad. Diferenciar sesión expirada, falta de permiso, fallo temporal y respuesta incompatible. Conservar solicitudes pendientes y su identidad.

**Verificación y cierre:** F00/F02/F07; T50. Forzar cada clase en pruebas, recuperar sin pérdida de trabajo y analizar el incidente real con logs autorizados. Si la causa real no se identifica, queda NO VERIFICADO, con evidencia y riesgo residual; no «resuelto» porque volvió a cargar.

### H32 — El diagnóstico no explica suficientemente el resultado individual · P2

**Evidencia:** E56–E58 y E76. Se muestra avance de ruta 17/34 durante una evaluación de tres preguntas, sin un contador claro de la evaluación. Al terminar, «Respuestas confirmadas» dice «Respuesta guardada» en cada ítem, pero no presenta claramente lo enviado ni qué ítem causó el fallo. Para confirmar el falso negativo hubo que contrastar un recibo técnico.

**Acción:** avance de sesión separado del de ruta. En la pantalla de resultados, mostrar corrección por pregunta, respuesta enviada y feedback permitido, o motivo pedagógico concreto cuando una evaluación no permita revelar la solución. No exponer el banco reservado ni futuras preguntas; limitarse a información que el contrato autorice después de terminar.

**Verificación y cierre:** F02/F09; T31, T51. El usuario distingue «guardada» de «correcta», entiende qué reforzar y cuándo reintentar. El diagnóstico aprobado conserva su mensaje de acceso sin dominio otorgado.

## 4. Experiencia objetivo

Esta sección define el destino del producto. Los cambios necesarios para acceder, responder, guardar y volver pertenecen a F01–F08; jerarquía estética, tipografía, color y composición final se aplican en F09, una vez estable el funcionamiento.

### 4.1 Reglas de producto obligatorias

1. **Un título que se explique solo.** Sin antetítulo ni subtítulo descriptivo bajo la cabecera. Las instrucciones necesarias para responder viven junto a la actividad, no como segunda presentación de la página.
2. **Unidad → objetivo → actividad.** Al expandir una unidad se reconocen sus objetivos y todas sus actividades correspondientes, incluidas las que aún no se pueden iniciar. No obligar a abrir otro acordeón por objetivo para descubrirlas.
3. **Detalle de ruta como lugar de estudio.** El mapa orienta; el panel resume; el detalle organiza; el reproductor permite realizar la actividad.
4. **Una acción principal por contexto.** «Abrir ruta» en el resumen del mapa; «Continuar…» o «Retomar sesión» en el detalle. Revisar, consultar o explorar son acciones secundarias.
5. **La interfaz no inventa aprendizaje.** Completar, dominar, consolidar, quedar habilitado, recibir XP y tener un repaso pendiente son estados diferentes, derivados de hechos aceptados por el servidor.
6. **Diseño común, capacidades reales.** Ningún estudiante ve B1/B2 como modos de diseño. La ausencia de una capacidad en V1 no se disfraza con una métrica V2 ficticia.
7. **Rapidez y continuidad.** Mantener unidad, posición, selección y contexto al regresar. Mostrar respuesta inmediata al clic sin adelantar resultados de evaluación.
8. **Marca conservada.** Reutilizar logo, tipografía, tokens y componentes existentes; ajustar jerarquía y densidad. No introducir otra identidad visual.

### 4.2 Arquitectura de navegación propuesta

| Superficie | Función | Acción principal | Información secundaria |
|---|---|---|---|
| Inicio | Retomar el estudio y ver pendientes relevantes. | Continuar en la ruta activa. | Repasos por categoría, otras rutas, avance real. |
| Mapa | Entender relaciones y elegir ruta/unidad. | Abrir el resumen del nodo elegido. | Estado con icono/etiqueta, lista alternativa, ubicación actual. |
| Resumen del mapa | Confirmar qué se eligió y facilitar entrada. | **Abrir ruta**, enfocada en la unidad. | Avance de esa unidad; una acción rápida elegible. |
| Detalle de ruta | Estudiar y reconocer todo el recorrido. | Continuar actividad o retomar sesión. | Unidades/objetivos/actividades; recursos; repaso; progreso ampliado. |
| Reproductor | Realizar una actividad con contexto y feedback. | Acción del tipo de actividad. | Guardar y volver; avance de sesión; ayuda cuando procede. |
| Repasos pendientes | Elegir y realizar práctica programada. | Empezar o retomar una sesión válida. | Categorías, duración estimada, próximos repasos. |

Objetivos de interacción: panel → detalle en **un clic**; detalle → actividad disponible en **un clic explícito**; Inicio → lugar de estudio en **un clic**; regresar del reproductor a la unidad en **un clic**. Configurar una sesión de repaso puede requerir elegir duración antes de empezar. No añadir confirmaciones rutinarias donde el inicio sea reversible.

### 4.3 Composición de la ruta común

- Cabecera compacta con nombre completo de ruta y navegación de regreso. Estado y avance breve en una fila de etiquetas; sin gran tarjeta de XP delante del currículo.
- Acción principal asociada a una actividad/objetivo concreto. Si corresponde a otra unidad porque hay una sesión abierta, nombrar esa unidad: «Retomar sesión de Retorno sistémico y VCI».
- Unidades inmediatamente después. La seleccionada por URL o la recomendada se abre automáticamente; el resto conserva una cabecera visible con estado. El estudiante puede expandir otras sin perder la activa.
- Dentro de la unidad, objetivos como separadores visuales breves y actividades siempre visibles para ese objetivo. Una misma actividad con varios objetivos se cuenta una sola vez y expresa sus asociaciones sin inventar copias independientes.
- Pestañas **Actividades** y **Recursos** en el detalle, con foco y selección preservados. El cambio de pestaña no desplaza al usuario hasta un bloque global de XP.
- Repasos y diagnóstico ubicados en su ámbito: objetivo/unidad cuando son específicos, sección de ruta cuando son globales. Las funciones avanzadas, agenda extensa, fuentes completas y versiones se abren a demanda.
- En móvil, el inicio de la unidad activa debe aparecer en la primera pantalla útil a 390 × 844, con un título de dos líneas como máximo en el caso de prueba y datos habituales. A 320 px se admite más alto por reflujo; nunca recortar contenido esencial para alcanzar una cifra de diseño.
- El pie de acción, si se fija, reserva espacio real en el layout y se ubica por encima de navegación inferior y safe area. El teclado virtual no debe tapar la entrada ni la confirmación.

### 4.4 Títulos y etiquetas: ejemplos aplicables

Los títulos temáticos siguientes son **ejemplos de presentación**, sujetos a validación editorial con el contenido real; no sustituyen esa revisión.

| Antes | Propuesta | Condición |
|---|---|---|
| Abdomen + «Vascularización del abdomen» debajo | **Vascularización del abdomen** | Un único título. |
| PERITONEO ANATÓMICO / Peritoneo / párrafo introductorio | **Peritoneo** | La categoría «Anatomía» puede estar en navegación, no como antetítulo. |
| Actividad 1 · Ver video · Cuestionario | **Contenido temático verificado** + etiqueta **Cuestionario** | Primero reparar la asociación; no inventar el tema. |
| Elegir la respuesta correcta, repetido | **Drenaje venoso gonadal** + etiqueta **Opción múltiple** | Título editorial seguro, sin revelar la respuesta. |
| Relacionar conceptos, repetido | **Relaciones vasculares** + etiqueta **Relacionar** | Fallback específico al objetivo si aún no hay título. |
| Tu sesión de aprendizaje | **Título de la actividad** | Avance «Pregunta 2 de 5» junto a los controles, no encima del título. |
| Una sesión breve y acotada | **Repasos pendientes** | Duración como selector, cantidad y tipos como etiquetas. |
| Confirmación desde el servidor | **Progreso guardado** | Solo cuando exista confirmación real. |
| Reaparición 1 de 2 | **Volverá más tarde** | Fecha/intervalo confirmado; no repetir inmediatamente. |
| Ver en la ruta, enlace pequeño | **Abrir ruta**, botón principal | Abre unidad seleccionada, no la cabecera genérica. |

### 4.5 Lenguaje visual y estados

| Estado | Tratamiento propuesto | Acción / significado |
|---|---|---|
| Pendiente | Icono de contorno y texto neutro. | Todavía no realizada; no implica bloqueo. |
| Disponible | Acento de marca moderado y etiqueta explícita. | Se puede iniciar según servidor. |
| En curso | Icono de continuación, fondo suave. | Retomar intento existente. |
| Completada | Marca de verificación y texto. | Actividad terminada; no equivale a dominio. |
| Objetivo comprobado | Sello/etiqueta diferenciada. | Evidencia objetiva confirmada por el motor. |
| Consolidado | Estado propio, en detalles de objetivo. | Retención confirmada según política. |
| Requiere otra actividad | Candado más motivo legible. | Mostrar qué habilita el acceso. |
| Repaso pendiente | Icono de reloj y fecha comprensible. | No significa fracaso por ausencia. |
| Cubierta por diagnóstico | Etiqueta de exención explícita. | No decir «la completaste» si no se realizó. |
| No disponible | Icono de información y motivo. | Sigue visible si pertenece al currículo. |

Usar el color como refuerzo, nunca como único significado. Reutilizar escala de espaciado de 4/8 px, texto de lectura cercano a 16 px, separación suficiente entre controles y superficies sobrias; fijar valores finales con los tokens reales. Evitar indicadores circulares grandes, tarjetas repetidas para cada dato y celebraciones que tapen la siguiente acción.

## 5. Lógica que se debe conservar y aclarar

### 5.1 Repasos y aprendizaje: estado actual inspeccionado

| Aspecto | V1 | V2 | Decisión del plan |
|---|---|---|---|
| Programación | Intervalos 1, 3, 7, 14 y 30 días; fallo corto de 10 minutos con límite de reapariciones. | Intervalos versionados; refuerzo de 10 minutos, límite que considera historial de 24 h para repasos; reglas de estabilidad. | Conservar políticas hasta corregir defectos específicos con pruebas. No instalar otro algoritmo por preferencia. |
| Respuesta subjetiva | Flashcards con cuatro grados de recuerdo. | Autoevaluación, ayuda y corrección objetiva tienen efectos distintos. | Etiquetas consistentes cuando signifiquen lo mismo; nunca convertir autoevaluación en respuesta objetiva. |
| Fallo | Puede encadenar reaparición por el índice de sesión. | Registra lapsos y programa refuerzo. | Corregir H05 en V1 y verificar límites entre sesiones. |
| Éxito | Efecto según scheduler V1. | Éxito objetivo sin ayuda puede extender intervalo bajo condiciones; repaso ya servido debe salir de la cola vencida. | Mostrar resultado real y próximo repaso, no recalcular en cliente. |
| Ausencia | Debe verificarse en el flujo completo. | La ausencia genera pendiente, no respuesta fallida. | No castigar la ausencia con fallos inventados en ningún motor. |
| Retención | No presumir equivalencia con V2. | Pruebas a 7/30 días con separación mínima y hechos de dominio. | Exponer solo capacidades disponibles; no completar retención por abrir agenda. |
| Diagnóstico | Capacidades propias de V1. | Admisión a un objetivo, sin otorgar dominio ni completar trabajo previo automáticamente. | Mantener separado acceso, consumo, evidencia y recompensa. |
| Selección | Ítems y progreso según manifiesto/intento. | Prioriza sesión abierta, refuerzo crítico, retención y otras acciones según estado confirmado. | La interfaz comunica prioridades; no las sustituye por un orden local improvisado. |

La igualdad de diseño no exige que dos acciones pedagógicamente diferentes tengan el mismo efecto. Si más adelante se desea armonizar algoritmos, habrá que formular una nueva política, versionar su activación y analizar resultados; queda fuera de la unificación visual propuesta.

### 5.2 XP: qué es un error y qué es una regla distinta

- En V1 existen premios por actividades esenciales y cierres de unidad/ruta; en V2 aparecen hitos por primera recuperación objetiva, dominio y consolidación, con valores inspeccionados de 5/10/15 XP. No toda lectura V2 debe dar XP solo porque V1 lo haga.
- La práctica V2 distingue corrección de un fallo previo y mantenimiento; la categoría diaria `review_applied` tiene tope compartido de 20 XP. H06 afecta ese tope.
- Un total de cuenta, un total de ruta y una variación de sesión no son el mismo indicador. Los 182 XP totales y 20 de una ruta al inicio no demuestran pérdida de puntos. Al terminar se confirmaron 186 y 22, respectivamente.
- V1 puede recompensar participación en un repaso de primera ronda sin que sea evidencia de dominio. Eso requiere explicación y una decisión de política documentada; no se declara bug solo por diferir de V2.
- Si una acción no otorga puntos, el feedback debe indicar el hecho relevante cuando sea necesario: «Actividad completada», «Sin XP adicionales: ya recibiste esta recompensa» o «Alcanzaste el límite diario de XP de repaso». Los motivos deben provenir del servidor, no inferirse del saldo.
- El diagnóstico que permite avanzar no se presentará como compra de dominio. Conservar las reglas actuales de requisito de XP y comprobar que un fallo no descuenta puntos por accidente.

## 6. Diseño técnico propuesto

Todos los nombres de tipos, campos y componentes de esta sección son **propuestas**, salvo los archivos actuales citados. El ejecutor debe ajustarlos al contrato existente y documentar cualquier diferencia antes de depender de ella.

### 6.1 Una capa de presentación común

Introducir una proyección autorizada del aprendizaje que alimente Inicio, mapa, detalle y repaso. Un adaptador V1 y otro V2 traducen sus datos a componentes comunes; los comandos siguen usando el motor propietario y sus contratos. No fusionar las tablas de intentos, no migrar matrículas automáticamente y no recalcular evidencia en React.

```ts
// Esquema orientativo, no código aplicado.
type LearningRouteView = {
  id: string;
  slug: string;
  versionId: string;
  title: string;
  capabilities: {
    objectiveEvidence: boolean;
    retentionAgenda: boolean;
    diagnosticPlacement: boolean;
    consultCompleted: boolean;
  };
  // Valores y pertenencia al conjunto confirmados por la API.
  progress: {
    required: { completed: number; covered: number; total: number };
    masteredObjectives: { completed: number; total: number } | null;
  };
  units: LearningUnitView[];
  recommendedAction: ServerLearningAction | null;
};

type LearningUnitView = {
  key: string;
  title: string;
  objectiveGroups: Array<{
    key: string;
    title: string;
    activityIds: string[];
  }>;
  activities: Array<{
    id: string;
    title: string;          // Metadato público editorial, no el enunciado.
    formatLabel: string;
    requirement: 'required' | 'additional' | 'remediation';
    status: 'pending' | 'in_progress' | 'completed' | 'covered' | 'unavailable';
    access: { allowed: boolean; reasonCode: string | null };
    actions: ServerLearningAction[];
  }>;
};
```

`ServerLearningAction` debe ser una unión discriminada validada por el esquema del motor: retomar, iniciar actividad, revisar, consultar, diagnóstico o abrir recurso. Su token/clave autoriza un objetivo concreto dentro de matrícula y versión; no es un permiso general generado en el navegador. El servidor vuelve a validar elegibilidad al ejecutar. El cliente puede formatear texto, agrupar por relaciones existentes y elegir entre acciones ya autorizadas; no crea nuevas acciones pedagógicas.

Para V1 sin objetivos explícitos, mostrar el grupo de actividades de la unidad sin inventar objetivos. Si hay relaciones múltiples, preservar las reales y no duplicar el progreso. `null` en dominio significa que esa medida no está disponible, no cero ni dominio logrado.

Componentes comunes propuestos: `LearningRouteShell`, `UnitSection`, `ObjectiveGroup`, `ActivityRow`, `LearningStatus`, `RecommendedAction`, `ResourceList`, `ReviewCenter` y `SessionHeader`. Los nombres pueden variar; la propiedad común y la ausencia de dos ramas visuales completas son el criterio.

### 6.2 Metadatos editoriales y fuentes

El DTO V2 actual publica clave, objetivo, tipo, fase y scaffold, pero no un título temático. Añadir un campo público seguro exige actualizar esquema, compilador/proyección, validación editorial, serialización y consumidores. Para revisiones históricas sin campo, usar un fallback legible que no extraiga preguntas privadas. No alterar silenciosamente el hash de snapshots ya fijados.

Un recurso puede representar `reader`, `external_link`, `download` o `citation_only`, con permiso y disponibilidad confirmados. Si es lectura interna, necesita identidad y localizador de la revisión correspondiente; no fabricar una URL a partir del título. Las citas pueden desplegarse debajo del recurso sin repetirse como filas de estudio.

La integridad de «ruta/unidad → activo» se comprueba en publicación y al resolver la actividad. Un vínculo válido técnicamente puede ser pedagógicamente incorrecto: requiere revisión editorial y una lista de casos reales, no solo integridad referencial de base de datos.

### 6.3 Contexto de retorno

```ts
// Propuesta de contexto estructurado; serializar solo campos permitidos.
type LearningReturnContext =
  | { surface: 'route'; slug: string; unitKey?: string;
      objectiveKey?: string; activityKey?: string;
      tab: 'activities' | 'resources'; mapContext?: MapContext }
  | { surface: 'review'; routeSlug?: string; category?: 'review' | 'retention' }
  | { surface: 'map'; mapContext: MapContext };
```

El servidor/constructor de URLs valida destinos y parámetros internos. `safeMapReturnHref` actual no debe relajarse para aceptar cualquier `returnTo`; agregar un resolver de contextos conocidos. Rechazar URLs externas, esquemas alternativos, barras inversas, dobles codificaciones peligrosas y claves desconocidas. `mapContext` conserva el nivel, selección y posición del mapa independientemente del destino principal de regreso al detalle.

Restaurar ancla por clave estable, esperar el montaje de la unidad y mover foco a su encabezado sin saltos dobles. La posición exacta de scroll puede almacenarse como preferencia de navegación, nunca como evidencia de progreso. Al actualizar versión, resolver claves eliminadas a la unidad/ruta válida y avisar con un mensaje breve.

### 6.4 Repaso sin repetición inmediata

```text
Al aceptar una respuesta:
  1. Validar usuario, intento, versión, ítem y solicitud idempotente.
  2. Persistir respuesta y ejecutar la política del motor con hora del servidor.
  3. Marcar ese ítem como atendido para esta pasada de la sesión.
  4. Si requiere refuerzo, conservar su elegibilidad futura confirmada.
  5. Elegir otro ítem elegible; no reutilizar la revelación de una nueva presentación.
  6. Si no queda ninguno, terminar la pasada y mostrar el siguiente repaso pendiente.
```

La implementación debe distinguir identidad del ítem de identidad de presentación/ronda, conservar versiones esperadas y no cobrar ni premiar dos veces. La revelación ya aceptada sigue en el historial; la nueva presentación comienza por el anverso salvo que el servidor describa explícitamente un modo de consulta. No dar por aprobada una tarjeta porque se vio su reverso.

### 6.5 Tope de XP compartido

```text
Dentro de una transacción protegida por un bloqueo común al usuario:
  fecha = fecha local derivada de acceptedAt y zona autorizada
  si la recompensa idempotente ya existe: devolver su recibo
  acumulado = suma de review_applied para usuario y fecha
  otorgado = min(baseElegible, max(0, 20 - acumulado))
  guardar el hecho/recibo según el contrato vigente
  conceder solo otorgado y devolver motivo si no hay XP adicional
```

Se debe probar la protección con los dos motores a la vez. Utilizar una primitiva de bloqueo común con orden consistente; no introducir un bloqueo adicional en orden inverso que pueda provocar interbloqueos. Confirmar la semántica de recibos de cero puntos del sistema existente. El ejemplo no autoriza borrar o reconstruir recompensas históricas.

### 6.6 Altura y acciones del panel

Usar una única medida de viewport útil, idealmente compartida por shell, mapa, panel y navegación inferior. El panel puede componerse como `grid-template-rows: auto minmax(0, 1fr) auto`; su cuerpo usa scroll y `min-height: 0`. El contenedor reserva la altura real de la barra inferior más safe area. Es una dirección de implementación, no una receta de sumar márgenes hasta que una captura pase.

Validar con `visualViewport`, teclado virtual y cambios de orientación. Ningún footer fijo puede quedar por fuera del área reservada. Una prueba del rectángulo no basta: comprobar el elemento que recibe el clic y el foco visible.

### 6.7 Rendimiento sin debilitar contratos

Resolver primero el perfil de consultas. Son candidatos: metadatos de motor, estado agregado de matrículas, solicitudes duplicadas en montaje y foco, precarga de navegación y separación de bloques secundarios. Un endpoint agregado es una **propuesta**, no una API existente.

Toda caché debe estar acotada por usuario, versión/matrícula y contexto relevante; invalidar tras recibos aceptados. Mantener comportamientos correctos ante 401/403/404/409/5xx. No usar un fallo de autorización como señal para probar otro motor. La detección actual permite 404 legacy o mismatch explícito y solo despacha V2 tras una lectura V2 válida: conservar esa frontera hasta sustituirla con resolución autorizada.



### 6.8 Estado del reproductor y feedback final

Un patrón posible es representar explícitamente los estados; no se propone un framework nuevo:

~~~ts
type PlayerView =
  | { kind: "question"; item: PublicItem }
  | { kind: "submitting"; pendingRequestId: string }
  | { kind: "feedback"; receipt: AcceptedReceipt; final: boolean }
  | { kind: "completed"; summary: ConfirmedSummary }
  | { kind: "recoverable_error"; pendingRequestId?: string; reason: string };

// Primero resolver feedback del recibo, después consultar si existe siguiente ítem.
if (acceptedFeedback) return feedbackView(acceptedFeedback);
if (attempt.status === "completed") return completedView(attempt);
if (currentItem) return questionView(currentItem);
return recoveryView("No pudimos cargar la siguiente actividad");
~~~

No copiar este pseudocódigo sustituyendo el servidor por booleanos locales. La transición de respond/complete debe respetar el recibo, rowVersion, deduplicación y persistencia del cliente. Para H24, la prueba clave es «último ítem aceptado + feedback pendiente + índice fuera del manifiesto»: debe mostrar feedback y «Ver resumen». Recargar puede llevar directamente al resumen confirmado o restaurar feedback, según política, pero nunca a un cuerpo vacío.

Una solicitud pendiente conserva la misma clave y el mismo payload al reintentar. Si se permite editar tras un error, primero debe resolverse el estado de la solicitud anterior; no reenviar silenciosamente otra respuesta con su misma clave. Tras volver de offline, mostrar qué se está recuperando y evitar que un indicador local diga «guardado» antes de confirmación.

### 6.9 Corrección de respuesta breve sin aceptar respuestas peligrosamente amplias

Para el caso observado, una nueva revisión editorial puede incluir aliases como los siguientes **después de validarlos contra su fuente y consigna**:

~~~json
{
  "acceptedAnswers": [
    "venas ilíacas comunes",
    "las venas ilíacas comunes derecha e izquierda"
  ],
  "normalization": "nfkc-lower-space"
}
~~~

Es un ejemplo de compatibilidad de formulaciones, no el conjunto final ni una modificación de la revisión existente. Probar positivos por separado de negativos: sustituir venas por arterias, negar la afirmación, cambiar un lado cuando la pregunta lo evalúe o alterar una unidad no debe pasar por normalización. No utilizar contains("ilíacas") como criterio de corrección. No eliminar diacríticos, unidades o signos globalmente sin demostrar que preserva el significado de cada tipo de pregunta.

Si la tarea exige un término exacto, indicarlo en la instrucción junto al campo. Si exige un razonamiento libre, el contrato de respuesta construida debe seguir separando escritura, revelación, autoevaluación y comprobación objetiva posterior. Una autocalificación no puede resolver un diagnóstico objetivo por sí sola.

### 6.10 Catálogo coherente de materiales

Modelo conceptual:

~~~text
contenido autorizado y publicado
  → resolver proyecciones de estudio válidas
  → deduplicar por identidad estable y proyección
  → aplicar filtro de tipo de estudio y materia
  → ordenar, contar y paginar el mismo conjunto
  → construir enlaces autorizados de consulta/práctica
~~~

Aplicar este orden semántico en la consulta o índice del servidor; no descargar toda la colección para filtrarla en el navegador. Separar contentKind del contenedor (guía, video...) de studyKind (lectura, cuestionario, flashcards...). El contrato debe permitir que una guía aporte varios recursos sin duplicar el mismo recurso enlazado desde un video. Una falla de consulta no se representa como lista vacía.

La prueba de reconciliación compara IDs, no solo números. Dos entradas con el mismo título pueden ser revisiones o recursos diferentes; dos URLs distintas pueden llevar al mismo recurso. Explicitar la regla de identidad antes de deduplicar.

### 6.11 Texto de búsqueda y lectura estructurada

El extractor del API debe recorrer nodos de texto y campos de contenido aprobados. No concatenar todo Object.values del documento: eso convierte los tipos internos del editor en fragmentos visibles. Reutilizar la conversión semántica existente si su dependencia es apta para servidor; de lo contrario, publicar un contrato de equivalencia y fixtures compartidos.

Para la guía dentro de una actividad, conservar secciones, encabezados, listas y relaciones de tabla del snapshot. Una representación alternativa de una tabla pequeña puede ser una lista de pares encabezado/valor en móvil, pero debe mantener las asociaciones y el orden de lectura. No resolver el problema reduciendo fuente hasta volverla ilegible ni tomando una versión editorial distinta.

### 6.12 Recuperación sin confundir autenticación y disponibilidad

~~~text
401 de credenciales actuales → flujo de sesión expirada, conservando retorno permitido
403 → falta de permiso, sin probar otro motor para eludirla
timeout / 5xx recuperable → error temporal + reintento acotado
200 con DTO incompatible → error de contrato registrado, no tratar como usuario anónimo
mutación sin respuesta concluyente → recuperar con misma identidad idempotente
404 o mismatch explícito → resolver motor solo según contrato permitido
~~~

Un identificador de correlación puede mostrarse en «Detalles del problema» y enlazar registros internos saneados. No registrar cookies, tokens, respuestas médicas libres o correos en métricas de navegación. Recuperación visual y salud de la API son pruebas distintas; un HTML 200 no acredita que la consulta interna haya tenido éxito.

## 7. Fases de implementación y puertas de salida

**Estado actual en la sección 0.** Esta tabla conserva el orden acordado y los criterios de salida. Las verificaciones locales de casos individuales aportan evidencia a su fase. La aprobación formal requiere completar sus dependencias y las pruebas indicadas.

| Fase | Resultado verificable | Depende de | Puerta principal |
|---|---|---|---|
| F00 | Línea base reproducible y fuentes de verdad identificadas | Ninguna | Evidencias, fixtures y alcance vigente listos |
| F01 | Contenido, formato y calificación confiables | F00 | H01/H02/H03/H25 reproducidos y corregidos en su ámbito |
| F02 | Intentos y finales de sesión recuperables | F01 | Ningún estado vacío ni pérdida/duplicación de respuesta |
| F03 | Repasos, refuerzo y retención coherentes | F02 | Elegibilidad y tiempos correctos con reloj controlado |
| F04 | XP consistente y seguro ante reintentos/carreras | F03 | Tope y premios comprobados con PostgreSQL real de pruebas |
| F05 | Catálogo, contadores y resumen comunes | F04 | Listas, conjuntos y acciones reconciliados V1/V2 |
| F06 | Navegación funcional y estructura de ruta común | F05 | Mapa → detalle → actividad → regreso sin perder contexto |
| F07 | Disponibilidad, rapidez y accesibilidad operativa | F06 | Recuperación, teclado/táctil y presupuestos medidos |
| F08 | Aceptación funcional móvil y escritorio | F01–F07 | Sin P1 ni P2 funcional abierto dentro del alcance acordado |
| F09 | Interfaz unificada y refinamiento visual basado en V2 | F08 | Requisitos visuales del usuario y regresión funcional aprobados |
| F10 | Entrega verificable y seguimiento | F09 | Evidencias por entorno, documentación y reversión listas |

El alcance editorial puede requerir revisión humana especializada. «Necesita revisión» no equivale a permiso para inventar contenido ni a PASS. Si una dependencia queda NO VERIFICADO, documentar el bloqueo concreto y continuar únicamente con trabajo independiente autorizado; no ocultarlo bajo un cierre global.

### F00 — Preparar una línea base reproducible

**Objetivo:** saber qué código, versiones de ruta, roles y datos se están probando antes de cambiar comportamiento.

**Trabajo y entregables**

- Registrar SHA local, rama, estado del árbol y, por separado, SHA/identificador del despliegue que se vaya a validar. Releer instrucciones aplicables del repositorio.
- Capturar las cadenas de identidad de las actividades afectadas: ruta, matrícula, revisión, unidad, objetivo, paso, proyección y contenido. Conservar las versiones fijadas y no exportar credenciales ni datos innecesarios de la cuenta.
- Crear fixtures representativas: solo V1, solo V2, ambas; cuenta sin matrícula; ruta sin material, material retirado, progreso parcial/no lineal, intento pendiente, último ítem, diagnóstico disponible/bloqueado y revisiones antiguas.
- Reproducir H24, H25, H26 y la condición 19+2 de H06. Para H19/H31 registrar secuencia y trazas; no adjudicar una causa que no se observe.
- Entregar matriz H→caso→archivo/servicio→responsable de decisión y línea base de pruebas. Preparar PostgreSQL aislado para casos que requieren transacciones reales.

**Criterio para pasar a F01:** cada P1 tiene reproducción automatizable o evidencia concreta con una investigación acotada; los casos de cuenta de prueba están identificados; no se confunde fixture con producción. Los tests existentes que fallen por causas previas quedan registrados, no “arreglados” modificando aserciones para ocultar el defecto.

### F01 — Corregir identidad de contenido y calificación

**Objetivo:** que una actividad abra lo anunciado y que una respuesta válida no falle por una formulación editorial incompleta.

**Trabajo y entregables**

- Resolver Peritoneo/«Ver video»/cuestionario de cuello y los pasos esenciales ausentes. Separar reparación de asociación, título, proyección y disponibilidad.
- Validación editorial de preguntas con opciones duplicadas, distractores irresolubles, explicaciones de prueba, fuentes ausentes y objetivos sin propósito. Aplicar a materiales libres y guiados.
- Corregir H25 con aliases/consignas revisados y negativos de regresión. Revisar el resto de respuestas breves con la misma regla, sin cambiar a corrección “semántica” indiscriminada.
- Incorporar metadatos públicos de actividad y disponibilidad de ayuda/recursos donde hagan falta, con compatibilidad hacia atrás.
- Entregar informe de contenido afectado, nuevas revisiones propuestas/aplicadas según autorización, validaciones y fixtures. Definir tratamiento de intentos históricos sin reescribir hechos automáticamente.

**Criterio para pasar a F02:** T01–T03, T06, T42–T43 y la validación editorial de T49 pasan; no quedan opciones idénticas con calificación diferente en los materiales afectados; cada actividad esencial tiene identidad y estado visible. Una corrección local de contenido aún no publicada se identifica como tal. La publicación editorial y aceptación del contenido deben acreditarse antes de la liberación del flujo, sin atribuirlas a la suite técnica.

### F02 — Asegurar intentos, respuestas y finalización

**Objetivo:** responder, salir, volver y terminar siempre deja un estado comprensible y recuperable.

**Trabajo y entregables**

- Corregir H24 con estado explícito de feedback final. Mantener último recibo y transición al resumen.
- Revisar V1/V2: envío doble, red lenta, corte antes/después de aceptación, recarga, cierre de pestaña y reapertura, conflicto de versión y expiración de sesión.
- Mantener la cola V1 y recuperación V2; unificar mensajes de guardado sin reemplazar sus contratos por un mecanismo local ficticio.
- Identificar tipo de sesión, progreso propio y resultado por pregunta permitido. Diferenciar consulta/práctica/diagnóstico/retención.
- Resolver vista previa/adopción de versión con mensajes distintos. No adoptar revisiones automáticamente.
- Reducir transiciones redundantes solo cuando el servidor permita responder+cerrar de forma consistente. Si no, el texto de la acción debe describir lo que hace.

**Entregables:** máquina de estados documentada, contrato de recuperación por motor, regresiones de componentes y E2E de último ítem/offline, catálogo de errores accionables.

**Criterio para pasar a F03:** T11–T12, T32–T36, T41, T46–T47, T50–T51 pasan en el ámbito implementado. Cero pantallas vacías, cero pérdida o duplicación de respuesta/XP en reintentos. Ninguna recarga obligatoria para llegar al resumen.

### F03 — Corregir repasos, refuerzo y retención

**Objetivo:** el repaso refuerza sin encerrar al estudiante ni fabricar dominio.

**Trabajo y entregables**

- Separar ítem atendido en la pasada actual de próximo vencimiento. Aplicar H05 con elegibilidad temporal del servidor.
- Conservar las reglas existentes de límite de reaparición, ausencia, ayuda, autoevaluación, refuerzo y retención; corregir únicamente defectos demostrados.
- Hacer explícita la prioridad de sesión abierta, actividad nueva, refuerzo y retención según política. Conservar la posibilidad de repasar junto a continuar cuando está autorizada.
- Definir un centro común de repaso con cantidades homogéneas por categoría. Si los motores requieren sesiones distintas, coordinar bloques sucesivos sin mezclar recibos.
- Verificar fechas, zona horaria, cambio de día, separación mínima y reintentos distribuidos en varias sesiones.

**Entregables:** tabla de transiciones antes/después, fixtures con reloj, pruebas de política y selección, agenda coherente con recibos, sesión sin bloqueo por ítem inelegible.

**Criterio para pasar a F04:** T18–T26 y T52 pasan. Un fallo no reaparece antes de su hora; otros ítems elegibles pueden continuar. Ausencia no genera fallo; ayudas no se convierten en evidencia objetiva; retención no se acredita por abrir una pantalla. Si no hay ítems elegibles, se termina la pasada con próximo repaso claro.

### F04 — Reconciliar XP y evitar duplicados

**Objetivo:** cada premio responde a un hecho elegible y respeta el límite compartido.

**Trabajo y entregables**

- Inventariar reglas V1/V2 y categorías, incluido primer cumplimiento, repetición, repaso, diagnóstico y lectura. Explicar diferencias válidas.
- Corregir límite residual compartido y serialización común de H06. Mantener claves idempotentes y unicidad del hecho premiado.
- Probar carreras V1+V2 y entre pestañas, reintentos y respuestas fuera de orden. Usar PostgreSQL de pruebas real para locks/transacciones.
- Reconciliar ledger, saldo total, ruta y sesión después de cada caso; incluir motivos explícitos de cero XP.
- Definir si existe un procedimiento posterior para anomalías históricas; no ejecutarlo como efecto oculto de este cambio.

**Entregables:** matriz regla→evento→cantidad→límite→deduplicación, migración compatible solo si se necesita, pruebas de concurrencia y conciliación.

**Criterio para pasar a F05:** T27–T30 y T53 pasan; acumulado diario máximo 20 en la categoría compartida, incluso desde 19 y en carreras. Repetir no duplica premios. Diagnóstico aprobado no concede dominio o XP que su política no autoriza. Un test omitido de PostgreSQL impide cerrar esta fase.

### F05 — Unificar datos visibles y descubrimiento

**Objetivo:** mapa, detalle, Inicio, Hoy, Progreso y bibliotecas hablan del mismo estado.

**Trabajo y entregables**

- Definir adaptadores de presentación V1/V2 y capacidades reales sin migrar motores.
- Reconciliar IDs de actividades obligatorias, adicionales/remediales, completadas/cubiertas, objetivos y repasos. Cada contador tiene una unidad y un conjunto definido.
- Corregir H26 con proyección de catálogo autorizada, paginación, deduplicación y conteos.
- Corregir extracción de snippets H28 en el camino usado por API; conservar búsquedas útiles y permisos.
- Mostrar recomendaciones con destino y ámbito correctos; eliminar el fallback silencioso de diagnóstico de otra unidad.
- Agregar resumen de las matrículas V1/V2 al Inicio y un destino real para «Continuar mi ruta».

**Entregables:** DTO/proyección documentada, adaptadores y pruebas de contrato, reconciliación por IDs, catálogo de estados vacíos/error y datos de resumen.

**Criterio para pasar a F06:** T04–T06, T08, T23–T24, T30–T31, T44–T46 y T54 pasan. No hay materiales “inexistentes” que sí se abren por otra entrada, ni denominadores inexplicables. Cero filtraciones de reservas, respuestas o permisos mediante el DTO común.

### F06 — Hacer continua la navegación de aprendizaje

**Objetivo:** estudiar principalmente en el detalle de la ruta y volver al mismo lugar.

**Trabajo y entregables**

- Unificar estructura funcional del detalle, filas de actividad, recursos y acciones sobre los adaptadores de F05. Reutilizar V2 como base sin dedicar aún esfuerzo a cosmética.
- Reducir panel del mapa a resumen, botón principal «Abrir ruta» y, como máximo, acceso rápido a la acción recomendada autorizada. Mantener controles para explorar unidades y la vista de lista.
- Preservar unidad/objetivo/actividad/pestaña/origen con el contexto estructurado. Soportar enlace profundo, atrás/adelante, recarga y claves antiguas.
- Asegurar que el usuario descubre todas las actividades de cada unidad y entiende bloqueos. Consultar no crea intentos; prefetch tampoco.
- Resolver recursos y guía estructurada con permisos, revisión y localizador correctos. Verificar formatos no alcanzados en la cuenta durante esta auditoría.

**Entregables:** estructura común, contrato de navegación, rutas compatibles, E2E móvil/escritorio de recorrido completo y lectores de recursos.

**Criterio para pasar a F07:** T09–T17, T24, T34–T35, T48 y T55 pasan. Un clic del resumen abre la unidad en el detalle; volver del reproductor restaura el contexto. Las funciones existentes no desaparecen para lograr una pantalla más simple. H19 se reproduce/corrige o queda con evidencia y tratamiento explícito, sin afirmar una reparación por ausencia casual.

### F07 — Validar disponibilidad, rapidez y acceso operativo

**Objetivo:** los recorridos funcionan bajo latencia, fallos y métodos de entrada reales.

**Trabajo y entregables**

- Investigar H31 con trazas autorizadas de web/API; resolver causa si se confirma y probar recuperación. Conservar sesión y solicitudes pendientes.
- Medir solicitudes, payloads, tiempo a interacción y navegación con método fijo; corregir consultas redundantes o N+1 donde se demuestren.
- Mantener virtualización y memoria del mapa, acotación de caché por usuario/revisión e invalidación tras mutación.
- Operar toda acción esencial con teclado y entrada táctil. Verificar foco, avisos de guardado, modal, pestañas, búsqueda, ordenación y teclado virtual.
- Ejecutar matriz de tamaños prioritarios y navegadores; reservar tablet como seguimiento.

**Entregables:** informe antes/después, trazas saneadas, pruebas de error/recuperación, auditoría operativa de accesibilidad y resultados en dispositivo.

**Criterio para pasar a F08:** T13–T15, T37–T40, T45, T50 y T56 pasan con presupuestos acordados en sección 9. Ningún CTA esencial queda tapado o inalcanzable en móvil/escritorio. No cerrar H31 como corregido sin demostrar la causa o una resolución verificable del fallo. Un dispositivo no disponible queda NO VERIFICADO.

### F08 — Aceptar el funcionamiento en móvil y escritorio

**Objetivo:** una puerta de calidad que impida comenzar el refinamiento visual sobre flujos rotos.

**Trabajo y entregables**

- Ejecutar T01–T56 funcionales aplicables (T07 visual se reserva a F09) en una cuenta estudiante y una cuenta administradora, separando lo que corresponde a cada rol.
- Recorrer Peritoneo V1 y Vascularización V2, además de una revisión histórica y fixtures de los tipos que las rutas no permitan alcanzar.
- Hacer sesiones completas con aciertos, fallos, ayuda, repasos, salida/retorno, recarga y reintento. Conciliar respuestas, progreso, acceso, agenda y XP.
- Revisar los problemas de producción observados: contenido incorrecto, vacío de repaso, falso negativo, catálogo, indisponibilidad y navegación.
- Registrar PASS/FAIL/NO VERIFICADO por prueba y por capa. Revisar que ningún “arreglo” solo oculte una función.

**Criterio para pasar a F09:** no hay P1 ni P2 **funcional** abierto dentro del alcance móvil/escritorio; cada criterio obligatorio tiene evidencia y no está omitido. Las brechas requieren resolución o una reducción explícita de alcance del propietario; el ejecutor no puede autoaprobar una excepción. H04 tablet y refinamientos puramente visuales no bloquean esta puerta. Una aceptación funcional no equivale a autorización de publicación ni a validación de producción.

### F09 — Unificar y pulir el diseño basado en V2

**Objetivo:** cumplir la dirección visual original sobre un comportamiento ya confiable.

**Trabajo y entregables**

- Aplicar el mismo diseño a V1/V2 y futuras rutas compatibles: un único título autosuficiente, sin antetítulos ni subtítulos de presentación.
- Compactar cabeceras, métricas y acciones; unidad activa y actividades reconocibles; etiquetas de tipo/estado y jerarquía unidad→objetivo→actividad.
- Hacer «Abrir ruta» evidente en el resumen; quitar listas redundantes del panel del mapa y favorecer el detalle como lugar de estudio.
- Mantener logo/identidad, tokens consistentes y estados distinguibles sin depender del color.
- Revisar vacíos, loading, errores, sesiones completas, ayudas, recursos, resultados y vistas con textos largos, no solo la pantalla ideal.

**Entregables:** especificación de componentes/estados, capturas comparables antes/después en móvil/escritorio, librería común sin dos implementaciones completas por motor, revisión visual y accesible.

**Criterio para pasar a F10:** T05–T10, T13, T40, T51 y T57–T58 pasan; ambos motores cumplen el mismo contrato de interfaz. Ninguna mejora visual altera calificación, elegibilidad, fechas, recompensas, persistencia o navegación validada. Regresión funcional afectada y recorridos esenciales repetidos sobre el candidato final.

### F10 — Entregar con evidencia y posibilidad de reversión

**Objetivo:** que se sepa exactamente qué está probado y dónde.

**Trabajo y entregables**

- Preparar changelog de comportamiento, instrucciones operativas, impacto sobre datos/versiones y lista de riesgos residual.
- Confirmar suite, typecheck, lint/build pertinentes y CI del SHA final. Preparar preview y aceptación autenticada sin confundirlos con producción.
- Si la ejecución incluye autorización de despliegue, verificar versión servida/alias y realizar smoke autenticado seguro. Si no la incluye, dejar candidato revisable listo y publicación pendiente, sin declarar producción corregida.
- Instrumentar errores y duración de recorridos con datos mínimos; definir quién revisa y cómo se detectan regresiones.
- Documentar reversión de interfaz/despliegue, compatibilidad de datos y límites de rollback. No revertir respuestas válidas ni XP aceptados al volver a una versión de UI.

**Condición de entrega acordada.** La prueba funcional final se hace sobre el mismo candidato que se va a liberar. Los recorridos esenciales deben funcionar con los datos de entrega y con matrículas anteriores. La revisión editorial de los materiales destinados al alumnado se registra por separado de la validación con datos ficticios.

**Criterio de cierre:** T59–T60 y la lista de sección 10 tienen evidencia para cada entorno declarado. Estado final inequívoco: implementado local, CI, preview, aceptado autenticado o verificado en producción. No utilizar «terminado en producción» si falta uno de los requisitos de producción.



## 8. Pruebas y evidencias de aceptación

### 8.1 Pruebas locales realmente ejecutadas

No se escribieron tests nuevos ni se modificaron los existentes. Se ejecutaron suites presentes en el repositorio para contrastar contratos y detectar qué cobertura falta.

| Ejecución | Alcance | Resultado real | Límite |
|---|---|---|---|
| Primera pasada, API | review-scheduler y parte pura de guided-v2-scheduler | **30 PASS, 16 omitidas** | El filtro seleccionó los schedulers puros; no valida concurrencia de PostgreSQL. |
| Primera pasada, web | Modelo y currículo V2 | **20 PASS** | Componentes/modelos, no persistencia autenticada. |
| Ampliación, API | Catálogo guiado, scheduler, evidencia, selección, intentos y actualización V2; seis archivos | **136 PASS, 22 omitidas**, 81,84 s | PGlite/lógica local. PostgreSQL opcional y ciertos casos exclusivos de ese backend quedaron sin ejecutar. |
| Ampliación, web | Cola de mutaciones, cliente, player, maintenance, review-page, servidor y upgrade V2; siete archivos | **89 PASS**, 51,03 s | No cubre automáticamente el vacío final del repaso V1 ni datos editoriales reales. |
| Cierre, API | guided-v2-grading | **12 PASS**, 1,66 s | Verifica reglas con fixtures; no demuestra suficiencia de aliases de todas las preguntas publicadas. |
| Cierre, web | content-search | **4 PASS**, 1,01 s | Prueba el extractor web; no acredita el camino de búsqueda del API donde se localizaron tokens técnicos. |

**Ampliación y cierre: 241 ejecuciones de tests aprobadas y 22 omitidas.** Las 50 aprobadas de la primera pasada se informan aparte; hay solapamiento de suites y no deben sumarse como 291 casos únicos. Todas las invocaciones anteriores terminaron con código 0. No se ejecutó build completo ni auditoría de tipos/lint porque no se cambió código; esos controles pertenecen al candidato de implementación.

Comandos principales reproducibles, desde la raíz del repositorio:

~~~powershell
pnpm.cmd --filter @cediah/api exec vitest run test/review-scheduler.test.ts test/guided-v2-scheduler.test.ts -t 'guided-learning scheduler-v1|guided v2 pure scheduler'

# Variables de la sesión de pruebas, sin apuntar a bases externas:
$env:KORAZ_T015_TEST_DATABASE_URL = ''
$env:KORAZ_T018_TEST_DATABASE_URL = ''
pnpm.cmd --filter @cediah/api exec vitest run test/guided-learning-catalog.test.ts test/guided-v2-scheduler.test.ts test/guided-v2-evidence.test.ts test/guided-v2-selection.test.ts test/guided-v2-attempts.test.ts test/guided-v2-upgrade.test.ts

pnpm.cmd --filter @cediah/web exec vitest run src/lib/learning-mutation-queue.test.ts src/components/learning/v2/client.test.ts src/components/learning/v2/player.test.tsx src/components/learning/v2/maintenance.test.tsx src/components/learning/v2/review-page.test.tsx src/components/learning/v2/server.test.ts src/components/learning/v2/upgrade.test.tsx

pnpm.cmd --filter @cediah/api exec vitest run test/guided-v2-grading.test.ts
pnpm.cmd --filter @cediah/web exec vitest run src/lib/content-search.test.ts
~~~

Las variables vacías fueron solo del proceso de prueba. Para cerrar F04/F08, ejecutar los casos de concurrencia con una base **de pruebas aislada**, usando la configuración documentada del repositorio; no copiar credenciales de producción. La suite reconoce KORAZ_T018_TEST_DATABASE_URL y KORAZ_T015_TEST_DATABASE_URL. Los 22 skips no significan éxito y no justifican omitir la aceptación de locks/reintentos.

### 8.2 Matriz obligatoria para el ejecutor

Esta matriz es **trabajo de validación futuro**, no una lista de sesenta PASS de esta auditoría. Cada fila debe generar evidencia con versión, entorno, datos de prueba y resultado. T01–T56 son funcionales salvo T07, reservada al refinamiento visual; T57–T58 son visuales y de unificación final; T59–T60 son de entrega.

Abreviaturas de capa: U = unidad/política; C = componente/contrato; I = integración de API/DB; E = navegador autenticado; M = manual/dispositivo. Un fixture E2E no sustituye una prueba E con cuenta y persistencia reales en el entorno declarado.

| ID | Caso y condición inicial | Acción y resultado exigido | Capa / fase principal |
|---|---|---|---|
| T01 | Peritoneo, unidad y actividad observadas; revisión fijada | Abrir cada proyección: identidad, tema, formato y recurso coinciden; no abrir cuello bajo Peritoneo. Mantener historial de revisiones. | I+E / F01 |
| T02 | Opciones idénticas y textos de prueba, tanto libres como guiados | Publicación/validación detecta el defecto y enfoca el campo; material corregido tiene respuesta resoluble. No basta cambiar la clave correcta de un duplicado. | U+I+M / F01 |
| T03 | Paso obligatorio solo video, video+quiz, recurso retirado | Todos aparecen con estado real; se abre formato anunciado o se explica indisponibilidad. Ningún filtro hace desaparecer trabajo obligatorio. | C+E / F01/F05 |
| T04 | Ruta con obligatorias, remediales y exenciones | Reconciliar IDs de lista y denominador en mapa/detalle/Inicio/API; no sumar conjuntos diferentes bajo el mismo nombre. | I+C+E / F05 |
| T05 | V1, V2 y revisión histórica sin nuevos metadatos | Adaptadores producen el contrato público compatible; capacidades no disponibles se representan explícitamente, sin inventar dominio. | U+C / F05 |
| T06 | Dos actividades del mismo kind y título editorial ausente | Diferenciación temática segura con fallback; sin prompt reservado, soluciones ni rúbricas filtradas por metadatos. | U+C+I / F01/F05 |
| T07 | Cabeceras reales, títulos largos y ambas rutas | Un título autosuficiente, sin antetítulo/subtítulo; estados como etiquetas funcionales. No truncar información esencial para cumplir un número de líneas. | M+E / F09 |
| T08 | Usuario solo V1, solo V2, mixto y sin matrícula | Inicio/Hoy/Progreso tienen contenido y acciones coherentes; «Continuar» llega al ámbito anunciado; vacío útil y auténtico. | I+E / F05 |
| T09 | Nodo de unidad abierto | Un clic en Abrir ruta llega al detalle y unidad seleccionada; un clic en actividad disponible crea/retoma el intento correcto. | E / F06 |
| T10 | Panel de VCI, diagnóstico disponible para Sistema porta | El resumen conserva su ámbito; no atribuye el diagnóstico ajeno a VCI. Solo acción rápida elegible y acceso principal a detalle. | C+E / F06 |
| T11 | Respuesta o lectura confirmada, intento incompleto | Salir y volver/recargar conserva ítem, revelación, respuesta y avance según recibo. No confundir volver con completar/abandonar. | I+E / F02 |
| T12 | Enlace profundo, historial y versión con clave retirada | Atrás/adelante y regreso preservan unidad/pestaña/foco; clave inválida lleva a contexto válido con explicación. Rechazar returnTo externo. | C+I+E / F06 |
| T13 | Móvil estrecho, teclado, textos largos y zoom de lectura | Responder, comprobar, continuar y cerrar son visibles y alcanzables; foco no queda tapado. No depende de un pixel exacto de captura. | E+M / F07 |
| T14 | 320/360/390/430 y escritorios; variación de alto/orientación | Área útil y pies respetan navegación/safe area. Verificar hit-test, scroll y foco. 768/820 tablet se registra aparte como diferido. | E+M / F07 |
| T15 | Mapa grande, navegación de varios niveles y recarga | IDs visibles correctos tras ida/vuelta, lista/mapa y cambio de tamaño; no desaparecen unidades por virtualización o medidas. | E+C / F06/F07 |
| T16 | Guía/tablas/listas/imágenes; recurso con localizador | Abrir revisión autorizada y sección correcta; mantener estructura y posición. Ausente/denegado produce estado claro, no enlace falso. | I+E+M / F06 |
| T17 | Actividad completada, recurso de consulta y evaluación reservada | Consultar no crea respuesta/premio; practicar usa comando explícito. No revelar banco reservado ni material sin permiso. | I+E / F06 |
| T18 | Repaso V1 con A y B elegibles; A falla | A queda atendido en la pasada y B puede continuar; A no reaparece antes del vencimiento. Respuesta/revelación nueva respeta identidad de presentación. | U+I+E / F03 |
| T19 | Solo un ítem fallado sin otros elegibles | Cerrar pasada con próximo repaso real. No repetir inmediatamente ni mantener pantalla bloqueada esperando diez minutos. | U+I+E / F03 |
| T20 | Límite de reapariciones en una o varias sesiones | Con reloj controlado, respetar ventana/límite vigente; reiniciar sesión no permite evadirlo. Guardar y recuperar eventos una vez. | U+I / F03 |
| T21 | Flashcard fallada, nueva presentación elegible | Mostrar anverso; revelación anterior no revela la nueva ronda. Again/hard/good/easy aplican una sola transición aceptada. | I+C+E / F03 |
| T22 | Sesión abierta y varias acciones de ruta elegibles | Prioridad del servidor se conserva y se explica; no crear otro intento saltándose bloqueo. Retomar lleva al intento correcto. | I+E / F03 |
| T23 | V1 pendiente, V2 mantenimiento y retención distintos | Centro común cuenta unidades homogéneas por categoría; explica qué incluye el lote y qué queda pendiente. | C+I+E / F03/F05 |
| T24 | Consulta libre, práctica libre y actividad guiada del mismo material | Cada modalidad declara guardado/XP/retención reales. Saltar a ruta conserva destino; cerrar modal vuelve al lector. | I+E / F02/F05 |
| T25 | Retención a 7/30 días, respuesta tardía y separación mínima | Fechas dependen de hechos y reloj del servidor; no fingir realización en el día nominal ni habilitar temprano por reloj cliente. | U+I / F03 |
| T26 | Ausencia prolongada y repaso ayudado/no ayudado | Ausencia solo genera pendiente; ayuda/autocalificación no otorga evidencia objetiva. Éxitos/fallos cambian estado según política fijada. | U+I+E / F03 |
| T27 | Acumulado review_applied 0, 18, 19 y 20 | Premio usa residual; desde 19 se concede como máximo 1. Categoría termina ≤20, sin tocar premios ajenos. | U+I / F04 |
| T28 | V1 y V2 responden simultáneamente cerca del límite | Con conexiones independientes PostgreSQL, lock compartido evita exceso, duplicación e interbloqueo; verificar ledger y saldo. | I PostgreSQL / F04 |
| T29 | Mismo evento/clave reenviado, red pierde respuesta | Recibo original se recupera y no crea otro premio. Mismo requestId con payload distinto es rechazado según contrato. | I+E / F04 |
| T30 | XP total/ruta/sesión y avance no lineal | Los tres saldos concilian con eventos; progreso corresponde a IDs, no a pintar primeros N pasos. Mostrar motivo confirmado de 0 XP. | I+C+E / F04/F05 |
| T31 | Diagnóstico insuficiente, reprobado y aprobado | Respetar umbral/cooldown; aprobar habilita destino sin dominio/XP/actividades previas ficticios; fallar conserva estado y explica reintento. | U+I+E / F02/F05 |
| T32 | Offline antes del envío y después de aceptación del servidor | Estado pendiente claro, payload/clave preservados, sin avance falso; reconectar/reintentar termina una vez. Probar V1 y V2 por separado. | I+E / F02 |
| T33 | Recarga/cierre con solicitud pendiente | Reabrir en el mismo contexto recupera la solicitud; no mostrar respuesta distinta a la que se reenvía ni limpiar datos antes de confirmar. | C+E / F02 |
| T34 | Doble clic, dos pestañas, conflicto rowVersion y sesión abierta | Una mutación efectiva por identidad; conflicto recuperable sin sobrescribir respuesta confirmada ni crear intento paralelo indebido. | I+E / F02 |
| T35 | Usuario sin permiso, revisión/objetivo ajeno e ítem reservado | Autorización se vuelve a comprobar en cada comando y lectura; UI/caché comunes no filtran claves sensibles o respuestas. | I+C / F01/F05/F06 |
| T36 | Preview de revisión con 409 y adopción autorizada en entorno de prueba | Consultar no adopta ni comunica adopción fallida. Adopción distingue confirmada/pendiente y preserva versión de intentos abiertos. | I+C+E / F02 |
| T37 | Navegación repetida y mapa de volumen representativo | Conservar contexto/IDs, medir mounts y solicitudes; no afirmar mejora por una sola recarga caliente. | E+perfil / F07 |
| T38 | Navegación fría/caliente y mutación reciente | Medir presupuestos; caché válida por usuario/matrícula/revisión, invalidación tras recibo, sin N+1 injustificado. | I+E+perfil / F07 |
| T39 | 401/403/404/mismatch/5xx de V1/V2 | Clasificación correcta y sin fallback para eludir permisos; motor se resuelve con contrato autorizado y menos lecturas solo si procede. | I+C / F07 |
| T40 | Teclado y tecnología de asistencia | Pestañas, diálogos, ayudas, feedback y navegación operables; foco recuperado y anuncios sin repetición excesiva. Color no es el único estado. | E+M / F07/F09 |
| T41 | Último ítem V1 completado con feedback aún presente | Resultado visible y «Ver resumen», incluso sin siguiente ítem; sin null/vacío. Recarga y respuesta duplicada no alteran resultado. | C+E / F02 |
| T42 | Quiz de guía con dos textos iguales y claves distintas | Validador impide ambigüedad; la UI no presenta dos opciones indistinguibles con resultados opuestos. Cubrir Unicode/espacios. | U+I+E / F01 |
| T43 | Frase breve observada y aliases aprobados; negativos cercanos | Todas las variantes aprobadas aceptadas; errores semánticos rechazados. Validar versión fijada y resultado del diagnóstico. | U+I+E+editorial / F01 |
| T44 | Materiales nativos/embebidos, video vinculado, varias páginas | Global y materias presentan la misma unión autorizada; deduplicación, conteos, filtros y paginación estables. Error no equivale a vacío. | I+C+E / F05 |
| T45 | Documento rico y búsqueda con/sin tilde | API y web extraen texto útil sin tokens del editor; teclado abre resultado conforme al patrón accesible, Escape cierra y foco vuelve. | U+I+E / F05/F07 |
| T46 | Abrir cuestionario desde biblioteca, guía y ruta | Modo claro: consulta/práctica guiada/libre. No expone respuestas antes de evaluación donde no corresponde ni promete guardado inexistente. | C+E / F02/F05 |
| T47 | Lectura V2 seguida de práctica | El botón describe el próximo estado; evitar pantallas de confirmación redundantes cuando el contrato permita consolidarlas. Guardado correcto aunque se interrumpa la transición. | I+E / F02/F06 |
| T48 | Tabla de guía V1 y documento libre equivalente | Semántica de celdas/listas conservada en móvil y desktop; revisión correcta y sección persistida; contenido saneado. | C+E / F06 |
| T49 | Pista vacía, pista real y fuente | No cobrar asistencia por una pista inexistente presentada como válida; ayuda real registrada una vez y efectos de evidencia correctos. | U+I+E / F01/F02 |
| T50 | auth/me no disponible, DTO inválido, sesión vencida y recuperación | UI distingue causas accionables; no hace logout por timeout. Correlación saneada y recuperación mantienen trabajo pendiente. | I+C+E / F02/F07 |
| T51 | Diagnóstico de tres preguntas y retención | Progreso propio visible; resultado distingue guardado/correcto y muestra respuesta/feedback autorizado. Sesión identifica su tipo antes de empezar. | C+E / F02/F09 |
| T52 | Medianoche local, UTC, cambio de zona y horario estacional | acceptedAt y zona autorizada determinan fecha/límites; reloj del cliente no cambia elegibilidad. Sin doble extensión ni fallo por ausencia. | U+I / F03 |
| T53 | Repetir actividad ya premiada y leer de nuevo | Progreso y saldo no se duplican; premios por unidad/ruta/hito se conceden una vez según motor, incluyendo concurrentes. | I PostgreSQL+E / F04 |
| T54 | Usuario A y B, antigua/nueva revisión y caché caliente | Estado de A jamás se muestra a B; revisión e invalidación correctas después de respuesta/adopción. | I+E / F05 |
| T55 | Todos los formatos soportados, incluidas imágenes y video | Ejercitar selección, breve, relaciones, secuencia, caso, estudio, construida y objetivo de imagen; V1 video/quiz/cards/guía. En construida: escribir→revelar→autocalificar→verificación; video/imagen no se completan ficticiamente si falta recurso. | U+C+I+E / F06 |
| T56 | Móvil físico y escritorio en navegadores objetivo | Teclado virtual, orientación, foco, controles táctiles y reconexión reales. Documentar modelo/OS/browser; emulación se informa separada. | M / F07 |
| T57 | Mismo estado V1/V2 y datos largos/vacíos/error | Comparar composición, títulos, etiquetas y jerarquía; V1 adopta la base moderna V2, preservando capacidades reales. | E+M / F09 |
| T58 | Nueva ruta compatible y versión anterior sin displayTitle | Render común sin nueva pantalla por motor; fallback consistente; marca original conservada. | C+E+M / F09 |
| T59 | SHA candidato final | Pruebas pertinentes, typecheck/lint/build y CI del mismo SHA; preview accesible y aceptación autenticada documentada. | CI+E / F10 |
| T60 | Liberación autorizada y rollback ensayado | Verificar commit servido/alias, smoke real, métricas y reversión compatible; sin perder intentos/premios aceptados al revertir UI. | Entrega+E / F10 |

### 8.3 Escenarios integrales de aceptación

Cada escenario se ejecuta en móvil y escritorio; se adjunta recibo/saldo antes y después cuando muta aprendizaje.

1. **Empezar y continuar:** Inicio → ruta → unidad → actividad nueva → feedback → resumen → siguiente actividad → volver a unidad. Recargar y retomar sin pérdida.
2. **V1 histórico:** Peritoneo con sus contenidos corregidos; abrir todas las actividades esenciales, terminar una no completada y consultar otra completada. Verificar video si pertenece a la revisión, sin ocultarlo.
3. **V2 con prerrequisitos:** unidad bloqueada → explicar requisito → diagnóstico fallido → cooldown → aprobado → primera actividad. Acceso cambia; dominio/XP no se inventan.
4. **Repaso sin bucle:** dos ítems pendientes → fallo A → B → cierre → refuerzo cuando corresponda. Repetir con un solo ítem y con flashcards.
5. **Red interrumpida:** enviar, perder respuesta, recargar, reconectar y recuperar. Contar exactamente una respuesta, transición de progreso y recompensa.
6. **Práctica libre:** buscar materia → encontrar quiz/cards → practicar → volver al material → entrar a la ruta correspondiente si está autorizada. Distinguir estado local de guardado guiado.
7. **Usuario mixto:** completados no lineales en V1/V2 → Inicio/Hoy/Progreso/mapa/detalle/revisión. Mismas identidades, cifras y próxima acción pertinentes.
8. **Contenido retirado o incompleto:** actividad sigue visible con motivo; no bloquea sin salida ni finge completado. Arreglo editorial versionado y aceptación de la transición.
9. **Dispositivo y entrada:** móvil con teclado abierto y orientación cambiada; escritorio con teclado; retorno de modal y pestañas con foco correcto.
10. **Final y recuperación:** último ítem correcto/incorrecto → feedback visible → resumen; reabrir sesión terminada y volver sin crear otro premio.

La condición de cierre no es «hice clic en todo». Debe coincidir el comportamiento mostrado con el estado confirmado y poder repetirse con datos controlados.




## 9. Rendimiento y dispositivos prioritarios

### 9.1 Presupuestos propuestos

Los siguientes son **objetivos de aceptación**, no resultados actuales. F00 fija equipo, navegador, red, volumen y condiciones; F07 mide contra esa misma línea base. Si un presupuesto no resulta razonable por una dependencia demostrada, documentar la causa y la decisión del propietario antes de reemplazarlo.

| Indicador | Objetivo inicial | Forma de comprobar |
|---|---|---|
| Respuesta visual al clic | Estado de activación/procesando visible en ≤100 ms en interacción local habitual | Traza de evento a actualización visible; no simular resultado guardado |
| Panel/resumen de nodo con datos disponibles | p75 ≤300 ms | Click → panel utilizable; medir con y sin caché por separado |
| Navegación interna caliente hacia detalle | p75 ≤800 ms; p95 ≤1.500 ms | Click → título, unidad y acción utilizables, no solo aparición de un skeleton |
| Crear/retomar intento y confirmar respuesta | p75 ≤1.500 ms; p95 ≤3.000 ms en perfil acordado | Medición completa navegador→servidor→UI; conservar feedback de espera y recuperación |
| LCP | p75 ≤2,5 s | Medición de campo por tipo de dispositivo y ruta, complementada con laboratorio |
| INP | p75 ≤200 ms | Interacciones reales; incluir abrir mapa, panel, responder y cambiar de unidad |
| CLS | p75 ≤0,1 | Revisar especialmente carga de imágenes, barras y paneles durante acciones |
| Coherencia tras respuesta | Estado correcto al terminar la confirmación/invalidación | No queda contador antiguo en una superficie tras volver; no “acelerar” mostrando progreso falso |
| Solicitudes redundantes | Cero duplicados evitables de la misma lectura simultánea; sin N+1 por ruta visible | Traza identificada por ámbito/versión; justificar lecturas que cambian semántica |

LCP/INP/CLS y sus umbrales proceden de [Core Web Vitals de web.dev](https://web.dev/articles/vitals). Los restantes presupuestos son decisiones propuestas para este producto. La muestra inicial TTFB 127 ms, DOMContentLoaded 1.892 ms y load 1.905 ms **no permite comparar esos percentiles ni declarar aprobados Core Web Vitals**.

Método mínimo:

- Separar frío/caliente, primera carga/navegación interna y fallo/reintento. Mantener el mismo estado inicial y tamaño de datos para comparar.
- En laboratorio, al menos 10 ejecuciones frías y 30 calientes por recorrido crítico en un perfil estable. Guardar muestras, mediana y percentiles descriptivos; no presentarlos como p75 de usuarios reales.
- Perfiles propuestos: escritorio de referencia sin throttling y móvil con red/CPU limitadas documentadas; añadir móvil físico. Un ejemplo controlado es RTT 150 ms, 10 Mbps y CPU 4×, sin afirmar que represente todos los teléfonos.
- Medir el catálogo y mapa con volumen real máximo conocido y una fixture mayor (por ejemplo 3×), documentando tamaño y paginación. No atribuir ese volumen sintético al producto real.
- Separar tiempos de autenticación, servidor web, API, DB y render. Primero localizar el cuello de botella; luego comparar tras el cambio.
- No almacenar respuestas ni identificadores personales en métricas. No añadir trackers externos para esta tarea sin necesidad.

### 9.2 Matriz de dispositivo

| Grupo | Cobertura de aceptación futura | Prioridad |
|---|---|---|
| Móvil estrecho | 320 × 740 y 360 × 800 | Obligatoria funcional |
| Móvil habitual | 390 × 844 y 430 × 932 | Obligatoria funcional y luego visual |
| Móvil en horizontal | Alto reducido y teclado virtual en los flujos de respuesta | Obligatoria funcional |
| Escritorio compacto | 1024 × 768 y 1280 × 800, ratón/teclado | Obligatoria funcional |
| Escritorio habitual | 1440 × 900 y 1920 × 1080 | Obligatoria funcional y luego visual |
| Navegadores | Chromium de escritorio, Safari iOS y Chrome Android según dispositivos de prueba | Registrar versión y evidencia separada |
| Tablet | 768 × 1024, 820 y otras variantes específicas | **Diferida**, no puerta actual |

No ocultar un fallo móvil porque su anchura se acerque a un breakpoint usado por tablet. Lo diferido es la aceptación de tablet como dispositivo, no la obligación de que un móvil en horizontal o escritorio compacto pueda operar.

Los controles esenciales deben ser táctiles, tener nombre accesible y foco visible. El mínimo normativo de WCAG 2.2 para tamaño de objetivo es de 24 CSS px con excepciones; el objetivo de producto propuesto es 44–48 px para acciones principales, distinguiendo ambas cosas. Véanse [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) y [Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html). No declarar cumplimiento WCAG completo a partir de esas dos comprobaciones.

## 10. Entrega, versiones y reversión

### 10.1 Evidencia por capa

| Capa | Evidencia exigida | No sustituye |
|---|---|---|
| Código/local | Diff acotado, tests pertinentes, typecheck/lint/build del candidato | Integración remota o UX real |
| Integración de pruebas | DB aislada, conexiones independientes, transacciones/locks y contratos | PostgreSQL de producción ni datos editoriales reales |
| CI | Ejecución asociada al SHA exacto final | Deploy terminado |
| Preview | URL y versión, carga, rutas y recursos | Sesión autenticada ni producción |
| Aceptación autenticada | Cuenta/rol de prueba, recorrido, recibos y saldos antes/después | Todos los roles ni todo el contenido |
| Producción | Versión/alias servido, smoke autorizado y métricas de funcionamiento | Cierre formal si quedan criterios sin evidencia |
| Aceptación del producto | Puertas de fases y riesgos explícitos | Revisión clínica exhaustiva o seguridad integral |

La implementación debe ser revisable antes de cualquier paso de publicación. Este documento no publica cambios ni autoriza por sí solo al ejecutor a modificar una base productiva. La autorización que reciba en su tarea determina esos pasos; no debe añadir confirmaciones rutinarias que ya estén cubiertas por esa autorización.

### 10.2 Estrategia de compatibilidad

1. Introducir adaptadores y componentes comunes detrás del mecanismo de activación existente o una bandera acotada si hace falta. Mantener las URLs y contextos válidos.
2. Separar despliegue de UI, contrato compatible y revisión de contenido. Las revisiones fijadas por intentos siguen siendo interpretables.
3. Añadir campos de metadatos de forma compatible; no alterar hashes de snapshots publicados. Para contenido corregido, emitir nueva revisión y definir adopción con garantías.
4. Conservar comandos y políticas V1/V2. Un diseño único no obliga a migrar datos ni a convertir V1 en V2.
5. Retirar ramas visuales antiguas solo después de comprobar paridad de capacidades. Una condición de motor puede seleccionar adaptador/comando; no debe duplicar toda la pantalla.
6. Revertir una UI no debe invalidar el contrato nuevo ni destruir recibos. Mantener compatibilidad de lectura durante la ventana de reversión.
7. Si una migración de datos fuera indispensable, crear tarea separada con ensayo, verificación, respaldo y plan de recuperación. No incluirla como efecto lateral de “unificar diseño”.

### 10.3 Señales que exigen detener una liberación

- Respuestas aceptadas sin recuperación, intentos duplicados o pantalla sin salida.
- Premio duplicado, exceso del límite o pérdida de saldo/progreso.
- Acceso incorrecto a objetivo, revisión o contenido de otro usuario.
- Contenido equivocado o calificación ambigua en el recorrido de aceptación.
- Acciones principales inaccesibles en móvil/escritorio.
- Regresión sostenida de disponibilidad o navegación respecto de la línea base.

Antes de liberar, definir el responsable y mecanismo de vuelta al candidato anterior compatible. Después, observar errores de inicio/respuesta/completado, latencias, abandonos entre estados, reintentos, discrepancias de catálogos y fallos de auth/me. No concluir que una caída de XP medio significa un bug sin distinguir cambio de política, mezcla de usuarios y tipos de sesión.

## 11. Instrucciones para el modelo ejecutor

### 11.1 Reglas que no se deben romper

- Mantener autoridad del servidor sobre acceso, dominio, consolidación, fechas, avance, XP y recibos.
- Mantener idempotencia, versiones esperadas, snapshots fijados, autorización y aislamiento de caché.
- No migrar matrículas V1 a V2 para conseguir igualdad visual.
- No reparar contenido médico inventando preguntas, fuentes o respuestas; solicitar la decisión editorial necesaria con evidencia concreta.
- No recalcular ni borrar datos históricos como parte de una corrección de interfaz.
- No introducir algoritmos nuevos de repaso, corrección generativa o gamificación sin una tarea independiente.
- No convertir consulta o autoevaluación en evidencia objetiva.
- No ocultar funciones o pasos obligatorios para que los contadores “parezcan” coherentes.
- Priorizar móvil/escritorio y funcionamiento. No gastar la primera fase en colores, sombras o tablet.
- Mantener nombre/logo e identidad del producto. No rehacer branding.
- Si una prueba se omite, escribir NO VERIFICADO y su causa. Un test verde que no cubre el caso observado no cierra el hallazgo.

### 11.2 Unidad de trabajo sugerida

Cada fase puede dividirse en fichas pequeñas, con una ficha por causa verificable o contrato. Por ejemplo:

- F01-A: corregir asociación de Peritoneo y documentar sus revisiones.
- F01-B: validación de duplicados y variantes de respuesta breve.
- F02-A: feedback final de repaso V1.
- F02-B: recuperación offline y cierre consistente por motor.
- F03-A: elegibilidad de reaparición y pasada de repaso.
- F04-A: tope residual y concurrencia común de XP.
- F05-A: catálogo por capacidades; F05-B: contadores y adaptadores.
- F06-A: contexto de navegación; F06-B: resumen de mapa y detalle común.
- F07-A: investigación de disponibilidad; F07-B: perfil de rendimiento y acceso operativo.

Esta división no exige un agente por ficha ni trabajo paralelo. Cada cambio debe tener alcance pequeño y evidencia suficiente. No crear tests de “lo que hace hoy la implementación” si perpetúan el fallo; probar el contrato y la conducta esperada.

### 11.3 Plantilla de cierre de ficha

~~~markdown
# Fxx-X — Nombre concreto

Estado: PASS / FAIL / NO VERIFICADO
Dependencias:
Hallazgos y pruebas:
SHA local:
SHA/versión del entorno validado:
Rol y datos de prueba:

## Cambio
Problema reproducido y conducta final.
Archivos/contratos afectados.
Impacto sobre revisiones y datos existentes.

## Evidencia
Comandos y resultados reales.
Pruebas de integración y navegador, separadas.
Capturas/recibos relevantes y pasos de reproducción.
Comparación antes/después.

## Criterios
- Criterio 1: resultado + enlace.
- Criterio 2: resultado + enlace.

## Pendientes y riesgos
Qué falta, por qué y qué condición lo desbloquea.
No atribuir producción a pruebas locales.

## Próximo paso permitido
La siguiente ficha/fase y sus dependencias efectivamente satisfechas.
~~~

### 11.4 Definición de terminado del encargo futuro

El trabajo estará completo cuando ambas rutas compartan una experiencia clara basada en V2; los flujos de aprender, evaluar, repasar, consultar y continuar sean correctos y recuperables; progreso/XP/agenda concilien con el servidor; móvil y escritorio hayan pasado su aceptación; y cada estado de entrega esté acreditado. El aspecto visual se da por terminado solo después de la puerta funcional, no como sustituto de ella.

Este plan no exige que el usuario complete todas las rutas ni que se espere un mes para desarrollar. Las políticas de 7/30 días se prueban con reloj controlado y luego se distinguen de observación longitudinal real. Los casos no alcanzables con la cuenta de auditoría se cubren con fixtures fieles y cuentas de prueba, sin manipular la elegibilidad de producción para “forzarlos”.



## 12. Mapa técnico para localizar el trabajo

Los enlaces señalan archivos reales del checkout inspeccionado. Los números de línea son orientativos y deben revalidarse si cambia el SHA; una coincidencia de código no prueba que esa revisión esté desplegada.

| Área | Archivo | Qué revisar |
|---|---|---|
| Despacho de ruta | [page.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/app/aprendizaje/rutas/[slug]/page.tsx>) | Selección de pantalla V1/V2; conservar URLs y autorización. |
| Lectura V1/V2 | [server.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/server.ts>) | Detección de motor, 404/mismatch y validación de respuestas. |
| Detalle V1 | [learning-path-screen.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/learning-path-screen.tsx:36>) | Filtra pasos/opciones video; H03. |
| Panel V1 | [lesson-detail-panel.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/map/lesson-detail-panel.tsx:106>) | Filtra video en recomendación y actividades; H03. |
| Detalle V2 | [path-screen.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/path-screen.tsx>) | Composición de detalle, progreso y versiones. |
| Currículo | [curriculum-model.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/curriculum-model.ts>) | Actividad pendiente, bloqueo, diagnóstico y prioridad confirmada. |
| Panel V2 | [map-panel.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/map-panel.tsx>) | Resumen actual y acciones de unidad. |
| Motivación | [motivation.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/motivation.tsx:12>) | Fallback a diagnóstico de otra unidad; H15. |
| DTO público V2 | [guided-learning-v2.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/packages/contracts/src/guided-learning-v2.ts>) | Extender metadatos seguros sin publicar enunciados reservados. |
| Repaso V1 UI | [review-activity.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/activities/review-activity.tsx:29>) | Retorno null antes de feedback; H24. |
| Shell V1 | [activity-shell.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/activities/activity-shell.tsx:98>) | Resumen oculto mientras hay feedback; H24. |
| Intentos V1 | [postgres-learning-activities.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/providers/postgres-learning-activities.ts:1063>) | sessionRetry, finalized e índice del siguiente ítem; H05. |
| Scheduler V1 | [review-scheduler.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/review-scheduler.ts>) | Intervalos y grados de recuerdo. |
| Scheduler V2 | [scheduler.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/scheduler.ts>) | Refuerzo, límites, estabilidad y recibos. |
| XP | [rewards.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/rewards.ts:91>) | Fórmula V2; contrastar awardAppliedReview en línea 312, H06. |
| Calificación V2 | [grading.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/guided-learning/v2/grading.ts:44>) | Normalización y aliases exactos; construida, relaciones, secuencia e imagen. |
| Ayuda V2 | [postgres-guided-learning-v2.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/providers/postgres-guided-learning-v2.ts:1258>) | Fallback genérico de hint y política de asistencia; H30. |
| Player V2 | [player.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/player.tsx>) | Recuperación, ayuda, feedback y composición por tipo. |
| Lectura visual V2 | [study.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/v2/renderers/study.tsx:13>) | assetKey anuncia recurso visual no disponible en visor; H16. |
| Guía V1 | [guide-activity.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/learning/activities/guide-activity.tsx>) | Secciones, progreso y representación del texto. |
| Práctica libre | [content-detail-screen.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/content-detail-screen.tsx:1564>) | QuizBody de consulta y FlashcardsBody libre; contraste con quiz de guía. |
| Catálogo global | [page.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/app/asignaturas/page.tsx:21>) | Petición con kind antes de proyectar embebidos; H26. |
| Catálogo API | [study-catalog.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/study-catalog.ts:111>) | Filtro content_items.kind; H26. |
| Proyección catálogo web | [study-catalog.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/lib/study-catalog.ts:97>) | getStudySummaryCatalog; recursos de guía/video. |
| Búsqueda API | [content-search.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/api/src/content-search.ts>) | collectStrings recoge tipos y marcas del documento; H28. |
| Búsqueda web | [content-search.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/lib/content-search.ts>) | Extractor semántico web y diferencia con API. |
| Combobox | [global-content-search.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/global-content-search.tsx:206>) | Teclado de resultados; H28. |
| Shell autenticado | [authenticated-app-layout.tsx](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/components/authenticated-app-layout.tsx:19>) | Estado unavailable; H31. |
| Usuario actual | [current-user.ts](<D:/Jose (Datos)/Medicina/CEDIAH/Web/apps/web/src/lib/server/current-user.ts>) | auth/me: status no 200 o DTO inválido se convierten en unavailable. |

### 12.1 Identidad de las sesiones de prueba

Estos IDs sirven para correlacionar evidencia en el entorno autorizado; no son credenciales y no deben emplearse para alterar el historial.

| Sesión | Identificador | Efecto confirmado |
|---|---|---|
| V2 respuesta recuperada | c7b3e68d-e334-4897-8eaf-b62f3d1b5539 | +2 XP; 16→17/34; cerrada. |
| V2 evaluación diferida fallada | 3ebc5903-ba5f-4591-8220-4da3621416be | Fallo deliberado; refuerzo +10 min; 0 XP; cerrada. |
| V1 flashcards | d1575ecb-e801-441c-9ccd-382603cc74cf | Calificaciones again/hard/good; actividad previamente completada; cerrada. |
| V1 repaso | a56de735-821b-4413-9e1c-c4f769adc66c | Repetición inmediata y vacío final; recarga recupera resumen; +2 XP total atribuido al repaso. |
| V1 cuestionario normal | f4fa12fa-a947-46f9-ba64-845876115bcd | Resultado 3/3; actividad ya completada; cierre funcional. |
| V1 lectura | 878c9145-cba0-4191-922d-e9a2ddd06271 | Recarga en sección 2/11; cierre autodeclarado desde sección 2. |
| V2 diagnóstico reprobado | c9de01b3-44e4-48da-bffc-eb64617c1a77 | Recibo [1,0,1]; respuesta breve rechazada; sin acceso ni XP. |
| V2 diagnóstico aprobado | a4a7874c-768f-4284-adf9-3af681bfaa80 | Preguntas rotadas; acceso Sistema porta; 0 XP, sin completar actividades. |
| V2 lectura Sistema porta | ac028561-47ba-47c1-92fc-0eabd88e617a | 17→18/34; 0 XP; cerrada. |

Además se completó un refuerzo V2 con pista/fuente y se practicó fuera de la ruta. El ID del refuerzo no se exportó a este resumen; sus capturas E60–E61 muestran cierre y agenda. No se inventa un identificador ni se afirma que la práctica libre haya generado un recibo guiado.

## 13. Evidencia visual y archivos de apoyo

El Markdown es el entregable principal y contiene el plan completo. Las capturas y JSON son anexos de trazabilidad; si se mueve el documento a otra máquina, conviene copiar también esta carpeta. Las imágenes siguientes son capturas de la auditoría, no diseños propuestos. Algunas capturas de escritorio tienen menor nitidez por el mecanismo de captura; eso no se considera un defecto de la plataforma.

### 13.1 Capturas representativas

**E12 — La actividad de Peritoneo abre el cuestionario de cuello.**

![E12 — La actividad de Peritoneo abre el cuestionario de cuello](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/12-peritoneo-video-es-cuestionario.jpg>)

**E15 — Una actividad visible frente a 1/3 esenciales.**

![E15 — Una actividad visible frente a 1/3 esenciales](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/15-v1-unidad-incompleta.jpg>)

**E39 — Solicitud V2 pendiente tras el corte de red.**

![E39 — Solicitud V2 pendiente tras el corte de red](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/39-v2-respuesta-pendiente-sin-red.jpg>)

**E48 — Reaparición inmediata en repaso V1.**

![E48 — Reaparición inmediata en repaso V1](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/48-repaso-repeticion-inmediata.jpg>)

**E49 — Final del repaso con cuerpo vacío.**

![E49 — Final del repaso con cuerpo vacío](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/49-repaso-final-vacio.jpg>)

**E50 — Resumen recuperado al recargar.**

![E50 — Resumen recuperado al recargar](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/50-repaso-recuperado-tras-recargar.jpg>)

**E58 — Diagnóstico cuyo recibo rechazó una respuesta equivalente.**

![E58 — Diagnóstico cuyo recibo rechazó una respuesta equivalente](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/58-diagnostico-respuesta-equivalente-rechazada.jpg>)

**E63 — Biblioteca general de cuestionarios vacía.**

![E63 — Biblioteca general de cuestionarios vacía](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/63-cuestionarios-biblioteca.jpg>)

**E66 — Cuestionarios disponibles dentro de Anatomía.**

![E66 — Cuestionarios disponibles dentro de Anatomía](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/66-cuestionarios-existentes-en-materia.jpg>)

**E69 — Búsqueda con fragmentos técnicos.**

![E69 — Búsqueda con fragmentos técnicos](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/69-busqueda-fragmentos-tecnicos.jpg>)

**E72 — Opciones idénticas, una correcta y otra incorrecta.**

![E72 — Opciones idénticas, una correcta y otra incorrecta](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/72-guia-cuestionario-opciones-duplicadas.jpg>)

**E74 — Error intermitente de acceso.**

![E74 — Error intermitente de acceso](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/74-ruta-error-conexion.jpg>)

**E76 — Diagnóstico aprobado sin XP adicionales.**

![E76 — Diagnóstico aprobado sin XP adicionales](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/76-diagnostico-aprobado.jpg>)

**E78 — Lectura V2 completada: 18/34 y 186 XP.**

![E78 — Lectura V2 completada: 18/34 y 186 XP](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/78-lectura-v2-completada.jpg>)

**E80 — Estado final de la ruta.**

![E80 — Estado final de la ruta](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/80-estado-final-ruta.jpg>)

### 13.2 Índice de capturas

El número E identifica el prefijo del archivo. E49 tiene dos archivos históricos: para el hallazgo usar el que termina en final-vacio. El nombre del otro no demuestra que se aceptara la última opción; su feedback no se observó. E52 tampoco acredita por sí sola el estado offline V1. E44 está parcialmente cortada; E61 es la referencia posterior de agenda. E59 y E67 se excluyen como evidencia visual principal por recorte/escalado.

| Archivo | Uso |
|---|---|
| [01-inicio.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/01-inicio.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [02-aprendizaje.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/02-aprendizaje.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [03-abdomen-mapa-unidades.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/03-abdomen-mapa-unidades.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [04-panel-unidad-v2.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/04-panel-unidad-v2.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [05-panel-recursos-v2.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/05-panel-recursos-v2.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [06-ruta-v2-detalle.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/06-ruta-v2-detalle.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [07-v2-unidad-actividades.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/07-v2-unidad-actividades.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [08-v2-actividades-genericas.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/08-v2-actividades-genericas.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [09-v2-cuestionario.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/09-v2-cuestionario.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [10-v2-detalles-sesion.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/10-v2-detalles-sesion.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [11-peritoneo-panel-unidad2.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/11-peritoneo-panel-unidad2.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [12-peritoneo-video-es-cuestionario.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/12-peritoneo-video-es-cuestionario.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [13-v1-recursos-duplicados.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/13-v1-recursos-duplicados.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [14-ruta-v1-detalle.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/14-ruta-v1-detalle.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [15-v1-unidad-incompleta.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/15-v1-unidad-incompleta.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [16-v1-paso-intermedio.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/16-v1-paso-intermedio.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [17-flashcards-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/17-flashcards-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [18-flashcards-autoevaluacion.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/18-flashcards-autoevaluacion.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [19-repaso-global.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/19-repaso-global.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [20-repaso-real.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/20-repaso-real.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [21-v2-repaso-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/21-v2-repaso-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [22-agenda-retencion.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/22-agenda-retencion.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [23-v2-detalle-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/23-v2-detalle-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [24-v2-recursos-sin-apertura.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/24-v2-recursos-sin-apertura.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [25-panel-v1-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/25-panel-v1-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [26-mapa-peritoneo-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/26-mapa-peritoneo-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [27-vista-lista-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/27-vista-lista-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [28-mapa-320.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/28-mapa-320.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [29-panel-v2-320.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/29-panel-v2-320.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [30-panel-v2-tablet.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/30-panel-v2-tablet.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [31-tablet-boton-cubierto.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/31-tablet-boton-cubierto.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [32-guia-lectura.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/32-guia-lectura.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [33-versiones-historial.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/33-versiones-historial.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [34-catalogo-error-conexion.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/34-catalogo-error-conexion.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [35-catalogo-recuperado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/35-catalogo-recuperado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [36-hoy-completo.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/36-hoy-completo.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [37-ajustes-aprendizaje.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/37-ajustes-aprendizaje.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [38-progreso-completo.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/38-progreso-completo.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [39-v2-respuesta-pendiente-sin-red.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/39-v2-respuesta-pendiente-sin-red.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [40-v2-respuesta-guardada-xp.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/40-v2-respuesta-guardada-xp.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [41-v2-sesion-finalizada.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/41-v2-sesion-finalizada.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [42-v2-error-deliberado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/42-v2-error-deliberado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [43-v2-evaluacion-cerrada-escritorio.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/43-v2-evaluacion-cerrada-escritorio.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [44-v2-refuerzo-diez-minutos.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/44-v2-refuerzo-diez-minutos.jpg>) | Captura parcial; complementar con DOM y E61. |
| [45-flashcards-completadas.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/45-flashcards-completadas.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [46-repaso-opciones-identicas-error.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/46-repaso-opciones-identicas-error.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [47-repaso-programacion-error.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/47-repaso-programacion-error.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [48-repaso-repeticion-inmediata.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/48-repaso-repeticion-inmediata.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [49-repaso-final-vacio.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/49-repaso-final-vacio.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [49-repaso-mismo-texto-aceptado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/49-repaso-mismo-texto-aceptado.jpg>) | Nombre histórico ambiguo; NO demuestra calificación de la última respuesta. |
| [50-repaso-recuperado-tras-recargar.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/50-repaso-recuperado-tras-recargar.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [51-v1-cuestionario-explicacion-prueba.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/51-v1-cuestionario-explicacion-prueba.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [52-v1-envio-sin-red.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/52-v1-envio-sin-red.jpg>) | No acredita un estado pendiente offline visible. |
| [53-v1-cuestionario-completado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/53-v1-cuestionario-completado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [54-guia-posicion-persistida.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/54-guia-posicion-persistida.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [55-guia-completada.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/55-guia-completada.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [56-diagnostico-secuencia-movil.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/56-diagnostico-secuencia-movil.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [57-diagnostico-finalizado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/57-diagnostico-finalizado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [58-diagnostico-respuesta-equivalente-rechazada.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/58-diagnostico-respuesta-equivalente-rechazada.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [59-repaso-con-pista-escritorio.png](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/59-repaso-con-pista-escritorio.png>) | Captura parcial; usar E60–E61. |
| [60-repaso-asistido-completado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/60-repaso-asistido-completado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [61-repaso-agenda-confirmada.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/61-repaso-agenda-confirmada.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [62-seguridad-cuenta-sin-cambios.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/62-seguridad-cuenta-sin-cambios.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [63-cuestionarios-biblioteca.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/63-cuestionarios-biblioteca.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [64-flashcards-biblioteca.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/64-flashcards-biblioteca.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [65-materias-busqueda-escritorio.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/65-materias-busqueda-escritorio.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [66-cuestionarios-existentes-en-materia.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/66-cuestionarios-existentes-en-materia.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [67-cuestionario-respuestas-visibles.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/67-cuestionario-respuestas-visibles.jpg>) | Captura inválida por escalado; hallazgo basado en DOM y fuente. |
| [68-flashcards-fuera-ruta.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/68-flashcards-fuera-ruta.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [69-busqueda-fragmentos-tecnicos.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/69-busqueda-fragmentos-tecnicos.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [70-guia-lectura-independiente.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/70-guia-lectura-independiente.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [71-guia-indice-tabla.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/71-guia-indice-tabla.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [72-guia-cuestionario-opciones-duplicadas.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/72-guia-cuestionario-opciones-duplicadas.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [73-guia-cuestionario-resultado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/73-guia-cuestionario-resultado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [74-ruta-error-conexion.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/74-ruta-error-conexion.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [75-diagnostico-segundo-intento.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/75-diagnostico-segundo-intento.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [76-diagnostico-aprobado.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/76-diagnostico-aprobado.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [77-lectura-v2-tras-diagnostico.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/77-lectura-v2-tras-diagnostico.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [78-lectura-v2-completada.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/78-lectura-v2-completada.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [79-mapa-lista-escritorio.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/79-mapa-lista-escritorio.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |
| [80-estado-final-ruta.jpg](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/capturas/80-estado-final-ruta.jpg>) | Evidencia del recorrido; consultar contexto en sección 2. |

### 13.3 Registros complementarios

- [resultados-pruebas-locales.json](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/resultados-pruebas-locales.json>): salidas resumidas reales de las suites ampliadas y de cierre; los resultados previos se identifican como resumen.
- [ampliacion-funcional.json](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/ampliacion-funcional.json>): Notas A01–A18, cambios de estado y restauración del navegador. Son notas cronológicas; el texto consolidado de este plan resuelve sus observaciones intermedias.
- [recibo-diagnostico-resumido.json](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/recibo-diagnostico-resumido.json>): Resumen saneado del recibo del diagnóstico con puntuaciones [1,0,1]. No incluye tokens ni respuestas reservadas futuras.
- [rendimiento-observado.json](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/rendimiento-observado.json>): Una muestra temporal de navegación; no es un benchmark de percentiles.
- [geometria-tablet.json](<D:/Jose (Datos)/Medicina/CEDIAH/Web/output/auditoria-aprendizaje-2026-11-03/geometria-tablet.json>): Solapamiento observado en la primera pasada; tablet diferida.

Verificación final del checkout: HEAD seguía en 85236119f603d04053498356eb66ecf08b5dcc04 y git diff no mostró cambios en archivos rastreados. Permanecían las carpetas no rastreadas output/ y tmp/pdfs/ ya presentes; el trabajo de esta auditoría se guardó dentro de output/auditoria-aprendizaje-2026-11-03.

**Cierre de esta auditoría:** exploración ampliada, evidencias y plan terminados. Implementación, correcciones de contenido, validación pendiente y publicación pertenecen al encargo del ejecutor. No se declara que toda la plataforma esté libre de fallos ni que los casos aún no verificados hayan pasado.
