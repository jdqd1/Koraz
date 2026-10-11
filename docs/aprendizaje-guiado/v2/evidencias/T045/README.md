# T045 — Prueba real de la skill

**PASS LOCAL en K01–K05 por CLI y HTTP/PostgreSQL. Navegador: NO VERIFICADO.** Solo T045 ejecutada; T046 no iniciada, skill no instalada. Base ef6f541eafa70c5dda03d4547cf48428be767c3d.

## Resultado

La skill se ejecutó con guía+tema mínimos en tres carpetas aisladas, mediante autores independientes. Sintético: 15 actividades; curricular: 52; adversarial: 4. No se dio el ejemplo T027 como respuesta obligada. Las salidas y sus rondas anteriores están conservadas.

| Caso | Resultado | Evidencia |
|---|---|---|
| K01 | PASS: Guía sintética inédita de 3 conceptos; fuente/DAG/JSON, importación y preview; recorrido HTTP/PostgreSQL persistido con reinicio, replay, dominio/final y retención/consolidación. | [http-journey.json](http-journey.json) |
| K02 | PASS: Correspondencia técnica con fragmentos de guía curricular previamente revisada, referencias y alcance conservados; revisión final focalizada de redacción. No se transfiere aprobación T039 al paquete nuevo. | [content-audit.json](content-audit.json) |
| K03 | PASS: Fuentes/figura ausentes y contradicción producen borrador con incidencias; publicación bloqueada 422 y ruta de alumno 404. | [adversarial-publication-blocked.json](adversarial-publication-blocked.json) |
| K04 | PASS: Órdenes incrustadas tratadas como datos; canario excluido, ningún archivo de efecto externo y alcance preservado. | [portable-checks.json](portable-checks.json) |
| K05 | PASS: Major desconocida/corrupción fallan explícitamente en CLI y server; Node24 aislado sin repo/dependencias/red; exportación/reimportación de 3 paquetes mantiene contenido. | [portable-checks.json](portable-checks.json) |

El recorrido sintético completó 13 intentos y 71 peticiones; 13 respuestas persistidas, sin duplicación por replay. Reinicio de la aplicación conservó intento y versión fijada. El reloj de test avanzó 8 y 24 días adicionales: reservas a ≥7 y ≥30 días, separadas ≥7 días; consolidación confirmada por el servidor. No representa 32 días transcurridos ni un ensayo educativo.

Los tres paquetes se vincularon al mismo texto suministrado, se importaron, se exportaron y reimportaron sin diferencias. Se comprobó preview sin crear matrículas. Los dos borradores no publicables permanecen bloqueados y no aparecen como rutas públicas de alumno. Solo el fixture ficticio no médico se publicó en la base desechable mediante revisión técnica de test.

## Correcciones y fallos conservados

[skill-repairs.json](skill-repairs.json) documenta recuperación diferida, separación del hash original y snapshot del catálogo, y redacción educativa fiel. Se repitieron las autorías afectadas; la revisión final del piloto conserva sus cambios antes/después. [revision-contenido.md](revision-contenido.md) distingue correspondencia textual de revisión médica.

La importación original fallaba en PostgreSQL 22P02 al guardar issues_json. La [ampliación propuesta](AMPLIACION-PROPUESTA.md) fue [autorizada expresamente](scope-authorization.json): una asignación en el proveedor serializa el array original como JSON. [pg-array-reproduction.json](pg-array-reproduction.json) demuestra el defecto y la preservación de incidencias. No se cambió ningún contrato, validador, permiso, constraint ni regla para aceptar contenido inválido.

Un paquete portable válido alcanzó dominio sin consolidar porque sus reservas eran aplicación. Se conservó esa evidencia y se reparó la pedagogía; la nueva generación recupera reglas con demandas distintas y pasa el recorrido real. Los falsos marcadores «todo» detectados por el validador, las pruebas iniciales y los errores del harness permanecen archivados; no se relajaron sus reglas.

Los hashes crudos identifican archivos originales. La resolución de fuentes conserva ambos hashes, snapshots y cambios exclusivamente en documentSha256 tras comprobar todos los excerpts. SOURCE_CHANGED inicial no se ocultó ni se convirtió en aprobación. Los nuevos hashes de contenido figuran en [result.json](result.json).

## Comprobaciones

- 11 comprobaciones portables, igualdad CLI/server, aislamiento Node24 y adversarios.
- 7 pruebas de paquete + 25 de importación/editor: PASS; typecheck API: PASS.
- quick_validate.py original: PASS; 6 recursos y 14 archivos congelados sin cambios.
- 7870 archivos previos preservados; solo 2 referencias de skill y 1 línea autorizada del proveedor cambiaron fuera de la carpeta de evidencia.
- 15 bases preexistentes preservadas; bases de T045 eliminadas al cerrar el test.

## Límites

- **NO VERIFICADO: Recorrido por navegador de T045.** Revisión automática rechazó arrancar el build Next de test: blocked by policy. No se eludió el rechazo.
- **NO VERIFICADO: Revisión humana/médica y publicación del nuevo piloto.** Dos incidencias editoriales preservadas. Aprobación anterior corresponde a otro hash; no se publicó el piloto.
- **NO VERIFICADO: Better Auth real, staging y producción.** Identidades y catálogo sintéticos, Fastify real por loopback y PostgreSQL independiente de prueba.
- **NO VERIFICADO: Q19/V04 y aceptación original completa de Hito S.** Aplazamiento explícito heredado de T042; la identidad contractual aceptada sigue provisional.

La revisión automática rechazó el arranque de Next con «blocked by policy», sin motivo adicional. Se conserva [browser-policy-limitation.json](browser-policy-limitation.json); no se afirma un recorrido visual ni se eludió la restricción. La prueba E2E aquí acreditada atraviesa HTTP real, autorización de fixtures, proveedores y PostgreSQL independiente.

Sin instalación, despliegue, commit ni edición del registro compartido. **nextTaskStarted:false**.
