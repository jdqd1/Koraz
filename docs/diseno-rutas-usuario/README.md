# Rediseño de rutas del usuario

Fecha de trabajo: 12 de octubre de 2026, America/Caracas.

Se rediseñaron el detalle de las rutas guided-v2 y la pantalla de repaso y práctica. La portada usa una imagen pequeña, el siguiente paso tiene una acción principal y el progreso distingue recorrido, dominio y consolidación. Las unidades muestran etiquetas de objetivos; la agenda, las comprobaciones y las versiones se consultan mediante controles desplegables. Las explicaciones extensas siguen disponibles dentro de cada sección.

La presentación conserva los contratos, las llamadas, las reglas de autorización, la recuperación de solicitudes, las fechas confirmadas y la navegación. No se modificaron el backend ni las reglas de evaluación. La barra representa actividades completadas y no acredita dominio. Abrir unidades no cambia el progreso.

## Vista local

Con el servidor de desarrollo iniciado:

- Ruta: http://127.0.0.1:3000/visual-fixtures/aprendizaje-v2?surface=route&estado=abdomen
- Repaso: http://127.0.0.1:3000/visual-fixtures/aprendizaje-v2?surface=review&estado=abdomen

Abdomen es un ejemplo sintético construido a partir del contenido visible en las capturas del encargo. Las vistas de prueba siguen restringidas a desarrollo. No representan una matrícula real ni una validación editorial o clínica.

## Verificación

- 85 casos efectivos de Vitest en 7 archivos: modelo, mantenimiento, cliente, actualización, reproductor, composición y despacho de repaso. No se suman ejecuciones repetidas.
- TypeScript y ESLint de los componentes modificados: PASS.
- Responsive a 320 × 844, 390 × 844, 768 × 1024 y 1440 × 1000: sin desbordamiento horizontal. Botón principal de 46 px. Mediciones en `responsive.json`.
- Navegación de unidades y agenda con teclado: verificada. Abrir la segunda unidad conserva el contador de 16 actividades del ejemplo.
- Fechas de repaso y evaluaciones posteriores: se mantienen los instantes originales, con presentación compacta y zona del estado confirmado. La fecha completa permanece en el atributo `title` del elemento `time`.
- Los selectores de los recorridos Playwright existentes se adaptaron a los nuevos títulos y desplegables. La suite completa con API y persistencia no se ejecutó para este rediseño.

Durante la verificación se corrigieron dos incidencias de presentación: un comentario de hidratación de React separaba una frase en el HTML de una aserción; otra aserción seguía buscando el título anterior de repaso. Se conserva su descripción y los casos finales mantienen las comprobaciones de estado y autorización.

## Capturas

- `ruta-390.jpg`: vista móvil.
- `ruta-1440.jpg`: vista de escritorio.
- `agenda-390.jpg`: agenda de un objetivo desplegada.

Esta evidencia es local y utiliza fixtures; no prueba una publicación en producción. Los cambios concurrentes en el editor de actividades no forman parte de este trabajo.
