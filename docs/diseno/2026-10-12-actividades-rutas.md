# Actividades de aprendizaje: rediseño de la interfaz

Fecha: 12 de octubre de 2026.

El reproductor presenta la tarea actual y una acción principal. El diseño prioriza móvil y utiliza una superficie blanca, tipografía de sistema, azul como acento, controles de al menos 44 px y transiciones de 180 ms que respetan la preferencia de movimiento reducido.

## Cobertura

| Superficie | Presentación |
| --- | --- |
| Estudio, ejemplos resueltos y ejemplos parciales | Texto de lectura y resaltado opcional |
| Selección de respuesta | Opciones amplias y una comprobación |
| Respuesta breve | Campo de respuesta y contador discreto |
| Respuesta construida | Escritura, comparación autorizada y valoración |
| Relaciones, tablas y mapas causales | Selectores agrupados por elemento |
| Secuencias | Pasos numerados y flechas para reordenar |
| Imágenes con punto o etiquetas | Imagen, ampliación, selección táctil y ajuste preciso bajo demanda |
| Casos progresivos | Narrativa actual separada de la pregunta; sin etapas futuras |
| Actividades anteriores | Cuestionarios, tarjetas, guías, repasos y videos con el mismo marco visual |

La cabecera incluye regreso al mapa o a la ruta, avance confirmado y detalles de sesión. En móvil, la navegación general de la aplicación se oculta durante la actividad. Las pistas y fuentes se abren cuando el estudiante las solicita. La explicación principal del resultado permanece visible, con el error frecuente y las referencias bajo demanda.

La continuación después del último feedback confirma el cierre directamente, sin mostrar una pantalla intermedia de cierre. Una sesión completada ofrece la siguiente actividad elegible que devuelve el servidor y conserva el mapa de regreso. Si no hay una actividad elegible, ofrece volver al mapa. Las lecturas mantienen su confirmación explícita de cierre.

## Funcionamiento conservado

No se modifican backend, migraciones, contratos, evaluación, selección de actividades ni reglas de progreso. Las ayudas conservan su registro; la comparación se muestra tras autorización. Las respuestas, el cierre y la nueva sesión requieren confirmación. Las solicitudes inciertas conservan su identidad de reintento y bloquean el envío de una respuesta nueva. El avance no concede dominio por sí mismo. Las fuentes de una respuesta anterior no se mantienen en la siguiente pregunta.

La carga de imágenes conserva el acceso autorizado, la caducidad de la URL, el cálculo de coordenadas dentro de la imagen y la cancelación de lecturas antiguas. El ajuste mediante teclado y coordenadas permanece disponible en un desplegable. Los lectores de pantalla mantienen etiquetas, avisos y foco al cambiar de tarea o resultado.

## Validación local

- Web: 63 archivos y 492 pruebas de Vitest aprobados.
- Browser: 66 de 66 comprobaciones efectivas aprobadas, con 22 escenarios en cada tamaño de 320, 390 y 1440 px. El resumen por escenario se guarda en `tmp/activity-redesign/validation-summary.json`; las ejecuciones y los rechecks permanecen separados, sin sumar repeticiones.
- Axe: sin incidencias serias o críticas en las superficies capturadas. Se comprueba ausencia de desbordamiento horizontal, ayudas, comparación, orden conservado después de pedir ayuda, señalamiento, etiquetas, recuperación de conexión y navegación directa.
- TypeScript, ESLint y compilación de Next.js aprobados. La compilación mantiene el aviso anterior de `::highlight` en `interactive-term-polish.css`, fuera del rediseño.
- Galería y vista conjunta móvil: `tmp/activity-redesign/gallery.html` y `tmp/activity-redesign/mobile-preview.png`.

Las primeras ejecuciones detectaron defectos en fixtures de comparación, imagen y estado anterior, además de un bloqueo de red local del navegador de pruebas. Se corrigieron los fixtures y se concedió acceso a red local únicamente en el contexto de Playwright. La CSP del documento de prueba permite solo su origen de imagen sintética; la CSP de la aplicación no cambia. Un recheck corrige el clic de escritorio que caía en el margen de la imagen, manteniendo las mismas aserciones. Las capturas ocultan exclusivamente el indicador de desarrollo de Next.js.

Los escenarios usan material sintético y respuestas HTTP validadas por los contratos. No se atribuyen a una aceptación con API o base de datos reales, autenticación real, reproducción real de video, Safari nativo, staging o producción. Esta evidencia se obtuvo antes de publicar el rediseño.

## Reproducción

Con un servidor de desarrollo disponible, configurar `MAP_E2E_URL` con su dirección y ejecutar:

```powershell
pnpm.cmd --filter @cediah/web exec playwright test --config playwright.activities.config.ts
```

Para regenerar la galería y el resumen desde la raíz del repositorio:

```powershell
python tmp/activity-redesign/generate-gallery.py
python tmp/activity-redesign/summarize-validation.py
```
