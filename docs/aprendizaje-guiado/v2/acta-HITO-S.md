# Acta de Hito S — T042

**Decisión actual: aceptación provisional de implementación con excepción expresa del usuario. T042: PASS en el alcance ajustado; 23 criterios PASS, Q19 NO VERIFICADO y aplazado.** No se declara el Hito S original 24/24 ni accesibilidad completa. T043 puede continuar con este contrato y esta excepción; todavía no se inició.

El usuario pidió literalmente: «por ahora la accesibilidad no me importa, salta esa parte del narrador, me interesa mas la implementacion del sistema de rutas». Su instrucción cambia temporalmente el requisito de lector del handoff para priorizar implementación de rutas. [Autorización, alcance y límites](evidencias/T042/reader-deferral.json). No se marca Q19 PASS ni se eliminan resultados anteriores. El desacuerdo entre el informe humano y la sesión persistida permanece abierto dentro de esa inspección aplazada; no invalida ni sustituye las pruebas HTTP/browser automatizadas existentes.

Base: ef6f541eafa70c5dda03d4547cf48428be767c3d. Revisión: 2026-10-10T23:16:05.377Z. Schema 2.0, policy guided-v2.0, scheduler scheduler-v2.0. Identidad del contrato verificada nuevamente antes de congelar. [Resultado](evidencias/T042/result.json), [manifest de contrato congelado](evidencias/T042/accepted-contract-hashes.json).

## Criterios y evidencia

El criterio original y su resultado permanecen visibles. El alcance requerido actual contiene 23 criterios satisfechos y una excepción temporal; los conteos históricos de tests no se suman ni se convierten en otra ejecución.

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
| Q19 | **NO VERIFICADO — aplazado por el usuario** | [Excepción expresa](evidencias/T042/reader-deferral.json). Se conserva teclado/móvil/zoom/axe y la [inspección humana parcial](evidencias/T042/reader-manual/observations.md), incluida la discrepancia de persistencia. V04 deja de bloquear la continuación de implementación; no se declara superado. |
| Q20 | PASS | [T038](evidencias/T038/result.json), [carga T040](evidencias/T040/performance-recheck.txt), [editor grande](evidencias/T040/accessibility-summary.json): 30 unidades/200 objetivos/1600 ítems, 20 corridas; 20 usuarios/300 s/pool20, p95 estado 237.16 ms y respuesta 532.20 ms, cero errores/inconsistencias; manifiestos ≤100 KiB y máximo un formulario. No acredita pool8 ni capacidad de producción. |
| Q21 | PASS | [Acta editorial](piloto/ACTA-REVISION.md), [aprobación humana](piloto/aprobacion-propietario.json): propietario identificado por función aprobó el paquete exacto, 59/59 actividades, caso completo, 3 referencias y 4 fuentes. Derechos C03 no aplica documentadamente: 0 assets en el piloto. Declaración humana; sin cotejo independiente de pasajes de libros por Codex ni validación clínica del software. |
| Q22 | PASS | [T020 A01–A03](evidencias/T020/result.json): eficiencia null sin diagnóstico/minutos, denominadores elegibles/respondieron/ausentes, exposición/modalidad de transferencia, unión de heartbeat y exportación agregada sin causalidad. |
| Q23 | PASS | [T040](evidencias/T040/counts-and-omissions.json) conserva regresión/build de la aplicación. [T042](evidencias/T042/result.json) añade build de contratos, tipos API/web, lint focalizado, validador 23, API auth 1, BFF auth 1, móvil 7 y escritorio 2 PASS. Son suites separadas; no se suman a la regresión histórica ni se cuentan reruns dos veces. Fallos iniciales preservados. |
| Q24 | PASS | [T041](evidencias/T041/result.json), [log SQL](evidencias/T041/recovery-final.txt), [navegador](evidencias/T041/playwright.json): backup/restauración en otra DB, 67 tablas con conteos/hashes/esquema/secuencias, rollback de migración fallida, flags y continuidad v1/v2. 10 comprobaciones SQL y 6 navegador sin omisiones. |

## Contrato congelado para la implementación

accepted:true, frozen:true, acceptanceKind:provisional_implementation_with_user_exception. La excepción debe acompañar el contrato en cualquier trabajo posterior; no habilita afirmaciones de accesibilidad completa o del Hito S original sin reservas. Se conservan las mismas reglas, versiones y fuentes runtime.

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

## Preservación y límites

[Acta antes del aplazamiento](evidencias/T042/acta-before-reader-deferral.md), [resultado anterior](evidencias/T042/result-before-reader-deferral.json) y [registro anterior](evidencias/T042/registry-before-reader-deferral.json) conservan el rechazo y la discrepancia. La revisión inicial y fallos de pruebas anteriores siguen preservados en el dossier. Las reparaciones de bundle, equivalencia backend/CLI, móvil y autenticación permanecen verificadas; no se reescribió su evidencia.

El contenido piloto y su aprobación editorial quedan intactos. [Limpieza de sesión manual](evidencias/T042/reader-manual/cluster-cleanup.json) y [servicios detenidos](evidencias/T042/reader-manual/services-cleanup.json). [Preservación del workspace](evidencias/T042/preservation.json). No se modificaron runtime, políticas, dependencias ni otras tareas en esta decisión. No hubo despliegue o commit. No se afirma producción, eficacia educativa, competencia clínica, dispositivo físico ni certificación WCAG completa.

El siguiente paso disponible es T043, empaquetado de este contrato con su excepción. T043 y la skill no fueron iniciados por este cierre.
