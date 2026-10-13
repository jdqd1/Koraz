# Rediseño del editor de rutas

Fecha de cierre: 13 de octubre de 2026, America/Caracas.

## Resultado

El editor guided-v2 se organiza alrededor del trabajo en escritorio: navegación horizontal compacta, actividades por unidad con búsqueda, configuración como área principal de edición y una vista previa compacta en directo. Los títulos identifican cada sección sin antetítulos ni descripciones repetidas. El estilo usa superficies neutras, tipografía de sistema, divisores sutiles y azul para las acciones y selecciones.

Antes de crear una actividad, el selector muestra un ejemplo interactivo, su finalidad y cuándo conviene usarla. Incluye los 13 tipos y composiciones existentes. Mecanismo crea dos actividades vinculadas; detección de errores crea un caso y dos preguntas. Los ejemplos del selector no se copian al borrador: la creación conserva los presets vacíos existentes.

En cada actividad se editan el contenido, la respuesta y la explicación en Configuración. La vista previa permanece visible mientras se edita; Probar activa sus controles para ensayar la respuesta. La vista de estudiante reutiliza los renderizadores de estudio, elección única, respuesta breve, respuesta construida, relaciones, secuencias e imágenes. Los casos permiten explorar sus etapas y las preguntas vinculadas. Las opciones y zonas de las imágenes también se editan en Configuración.

## Validación del primer rediseño

- TypeScript del frontend: PASS.
- ESLint de los archivos modificados: PASS.
- Suite del editor: 10 archivos, 114 pruebas PASS. Revisión posterior de los formularios y vistas previas: 3 archivos, 48 pruebas PASS; son un subconjunto y no se suman al total.
- `git diff --check`: PASS.
- Navegador integrado: los 13 tipos muestran finalidad, recomendación de uso y ejemplo antes de crearlos.
- Se respondió un ejemplo de respuesta breve; se probó responder, revelar el modelo y reiniciar una tarjeta. El modelo no aparece antes de responder y revelar.
- Creación desde cero: datos, tema sintético, unidad, objetivo, actividad de estudio y guardado del borrador. La actividad vacía recibió foco en Consigna. La navegación por las cinco secciones conservó los datos.
- Edición de un borrador: creación de respuesta breve, configuración de respuesta y explicación, guardado y recarga con contenido conservado.
- Validación con búsqueda activa: una actividad incompleta oculta por el filtro se abrió, se limpió la búsqueda y Consigna recibió foco. Se eliminó esa actividad de prueba y se guardó el borrador restaurado.
- Resoluciones revisadas: 1920 × 1080, 1440 × 900, 1280 × 800, 390 × 844 y 320 × 844, sin desbordamiento horizontal del documento. El selector también se revisó a 390 × 844.

Dos pruebas antiguas de renderizado fallaron inicialmente porque suponían que todas las actividades permanecían cerradas y que los tipos aparecían en un select permanente. Se ajustaron esas expectativas a la nueva interfaz: una actividad activa y un selector modal. Las comprobaciones de contratos, soluciones privadas, creación, eliminación y persistencia se conservaron.

## Alcance de la evidencia

Las interacciones se verificaron en `/visual-fixtures/editor-rutas-v2`, con datos sintéticos y el transporte local de la fixture. El catálogo de la prueba de creación nueva se simuló temporalmente en el navegador; la interceptación se retiró al terminar. Esto no acredita persistencia PostgreSQL ni un flujo autenticado en producción. La suite Playwright de usabilidad se actualizó y amplió; las comprobaciones de navegador de este cierre se ejecutaron mediante el navegador integrado, no mediante la CLI de Playwright.

La prueba de cada actividad conserva respuestas únicamente en la mini interfaz. Permite revisar controles, contenido y revelado; la corrección completa de la ruta sigue en la vista previa editorial existente, conectada al servidor. Para probar una imagen del borrador se abre una copia local en el navegador; no se sube ni cambia el recurso vinculado.

Se mantuvieron contratos, reglas de publicación, permisos, validadores y transporte de guardado. No se realizaron acciones de despliegue durante este rediseño.

## Ajustes de navegación, guardado y revisión

La navegación deja de usar el contenedor segmentado gris y los números de paso. Las cinco secciones comparten un divisor discreto; el texto azul y una línea inferior identifican la sección activa. Los recuentos quedan como información secundaria en escritorio.

El pie de guardado se reduce a una sola fila con el estado del borrador y las acciones. La fecha del último guardado queda en la ayuda del estado, y la revisión deja de ocupar una segunda línea. Los avisos que necesitan atención se muestran aparte. En pantallas estrechas, Atrás y Guardar usan iconos con nombres accesibles y mantienen controles de 44 píxeles; Guardar conserva su texto en la sección final.

Revisión agrupa los pendientes por actividad, evaluación, objetivos o fuentes. Cada tarea tiene un título concreto, una explicación en lenguaje de uso y una acción descriptiva. El contexto muestra los nombres del contenido; las etapas de casos y las comprobaciones de distintas unidades se distinguen entre sí. Las sugerencias se diferencian de los pendientes. Solo se agrupan avisos que llevan a la misma corrección; los resultados originales del validador se conservan.

Las acciones llevan al campo correspondiente o al control para añadir el contenido que falta. La presentación mantiene los requisitos de preguntas distintas, reservas exclusivas y comprobaciones de aprendizaje. No cambia la aprobación ni la publicación de la ruta.

Validación de esta iteración:

- Suite completa del editor, antes del último ajuste de contexto y navegación: 11 archivos, 121 pruebas PASS.
- Después de ese ajuste: 8 pruebas de revisión PASS, incluida una regresión nueva. Este resultado se solapa con la suite anterior y no se suma al total.
- TypeScript y ESLint de los archivos ajustados: PASS.
- `git diff --check`: PASS.
- Se inspeccionó visualmente una versión intermedia de la barra de navegación, el pie compacto y los pendientes en la fixture local. La barra inferior medía aproximadamente 56 píxeles en la vista estrecha revisada.
- La comprobación final de las acciones y del aspecto en navegador quedó NO VERIFICADA: la política de seguridad del navegador integrado bloqueó el acceso a la URL local. No se intentó acceder por otro navegador o mecanismo.

## Configuración como área principal

La configuración recibe aproximadamente el 62 % del área de edición en escritorio, con un ancho mínimo de 440 píxeles. La vista previa ocupa el resto y conserva un ancho mínimo de 300 píxeles. Cuando el espacio no permite ambas columnas, la configuración aparece primero y la vista previa después.

Todos los campos para crear la actividad están en Configuración: consigna, lectura, opciones, relaciones, etapas, zonas de imágenes, respuesta y explicación. El contenido y la respuesta quedan visibles desde el inicio. Objetivo y fuentes, ayuda adicional y opciones avanzadas se agrupan en desplegables; los campos permanecen montados para que la validación pueda abrirlos y enfocarlos. Las fuentes muestran sección y página cuando están disponibles para distinguir materiales con el mismo título.

La vista previa reutiliza los controles del estudiante y se actualiza mientras se edita. En Editar, las respuestas de prueba están desactivadas; Probar permite responder y reiniciar. Cambiar de modo reinicia el ensayo. La configuración permanece disponible en ambos modos y no se muestran soluciones privadas en la vista previa antes del revelado. La geometría de imágenes conserva el dibujo y las alternativas de teclado en el panel de configuración.

Validación local de este ajuste:

- Suite del editor: 11 archivos, 124 pruebas PASS.
- Se comprueba que los 13 presets vacíos abran su contenido editable y una vista previa sin inventar datos ni modificar el borrador durante el renderizado.
- TypeScript, ESLint de los archivos ajustados y `git diff --check`: PASS.
- El primer typecheck detectó declaraciones compiladas de contratos desactualizadas frente al trabajo concurrente de la vista del estudiante. Se recompilaron los contratos y el typecheck completo pasó; no se modificó ese código concurrente.
- La prueba E2E de vista previa se actualizó para comprobar el contenido en directo y la edición en Configuración. No se ejecutó la CLI de Playwright ni se acreditó una nueva comprobación visual: sigue pendiente por el bloqueo del navegador registrado arriba.
- No se desplegó este ajuste.

## Datos y fuentes

En escritorio, los datos de la ruta ocupan una columna compacta y las fuentes reciben aproximadamente dos tercios del espacio. Título, descripción y tema son los campos iniciales; presentación, audiencia y portada permanecen disponibles en un desplegable. Una vista pequeña muestra el título, la descripción y la portada seleccionada, reutilizando las imágenes existentes.

Las fuentes comparten una sola superficie con divisores discretos. Cada fila muestra el nombre, el tipo de material y su estado de vinculación o verificación. La primera fuente y las fuentes nuevas se abren inicialmente. Dentro, se priorizan el material vinculado, el fragmento utilizado y su sección o página; referencia, verificación y documento se agrupan sin desmontar sus campos. Las referencias externas muestran inicialmente los datos de verificación.

La búsqueda de guías, los reintentos y la carga siguen usando el catálogo existente. Se conservaron la selección de versiones reales, el reinicio del fragmento al cambiar el documento, la huella local, la protección de fuentes utilizadas y el foco tras añadir o eliminar. Los indicadores muestran los datos actuales y no acreditan aprobación o publicación.

Validación local:

- Suite del editor: 11 archivos, 126 pruebas PASS.
- Se añadieron regresiones para conservar vínculos y fragmentos cuando falla el catálogo, y para distinguir los controles de una referencia externa de los de una guía.
- TypeScript, ESLint de los archivos ajustados y `git diff --check`: PASS.
- No hay una nueva verificación visual en navegador ni ejecución de Playwright. El bloqueo de acceso local registrado anteriormente sigue limitando esa comprobación.
- No se desplegó este ajuste.

## Objetivos

La pestaña utiliza una columna de unidades y un área principal de edición. Las unidades muestran sus objetivos asociados y permiten ir al primero de ellos sin filtrar ni desmontar el resto. Añadir unidad sigue en esa columna, mientras que Añadir objetivo permanece como acción principal. La asignación inicial a la primera unidad y el selector para cambiarla mantienen el comportamiento anterior.

El primer objetivo y los objetivos nuevos se abren desde el inicio. Nombre, unidad, acción del estudiante, prioridad y obligatoriedad quedan visibles. Las fuentes y los requisitos previos se agrupan en desplegables; las fuentes pendientes se abren inicialmente. Las etiquetas de prioridad y el nombre de la unidad ayudan a reconocer cada objetivo cerrado. La eliminación queda al final con su motivo de bloqueo cuando corresponda.

Los requisitos previos muestran un objetivo seleccionable y la acción Vincular objetivo. El orden de aprendizaje queda disponible dentro de la columna de unidades. Los mensajes explican en lenguaje de uso los objetivos que se necesitan mutuamente, conservando la detección de ciclos y las reglas originales.

Validación local: 11 archivos, 127 pruebas PASS; TypeScript, ESLint de los archivos ajustados y `git diff --check` PASS. La regresión nueva comprueba que los campos de todas las unidades sigan montados para su navegación y enfoque. La prueba E2E se actualizó, pero no se ejecutó en navegador.

Product Design se aplicó usando el contexto de este chat y el código del producto; su preflight no encontró contexto guardado. La [QA visual de Objetivos](../../design-qa.md) está bloqueada por falta de capturas comparables y por el bloqueo del navegador registrado anteriormente. No se declara un cierre visual ni se desplegó esta iteración. Los informes anteriores de otros flujos permanecen como evidencia histórica independiente.

## Capturas

Estas capturas corresponden al primer rediseño, antes de los ajustes posteriores de navegación, guardado, configuración, datos y fuentes, y objetivos.

- [Editor en escritorio](evidencias/editor-escritorio-1440.jpg)
- [Selector de relaciones](evidencias/selector-relaciones-1440.jpg)
