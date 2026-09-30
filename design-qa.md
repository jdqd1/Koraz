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


---

## Informe anterior conservado

# QA visual · mapa de aprendizaje

final result: passed

## Evidencia

- Referencia: `C:/Users/josed/AppData/Local/Temp/codex-clipboard-f62ab430-03a0-49a1-bf22-d4cfe0e49a49.png` (1672 × 941 px). Se compararon las dos pantallas interiores de los teléfonos; los marcos y la lámina explicativa no forman parte de la interfaz.
- Implementación: `tmp/design-qa/map-redesign-mobile-crop.png` y `tmp/design-qa/map-redesign-detail-crop.png` (390 × 844 px), capturadas desde `http://localhost:3000/visual-fixtures/mapa` en el navegador integrado. Las capturas completas originales son de 488 × 1055 px por la escala de la ventana; se recortó el área visible de 390 × 844 px.
- Comparación conjunta: `tmp/design-qa/map-redesign-comparison.png`. Los recortes de referencia (344 × 710 px y 348 × 710 px) se normalizaron a 390 × 844 px. La comparación incluye mapa y panel de actividades en el mismo estado funcional. Los títulos, cantidades y avances son datos propios del fixture y difieren del contenido ilustrativo de la propuesta.
- Se comprobaron también un ancho CSS de 320 px y el escritorio (`tmp/design-qa/map-redesign-desktop.png`, viewport CSS de 1440 × 900 px). No hubo desbordamiento horizontal a 320, 390 ni 1440 px; el botón principal del panel quedó visible. La vista de lista, la navegación por nodos, el cierre del panel y la pestaña Recursos respondieron correctamente. La consola del navegador no mostró errores.

## Comparación final

- **Tipografía:** títulos, métricas y estados tienen una jerarquía comparable a la referencia. Se conserva la fuente de Koraz y sus iconos Phosphor.
- **Distribución:** tarjetas horizontales dentro de la secuencia vertical de React Flow, marcadores de progreso, conexiones, barras y menú de cada nodo. El panel móvil usa cabecera, descripción, progreso, pestañas y tarjetas de actividad con la misma estructura general de la propuesta.
- **Color:** azul de acciones y selección, verde de completado, naranja de avance y gris de pendiente se mantienen consistentes entre mapa y detalle.
- **Iconos y recursos:** los iconos son vectores de la biblioteca existente; la referencia no incorpora ilustraciones o fotografías dentro del contenido de la app que deban generarse. El marco de teléfono y la barra de estado del mock no se reproducen como parte de la app.
- **Texto:** el fixture muestra Anatomía/Tórax/Mediastino en vez de las unidades de ejemplo. La cabecera global de Koraz y el botón de continuación se conservaron porque son parte del flujo real.

## Historial de ajustes

1. **P2, primera captura:** tarjetas y etiquetas demasiado pequeñas frente a la referencia; se aumentó la tipografía y se ajustó el ancho de las tarjetas. Evidencia posterior: `tmp/design-qa/map-redesign-mobile-crop.png`.
2. **P2, primera captura:** la navegación inferior quedaba por encima del botón de continuación del panel; se corrigieron las capas del desplegable y su fondo. Evidencia posterior: `tmp/design-qa/map-redesign-detail-crop.png`.
3. **P2, comparación intermedia:** la posición vertical del detalle y sus pestañas no coincidía con el teléfono de referencia; se ajustó la altura del panel y el espacio de la cabecera. Evidencia posterior: `tmp/design-qa/map-redesign-comparison.png`.

## Diferencias aceptadas

- La propuesta es un mock móvil; Koraz mantiene su cabecera, navegación y datos reales. En escritorio se conserva el mapa panorámico de React Flow con controles de zoom y el panel lateral.
- El pie de continuación ocupa parte de la altura del panel. Se mantiene visible para que el usuario pueda comenzar o reanudar una actividad; la lista interior se desplaza.

## Comprobación de implementación

- `pnpm --filter @cediah/web typecheck`: PASS.
- `pnpm --filter @cediah/web lint`: PASS.
- `pnpm --filter @cediah/web test -- src/components/learning/map/map-helpers.test.ts`: PASS (41 archivos, 236 pruebas; Vitest ejecutó la suite web completa).
- `git diff --check`: PASS.

---

## Informe anterior conservado (2026-09-13)

# Design QA — App shell inspirado en Google Drive

Fecha: 2026-09-13

## Alcance

Actualización visual del dashboard de aprendizaje en modo claro: control del sidebar colapsado al extremo izquierdo, control de cierre a la derecha del logotipo, desplazamiento real del contenido al expandir el sidebar y sustitución de tarjetas flotantes con sombra por una jerarquía tonal semejante a Google Drive. Se conservaron el contenido, la marca y la funcionalidad de Koras.

## Verdad visual y evidencia

- Referencia principal, Drive claro: `C:\Users\josed\AppData\Local\Temp\codex-clipboard-fd42474e-c24e-408f-a22d-129c94235881.png` (1836 × 953 px).
- Referencia secundaria de contraste, Drive oscuro: `C:\Users\josed\AppData\Local\Temp\codex-clipboard-56886ee4-047d-4ac8-8f12-fa987539422c.png` (1846 × 953 px).
- Estado previo de Koras: `C:\Users\josed\AppData\Local\Temp\codex-clipboard-17223053-cb02-400b-9cac-61eda522b14c.png` (1800 × 1125 px).
- Comparación enfocada final: `C:\Users\josed\.codex\visualizations\2026\09\13\01a09b85-275b-7351-9ade-de2bf1c4e500\koras-drive-light-desktop-qa.png` (925 × 575 px).
- Vista expandida: `C:\Users\josed\.codex\visualizations\2026\09\13\01a09b85-275b-7351-9ade-de2bf1c4e500\koras-drive-light-desktop-header-route.png` (1100 × 650 px).
- Vista móvil cerrada: `C:\Users\josed\.codex\visualizations\2026\09\13\01a09b85-275b-7351-9ade-de2bf1c4e500\koras-drive-light-mobile.png` (312 × 675 px).
- Ruta verificada: `http://localhost:3000/visual-fixtures/aprendizaje?estado=dashboard`.
- Estado funcional: dashboard con ruta activa, 3 de 7 actividades completadas, actividad actual azul, actividad para continuar y repaso recomendado.

## Normalización de captura

El panel del navegador aplica un zoom interno de 0.8. La comprobación de escritorio se ejecutó con un viewport CSS de 1440 × 900 y la captura enfocada se recortó únicamente para retirar el área vacía generada por el escalado del panel. La comprobación móvil usó 390 × 844 CSS px y produjo una imagen de 312 × 675 px. Las conclusiones se basan en la comparación visual conjunta y en coordenadas CSS leídas del DOM, no en una superposición de píxeles sin normalizar.

La captura de Drive es una referencia de lenguaje visual, no una especificación de contenido. Las diferencias de copy, iconografía de marca y estructura de aprendizaje son intencionales.

## Comparación completa

- El chrome de header y sidebar usa un gris verdoso muy claro, mientras el workspace principal permanece blanco, reproduciendo la separación por tono de Drive.
- Ruta activa, accesos directos, destacados y controles secundarios usan superficies tonales relacionadas, sin el efecto de tarjetas blancas flotantes.
- Se eliminaron sombras y elevaciones de tarjetas, botones, buscador y contenedor principal. La elevación permanece únicamente en overlays reales, como el drawer móvil.
- El buscador ahora se integra en el header mediante un fondo tonal suave; al enfocarse cambia a blanco con outline visible.
- El contenedor principal mantiene una única gran superficie blanca con radio moderado y sin borde o sombra perceptible.
- La ruta activa conserva la jerarquía propia de Koras, pero se integra al workspace como una sección tonal y deja 18 px de separación respecto del borde superior del contenedor principal.

## Comparación enfocada

### Sidebar colapsado, escritorio

- Header: x=0, z-index=120.
- Botón visible de expansión: x=14, ancho=44 px.
- Buscador: x=74 px.
- Sidebar colapsado: x=0, ancho=72 px.
- Contenido principal: x=72 px y se amplía al espacio liberado.
- Desbordamiento horizontal: 0 px.

El primer pase colocó el botón en x=14, pero el header tenía z-index 100 y quedaba debajo del sidebar con z-index 110; el control se ocultaba parcialmente (P1). Se elevó el header colapsado a z-index 120 y la captura posterior confirma que el botón queda completamente visible al extremo izquierdo.

### Sidebar expandido, escritorio

- Logotipo: x=14, ancho=113 px.
- Botón de cierre: x=214, ancho=44 px; queda a la derecha del logotipo.
- Sidebar: ancho=272 px.
- Contenido principal: x=272 px y reduce su ancho sin overlay.
- Desbordamiento horizontal: 0 px.

### Superficies y elevación

Las únicas sombras no nulas visibles son el indicador inset del enlace activo del sidebar y el doble aro del paso actual azul. No se detectaron sombras en header, buscador, workspace, ruta activa, accesos directos, tareas ni CTA.

### Móvil

- Header, shell y main comparten exactamente `rgb(246, 248, 247)`.
- El main no tiene borde, radio exterior ni sombra de app shell.
- Las tarjetas se apoyan directamente sobre el fondo mediante contraste tonal.
- Viewport CSS: 390 × 844; desbordamiento horizontal: 0 px.
- Drawer cerrado: fuera del viewport y `body` con overflow restaurado.
- Drawer abierto: x=0, ancho=288 px, backdrop visible y bloqueo de scroll.
- En el drawer, el logotipo comienza en x=12 y el botón de cierre en x=232, por lo que el control queda a la derecha y dentro del área accesible.

## Superficies de fidelidad

- Tipografía: se conserva la familia, peso y jerarquía de Koras. No se imitó la tipografía de Google porque la referencia es estilística.
- Espaciado y layout: header y sidebar se leen como una unidad; el workspace comienza después del sidebar y responde a sus dos anchos.
- Color y tokens: chrome `#f6f8f7`, superficies tonales `#eef2f0`, hover `#e3ebe7`, workspace blanco y sección diaria `#e6eeea`.
- Imágenes y assets: se mantienen el logotipo y los iconos existentes, sin rasterización nueva ni degradación.
- Copy y contenido: sin cambios funcionales o editoriales.
- Iconos: conservan tamaño, grosor y labels accesibles existentes.
- Interacciones: expansión/colapso de escritorio, apertura/cierre del drawer móvil y bloqueo/restauración del scroll comprobados.
- Responsividad: comprobada en escritorio amplio, escritorio del panel y móvil de 390 px.
- Movimiento: el pulso azul del paso actual se conserva; los cambios de sidebar mantienen transición y no introducen desplazamientos en hover.

## Historial de iteración

1. Referencia y estado previo: exceso de superficies blancas con borde/sombra; botón colapsado separado del extremo izquierdo.
2. Primer pase: se aplicó la jerarquía tonal y se movió el control, pero el botón quedó bajo la capa del sidebar (P1).
3. Corrección: header colapsado elevado a z-index 120; botón confirmado en x=14 y completamente visible.
4. Pase final: revisión conjunta de Drive claro y Koras, verificación responsive, drawer móvil, sombras computadas, desbordamiento y consola.

## Comprobaciones técnicas

- `pnpm --filter @cediah/web lint`: aprobado.
- `pnpm --filter @cediah/web typecheck`: aprobado.
- `pnpm --filter @cediah/web test`: 20 archivos y 92 pruebas aprobadas.
- `git diff --check`: aprobado.
- Errores o advertencias de consola en la carga final: ninguno.

## Findings

No quedan hallazgos P0, P1 o P2 dentro del alcance solicitado.

## Open Questions

- Ninguna.

## Implementation Checklist

- [x] Botón de expansión completamente alineado a la izquierda.
- [x] Botón de cierre a la derecha del logotipo.
- [x] Sidebar expandido desplaza y reduce el workspace.
- [x] Header y sidebar forman una sola franja visual.
- [x] Tarjetas y botones sin sombra, diferenciados por tono.
- [x] Ruta activa separada del borde superior.
- [x] Móvil sin app shell exterior y con fondo continuo.
- [x] Validación visual, responsive, funcional y técnica completada.

final result: passed
