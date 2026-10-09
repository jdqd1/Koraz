# T039 — corrección mínima propuesta para el selector de casos

**Actualización:** el propietario autorizó aplicar esta propuesta respondiendo «si». La corrección quedó aplicada; ver [scope-authorization.json](scope-authorization.json) para el alcance y hashes antes/después. El texto inferior conserva la propuesta presentada antes de la autorización.

La aprobación humana del paquete `d9f35d39a769027998be0eeb17113e89f0e637af0b353c5bd1378ee77a59cf12` y su publicación en test pasaron. El recorrido HTTP real terminó las dos etapas del caso `puentes-caso-integrado`; la API informa 37/37 actividades y los cuatro CORE dominados, pero vuelve a ofrecer el caso y no habilita el checkpoint.

Causa: `loadContext` entrega al selector claves de respuestas de actividades hijas. La actividad contenedora del caso no tiene una respuesta propia y falta en esa lista. El motor de evidencia sí reconoce el caso completo; por eso los contadores y la selección divergen.

Propuesta concreta: [case-selection-fix.patch](case-selection-fix.patch), limitada a `apps/api/src/guided-learning/v2/routes.ts`. Añade al conjunto de completados los casos cuyos intentos están terminados y pertenecen a la versión matriculada actual. No acredita casos abiertos ni modifica preguntas, soluciones, fuentes o hashes del paquete aprobado.

Validación prevista: repetir el recorrido real del piloto y su ruta de refuerzo, reiniciar la API para comprobar reanudación desde la base, ejecutar typecheck/lint de API y regresión enfocada de rutas/selección/casos. La reproducción y estos recorridos quedan en evidencia T039; no se inicia T040.

La aplicación aún no está autorizada. T039 limita sus cambios a datos aislados, `docs/aprendizaje-guiado/v2/piloto/` y `evidencias/T039/`. La skill de ejecución indica: “Work only in the ficha allowlist. If a minimal integration needs files beyond it, describe the exact extension and obtain concrete authorization before editing those files.”
