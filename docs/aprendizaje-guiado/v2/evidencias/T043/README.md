# T043 — contrato y validador portables

**Estado: PASS, dentro de la aceptación provisional de implementación autorizada por el usuario.** Q19/V04 permanece NO VERIFICADO y aplazado; no se acredita el Hito S original 24/24. Fecha del usuario: 10/10/2026, America/Caracas. Base: `ef6f541eafa70c5dda03d4547cf48428be767c3d`.

## Dependencia y autorización

La petición directa «ya puse que se saltara la prueba del navegador, puedes continuar con t043?» autoriza reanudar únicamente T043. Se verificó el [resultado actualizado de T042](../T042/result.json), su [acta](../../acta-HITO-S.md), los [hashes congelados](../T042/accepted-contract-hashes.json) y la [excepción exacta](../T042/reader-deferral.json). La excepción registrada corresponde al lector real Q19/V04 y su discrepancia manual; no omite las pruebas automatizadas HTTP/browser existentes ni otros criterios.

T042: `status: PASS`, `decision: accept_with_exception`, `implementationAcceptance: true`, contrato `accepted: true`, `frozen: true`; `systemAcceptance: false`. El registro coincide. La comprobación actual verifica 14/14 hashes y el hash del manifest de aceptación. [Auditoría](prerequisite-check.json).

El bloqueo de la primera ejecución de T043 era correcto para el estado de aceptación entonces existente. Se conservó íntegro en [initial-blocked](initial-blocked/README.md); no se sobrescribió evidencia de T042.

## Recursos entregados

En `tools/skills/crear-rutas-koraz/`:

- Esquema generado 2.0 y `scripts/validate-route.mjs`: copias exactas de los artefactos congelados, sin reimplementar reglas.
- Ejemplo sintético validado: copia exacta del fixture T027, una unidad, un objetivo, 11 actividades, reservas y cero assets. Incluye el aviso no bloqueante por diagnóstico pequeño. No es una guía médica aprobada.
- Referencia técnica con versiones, hashes, uso, códigos de salida y límite portable; copias del manifest aceptado y de la excepción del usuario.
- Licencia MIT de Zod 4.4.3 incorporado al bundle y `contract-runtime.json` con identidad y procedencia de cada recurso.
- Exportador reproducible `packages/contracts/bin/export-route-skill.mjs`: verifica aceptación/hashes y copia bytes sin regenerar el contrato. Reejecución idéntica comprobada.

`schemaSha256`: `5c7fe90b97bbe84a476bd311129494aaae1537e1efc3f5c394526c99159bb9d6`.

`bundleSha256`: `de41134aa324cef1b0e2c614ec5b4f236a585017baa083e4437d1e64d465b67d`.

El catálogo queda **PENDING_AT_IMPORT**. `--publish` solo valida cobertura portable: no publica ni acredita bindings, permisos o revisión editorial/médica. No se fabricaron UUID, figuras, citas ni autoridad de publicación. No se creó SKILL.md, que corresponde a T044.

## Pruebas

Node `v24.19.0`, Windows local. [Portabilidad](portability.json): **68 comprobaciones PASS**. Son 48 comparaciones exactas sobre 12 casos entre función compartida del backend, CLI ordinaria y copia portable (borrador/publicación); 6 rechazos de entrada/versión/IO; 14 comprobaciones de aislamiento. Casos positivos: ejemplo sintético y piloto previamente aprobado. Negativos: campo desconocido, respuesta incorrectamente referida, URL file, ciclo DAG, fuente ausente, cobertura insuficiente, reserva, gate CORE, fuente sin verificar y familias repetidas.

La copia se ejecutó en una carpeta temporal inicialmente vacía fuera del repo, sin `.git` o `node_modules`, con ambiente limpio y lectura restringida por Node a esa carpeta. Se comprobó denegación de lectura del repo y ejecución de procesos hijos. Un guard de pruebas bloqueó importación de módulos y APIs Node de red, DNS, fetch y WebSocket; los intentos de acceso fueron rechazados antes de contactar la red. **No se afirma aislamiento por firewall del sistema operativo.** El guard no forma parte del validador exportado; sus bytes siguen exactos. No hubo instalaciones ni descargas. Se eliminó solo la carpeta temporal creada por la prueba, verificando su ruta.

[Regresión focalizada](validator-tests.json): **23 PASS, 0 FAIL, 0 omitidas**, suites existentes package/graph/validation con un worker. Prueba schema generado = schema congelado PASS. Validación portable no sustituye `validateBoundRoutePackage` ni comprueba un catálogo real en esta ficha.

Se conserva la [consulta inicial](initial-probe.json) que obtuvo IO_ERROR al pasar el fixture bajo su antiguo nombre `ui-package.json`: se copiaron sus bytes a `.koraz-route.json`, sin cambiar el CLI; los checks finales pasaron. No se relajaron asserts ni reglas. El primer cierre detectó seis nombres de archivo que Git había escapado y el inventario PowerShell omitió; se conserva [ese fallo del parser](closure-initial-parser-failure.json). Se corrigió el tratamiento de nombres y se comprobó que los seis archivos históricos coinciden con HEAD, sin sustituir el baseline.

Reproducción con Node24 disponible en PATH:

```powershell
node packages/contracts/bin/export-route-skill.mjs
node docs/aprendizaje-guiado/v2/evidencias/T043/verify-prerequisite.mjs
node docs/aprendizaje-guiado/v2/evidencias/T043/verify-portability.mjs
pnpm.cmd --filter @cediah/api exec vitest run test/guided-v2-package.test.ts test/guided-v2-graph.test.ts test/guided-v2-validation.test.ts --maxWorkers=1 --reporter=json --outputFile=../../docs/aprendizaje-guiado/v2/evidencias/T043/validator-tests.json
node docs/aprendizaje-guiado/v2/evidencias/T043/verify-closure.mjs
```

## Preservación y límites

[Baseline](baseline.json) y [cierre](closure-check.json): 7749 archivos previos fuera de allowlist conservados por hash y seis artefactos T040 con nombres acentuados comprobados contra los blobs exactos de HEAD; HEAD intacto, sin archivos nuevos fuera de allowlist. Syntax checks y diff focalizado PASS. El trabajo se limitó a los recursos assets/scripts/references, el exportador y este dossier. No hubo cambios de runtime, backend, contratos, políticas, dependencias, migraciones, piloto, registro o acta.

K05 parcial PASS: ejecución portable, esquema mayor desconocido y JSON/UTF-8 corrupto rechazados. Generación guía+tema, round trip de una generación nueva, importación/recorrido de skill e instalación corresponden a T044–T046 y siguen NO VERIFICADO aquí. Q19/V04 continúa aplazado con su evidencia original; no se afirma accesibilidad completa, staging, producción, dispositivo físico, eficacia educativa o validación clínica. No hubo commit ni despliegue. T044 no iniciada.
