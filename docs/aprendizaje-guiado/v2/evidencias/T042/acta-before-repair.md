# Acta Hito S — T042

**Decisión: REJECT. Estado T042: FAIL de aceptación; revisión ejecutada.** Fecha: 10/10/2026, America/Caracas. Q01–Q24: **21 PASS locales, 1 FAIL, 2 NO VERIFICADO**. Hito S no aceptado; T043–T046 no iniciadas. El piloto conserva su aprobación editorial humana.

La solicitud «continua con t042» autoriza esta revisión. El handoff se usa como especificación de T042 y §§2,4,10; sus instrucciones históricas de comenzar por T001 no reemplazan la solicitud actual. T042 permite modificar este archivo y `registro-ejecucion.json`, y prohíbe modificar código o iniciar la skill antes de aceptar el sistema. Toda la evidencia y el resultado estructurado de esta revisión quedan en esos dos archivos; no se crea un tercer dossier.

## Base y alcance de la revisión

SHA actual: `ef6f541eafa70c5dda03d4547cf48428be767c3d`. Captura de preservación: `2026-10-10T21:23:09.642Z`. Estado inicial:

```text
 M docs/aprendizaje-guiado/v2/registro-ejecucion.json
?? docs/aprendizaje-guiado/v2/evidencias/T041/
?? docs/aprendizaje-guiado/v2/runbook.md
?? work/
```

Los cambios anteriores de T041 se conservan. Huella SHA-256 de 1064 archivos preexistentes de `apps`, `packages`, `database`, `work`, lockfile, package.json, runbook y dossier T041: `1b96f1bd39be6ac804a8560cc6c82da93de1fd4084e217c006d5feda949da926`. Método: rutas Git tracked/untracked no ignoradas ordenadas; SHA-256 de bytes por archivo; SHA-256 del JSON de pares ruta/hash. La huella excluye los dos archivos permitidos de T042. Resto de entradas del registro, excluyendo T042: `c20bb559f792b3f8746bb9c87669ecf306c088006ffad37e7df664c353e3eaa4`.

Comparación de validador ejecutada con Node **24.19.0** instalado en `C:/Users/josed/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`. Node del PATH: 22.22.0; pnpm disponible hoy: 11.25.0. No se instalaron dependencias ni se recompiló/regeneró el bundle. Las pruebas heredadas conservan sus runtimes originales, incluidos pnpm 11.19.0 y pool local de 20 conexiones.

Dependencias leídas: [T039](evidencias/T039/result.json), [T040](evidencias/T040/result.json), [T041](evidencias/T041/result.json), las tres PASS LOCAL en su alcance. T039 aprueba/publica el piloto en test; T040 cierra regresión técnica con omisiones explícitas; T041 cierra M04 local. Sus PASS no implican automáticamente aceptación integral. El [cierre M01](evidencias/M01/README.md) resuelve el antiguo bloqueo 0005 para el perfil vacío elegido por el propietario; no se trata el límite histórico de T034 como un fallo actual de ese perfil.

Se revisaron logs, resultados originales y repeticiones focalizadas, omisiones, la aprobación del piloto y muestras de código. Las únicas ejecuciones funcionales nuevas fueron comparaciones de contrato/CLI sobre el piloto existente. No se repitieron suites globales ya estabilizadas: no cambió código. Se inspeccionaron visualmente las capturas [feedback móvil ampliado](evidencias/T040/browser-artifacts/guided-v2-accessibility-T0-77cfd-rt-gallery-200-percent-zoom-mobile/learner-feedback-viewport.png) y [editor grande desktop](evidencias/T040/large-editor-confirmed-browser-artifacts/large-editor-T040-L03-larg-b4a47-rsists-through-the-real-BFF-desktop/large-editor.png); son muestras históricas, no una nueva sesión ni inspección de lector.

## Q01–Q24

La fecha de revisión de **cada fila** es 10/10/2026; los timestamps de ejecución de la evidencia original están en sus reportes enlazados. PASS significa únicamente el alcance local indicado. Las omisiones no se cuentan como PASS.

| ID | Estado | Evidencia y conclusión |
|---|---|---|
| Q01 | PASS | [Baseline T001](evidencias/T001/baseline.json), [baseline T040](evidencias/T040/baseline.json) y captura actual arriba: SHA, estado y runtimes registrados. |
| Q02 | **FAIL** | Comparación reproducida abajo: esquema generado y CLI con dist coinciden; bundle autónomo conserva `VALIDATION_PENDING` y rechaza el mismo piloto aceptado por backend. No se puede congelar un validador aceptado. |
| Q03 | PASS | [T005](evidencias/T005/result.json), [regresión T039](evidencias/T039/validation-tests.txt): DAG/ciclos/autorreferencias, referencias, pertenencia y orden. Se aplica al validador actual del backend; la divergencia del bundle permanece en Q02. |
| Q04 | PASS | [Paquete piloto](piloto/vascularizacion-abdomen.koraz-route.json), [validación portable](evidencias/T039/portable-validation.json), [validación vinculada aprobada](evidencias/T039/approved-bound-validation.json): cobertura y reservas del piloto sin incidencias. |
| Q05 | PASS | [T017 P11](evidencias/T017/result.json), [T039 alumno](evidencias/T039/learner-beginner.json): diagnóstico opcional/formativo, sin dominio ni penalización por omitirlo. |
| Q06 | PASS | [T025](evidencias/T025/README.md), [T026](evidencias/T026/README.md), [T035](evidencias/T035/README.md), [T040 casos efectivos](evidencias/T040/counts-and-omissions.json): autoría, serialización, respuesta/corrección/reanudación de ocho kinds; E04 desktop y móvil. No acredita los cinco recorridos móviles omitidos. |
| Q07 | PASS | [T013](evidencias/T013/result.json), [T016](evidencias/T016/result.json), [T018](evidencias/T018/result.json), [E03/T040](evidencias/T040/counts-and-omissions.json): lectura, ayuda, confianza y self-rating excluidos del dominio; práctica formativa permanece separada. |
| Q08 | PASS | [T017 P09](evidencias/T017/result.json), [T035 E03](evidencias/T035/README.md): CORE fallado bloquea descendientes; raíces/rama independiente conservan disponibilidad. Banco agotado no abre gates. |
| Q09 | PASS | [T019 P14/P15](evidencias/T019/result.json), [S03/T036](evidencias/T036/README.md): familias reservadas disjuntas, segmentos y feedback posterior al envío; sin exposición de etapas futuras. |
| Q10 | PASS | [T018](evidencias/T018/result.json), [T036 I04](evidencias/T036/README.md): reloj servidor, respuesta aceptada, fronteras 24 h, replays y conexiones PostgreSQL independientes; agenda y lapses con un efecto. |
| Q11 | PASS | [T016 P10](evidencias/T016/result.json), [T039 alumno](evidencias/T039/learner-beginner.json), [T035 E06](evidencias/T035/README.md): completada/dominada/consolidada y logros históricos separados del estado actual. |
| Q12 | PASS | [T036 navegador](evidencias/T036/playwright.json), [T036 S03](evidencias/T036/README.md), [manifiestos T040](evidencias/T040/manifest-summary.json): JSON/SSR/RSC/DOM/BFF sin claves, rúbricas, polígonos ni preguntas futuras; reveal autorizado después de texto. |
| Q13 | **NO VERIFICADO** | [T036 S01–S08](evidencias/T036/README.md) acredita permisos/ownership/IDOR/revocación/grants/origen y rechazo al faltar identidad. S07 usa adaptador sintético para simular expiración; falta replay tras expiración de sesión real Better Auth. No se convierte esa simulación en prueba de expiración real. |
| Q14 | PASS | [T033](evidencias/T033/result.json), [aislamiento piloto](evidencias/T039/preview-isolation.json), [T035 E02](evidencias/T035/README.md): preview completo sin nuevas filas de alumno/events/rewards ni llamadas mutantes del alumno. |
| Q15 | PASS | [T011](evidencias/T011/result.json), [exportación piloto](evidencias/T039/export-check.json): import/export/import conserva hash semántico con bindings/UUID distintos; revisión no exportada como autoridad. |
| Q16 | PASS | [T012 M02](evidencias/T012/result.json), [T036](evidencias/T036/README.md): CAS, aprobación ligada al hash, edición invalida revisión y snapshot/bindings publicados inmutables. |
| Q17 | PASS | [M01 perfil empty](evidencias/M01/result.json), [T034 M03](evidencias/T034/result.json), [T040 legacy](evidencias/T040/counts-and-omissions.json), [T041 M04](evidencias/T041/result.json): v1 preservada, conversión/adopción explícitas sin inventar dominio, intento abierto bloquea upgrade y restauración comprobada. 0005 no se declara aplicada en empty. |
| Q18 | PASS | [T035 E05](evidencias/T035/README.md), [T036 I04](evidencias/T036/README.md), [T040](evidencias/T040/counts-and-omissions.json): desconexión antes/después de commit, recarga y dos pestañas; dos conexiones PostgreSQL y 200/409 con un efecto. Móvil E05 continúa omitido. |
| Q19 | **NO VERIFICADO** | [T037 V01–V05](evidencias/T037/README.md), [lector](evidencias/T037/screen-reader.json), [T040 accesibilidad](evidencias/T040/accessibility-summary.json): teclado/viewports/zoom/alternativas y axe/árbol accesible PASS; falta inspección hablada de lector. E01/E02/E03/E05/E06 móvil siguen omitidos; E04 móvil y galerías no acreditan por sí solos el flujo integral móvil de §2. |
| Q20 | PASS | [T038](evidencias/T038/result.json), [carga T040](evidencias/T040/performance-recheck.txt), [editor grande](evidencias/T040/accessibility-summary.json): 30 unidades/200 objetivos/1600 ítems, 20 corridas; 20 usuarios/300 s/pool20, p95 estado 237.16 ms y respuesta 532.20 ms, cero errores/inconsistencias; manifiestos ≤100 KiB y máximo un formulario. No acredita pool8 ni capacidad de producción. |
| Q21 | PASS | [Acta editorial](piloto/ACTA-REVISION.md), [aprobación humana](piloto/aprobacion-propietario.json): propietario identificado por función aprobó el paquete exacto, 59/59 actividades, caso completo, 3 referencias y 4 fuentes. Derechos C03 no aplica documentadamente: 0 assets en el piloto. Declaración humana; sin cotejo independiente de pasajes de libros por Codex ni validación clínica del software. |
| Q22 | PASS | [T020 A01–A03](evidencias/T020/result.json): eficiencia null sin diagnóstico/minutos, denominadores elegibles/respondieron/ausentes, exposición/modalidad de transferencia, unión de heartbeat y exportación agregada sin causalidad. |
| Q23 | PASS | [T040](evidencias/T040/README.md), [conteos](evidencias/T040/counts-and-omissions.json): build/tipos/lint y últimos resultados efectivos sin fallos: API 593/3 omitidos, web 483, E2E v2 20/6 omitidos, legacy 63/1 omitido y editor grande 2. No se suman repeticiones; fallos iniciales conservados. Las lagunas obligatorias están en Q02/Q13/Q19. |
| Q24 | PASS | [T041](evidencias/T041/result.json), [log SQL](evidencias/T041/recovery-final.txt), [navegador](evidencias/T041/playwright.json): backup/restauración en otra DB, 67 tablas con conteos/hashes/esquema/secuencias, rollback de migración fallida, flags y continuidad v1/v2. 10 comprobaciones SQL y 6 navegador sin omisiones. |

## Reproducción de Q02

Ejecutadas con el binario Node 24 anterior, desde la raíz, el 10/10/2026:

```powershell
& 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' packages/contracts/bin/validate-learning-route.mjs --publish docs/aprendizaje-guiado/v2/piloto/vascularizacion-abdomen.koraz-route.json
& 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' packages/contracts/bin/validate-learning-route.bundle.mjs --publish docs/aprendizaje-guiado/v2/piloto/vascularizacion-abdomen.koraz-route.json
```

Backend portable (`validateRoutePackage` de `packages/contracts/dist/learning-route-validation.js`) y CLI con dist, exit 0:

```json
{"scope":"portable","valid":true,"publishable":true,"issues":[]}
```

Bundle autónomo, exit 1:

```json
{"scope":"portable","valid":true,"publishable":false,"issues":[{"code":"VALIDATION_PENDING","severity":"error","path":"","message":"Faltan las comprobaciones de DAG y cobertura pedagógica de T005/T006.","suggestedFix":"Ejecuta el validador de publicación completo cuando esté implementado."}]}
```

El esquema exportado coincide **byte a byte** con `JSON.stringify(routePackageJsonSchema(), null, 2) + "\n"` del dist actual. El backend importa el mismo validador portable desde `@cediah/contracts` y añade catálogo/actor/revisión en [validation.ts](../../../apps/api/src/guided-learning/v2/validation.ts). La CLI portable no tiene que sustituir esos controles bound. La discrepancia consiste en las comprobaciones portables ausentes del bundle, ya advertidas en [T005](evidencias/T005/result.json).

SHA de bytes del piloto: `a548d133de45686de4766a2d980a672cc7fe827a7a651cc9935761d62c0e4b75`. Hash semántico canónico recalculado: `d9f35d39a769027998be0eeb17113e89f0e637af0b353c5bd1378ee77a59cf12`. Ambos coinciden con la aprobación y publicación de T039; no se usó una revisión distinta para obtener el fallo.

## Invariantes y políticas examinadas

Muestras de código actuales: [provider de persistencia](../../../apps/api/src/providers/postgres-guided-learning-v2.ts), [proyección de manifiestos](../../../apps/api/src/guided-learning/v2/manifests.ts), [evidencia](../../../apps/api/src/guided-learning/v2/evidence.ts), [gates](../../../apps/api/src/guided-learning/v2/policy.ts), [agenda](../../../apps/api/src/guided-learning/v2/scheduler.ts), [validación bound](../../../apps/api/src/guided-learning/v2/validation.ts) y [política runtime](../../../apps/api/src/guided-learning/v2/service.ts).

- Autoridad servidor: `respond` valida respuesta, autoriza matrícula/intento, toma locks, comprueba etapa y CAS, califica en servidor y usa `now()` del servidor. La respuesta no admite score ni dominio del cliente.
- Atomicidad/idempotencia: transacción, lock de actor, recibo con hash, respuesta append-only, estado/evento/recompensa/agenda en la misma operación. Pruebas reales de dos conexiones respaldan el efecto único; PGlite no se usa como prueba de locks independientes.
- Privacidad: proyección por allowlist del ítem activo, solución privada y feedback diferido en evaluación; fuentes solo tras autorización. Inspección network/SSR/DOM en T036 respalda la muestra de código.
- Evidencia/gates: lectura, diagnóstico, preview y autorreporte no acreditan dominio; familias y ayuda conservan su semántica; CORE controla descendientes y se mantienen ramas independientes.
- Agenda: intervalos `[1,3,7,14,30]`, máximo una extensión por 24 h; fallo/refuerzo, retención +7/+30 y separación ≥7 días desde aceptación real. Ausencia no fabrica fallos.
- Versiones/fuentes: aprobación y bindings ligados al hash; catálogo y acceso se revalidan; versiones publicadas no se editan; upgrade conserva historia y nunca traduce dominio v1 en dominio v2.

Políticas revisadas sin desviación detectada en estas muestras/pruebas: `schemaVersion=2.0`, `guided-v2.0`, `scheduler-v2.0`; ocho kinds; cobertura 5 familias objetivas/2 recuperaciones/1 aplicación y reservas final/día7/día30; gate default 80 con justificación editorial; ventana 5, mínimo 3 familias/2 recuperación/1 aplicación; diagnóstico 4–8 formativo; checkpoint y repaso en segmentos de 10; XP 5/10/15 una vez y cero por lectura/ayuda; claves idempotentes/CAS; separación completada/dominada/consolidada. Son decisiones versionadas de producto, no constantes científicas universales. **Esta revisión de políticas no autoriza consumir sus hashes como contrato aceptado de Hito S.**

## Registro de hashes candidatos — congelación de aceptación pendiente

`accepted:false`, `contractFrozen:false`. Se fija la identidad exacta de los artefactos **revisados y rechazados** para reproducibilidad; no hay hash de validador aprobado para T043. El validador no expone una versión independiente: se identifica mediante schema/policy y SHA-256 de sus implementaciones. Tras reparar, recalcular hashes y emitir otra decisión T042.

| Artefacto | SHA-256 de bytes |
|---|---|
| `packages/contracts/src/learning-route-package.ts` | `c142901b0093d8eb26773f9a3300d7e647d8f236b1aae90a0f8f81836116c783` |
| `packages/contracts/src/learning-route-validation.ts` | `c78006a46569f5ec0c15894677ec5038b9034529515b4abcbad45b95b8b2be48` |
| `packages/contracts/src/guided-learning-v2.ts` | `dd5c39d9f7c0b4edde082f678b92adf71884a6a6a4c2c3c4ec048155a9ecc147` |
| `packages/contracts/schemas/koraz-route-2.0.schema.json` | `5c7fe90b97bbe84a476bd311129494aaae1537e1efc3f5c394526c99159bb9d6` |
| `packages/contracts/dist/learning-route-package.js` | `e16518033739080c68a88174561962187b3411d979f0774c2a4d0d0fcf2b799c` |
| `packages/contracts/dist/learning-route-validation.js` | `1789ed9a7707a74bcf8aa20ce7d4800ab86822760de9c36f3f04dc1c3f813146` |
| `packages/contracts/bin/validate-learning-route.mjs` | `fb5875361e9248513151460835384af5affe69d9d260eb6b5dd9a3e4d22eb949` |
| `packages/contracts/bin/validate-learning-route.bundle.mjs` | `0d73b18ec6ea283546838aaf0973dca9f890800a3dce52b2bffadcbc6b7deeb0` |
| `apps/api/src/guided-learning/v2/validation.ts` | `769f5fe78cb0f83374c7b9e124704500dafee8bac7a96951a58c2ff8f21454ee` |
| `apps/api/src/guided-learning/v2/service.ts` | `142e06dcc06d1d8784d0c6e65e69e5c859e6341a775e314a6604e4627a0d8ca3` |
| `apps/api/src/guided-learning/v2/policy.ts` | `18412f1df4e78112b27ef71e8759737a7712ca602dbc7969e3de4ce1b7c57180` |
| `apps/api/src/guided-learning/v2/scheduler.ts` | `5ddda1f428cf058aaa3147894a1fec20cd613accf4ac47f7c2450cf20f32823d` |
| `docs/aprendizaje-guiado/v2/policy-spec.md` | `fd7dd4f12a2f34cfcdb1349dc53f70b5720deba69c7aca47727b725a6b388138` |
| `pnpm-lock.yaml` | `bcbdb093fbeb947125f1e7d485da9e0b7573ab1982818790d2d1aa54c2c267ab` |

## Lista acotada para una nueva aceptación

| Reparación/comprobación | Dueño y alcance propuesto | Condición de cierre |
|---|---|---|
| R42-01: bundle portable desactualizado (Q02) | Reabrir integración T003/T005/T006; `packages/contracts/bin/validate-learning-route.bundle.mjs` y prueba de equivalencia focalizada. Regenerar con build/bundle existentes, sin alterar reglas. Esta revisión no modifica ese código. | Backend/CLI/bundle con resultados iguales sobre piloto válido y casos negativos DAG/cobertura/reservas/referencias; ejecución autónoma en carpeta vacía con Node24, sin repo/red; esquema y hashes exactos actualizados. |
| R42-02: V04 y recorrido móvil integral (Q19) | Completar T037/T035: inspección documentada Narrator/NVDA disponible sobre nombres/estados/foco/feedback; verificar flujo §2 en móvil. Los cinco E01/E02/E03/E05/E06 móviles están omitidos en el test actual. | Evidencia de lector real y recorrido móvil de crear/importar/corregir/revisar/publicar/matricular/diagnóstico/práctica/refuerzo/evaluación/repaso/recarga con estado persistido. No exige dispositivo físico si se mantiene el alcance local/emulado; axe y capturas no sustituyen lector. |
| R42-03: expiración real de sesión (Q13/S07) | Completar T036 con Better Auth existente en entorno de prueba aislado; no rehacer autenticación ni tocar producción. | Sesión emitida por implementación real, expiración con reloj controlado si procede, replay mutante por API/BFF 401/403 y cero efectos; documentar emisión/validación y no desactivar seguridad para pasar. |

Estas tres acciones son propuestas de reparación, **no fichas iniciadas ni ampliación implícita de T042**. Solo después de su evidencia se repite T042 y se decide si procede congelar contrato y habilitar T043. No hace falta repetir T041 por omisiones ya resueltas ni pedir otra aprobación editorial del mismo hash intacto. Si cambia contenido/política compartida, sí corresponde revisar su aprobación y repetir las suites afectadas según el handoff.

## Cierre

Verificación documental final: JSON del registro válido; Q01–Q24 únicos con 21 PASS / 1 FAIL / 2 NO VERIFICADO; 74 enlaces locales existentes; 14 hashes de artefactos exactos; cero espacios finales y `git diff --check` exit 0. Los 1064 archivos preservados, las demás entradas de tarea y los campos superiores del registro conservan las huellas iniciales. SHA de HEAD sin cambio. Las comprobaciones se registraron el `2026-10-10T21:28:04.985Z`; esta nota no agrega nuevos resultados funcionales.

No se detectó pérdida de datos ni concesión indebida de dominio en las muestras y pruebas examinadas. El rechazo se basa en un fallo reproducible y evidencia obligatoria ausente, no en intuición. Revisión terminada dentro de sus dos archivos autorizados, sin cambios de código/migraciones, commits, despliegue, publicación productiva o inicio de la skill. Los PASS locales no acreditan eficacia educativa, competencia clínica, staging, producción, dispositivos físicos ni certificación WCAG completa.

Resultado estructurado: entrada `tasks[taskId=T042]` de [registro-ejecucion.json](registro-ejecucion.json), con checks, incidencias, hashes y `nextTaskStarted:false`. Los estados históricos de las demás entradas se conservan; cuando una entrada antigua difiere del dossier posterior, esta acta enlaza la evidencia de cierre y no fabrica un nuevo PASS retrospectivo.
