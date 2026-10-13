# Mapa de aprendizaje: rediseño y navegación

Validado localmente el 13 de octubre de 2026. El mapa conserva un nivel visible, el origen centrado respecto a sus tarjetas y las conexiones de flujo. La presentación prioriza el uso en móvil con una estética limpia inspirada en Apple.

Las tarjetas tienen más espacio para el título, iconos discretos, progreso en azul y estados completados en verde. La cabecera presenta un único título; la ubicación y el avance aparecen como controles y métricas. Los botones de zoom y los menús tienen zonas táctiles de 44 px. El detalle móvil utiliza una hoja inferior con foco y cierre por teclado.

El desplazamiento táctil conserva la inercia del navegador, incluso cuando empieza sobre una tarjeta. En escritorio se puede arrastrar el fondo. El zoom mantiene la posición central y la sesión conserva el encuadre al volver, cambiar entre mapa y lista y recargar.

## Rendimiento

Los niveles con 30 o más tarjetas montan únicamente la ventana visible y dos filas adicionales a cada lado. El desplazamiento actualiza esa ventana al cruzar una fila, con un máximo de una comprobación por cuadro. Los nodos y sus datos mantienen referencias estables. Los niveles pequeños no actualizan estado React por desplazamiento.

Las animaciones de tarjetas y conexiones duran 180 y 220 ms; la transición termina a los 260 ms. Los mapas grandes evitan esas animaciones y las sombras de las tarjetas. Se respeta la preferencia de movimiento reducido.

Comparación de una muestra de 40 incrementos de desplazamiento de 12 px, ejecutada en Chromium con Next en desarrollo:

| Muestra | Actualizaciones React antes | Después | Cuadro p95 antes | Después | Tarjetas montadas, máximo final |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390 px, 6 elementos | 22 | 0 | 33,5 ms | 18,3 ms | 6 |
| 390 px, 200 elementos | 77 | 9 | 192 ms | 25,3 ms | 9 |
| 1440 px, 6 elementos | 0 | 1 | 22,2 ms | 18,1 ms | 6 |
| 1440 px, 200 elementos | 78 | 15 | 254,2 ms | 27,7 ms | 11 |

En los mapas grandes, esta muestra registra entre un 81 % y un 88 % menos de actualizaciones React. Las cifras incluyen los commits del árbol React completo, por lo que pueden aparecer actualizaciones independientes del scroll. Son mediciones locales con datos sintéticos; no equivalen a un benchmark de un teléfono físico ni a latencia de producción.

La prueba de navegación caliente registró un p95 de 509 ms en 30 muestras, después de cinco calentamientos, incluyendo la automatización del navegador y la transición. [Resultado de navegación](browser-final/learning-map-volume-render-d57b4-nd-measures-warm-navigation-desktop/navigation-performance.json).

Se conservaron los [datos iniciales](before/performance.json), una medición [intermedia](after/performance.json), una [verificación posterior](verified/performance.json) y los [resultados finales](final/performance.json). La técnica de referencias estables y componentes memorizados sigue la [documentación oficial de React Flow](https://reactflow.dev/learn/advanced-use/performance).

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Vitest: rutas, geometría, ventana visible y adaptación v1/v2 | PASS, 40 pruebas en tres archivos |
| Playwright: regresiones del mapa | PASS, 22 casos en escritorio y móvil |
| Playwright: tacto, arrastre, regreso, recarga, zoom, mapa grande y detalles v2 | PASS, 10 casos; dos omisiones por dispositivo no aplicable |
| Playwright: volumen y 30 muestras de navegación caliente | PASS, escritorio; móvil omitido por ser una muestra de rendimiento de escritorio |
| Axe: mapa y detalle de lección en ambos dispositivos | PASS, cero infracciones graves o críticas |
| TypeScript web, ESLint focalizado y git diff --check | PASS |
| Despliegue y datos reales de una cuenta | NO VERIFICADO en esta tarea |

La geometría de las conexiones se comprobó en anchos de 320, 390, 540, 767 y 1440 px, después de cambiar tamaño, zoom y desplazamiento. Las comprobaciones de legibilidad y lista también cubrieron 768 y 1024 px. Se verificaron estados de carga lenta, vacío, error, títulos largos y movimiento reducido.

La primera ejecución detectó un solapamiento de 4 px entre los controles y la navegación móvil inferior. Se amplió la separación y la prueba táctil pasó en la ejecución posterior. Una nueva aserción v2 buscaba el texto exacto «Necesita refuerzo», pero el estado confirmado incluye «objetivo esencial» en la misma etiqueta; se corrigió el selector y se verificó la acción «Reforzar». Los artefactos iniciales se conservan en `browser-tests/` y `browser-final/`; la suite nueva completa pasó en `browser-verified/`.

## Capturas y reproducción

- [Mapa móvil al 100 %](final/default-390.png).
- [Mapa de escritorio al 100 %](final/default-1440.png).
- [Título largo a 320 px](final/long-320.png).
- [Detalle de lección en móvil](final/lesson-390.png).
- [Práctica por objetivos en móvil](final/objectives-390.png).
- [Estado vacío](final/empty-390.png) y [error](final/error-390.png).

Las capturas y las pruebas de navegador usan las superficies locales de fixtures. Se preservaron los destinos de navegación, los menús de información y color y las reglas de progreso; esta tarea no cambia la API, los contratos ni la evaluación del aprendizaje.

Con el servidor local disponible en el puerto 3000:

```powershell
node docs/diseno-mapa-aprendizaje/verify-map.mjs nueva-muestra
$env:MAP_E2E_URL = 'http://localhost:3000'
pnpm.cmd --filter @cediah/web exec playwright test tests/e2e/learning-map.spec.ts tests/e2e/learning-map-navigation.spec.ts tests/e2e/learning-map-volume.spec.ts
```
