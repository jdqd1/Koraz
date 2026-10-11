# T044 — Crear la skill de guía + tema a ruta compatible

**PASS en el alcance de T044.** Fuente completa en `tools/skills/crear-rutas-koraz/`; no instalada. La petición «continua con t044» autoriza solo esta ficha. Se consultaron HANDOFF-EJECUTOR.md §8.14, T043, el contrato congelado y skill-creator disponible. T045 y T046 no se iniciaron.

## Entrega

- `SKILL.md`: descubrimiento normal, entrada guía + tema, workflow completo y entrega de JSON + revisión + assets pendientes. Sin desactivación de invocación implícita. Metadata UI opcional omitida; no se afirma descubrimiento efectivo en una instalación que todavía no existe.
- `references/pedagogia.md`: ocho kinds, ciclo por objetivo, cinco familias iniciales y tres reservas exclusivas por requerido, gates, diagnóstico, checkpoints y límites del dominio/repaso.
- `references/cobertura-por-disciplina.md`: patrones de las nueve disciplinas del contrato y requisitos visuales de anatomía/histología.
- `references/contrato-koraz-2.0.md`: conserva identidad/aceptación T043 y añade campos, trazabilidad, incidencias, faltantes, contradicciones y significado exacto de los resultados CLI.
- `scripts/verify-resources.mjs`: verifica Node 24 e identidad de los seis recursos congelados, sin escribir ni acceder a backend. El bundle validador, esquema, ejemplo y manifests heredados no se modificaron.

Las fuentes se leen como datos; las órdenes incrustadas no autorizan acciones. No se fabrican UUID, bibliografía, hashes, figuras o contenido clínico para completar cobertura. La skill prepara borradores locales; importación, binding de catálogo, revisión y publicación requieren sus procesos separados en Koraz.

## Verificación

[quick-validate.txt](quick-validate.txt): `skill-creator/scripts/quick_validate.py`, exit 0, «Skill is valid!». Se ejecutó el script original sin modificaciones con Python del runtime y PyYAML 6.0.3 aislado en `.python-deps` dentro de este dossier; no se cambió Python global ni dependencias del proyecto. [Instalación aislada de dependencia](validator-dependency.txt). Las sondas previas detectaron que PyYAML no estaba disponible en los dos intérpretes consultados; fue una limitación de entorno, no fallo de la skill.

[verification.json](verification.json): **14/14 PASS** con Node v24.19.0. Comprobaciones: predecesora PASS y hashes 6+14; enlaces locales; configuración de descubrimiento; sintaxis de ambos scripts; verifier desde cwd ajeno; ejemplo válido con/sin `--publish`; payload inválido; incidencia editorial con/sin `--publish`; versión mayor desconocida; JSON corrupto; bundle alterado y recurso faltante. No se cuentan sondas o reruns como pruebas adicionales. Los procesos CLI tienen lectura restringida a skill/fixtures mediante permisos de Node; no se afirma aislamiento de red del sistema operativo.

Reproducción desde raíz del proyecto, con el Node 24 del runtime:

```text
node docs/aprendizaje-guiado/v2/evidencias/T044/verify-t044.mjs
```

`verify-t044.mjs` guarda diagnóstico y crea fixtures en `validator-cases`. Son mutaciones del ejemplo heredado T043 para comprobar scripts, no ejecuciones de autoría con guía inédita ni pruebas K01–K05.

Revisión documental manual: entrada mínima suficiente para construir objetivos; campos/enums según esquema; clasificación razonada sin imponer todos CORE; representación y familia no confundidas; banco/reservas y cadencia de checkpoints coinciden con módulos aceptados; ausencias/conflictos mantienen errores bloqueantes; fidelidad médica no se deduce del CLI; salida exacta de tres componentes y pasos concretos de importación. Los enlaces resuelven dentro del paquete, y ningún recurso de uso requiere acceso al repositorio. La mención del exportador del repositorio es únicamente para mantenimiento tras una nueva aceptación.

[closure-check.json](closure-check.json): preservación por hash de todos los archivos iniciales fuera de allowlist, sin nuevos archivos externos; revisión de whitespace y SHA base. El registro general se conserva porque no pertenece a la allowlist de T044; este dossier es su cierre.

## Límites y artefactos temporales

- K01–K05: **NO VERIFICADO en T044**, corresponden a T045: generación con guía inédita/piloto, comportamiento adversarial real del agente, importación, publicación de prueba y recorrido persistido.
- Instalación/discovery en catálogo real y Hito K: **NO VERIFICADO**, corresponden a T046.
- Catálogo: **PENDING_AT_IMPORT**. Ni `valid:true` ni `publishable:true` sustituyen acceso, derechos, binding o revisión editorial humana.
- T042 mantiene aceptación provisional con excepción del usuario. Q19/V04 **NO VERIFICADO y aplazado**; no se declara Hito S original 24/24, accesibilidad completa, eficacia educativa, validación clínica ni producción.
- No se modificó backend, contrato aceptado, políticas, skills ajenas o configuración global. No hubo instalación de la skill, SQL, credenciales, despliegue o commit.

La política de ejecución rechazó dos intentos de eliminar `.python-deps` y `validator-cases/resource-copy` con el motivo «blocked by policy». Se conserva la dependencia aislada y la copia deliberadamente alterada como artefactos de verificación dentro del alcance autorizado; no están instaladas. **No usar la copia resource-copy para validar rutas reales**: se alteró para el control negativo. La fuente utilizable es exclusivamente `tools/skills/crear-rutas-koraz/`. [Registro de la limpieza bloqueada](cleanup.json). No se intentó evadir la restricción.
