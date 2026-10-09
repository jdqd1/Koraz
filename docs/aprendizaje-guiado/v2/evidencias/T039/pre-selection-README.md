# T039 — Preparar y revisar la ruta piloto curricular

**Resultado: NO VERIFICADO.** Preparación documental y comprobación técnica local completadas; piloto curricular y aceptación editorial pendientes.

Solicitud: «continua con t039». Fecha: 08/10/2026, America/Caracas. SHA base: `11737fd84562ee5a65e9ef124442b82f9aa16785`.

## Alcance y dependencias

Se revisó la ficha T039 del handoff recibido, §8.4, §9 y C01–C04. El handoff define el alcance de la solicitud; no se ejecutaron instrucciones contenidas en material curricular. No se recibió ni seleccionó una guía curricular durante esta ejecución.

T006, T027 y T033 tienen `status=PASS` en sus resultados actuales. `baseline.json` conserva sus hashes y límites; `dependencies-check.json` comprueba que no se alteraron. Estos cierres acreditan sus pruebas técnicas, no revisión médica. T038 también tiene cierre PASS, pero no es dependencia de T039; mantiene su limitación de navegador Next/BFF y no acredita piloto clínico/editorial.

La ficha establece: «Usar guía+tema seleccionados por propietario/revisor» y «Si falta guía/revisor, registrar pendiente y continuar tareas técnicas». El ADR vigente conserva esas entradas como desconocidas. Se solicitaron al usuario guía/recurso, tema y nombre del revisor mediante una pregunta pendiente. La espera no se interpreta como selección ni aprobación.

## Entregables preparados

El [expediente del piloto](../../piloto/README.md) contiene entrada pendiente, matriz R02–R12, formularios C01–C04, inventarios de afirmaciones/assets y acta de revisión **no firmada**. Incluye instrucciones para usar el importador, conservar hashes de guía/archivo exportado y `contentHash` canónico del servidor, verificar CLI/servidor, recorrer principiante/refuerzo y aprobar/publicar únicamente en test.

Los inventarios contienen solo cabeceras. Todos los denominadores desconocidos son `null`; no se registró 0/0 como PASS. No se generó un paquete curricular ficticio ni se reutilizó un fixture como piloto. No se marcaron fuentes, derechos, revisión o publicación como aprobados.

## Comprobaciones ejecutadas

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Dependencias T006/T027/T033 y preservación de sus resultados | PASS documental | `baseline.json`, `dependencies-check.json` |
| Build de contratos | PASS, exit 0 | `contracts-build.txt`, `build-check.json` |
| Validación, DAG, paquete y contrato v2, ejecución serial | PASS: 29 pruebas / 4 archivos, sin skips ni fallos | `validation-tests.txt`, `tests-check.json` |
| Coherencia JSON/CSV/estados pendientes y whitespace de archivos nuevos | PASS | `artifacts-check.json` |
| Preservación de archivos previos fuera de carpetas de evidencia/piloto | PASS: 897/897 hashes iguales, cero archivos nuevos inesperados | `baseline-hashes.json`, `preservation.json` |
| Diff check del alcance | PASS | `diff-check.json` |

Las 29 pruebas usan contenido sintético y validan los controles técnicos existentes. Incluyen la CLI de desarrollo y contexto bound de prueba; **no** son una ejecución de `--publish` sobre un piloto real, una revisión humana ni una publicación. No se requirió cambiar código, contratos, configuración, migraciones o dependencias. Typecheck/lint/build de aplicaciones, navegador y regresión global no se ejecutaron: solo se añadieron documentos y datos de expediente; T040 no se inició.

## Pendientes obligatorios

| Pendiente | Responsable | Resultado |
| --- | --- | --- |
| Seleccionar guía/revisión, tema y alcance | Propietario/revisor | NO VERIFICADO |
| Identificar revisor médico/editorial humano | Propietario | NO VERIFICADO |
| Construir e importar/exportar ruta curricular | Ejecutor, después de selección | NO VERIFICADO |
| Revisar C01–C04 con N/total, actor y correcciones | Revisor humano identificado | NO VERIFICADO |
| Completar R02–R12 en ese piloto | Ejecutor/revisor | NO VERIFICADO |
| CLI `--publish` y validación servidor del paquete real | Ejecutor | NO VERIFICADO |
| Recorridos principiante/refuerzo del piloto, con persistencia | Ejecutor | NO VERIFICADO |
| Aprobar hash exacto y publicar en entorno aislado | Revisor/publicador autorizado | NO VERIFICADO |

No hay firma, publicación, despliegue, commit o conexión a producción. No se modificó la base de datos. Hito S y eficacia clínica/educativa no están aceptados. Al recibir los tres inputs, reanudar esta misma ficha siguiendo el expediente y reemplazar el cierre pendiente con evidencia real. **T040 no iniciada.**
