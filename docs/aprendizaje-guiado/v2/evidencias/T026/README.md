# T026 — Formularios visuales, relaciones, secuencias y casos

**PASS de los criterios locales de T026, 02/10/2026.** Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`. Se completó el constructor de las ocho familias existentes y los presets de comparación, micro-mapa, mecanismo y detección/corrección de errores. T027 no se inició. Sin commit ni despliegue.

La solicitud ejecutada fue «inicia t026». El handoff y `tareas.json` se usaron como especificación de esa ficha; sus instrucciones históricas de comenzar por T001 no sustituyeron la petición actual. Se leyeron §8.3 y §8.11, `DISENO-RUTAS.md`, `apps/web/AGENTS.md` y la documentación local de componentes cliente/CSS de Next. Se comprobaron las evidencias PASS de T025 y T014. El registro general conserva estados antiguos; para las dependencias se utilizaron sus resultados individuales actuales.

## Cambios

- Relaciones: pares, comparación y micro-mapa; enunciados/opciones, tabla de correspondencias, reutilización opcional y conexiones por origen/destino/relación. Retirar un elemento retira sus correspondencias y conexiones. Cambiar la presentación conserva las conexiones y exige retirarlas explícitamente si ya no son compatibles.
- Imagen: asset existente, hotspot/labeling, masking y alternativa de texto/tabla; zonas, consignas, etiquetas privadas, polígonos y correspondencias de etiquetado. Se añaden/ajustan/ordenan/retiran vértices mediante controles de teclado. También se pueden dibujar puntos sobre una copia local PNG/JPEG/WebP de hasta 10 MiB. La copia solo se abre en este navegador: no se sube, no modifica los bindings, no se exporta y debe abrirse otra vez después de recargar. No se verificaron bytes ni licencias de assets reales.
- El SVG y el cálculo del clic utilizan el rectángulo de `contain` y las dimensiones intrínsecas de la copia. Las bandas quedan fuera; la geometría guardada está normalizada. La etiqueta privada no se convierte en alt/caption. Los polígonos siguen en la zona editorial.
- Secuencia: 3–12 pasos, hasta cinco órdenes aceptados, botones Subir/Bajar y explicación vinculada. Añadir/retirar un paso actualiza todos los órdenes. Un orden importado inválido puede restablecerse explícitamente antes de reordenarlo.
- Caso: 2–6 narrativas con actividades hijas existentes; selectores excluyen casos anidados, hijos compartidos y actividades reservadas. Subir/Bajar reordena los hijos después del wrapper en su unidad, sin copiarlos. El contenedor no recibe puntuación propia.
- Presets: comparación=`match/comparison_table`; micro-mapa=`match/causal_map`; mecanismo=`sequence` con `whyActivityKey` hacia `constructed_response`; error=`case` con detección `single_choice` y corrección `constructed_response`. Crean campos vacíos y claves locales únicas, sin generar contenido ni respuestas. La corrección conserva su naturaleza formativa.

Los siete módulos nuevos pertenecen a los patrones visual-/relation-/sequence-/case- de la ficha. Se editaron además **solo los enlaces mínimos en `activity-model.ts` y `activity-editor.tsx`**: ampliar la lista de tipos, delegar la creación de presets, despachar los formularios y sincronizar el orden de los hijos. Estos dos archivos tenían cuatro tipos fijados y un aviso de «siguiente ficha»; sin esos enlaces los nuevos formularios no serían utilizables en el constructor autorizado. No hubo refactor del shell ni cambios a grading, contratos, API, UI v1, canvas general, assets o licencias. El CSS conserva tarjetas, detalles, campos y botones del editor existente.

## Verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Build de contratos con Node 24.19.0 | PASS | `contracts-build.txt` |
| Regresión del editor | 6 archivos, 68 tests PASS | `web-focused-final.txt` |
| Suite web | 48 archivos, 329 tests PASS | `web-suite-final.txt` |
| Typecheck web | PASS | `typecheck-final.txt` |
| ESLint de los diez archivos TS/TSX afectados | PASS | `lint-final.txt` |
| P07 y casos: evaluadores existentes | 2 archivos, 15 tests PASS | `p07-case-tests.txt` |
| HTTP real create/edit/save/read/CAS/replay | 1 test PASS | `http-integration.txt`, `http-integration.test.ts` |
| Edición UI → BFF → API → provider y recarga | PASS local | `browser-checks.json`, `ui-storage-checks.json` |
| Preservación por hashes y limpieza | PASS | `closure-verification.json` |

Los 19 tests nuevos cubren creación y serialización de los ocho presets, geometría/orden round-trip, composición sin copias, selección de hijos, límites, geometrías inválidas, permutaciones repetidas, mappings incompletos, privacidad de DTOs y controles renderizados. Las pruebas P07 comprueban además match 3/4, borde/fuera de hotspot, secuencias inválidas y score nulo del caso; no se cambiaron sus evaluadores.

Runtime de las comprobaciones finales: Node 24.19.0 y pnpm 11.19.0. La primera compilación exploratoria usó el Node 22.22.0 del PATH; se localizó el Node 24 ya instalado y la compilación final se ejecutó con él, sin instalar/actualizar dependencias.

## Navegador y persistencia

Se inspeccionó y capturó la base antes de editar (`before.png`). La comprobación posterior utilizó la página editorial real en `127.0.0.1:3106`, su BFF y Fastify/provider en `127.0.0.1:4106`. El harness usa PGlite en memoria y una identidad sintética; no lee credenciales de DB habituales. Sus endpoints de inspección/parada existen solo en el harness.

1. La integración creó los cuatro tipos y los cuatro presets, guardó/leyó el paquete exacto y sus bindings, comprobó replay/CAS y mantuvo la copia local ante conflicto. Quedaron 19 actividades en revisión 3 (`storage-before-ui.json`). El tiempo total del test incluye la retención del servidor para QA manual; no mide rendimiento.
2. Se editaron los cuatro formularios en navegador. Dos vértices iguales bloquearon guardar y enfocaron el selector de zona; el provider conservó revisión 3. Se corrigió la geometría sin repararla automáticamente.
3. Se abrió una imagen **sintética** 800×400 y se comprobó el alt neutro. Se editó un vértice y se añadió otro mediante coordenadas/Enter; se cambió a labeling, se creó una etiqueta y su mapping, y se probó masking. Revisión 4.
4. Se editó enunciado/mapping/arista de un micro-mapa; se reordenó una secuencia con Enter y se añadió un segundo orden; se editó la narrativa y se reordenaron etapas con Enter. Revisión 5 (`storage-after-ui.json`).
5. Un clic sobre la copia añadió un quinto punto normalizado (`x=0.49952199581462786`); se retiró y se guardaron nuevamente los cuatro vértices. Revisión 6. Una recarga completa conservó el vértice `x=0.125`, la etiqueta privada y el mapping. La copia local desaparece al recargar, como corresponde a un preview no persistido.
6. `storage-final.json` confirma revisión 6, geometría exacta, dos órdenes, etapas/narrativas reordenadas, mapping/arista, 19 actividades sin copias y las otras 15 actividades idénticas a revisión 3. También se conservan fuentes, assets y bindings.
7. 360×800, 390×844, 768×1024, 1440×900 y 720×450: sin overflow horizontal del documento ni controles fuera del ancho. 720×450 prueba reflow equivalente a 200 %, no zoom nativo. `responsive.json` y `browser-checks.json` documentan el alcance. Capturas: `visual-desktop.png` y `visual-mobile.png`.

Se cerró la pestaña temporal, se eliminó la cookie sintética, se restableció el viewport y se detuvieron ambos servidores. Sin listeners en 3106/4106 al cerrar. La selección inicial de Edge no estaba disponible y se utilizó IAB. Una recarga con cambios locales fue cancelada; se guardó la geometría restaurada y se repitió la recarga completa. La primera llamada de parada tuvo content-type incorrecto (415); la petición JSON completó la limpieza. Son incidencias de QA, no modificaciones de producto.

## Límites y pendientes

E01 sigue parcial y E04 queda preparado por estas fixtures y formularios; el recorrido del alumno y sus renderers son tareas posteriores. No se declara Hito S, eficacia educativa ni validez médica.

NO VERIFICADO aquí: identidad/producción, despliegue, assets/licencias reales, bytes de la copia frente al asset vinculado, concurrencia PostgreSQL independiente, zoom nativo y auditoría completa axe/lector de pantalla de T037. El preview local no sustituye la revisión editorial del asset. No se añadió obtención de URLs firmadas ni un nuevo flujo de catálogo.

Permanece abierto el timeout de importación de la regresión API ampliada de T024, documentado en sus evidencias y heredado por T025. No se reejecutó ni se atribuye resolución a T026. Sigue bloqueando la aceptación global. Next dev también emite la advertencia preexistente de `::highlight` en `interactive-term-polish.css`; ese archivo se mantuvo intacto.

**Siguiente ficha: T027, pendiente de instrucción del usuario.**
