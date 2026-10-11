# Acta de Hito S — T042

**Decisión actual: aceptación pendiente (NO VERIFICADO). Q01–Q24: 23 PASS locales, 0 FAIL, 1 NO VERIFICADO (Q19).** El contrato permanece sin congelar y T043 sigue bloqueada.

La revisión inicial rechazó el sistema por bundle desactualizado y evidencia ausente. Se conserva íntegra en [acta anterior](evidencias/T042/acta-before-repair.md) y [registro anterior](evidencias/T042/registry-before-repair.json). La petición posterior «puedes hacer lo que hace falta hacer?» autorizó las tres reparaciones concretas; se guardó la [autorización y alcance](evidencias/T042/repair-authorization.json). Las instrucciones del handoff se usan como especificación; no reemplazan la solicitud del usuario ni autorizan iniciar T043 o desplegar.

Base: ef6f541eafa70c5dda03d4547cf48428be767c3d. Runtimes: Node 24.19.0 y pnpm 11.25.0. Revisión actual: 2026-10-10T22:29:14.302Z. Se conserva el trabajo previo de T041. No cambiaron fuentes runtime de API/web, políticas, migraciones, dependencias ni contenido editorial; se regeneró el bundle y se ampliaron tests/harnesses dentro del alcance autorizado.

## Q01–Q24

PASS se limita a la evidencia local señalada. Las filas heredadas conservan su evidencia anterior, releída durante la revisión inicial; las reparaciones añaden pruebas focalizadas. No se simula un lector real a partir de axe o del árbol accesible.

| ID | Estado | Evidencia y conclusión |
|---|---|---|
| Q01 | PASS | [Baseline T001](evidencias/T001/baseline.json), [baseline T040](evidencias/T040/baseline.json) y captura actual arriba: SHA, estado y runtimes registrados. |
| Q02 | PASS | [23 pruebas focalizadas](evidencias/T042/validator-tests.json): backend/CLI/bundle autónomo equivalentes sobre piloto y mutaciones de ciclo, referencia, cobertura y reserva. Bundle regenerado con tooling existente; sin cambios de reglas. |
| Q03 | PASS | [T005](evidencias/T005/result.json) y [T042](evidencias/T042/validator-tests.json): DAG, referencias y cobertura también comprobados en el bundle autónomo actualizado. |
| Q04 | PASS | [Paquete piloto](piloto/vascularizacion-abdomen.koraz-route.json), [validación portable](evidencias/T039/portable-validation.json), [validación vinculada aprobada](evidencias/T039/approved-bound-validation.json): cobertura y reservas del piloto sin incidencias. |
| Q05 | PASS | [T017 P11](evidencias/T017/result.json), [T039 alumno](evidencias/T039/learner-beginner.json): diagnóstico opcional/formativo, sin dominio ni penalización por omitirlo. |
| Q06 | PASS | [T025](evidencias/T025/README.md), [T026](evidencias/T026/README.md), [T035](evidencias/T035/README.md), [T040 casos efectivos](evidencias/T040/counts-and-omissions.json): autoría, serialización, respuesta/corrección/reanudación de ocho kinds; E04 desktop y móvil. No acredita los cinco recorridos móviles omitidos. |
| Q07 | PASS | [T013](evidencias/T013/result.json), [T016](evidencias/T016/result.json), [T018](evidencias/T018/result.json), [E03/T040](evidencias/T040/counts-and-omissions.json): lectura, ayuda, confianza y self-rating excluidos del dominio; práctica formativa permanece separada. |
| Q08 | PASS | [T017 P09](evidencias/T017/result.json), [T035 E03](evidencias/T035/README.md): CORE fallado bloquea descendientes; raíces/rama independiente conservan disponibilidad. Banco agotado no abre gates. |
| Q09 | PASS | [T019 P14/P15](evidencias/T019/result.json), [S03/T036](evidencias/T036/README.md): familias reservadas disjuntas, segmentos y feedback posterior al envío; sin exposición de etapas futuras. |
| Q10 | PASS | [T018](evidencias/T018/result.json), [T036 I04](evidencias/T036/README.md): reloj servidor, respuesta aceptada, fronteras 24 h, replays y conexiones PostgreSQL independientes; agenda y lapses con un efecto. |
| Q11 | PASS | [T016 P10](evidencias/T016/result.json), [T039 alumno](evidencias/T039/learner-beginner.json), [T035 E06](evidencias/T035/README.md): completada/dominada/consolidada y logros históricos separados del estado actual. |
| Q12 | PASS | [T036 navegador](evidencias/T036/playwright.json), [T036 S03](evidencias/T036/README.md), [manifiestos T040](evidencias/T040/manifest-summary.json): JSON/SSR/RSC/DOM/BFF sin claves, rúbricas, polígonos ni preguntas futuras; reveal autorizado después de texto. |
| Q13 | PASS | [API Better Auth real](evidencias/T042/auth-api.json), [BFF Next real](evidencias/T042/auth-bff.json): cookie firmada emitida por createBetterAuthService, firma alterada rechazada, aceptación/replay antes de expirar; expiración persistida con TTL de 2 s y espera temporal, replay API/BFF 401 sin efectos. Solo entorno de prueba, sin credenciales registradas. |
| Q14 | PASS | [T033](evidencias/T033/result.json), [aislamiento piloto](evidencias/T039/preview-isolation.json), [T035 E02](evidencias/T035/README.md): preview completo sin nuevas filas de alumno/events/rewards ni llamadas mutantes del alumno. |
| Q15 | PASS | [T011](evidencias/T011/result.json), [exportación piloto](evidencias/T039/export-check.json): import/export/import conserva hash semántico con bindings/UUID distintos; revisión no exportada como autoridad. |
| Q16 | PASS | [T012 M02](evidencias/T012/result.json), [T036](evidencias/T036/README.md): CAS, aprobación ligada al hash, edición invalida revisión y snapshot/bindings publicados inmutables. |
| Q17 | PASS | [M01 perfil empty](evidencias/M01/result.json), [T034 M03](evidencias/T034/result.json), [T040 legacy](evidencias/T040/counts-and-omissions.json), [T041 M04](evidencias/T041/result.json): v1 preservada, conversión/adopción explícitas sin inventar dominio, intento abierto bloquea upgrade y restauración comprobada. 0005 no se declara aplicada en empty. |
| Q18 | PASS | [T036 I04](evidencias/T036/README.md), [E05 móvil](evidencias/T042/mobile.json): desconexión antes/después de commit, recarga y dos pestañas mantienen un solo efecto. No se rebajaron timeouts ni aserciones. |
| Q19 | **NO VERIFICADO** | [T037](evidencias/T037/README.md) conserva teclado/zoom/axe/árbol. [Móvil E01–E07](evidencias/T042/mobile.json): 7 PASS, cero omisiones. [Escritorio E02/E07](evidencias/T042/desktop.json): 2 PASS. [Inspección humana de Narrator](evidencias/T042/reader-manual/observations.md): nombre/rol de Comenzar y estados confirmados; las confirmaciones de modelo/pista/feedback contradicen el [estado persistido](evidencias/T042/reader-manual/persisted-manual-journey.json), solo study-1 abierto y cero respuestas. No se acredita V04 completo. |
| Q20 | PASS | [T038](evidencias/T038/result.json), [carga T040](evidencias/T040/performance-recheck.txt), [editor grande](evidencias/T040/accessibility-summary.json): 30 unidades/200 objetivos/1600 ítems, 20 corridas; 20 usuarios/300 s/pool20, p95 estado 237.16 ms y respuesta 532.20 ms, cero errores/inconsistencias; manifiestos ≤100 KiB y máximo un formulario. No acredita pool8 ni capacidad de producción. |
| Q21 | PASS | [Acta editorial](piloto/ACTA-REVISION.md), [aprobación humana](piloto/aprobacion-propietario.json): propietario identificado por función aprobó el paquete exacto, 59/59 actividades, caso completo, 3 referencias y 4 fuentes. Derechos C03 no aplica documentadamente: 0 assets en el piloto. Declaración humana; sin cotejo independiente de pasajes de libros por Codex ni validación clínica del software. |
| Q22 | PASS | [T020 A01–A03](evidencias/T020/result.json): eficiencia null sin diagnóstico/minutos, denominadores elegibles/respondieron/ausentes, exposición/modalidad de transferencia, unión de heartbeat y exportación agregada sin causalidad. |
| Q23 | PASS | [T040](evidencias/T040/counts-and-omissions.json) conserva regresión/build de la aplicación. [T042](evidencias/T042/result.json) añade build de contratos, tipos API/web, lint focalizado, validador 23, API auth 1, BFF auth 1, móvil 7 y escritorio 2 PASS. Son suites separadas; no se suman a la regresión histórica ni se cuentan reruns dos veces. Fallos iniciales preservados. |
| Q24 | PASS | [T041](evidencias/T041/result.json), [log SQL](evidencias/T041/recovery-final.txt), [navegador](evidencias/T041/playwright.json): backup/restauración en otra DB, 67 tablas con conteos/hashes/esquema/secuencias, rollback de migración fallida, flags y continuidad v1/v2. 10 comprobaciones SQL y 6 navegador sin omisiones. |

## Reparaciones verificadas

R42-01: el bundle se regeneró con build y bundle:route existentes. Una copia en carpeta temporal ajena al repositorio, con Node24 y sin NODE_PATH ni proxy configurado, produce exactamente el resultado del validador del backend y CLI ordinaria para piloto válido y cuatro paquetes negativos. No hay dependencias externas requeridas por esa copia; no se afirma aislamiento de red mediante firewall. Esquema y reglas permanecen idénticos. La suite focalizada tuvo 23 PASS/0 FAIL.

R42-03: sesión emitida por Better Auth existente, con su verificación real de firma y expiración, contra PostgreSQL desechable. La expiración solo modifica expires_at del usuario creado por el harness: 2 segundos de TTL y espera en la prueba BFF; expiración inmediata en la prueba API. Antes: aceptación y replay 200 idénticos. Después: 401 por API y BFF, fingerprint completo sin cambios en nueve tablas de aprendizaje/recibos. Una cookie falsificada también fue rechazada. No se probaron correo, MFA, proveedor externo o configuración productiva; no se desactivó la verificación de sesión para pasar.

R42-02: los cinco E01/E02/E03/E05/E06 móvil antes omitidos pasaron; E07 recorre la versión corregida y publicada por E02, diagnóstico, práctica, evaluación final, repaso +7 y recarga con estado idéntico. [Manifiestos de sesiones](evidencias/T042/complete-published-journeys.json) confirman diagnostic-1, final-1 y retention7-1 realmente aceptados y evaluación final cerrada. El fixture de una unidad no tiene checkpoint separado. Móvil: 7 PASS/0 omitidos. Escritorio afectado E02/E07: 2 PASS/0 omitidos. El primer E07 leyó un manifiesto antes del commit y quiso responder otra vez; se corrigió la sincronización del test para esperar un nuevo acceptedResponse. También se corrigió el nombre del campo retention7.acceptedAt según el contrato. No cambió código de aprendizaje ni se rebajó una política. El primer BFF interpretó un ISO textual como JSON; se corrigió la lectura del test. Todos los reportes iniciales y el trace móvil se conservan.

Una inspección limitada al selector sugirió incorrectamente que faltaba ofrecer el final; el adaptador HTTP ya lo ofrece en routes.ts. La ampliación solicitada fue autorizada por el usuario, pero no se utilizó: [registro](evidencias/T042/unused-scope-extension.json). Se fortaleció la prueba E07 para comprobar directamente la respuesta reservada del final, sin editar selector ni su test unitario.

La inspección real de Narrator **no pasó**: se inició el lector, pero Computer Use detuvo la inspección por no verificar con suficiente confianza la URL de Edge. No se reintentó por otra automatización de Windows ni se elevaron permisos. Se cerró Edge de prueba; el primer intento de cerrar Narrator devolvió acceso denegado, pero al cierre su proceso ya no estaba en ejecución. El [procedimiento V04](evidencias/T042/reader-manual.md) y un entorno manual están preparados; no se ejecutaron ni constituyen evidencia PASS.

## Identidad, preservación y limpieza

El piloto aprobado conserva SHA de bytes a548d133de45686de4766a2d980a672cc7fe827a7a651cc9935761d62c0e4b75 y hash canónico previamente aprobado d9f35d39a769027998be0eeb17113e89f0e637af0b353c5bd1378ee77a59cf12. No se requiere otra aprobación editorial para ese contenido intacto.

La [comparación de preservación](evidencias/T042/preservation.json) parte de 7522 archivos y registra cambios autorizados; las otras tareas y campos superiores del registro permanecen iguales, sin cambio de HEAD. [Limpieza PostgreSQL](evidencias/T042/cluster-cleanup.json): mismos nombres/OIDs de bases preexistentes, cero bases T042 restantes; cluster iniciado por T042 detenido, directorio preservado. [Puertos](evidencias/T042/services-cleanup.json): servicios de prueba cerrados. Nada de producción fue consultado o modificado.

## Hashes candidatos actuales

accepted:false, frozen:false. Se registra identidad reproducible del candidato actualizado; no hay contrato aprobado para skill. [JSON de hashes](evidencias/T042/candidate-hashes.json).

| Artefacto | SHA-256 de bytes |
|---|---|
| `packages/contracts/src/learning-route-package.ts` | `c142901b0093d8eb26773f9a3300d7e647d8f236b1aae90a0f8f81836116c783` |
| `packages/contracts/src/learning-route-validation.ts` | `c78006a46569f5ec0c15894677ec5038b9034529515b4abcbad45b95b8b2be48` |
| `packages/contracts/src/guided-learning-v2.ts` | `dd5c39d9f7c0b4edde082f678b92adf71884a6a6a4c2c3c4ec048155a9ecc147` |
| `packages/contracts/schemas/koraz-route-2.0.schema.json` | `5c7fe90b97bbe84a476bd311129494aaae1537e1efc3f5c394526c99159bb9d6` |
| `packages/contracts/dist/learning-route-package.js` | `e16518033739080c68a88174561962187b3411d979f0774c2a4d0d0fcf2b799c` |
| `packages/contracts/dist/learning-route-validation.js` | `1789ed9a7707a74bcf8aa20ce7d4800ab86822760de9c36f3f04dc1c3f813146` |
| `packages/contracts/bin/validate-learning-route.mjs` | `fb5875361e9248513151460835384af5affe69d9d260eb6b5dd9a3e4d22eb949` |
| `packages/contracts/bin/validate-learning-route.bundle.mjs` | `de41134aa324cef1b0e2c614ec5b4f236a585017baa083e4437d1e64d465b67d` |
| `apps/api/src/guided-learning/v2/validation.ts` | `769f5fe78cb0f83374c7b9e124704500dafee8bac7a96951a58c2ff8f21454ee` |
| `apps/api/src/guided-learning/v2/service.ts` | `142e06dcc06d1d8784d0c6e65e69e5c859e6341a775e314a6604e4627a0d8ca3` |
| `apps/api/src/guided-learning/v2/policy.ts` | `18412f1df4e78112b27ef71e8759737a7712ca602dbc7969e3de4ce1b7c57180` |
| `apps/api/src/guided-learning/v2/scheduler.ts` | `5ddda1f428cf058aaa3147894a1fec20cd613accf4ac47f7c2450cf20f32823d` |
| `docs/aprendizaje-guiado/v2/policy-spec.md` | `fd7dd4f12a2f34cfcdb1349dc53f70b5720deba69c7aca47727b725a6b388138` |
| `pnpm-lock.yaml` | `bcbdb093fbeb947125f1e7d485da9e0b7573ab1982818790d2d1aa54c2c267ab` |

## Cierre

Tipos API/web y lint focalizado: exit 0. Build de contratos/bundle: exit 0. Tests focalizados: validador 23 PASS, auth API 1 PASS, auth BFF 1 PASS, móvil 7 PASS y escritorio afectado 2 PASS; no se agregan repeticiones a los conteos históricos. La regresión de T040 y recuperación de T041 se conservan; no se repiten globalmente fuentes runtime sin cambios. [Dossier y comandos](evidencias/T042/README.md), [resultado estructurado](evidencias/T042/result.json).

Solo queda V04/Q19: inspección documentada de nombres, estados, foco y feedback con un lector real. Después se repite T042 y se recalculan hashes antes de congelar. Sin ese paso, Hito S no se acepta. No se inició T043, no hubo commit ni despliegue. No se afirma eficacia educativa, competencia clínica, certificación WCAG completa, staging, producción ni dispositivo físico.

## Revisión humana posterior — 2026-10-10T23:11:24.280Z

El entorno manual sí se ejecutó. Se conservan los intentos de automatización bloqueados como historia; la prueba actual proviene del usuario. [Informe humano](evidencias/T042/reader-manual/observations.md): Comenzar y estados PASS; cierre/modelo/feedback NO VERIFICADO por discrepancia con la persistencia. Q19 permanece pendiente, accepted:false/frozen:false y T043 bloqueada. No se inventan frases del lector a partir de sus confirmaciones.

[Limpieza manual](evidencias/T042/reader-manual/cluster-cleanup.json): se recuperó del ECONNREFUSED sin reemplazar el baseline; base sintética temporal atribuida y eliminada, nombres/OIDs previos intactos. Se guarda la sesión antes de eliminarla. El resultado anterior queda en [acta previa a esta inspección](evidencias/T042/acta-before-human-reader.md). Los párrafos sobre lector no ejecutado describen la revisión anterior, conservada; este apartado documenta el estado actual.
