# T019 — PASS

Base: `c6dfa69466ee9cb61cf28d8b78177f6e7dd7ca84`. Dependencias T017, T018 y T006: PASS. Hashes de T017 y T018 comprobados; validación editorial T006 incluida en la regresión.

## Implementación

- `assessments.ts`: pools disjuntos por familia y objetivo; rechazo de `RESERVE_LEAK`; selección objetiva por versión autorizada; checkpoints con prioridad CORE, rotación y mezcla de la unidad más reciente con las anteriores ya introducidas. Solo se intercalan grupos comparables introducidos.
- Segmentos de hasta diez ítems, un ítem por objetivo requerido. El final considera todos los objetivos requeridos de la ruta; las retenciones consideran los objetivos pendientes según la agenda UTC de T018, incluso antes de finalizar la ruta. Un banco insuficiente bloquea explícitamente; no recicla otra reserva.
- Plan privado clonado y congelado, con hash de contenido/selección, fecha, exposición previa de la familia, modalidades previas, novedad y candidatura de transferencia. Revelado y exposición previa cuentan aunque no haya respuesta correcta; otro ID con la misma familia no recupera novedad. El preview editorial no es exposición del alumno. El indicador es metadata de candidatura; no otorga puntuación, dominio ni transferencia.
- Cobertura independiente del promedio: enviar solo el primer segmento no cubre la evaluación completa. Omisiones puntúan cero sobre todos los objetivos elegibles; respuestas asistidas o autorreportadas no inflan el resultado. Se registran días reales desde primer dominio y si la retención cae fuera de la ventana.
- `manifests.ts`: entrega únicamente el ítem activo con el proyector público compartido; práctica/preview del alumno no entregan reservas. El feedback del segmento se entrega tras enviarlo, sin entregar corrección de otros segmentos. El manifiesto de intentos existente también oculta reservas en actividad/repaso y difiere su feedback hasta completar la evaluación.

La selección consume snapshots autorizados y registros de exposición del servidor. T021 debe persistir/reutilizar el plan congelado en el intento, registrar la exposición real al presentar, usar estados de envío confirmados y conectar estos módulos a los endpoints. T019 entrega selección y proyección; no implementa ni acredita ese recorrido HTTP, la persistencia nueva de metadata de selección o UI.

## Verificación

| Comprobación | Resultado | Log |
|---|---|---|
| T019 focalizada | 26/26 PASS | focused-retention.txt |
| T019 + scheduler T018 | 49/49 ejecutadas PASS; 10 casos PostgreSQL omitidos en esta corrida | acceptance-tests.txt |
| Intentos, evidencia, casos, selección y publicación | 77/77 ejecutadas PASS; 12 casos PostgreSQL omitidos | regression.txt |
| Build de contratos | PASS | contracts-build.txt |
| Typecheck API | PASS | typecheck-final.txt |
| Lint API | PASS | lint-final.txt |
| Diff de archivos T019 y whitespace | PASS | scoped-diff.txt; state.txt |

Las pruebas demuestran cobertura de 18 y 24 objetivos en múltiples segmentos, exclusión de la cuarta unidad futura, prioridad CORE, omisiones cero, reservas distintas para final/7/30, repetición no inédita, agenda tardía y separación mínima de siete días, congelación, proyección sin soluciones y feedback diferido. Los casos PostgreSQL no se repitieron en T019: no se modificaron almacenamiento, locks o scheduler. T018 ya conserva sus comprobaciones independientes; no se presenta esa corrida como una prueba PostgreSQL de T019.

Los primeros logs se conservaron. El fixture inicial omitía las reservas de la pertenencia de actividades a unidades que exige el grafo; se corrigió el fixture sin debilitar el validador. La inferencia TypeScript de segmentos necesitó anotación explícita.

## Límites y cambios ajenos

Solo se modificaron los tres archivos de la ficha y esta evidencia. Cambios previos de T018 y cambios concurrentes del mapa permanecen intactos. El `git diff --check` global detectó una línea final adicional en un archivo ajeno del mapa; la comprobación de T019 pasó. No se corrigió código ajeno para ocultar ese resultado.

No se ejecutó suite global ni validación de navegador, staging o producción. No hubo despliegue, cambios de contratos, evaluadores, contenido real, migraciones ni nuevas dependencias. T020 no se inició. Resultado estructurado y hashes: `result.json`.
