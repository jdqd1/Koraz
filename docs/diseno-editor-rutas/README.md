# Rediseño del editor de rutas

Fecha de cierre: 13 de octubre de 2026, America/Caracas.

## Resultado

El editor guided-v2 se organiza alrededor del trabajo en escritorio: navegación horizontal compacta, actividades por unidad con búsqueda, lienzo central editable y configuración lateral. Los títulos identifican cada sección sin antetítulos ni descripciones repetidas. El estilo usa superficies neutras, tipografía de sistema, divisores sutiles y azul para las acciones y selecciones.

Antes de crear una actividad, el selector muestra un ejemplo interactivo, su finalidad y cuándo conviene usarla. Incluye los 13 tipos y composiciones existentes. Mecanismo crea dos actividades vinculadas; detección de errores crea un caso y dos preguntas. Los ejemplos del selector no se copian al borrador: la creación conserva los presets vacíos existentes.

En cada actividad se puede editar el contenido en el lienzo y alternar a Probar. La vista de estudiante reutiliza los renderizadores de estudio, elección única, respuesta breve, respuesta construida, relaciones, secuencias e imágenes. Los casos permiten explorar sus etapas y las preguntas vinculadas. Las zonas de imágenes se editan en el lienzo central, con sus opciones en el panel lateral.

## Validación local

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

## Capturas

Estas capturas corresponden al primer rediseño, antes del último ajuste de la navegación y el pie de guardado.

- [Editor en escritorio](evidencias/editor-escritorio-1440.jpg)
- [Selector de relaciones](evidencias/selector-relaciones-1440.jpg)
