# QA visual - rutas de aprendizaje por niveles (2026-09-29)

final result: passed

## Alcance y referencia
El mapa de Koraz adopta el lenguaje de la imagen adjunta: fondo neutro, tarjetas ligeras, origen compacto y conexiones horizontales finas. La instrucción del usuario modifica expresamente la composición: mostrar un solo nivel, retirar las tarjetas del nivel anterior, conservar su conexión y centrar el origen para obtener ramas simétricas. No se evalúa una copia literal del esquema completo ni del título "Information Architecture".

- Verdad visual: `docs/aprendizaje-guiado/evidencias-mapa-horizontal/reference.png` (1199 x 1217 px; copia de la imagen adjunta).
- Comparación completa: referencia y `desktop-normalized.jpg` / `mobile-normalized.jpg` se abrieron juntos en la misma entrada de revisión visual.
- Implementación de escritorio: `docs/aprendizaje-guiado/evidencias-mapa-horizontal/desktop-normalized.jpg`, 1440 x 900 px, viewport CSS 1440 x 900, nivel raíz y zoom 100 %.
- Implementación móvil: `docs/aprendizaje-guiado/evidencias-mapa-horizontal/mobile-normalized.jpg`, 390 x 844 px, viewport CSS 390 x 844, nivel Tórax y zoom 100 %.
- Evidencia adicional: `desktop-detail.jpg` (nivel Tórax al 100 %), `desktop-level.jpg` (vista general ajustada del mismo nivel), `mobile-320.jpg` (viewport CSS 320 x 844).
- Normalización: el navegador integrado aplica una escala de captura 1.25. Los archivos originales de escritorio miden 1800 x 1125 y los móviles 488 x 1055 / 400 x 1055, incluyendo área vacía del panel. Las capturas normalizadas se obtuvieron con el recorte del navegador compensado por esa escala y coinciden con el área CSS visible. No se alteró la imagen adjunta ni se juzgaron los espacios vacíos del panel como parte del producto.
- Los nombres y progresos pertenecen al fixture de Koraz; son distintos del ejemplo de comercio de la referencia. La cabecera y navegación existentes de Koraz se conservan.

## Comparación y superficies de fidelidad
- Tipografía: se conserva Plus Jakarta de Koraz, con títulos de tarjetas de 13 px en escritorio y 12 px en móvil, peso 600 y dos líneas como máximo. El texto secundario es discreto. Los títulos completos permanecen en los nombres accesibles y atributos title. El origen limita su texto a dos líneas para no desplazar el punto central de conexión.
- Distribución: un origen a la izquierda y una única columna de tarjetas del nivel actual a la derecha; no se renderizan columnas de otros niveles. El origen coincide con el punto medio entre la primera y la última tarjeta. Las ramas superiores e inferiores usan el mismo trazado Bezier reflejado. La conexión anterior entra desde el borde izquierdo y los breadcrumbs identifican el recorrido.
- Color y superficies: fondo #f8f8f8, tarjetas blancas, bordes neutros, sombras eliminadas en el mapa, origen raíz oscuro y origen interior gris. Las conexiones son grises de 1 px. Se conservan las señales de progreso verde y ámbar como información funcional de Koraz.
- Imágenes e iconos: el diagrama es una interfaz de nodos y conexiones, sin fotografías o ilustraciones para generar. Se reutilizan los iconos médicos y Phosphor del producto. Los trazos vectoriales representan conexiones funcionales; no sustituyen recursos gráficos de la referencia.
- Copy: títulos de rutas, estado, porcentaje y cantidad de lecciones son información del producto. "Mis rutas", "Volver desde..." y los controles de zoom describen acciones concretas.
- Revisión enfocada: los títulos y puntos de unión son legibles en las capturas normalizadas; además se midieron las coordenadas de los extremos y del origen desde el DOM. No hizo falta un recorte adicional para comparar una imagen o ilustración, porque la referencia no contiene ese tipo de recurso dentro del mapa.

## Historial de hallazgos y correcciones
1. P1: las tarjetas sin arrastre/selección quedaban con eventos de puntero desactivados en React Flow. Se restableció pointerEvents: all en tarjetas y origen. Comprobación posterior: raíz -> Anatomía -> Tórax -> Corazón, cierre del panel y retorno por el origen funcionan mediante clic, además del teclado.
2. P2: la rueda quedaba interceptada por React Flow. Se configuró preventScrolling=false. Comprobación posterior: scrollTop pasó de 237 a 538 en móvil, y de 12056 a 15053 en el fixture de 200 tarjetas, sin cambiar de nivel.
3. P2: el origen podía quedar desplazado al restaurar el zoom o al reservar espacio para la navegación móvil. Se espera al zoom aplicado y a la medida definitiva del contenedor antes de centrar. Evidencia posterior: origen y conjunto de tarjetas coinciden exactamente; en móvil el origen queda a menos de 1 px del centro de la región visible.
4. P2: los controles móviles coincidían con el área de navegación inferior. Se reservaron 96 px y se anclaron los controles fuera de la región que se desplaza. Las capturas móviles finales muestran ambos accesos.
5. P2: el ancho móvil podía introducir una pequeña barra horizontal innecesaria. El ancho de tarjeta ahora descuenta ambos márgenes, origen y separación. A 320 px el mapa admite desplazamiento interior horizontal para mantener texto legible; la página completa no desborda.
No quedan hallazgos P0/P1/P2 abiertos en el alcance solicitado.

## Verificación
- PASS: 32 pruebas Vitest (25 de geometría para 1, 3, 6, 8 y 100 tarjetas a 320, 390, 767, 1024 y 1440 px; 7 helpers de navegación y estado).
- PASS: typecheck web y ESLint de los archivos modificados.
- PASS: git diff --check.
- PASS: recorrido real por clic en el navegador integrado, cierre de lección, retorno mediante origen, zoom, desplazamiento y navegación por teclado.
- PASS: 8 tarjetas y 8 conexiones del nivel Tórax; tarjetas del nivel anterior ausentes; error de centro 0 px; error máximo en extremos 2 px, correspondiente al radio del handle.
- PASS: escritorio 1440 x 900, móvil 390 x 844 y 320 x 844 sin desbordamiento de la página.
- PASS: fixture de 200 tarjetas mantiene 10 tarjetas renderizadas cerca de la vista mientras se desplaza; el nivel no cambia.
- PASS: movimiento reducido emulado en el navegador, retorno con phase=idle; emulación restaurada al terminar.
- PASS: consola sin errores desde la carga limpia final. El aviso de atribución de React Flow ya existía en el producto. Los avisos de dependencias de hooks durante Fast Refresh se eliminaron al recargar y no aparecen en la carga limpia.
- Las suites Playwright se actualizaron para el abanico horizontal, el origen centrado y la rueda, pero no se ejecutaron mediante CLI en esta sesión. La interacción se verificó con el navegador integrado.
- NO VERIFICADO: persistencia con una cuenta autenticada/API real. La evidencia visual usa `/visual-fixtures/mapa`; no representa validación de producción.

## Checklist de implementación
- [x] Un solo nivel y referencia compacta de origen.
- [x] Conexiones horizontales simétricas y continuidad desde el nivel anterior.
- [x] Misma orientación en escritorio y móvil.
- [x] Navegación, clic, teclado, zoom y desplazamiento funcionales.
- [x] Capturas y comparación conjunta de la referencia.
- [x] Pruebas y comprobaciones de código.

## Pulido opcional
La vista general puede reducir el texto al ajustar niveles largos. El zoom 100 % conserva la legibilidad y permite recorrer el nivel por desplazamiento. No quedan cambios pendientes para el alcance solicitado.

