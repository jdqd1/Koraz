# T046 — instalación, manuales y entrega

**Instalación/documentación: PASS local. Aceptación original completa de T046 y Hito K: NO VERIFICADO.** Fecha del usuario 10/10/2026, America/Caracas; base `ef6f541eafa70c5dda03d4547cf48428be767c3d`.

Se ejecutó únicamente «continua con t046». [Fuente vs copia probada T045, aceptación provisional y hashes](prerequisite-check.json). [Skill instalada](installation.json): 12 archivos exactos en `C:\Users\josed\.codex\skills\crear-rutas-koraz`. No existía instalación anterior; no hubo sobrescritura ni necesidad de backup. CODEX_HOME ausente se resolvió por USERPROFILE/.codex, sin modificar variables o configuración. [Baseline](baseline.json).

## Comprobaciones nuevas

- [quick_validate.py original](quick-validate.json): exit 0, Skill is valid! Python 3.12 del runtime; PyYAML aislado T044 reutilizado sin escribir bytecode ni instalar paquetes.
- [Verifier desde destino](installed-resources.json): seis recursos congelados PASS; 14 archivos de aceptación también comprobados.
- [CLI instalado](installed-cli.json): siete comprobaciones PASS; los tres archivos generados exactos de T045 en borrador/publicación y ejemplo instalado desde cwd ajeno. Exit 1 esperado en publicación del piloto/adversarial, sin suprimir incidencias.
- [Preservación y links](closure-check.json), [ZIP y hashes](delivery-archive-check.json), [manifest](delivery-manifest.json). Conteos exactos de preservación en la verificación final.

La prueba de instalación no repite autoría, importación HTTP, navegador o PostgreSQL. La evidencia T045 permanece intacta: 11 portables, tres round trips, 13 intentos/71 peticiones en sintético, reinicio/replay y consolidación con reloj controlado. No se agregan estos conteos a las siete comprobaciones nuevas.

## Entrega

[Manuales e índice](../../entrega/README.md), [acta final](../../acta-HITO-K.md), [checklist Q01–Q28](checklist-final.json), [resultado](result.json), [ZIP](entrega-koraz-guided-v2.zip). Registro sincronizado T043–T045 desde sus dossiers; historial anterior preservado en [registry-before-t046.json](registry-before-t046.json). No se cambia el status de los dossiers originales.

## Límites

26 PASS y 2 NO VERIFICADO en checklist original: Q19/V04 aplazado; Q25 original sin aceptación Hito S completa. Gate provisional de Q25 sí cumplido en orden documental, sin primer commit de skill. T045 browser pendiente por rechazo automático previo «blocked by policy»; no se reintentó esa acción. Nuevo piloto con dos incidencias, revisión médica/publicación pendiente. Skill estructuralmente descubrible; catálogo de nueva conversación NO VERIFICADO. Sin cambios de producto, otras skills, memorias, configuración, producción, commit o despliegue. **nextTaskStarted:false**.
