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

## Capturas

- [Editor en escritorio](evidencias/editor-escritorio-1440.jpg)
- [Selector de relaciones](evidencias/selector-relaciones-1440.jpg)
