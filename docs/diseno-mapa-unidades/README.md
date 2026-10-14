# Mapa de aprendizaje: unidades, navegación y horarios

Trabajo local del 13 de octubre de 2026, horario de Venezuela. Aplica los ocho comentarios del panel de unidad y el pedido de una experiencia móvil clara y fluida.

## Cambios para el usuario

- El acceso «Ver ruta completa» está junto al número de actividades, con un separador discreto.
- Cada objetivo se identifica dentro de su título. Las actividades completadas permanecen en la lista, en su orden original.
- Al abrir una unidad o regresar a Actividades, la actividad recomendada queda a la vista junto a su objetivo. Las pestañas y el objetivo permanecen visibles durante el desplazamiento.
- Los controles anterior/siguiente permiten cambiar de unidad desde el panel. El botón de la actividad permanece accesible en el pie.
- «Ya demostraste lo que aprendiste» explica que se resolvió la evaluación y que los repasos ayudan a recordar lo aprendido.
- Las fechas de repaso usan frases como «mañana a la 1:00 a. m.» o «el viernes 16 de octubre a las 8:20 p. m.», según el horario del usuario y la referencia temporal del servidor.
- Los recursos muestran las secciones de lectura como una ruta visual. La cita y las notas de trazabilidad permanecen disponibles en «Sobre esta fuente».
- La apertura del panel y los cambios de pestaña usan animaciones breves; se desactivan con la preferencia de movimiento reducido.

## Horarios y persistencia

`PLATFORM_TIME_ZONE` centraliza `America/Caracas` para la administración. El panel administrativo conserva ese horario incluso si el administrador usa un dispositivo en otro país. Los usuarios reciben el horario detectado por su dispositivo mediante `Intl`, con nombres de zona geográfica y sus reglas de horario de verano.

La sesión autenticada guarda esa zona en las preferencias existentes, al abrir la plataforma, recuperar el foco, reconectar o detectar un cambio de zona. La actualización usa validación, versión confirmada y clave de idempotencia; se vuelve a leer una vez ante un conflicto. No envía la hora del dispositivo. El cambio de zona entra en vigor de inmediato; la meta semanal conserva su cambio diferido. Los eventos nuevos guardan su instante UTC y el día local correspondiente. Los eventos históricos conservan sus datos.

La programación de repasos sigue usando instantes aceptados por el servidor e intervalos reales. No se desplazan los vencimientos ni se suman cuatro horas a fechas guardadas. Esta separación corresponde al comportamiento de [PostgreSQL para `timestamptz`](https://www.postgresql.org/docs/current/datatype-datetime.html) y al formato de zonas de [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).

Las fechas ensamblan la hora de forma consistente entre servidor y navegador. Esto evita un error de hidratación detectado durante la verificación por diferencias entre sus versiones de ICU.

## Navegación

Las unidades de una misma ruta reutilizan el mismo paquete y estado confirmado, sin solicitudes adicionales al cambiar de unidad. El mapa prepara el nivel anterior y las primeras opciones de navegación. Las lecturas independientes del paquete, estado y mapa se realizan en paralelo. Se conserva la caché acotada por cuenta, la invalidación al recuperar el foco y la confirmación del servidor al abrir una actividad. Un panel de unidad abierto vuelve a comprobar sus fechas y opciones cada minuto mientras la página es visible.

La primera visita a una ruta que aún no se ha preparado requiere conexión. Las mediciones de navegación son locales con fixtures; no representan una medición de producción ni de un teléfono físico.

## Verificación

Resultados y límites están registrados en `validation.json`. Las capturas, informes de accesibilidad y la medición reproducible están en esta carpeta.

- `web-tests-final.log`: componentes, transporte de horario, fechas, separación de zonas administrativas, recursos y proyección de unidades.
- `api-tests.log`: integración en PostgreSQL WASM/PGlite, persistencia inmediata de la zona, conservación de la meta y del historial, API v2 y medianoche/horario de verano.
- `scheduling-tests.log`: 62 pruebas de selección y programación pasadas; 10 casos se omiten por sus condiciones de entorno. `admin-dates.log` y `date-ui-final.log` cubren los últimos ajustes de formato.
- `mobile-tests.log`: mapa, navegación, orientación, zoom, desplazamiento táctil y currículo en Chromium con perfil móvil.
- `navigation-performance.json`: tiempo desde el clic hasta el título actualizado y el siguiente frame.
- `accessibility-route.json` y `accessibility-panel.json`: revisión Axe del currículo y del panel.

Un ensayo anterior esperaba siempre una fase de salida durante una navegación lenta; la precarga puede completar esa navegación antes de que la fase sea observable. La comprobación conserva la respuesta inmediata de la URL, la llegada al nivel correcto y el retorno del diagrama a reposo. El ensayo anterior y su diagnóstico permanecen en el registro.

No se ha desplegado en producción ni se ha modificado una base de datos remota. No se añaden dependencias ni se requiere una migración de esquema. Persisten las advertencias previas de PostCSS sobre `::highlight`.
