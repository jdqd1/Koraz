# ADR v2 — decisiones cerradas de rutas de aprendizaje Koraz

**Estado:** especificación aceptada para implementación; no acredita runtime v2.  
**Fuente normativa:** `HANDOFF-EJECUTOR.md` §§4, 8 y 9, plan 1.0 del 26/09/2026.  
**Base local:** `774b60d2d0d3bd0bceefe3612a2108f684f01048`.  
**Dependencia:** baseline T001 en `evidencias/T001/baseline.json` (PASS con incidencia de timeout API documentada).

Este ADR materializa decisiones del plan sin cambiar contratos ni parámetros. Los valores de cobertura, umbral, agenda y recompensas son **defaults de producto**, no resultados científicos universales. La validez médica del contenido requiere la revisión editorial indicada para T039.

## Decisiones D01–D17

**Actualización autorizada el 29/09/2026:** la adaptación de v2 debe conservar la
esencia del diseño actual de rutas para alumno y administrador. Aplicar la
[directriz de diseño](DISENO-RUTAS.md) en las tareas de interfaz; las capacidades
del plan se integran en esa base, con mejoras graduales de compatibilidad y uso.

| ID | Decisión normativa | Consecuencia y tarea principal |
|---|---|---|
| D01 | Extender Koraz y reutilizar identidad, catálogo, permisos y shell. | Sin proyecto ni stack nuevo; T003–T034. |
| D02 | `guided-v2` convive con `guided-v1`; nuevas API bajo `/v2`. | Dispatch explícito y regresión v1; T004, T021, T034. |
| D03 | Definición v2 inmutable al publicar, JSON validado en la versión. | Una fuente editorial; tablas v2 solo para ejecución; T007, T009, T012. |
| D04 | DAG de objetivos como estructura pedagógica; unidades agrupan visualmente. | Dependencias topológicas independientes del mapa; T005, T024, T028. |
| D05 | Selección adaptativa determinista en servidor. | Política versionada y reloj inyectable; T017–T019. |
| D06 | Solo evaluación objetiva acredita dominio; rúbrica y autorreporte son formativos. | Verificación objetiva vinculada para objetivos requeridos; T013–T016. |
| D07 | Agenda inicial `[1,3,7,14,30]` días con algoritmo v2 explícito. | Sin algoritmo externo nuevo; T018. |
| D08 | Conservar logros históricos y calcular situación actual aparte. | Mostrar logro previo y necesidad de refuerzo; T016, T018, T028. |
| D09 | Editor de formularios con secuencia e incidencias; grafo como ayuda. | Crear ruta completa por teclado; T023–T027. |
| D10 | Paquete JSON portable con claves locales y bindings al importar. | Dos fases y round trip reproducible; T003, T010–T011. |
| D11 | Fijar fuentes, assets y revisión por versión. | Revalidar acceso y cambios, conservar snapshot; T006, T009, T012. |
| D12 | Ocho familias de renderer y composiciones explícitas. | Sin motor libre de HTML ni nuevo `kind`; T014, T025–T031. |
| D13 | Priorizar recuperación y espaciado; otras técnicas según objetivo. | Evidencia y revisión del piloto; T039. |
| D14 | No copiar dominio v1 a v2. | Conversión preserva historial y reinicia evidencia v2; T034. |
| D15 | Revisión editorial precede publicación; skill no publica. | Importación produce borrador sujeto al workflow; T012, T039, T043–T046. |
| D16 | Fastify es límite de confianza y Kysely accede a PostgreSQL. | Sin credenciales ni Data API en cliente; grants/RLS del runtime; T007–T022. |
| D17 | T042 es la única tarea A programada. | B implementa reglas fijadas; C tareas mecánicas; T042 revisa invariantes. |

## Identificadores, flags y ubicación de implementación

| Elemento | Valor/ubicación fijada | Responsable |
|---|---|---|
| Esquema portable | `schemaVersion="2.0"`; `packages/contracts/schemas/koraz-route-2.0.schema.json` | T003 |
| Política | `policyVersion="guided-v2.0"`; `apps/api/src/guided-learning/v2/policy.ts` | T003, T016 |
| Agenda | `schedulerVersion="scheduler-v2.0"`; `apps/api/src/guided-learning/v2/scheduler.ts` | T018 |
| Contrato portable y validación | `packages/contracts/src/learning-route-package.ts`, `learning-route-validation.ts`; CLI `packages/contracts/bin/validate-learning-route.mjs` | T003, T005–T006 |
| DTO v2 | `packages/contracts/src/guided-learning-v2.ts` | T004 |
| Persistencia | `apps/api/src/providers/postgres-guided-learning-v2.ts`; `apps/api/src/db/database.ts`; nuevas migraciones en `database/migrations/` | T007–T009 |
| API/servicios | `apps/api/src/guided-learning/v2/` | T009–T022 |
| Editor | `apps/web/src/components/learning/editor/v2/` | T023–T027, T033 |
| Alumno | `apps/web/src/components/learning/v2/` | T028–T032 |
| Feature flag | `GUIDED_LEARNING_V2_ENABLED=false` por defecto, impuesto por servidor | T034; dispatch T021 |
| Nuevas matrículas | `GUIDED_LEARNING_V2_NEW_ENROLLMENTS=false` por defecto, impuesto por servidor | T034 |
| Allowlist | IDs de cuentas de prueba en configuración privada; no introduce rol nuevo | T034 |
| Pruebas E2E | `apps/web/playwright.guided-v2.config.ts` con API/DB aisladas | T035 |
| Skill posterior | `tools/skills/crear-rutas-koraz/`, solo después de acta T042 | T043–T046 |

El prefijo de migración observado en T001 es `0029`; T007 debe volver a comprobar el siguiente prefijo libre antes de crear archivos. `supabase/migrations` es histórico. Ninguna política publicada se modifica en el lugar: cambiar significado exige nueva versión y migrador explícito.

## Matriz R → T → prueba

| Requisito | Tareas del plan | Prueba o evidencia principal |
|---|---|---|
| R01 | T023–T033 | E01–E06 |
| R02 | T003, T005, T024 | P01–P03 |
| R03 | T006, T025–T031 | P04, E03 |
| R04 | T017 | P11 |
| R05 | T013–T017, T029–T032 | P05–P07 |
| R06 | T016 | P08–P10 |
| R07 | T018–T019 | P12–P15 |
| R08 | T014, T025–T031 | P04, E04 |
| R09 | T016, T020, T028 | P08–P10 |
| R10 | T019 | P14 |
| R11 | T029 | S03, E03 |
| R12 | T006, T039 | C01–C04 |
| R13 | T003, T010–T012, T043–T045 | I01–I04 |
| R14 | T042–T046 | Acta T042, K01–K05 |
| R15 | T044–T045 | K01–K05 |
| R16 | T007–T022, T034–T036 | S01–S08, M01–M04 |
| R17 | T020 | A01–A03 |
| R18 | Plan, `tareas.json`, este registro | Auditoría de planificación |
| R19 | T041 | Simulacro y runbook §13 |
| R20 | T023–T037 | V01–V05 |

Esta matriz asigna comprobaciones futuras; ninguna fila acredita por sí sola que el requisito esté implementado. El estado ejecutable de cada tarea está en `registro-ejecucion.json`.

## Datos pendientes de §5

| Dato | Tratamiento fijado | Dueño / tarea afectada |
|---|---|---|
| Volumen, datos y versión de producción | No consultados; medir con fixtures. No declarar producción probada. | Propietario/operación; T038, T041–T042 |
| Guía curricular y tema del piloto | Selección por propietario o revisor del catálogo; mientras tanto, fixtures sintéticos. | Propietario/revisor; T039 |
| Derechos de imágenes concretas | `rightsStatus=unverified` bloquea publicación del asset. | Propietario de derechos/revisor; T039 |
| Identidad y disponibilidad del revisor médico | Registrar actor y revisión del hash exacto; modelo no sustituye firma. | Propietario/revisor; T039, T042 |
| Credenciales/entorno staging | Local aislado basta para pruebas técnicas; no usar producción como sustituto. | Operación; T035–T041 |
| Resultado base de tests/build | T001 lo registró: contratos, web, typecheck, lint y build PASS; API 230/231 con timeout y caso aislado PASS. | T001 (cerrada); comparar en T040 |
| Tasas reales de aprendizaje | Instrumentar con denominadores y limitaciones; no prometer eficacia. | Producto/investigación futura; T020, T039 |

## Aceptación documental de T002

T002 verifica correspondencia de D01–D17 y R01–R20 con el handoff, parámetros/enums de `policy-spec.md`, presencia de los 46 nodos y ausencia de ciclos en `tareas.json`, y estado de referencia T001. El acta y comandos están en `evidencias/T002/`; T003 permanece sin iniciar.
