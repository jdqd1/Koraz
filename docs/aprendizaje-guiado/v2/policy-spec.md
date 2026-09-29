# Especificación normativa de política v2

**Fuente:** `HANDOFF-EJECUTOR.md` §8.1–8.14, plan 1.0. **Estado:** contrato documental de T002; runtime y pruebas v2 pendientes. Los umbrales, tamaños de banco, calendario y XP son decisiones de producto versionadas, no constantes científicas universales. Se implementarán y comprobarán en las tareas señaladas.

## Versiones, archivo portable y límites

| Campo o límite | Valor exacto | Tarea / comprobación |
|---|---|---|
| `schemaVersion` | `"2.0"` | T003; Q02 |
| `policyVersion` | `"guided-v2.0"` | T003, T016; Q02 |
| `schedulerVersion` | `"scheduler-v2.0"` | T018; P12–P13 |
| Archivo | JSON UTF-8, un `.koraz-route.json`, máximo **10 MiB**, sin binarios ni código ejecutable | T003, T010; S05 |
| Clave local | `[a-z0-9]+(?:-[a-z0-9]+)*`, longitud 1–120; única por colección; referencias por clave local | T003, T005; P02 |
| `revision` | entero ≥1 | T003, T010–T011; I03 |
| Texto básico | `title` 1–200; `summary` 1–2000; `topicLabel/audience` 1–240 | T003 |
| `slug` | Patrón y límite ya fijados en v1; reutilizarlos sin inventar un segundo formato | T003 |
| Máximos | 30 unidades, 200 objetivos, 2000 actividades, 200 fuentes, 500 assets, 200 evaluaciones | T003; L01 |
| Fuente | `excerpt` ≤10000 caracteres; `documentSha256` hex64 | T003, T006; C01–C02 |
| Unidad | `estimatedMinutes` null o 1–600; es estimación editorial, no duración obligatoria | T003, T024 |
| Hint | 0–3 pistas por actividad | T003, T029 |
| CLI | 0 válido estructural; 1 inválido; 2 IO/versión; `--publish` requiere `publishable=true` | T003; Q02 |

La estructura es Zod estricta y JSON Schema 2020-12 generado del mismo contrato. `structural-valid` permite guardar borrador; `publishable` portable solo verifica reglas editoriales internas y nunca concede permiso para publicar. Scope `bound` en servidor comprueba catálogo, actor, medios y revisión.

## Enums cerrados

| Campo | Valores permitidos |
|---|---|
| `locale` | `es` |
| `discipline` | `anatomy`, `histology`, `embryology`, `physiology`, `biochemistry`, `pharmacology`, `pathology`, `clinical`, `general` |
| `Source.kind` | `guide`, `reference` |
| `Source.verification` | `provided`, `verified`, `unverified` |
| `Asset.mediaType` | `image`, `video` |
| `Asset.rightsStatus` | `owned`, `licensed`, `public_domain`, `unverified` |
| `Objective.verb` | `identify`, `recall`, `relate`, `differentiate`, `explain`, `predict`, `order`, `apply`, `integrate` |
| `Objective.criticality` | `core`, `high_yield`, `supporting`, `detail` |
| `Unit.support` | `full`, `standard` |
| `Activity.phase` | `activate`, `learn`, `retrieve`, `elaborate`, `apply`, `remediate` |
| `Activity.kind` | `study`, `single_choice`, `short_answer`, `constructed_response`, `match`, `image_target`, `sequence`, `case` |
| `Activity.representation` | `text`, `image`, `table`, `diagram`, `case`, `video` |
| `Activity.use` | `learning`, `diagnostic`, `gate`, `final`, `retention7`, `retention30` |
| `Assessment.kind` | `diagnostic`, `unit_gate`, `checkpoint`, `final`, `retention7`, `retention30` |
| `EditorialIssue.severity` | `error`, `warning` |
| `study.scaffold` | `explanation`, `worked_example`, `partial_example` |
| `short_answer.normalization` | `nfkc-lower-space` |
| `constructed_response.selfRating` | `again`, `hard`, `good` |
| `match.presentation` | `pairs`, `comparison_table`, `causal_map` |
| `image_target.mode` | `hotspot`, `labeling` |
| `image_target.masking` | `all_labels`, `partial_labels`, `no_labels` |
| `confidence` | `sure`, `unsure`, `guessed`, `null` |
| `gradingSource` | `server`, `self`, `none` |
| `learning_v2_bindings.kind` | `source`, `asset`, `topic` |
| Intento `target.kind` | `activity`, `assessment`, `review` |
| Ayuda `kind` | `hint`, `source`, `reveal` |

Eventos semánticos mínimos: `route_started`, `diagnostic_submitted`, `activity_presented`, `response_accepted`, `help_requested`, `feedback_viewed`, `gate_passed`, `remediation_started`, `review_scheduled`, `review_completed`, `final_submitted`, `retention_submitted`, `route_completed`, `route_mastered`, `route_consolidated`. Cada uno usa clave semántica única y reloj servidor; analítica no guarda textos clínicos libres completos.

`coverKey` usa el enum de portadas existente; T003 debe tomarlo del contrato actual, no inventar otro. Todos los campos de entidades enumerados en §8.2 son obligatorios salvo los `null` u opcionales allí indicados. `core` exige `required=true`.

## Ocho familias de actividad

| Familia | Restricción de payload/respuesta | Acreditación |
|---|---|---|
| `study` | Cuerpo, offsets válidos de enfoque, asset opcional, scaffold y rango de video opcional; respuesta `{acknowledged:true}`. | Solo completitud. |
| `single_choice` | 2–6 opciones, una correcta, feedback por distractor; `{optionKey}`. | 1/0 servidor. |
| `short_answer` | 1–30 alias, `maxChars` 1–500, respuesta modelo; `{text}`. NFKC, trim, minúsculas es y espacios colapsados; coincidencia completa. | 1/0 servidor; sin stemming, distancia ni quitar acentos, negación o unidades. |
| `constructed_response` | Rúbrica 1–8 criterios, texto 1–4000, reveal y autorreporte; verificación objetiva vinculada si objetivo requerido. | Formativa; nunca dominio directo. |
| `match` | Pares, tabla o mapa; pares completos, `allowReuse`, aristas solo para mapa. | Score parcial para feedback; evidencia solo con 1 completo. |
| `image_target` | Hotspot/etiquetado con polígono normalizado [0,1], alternativa accesible y masking. | Evaluación solo con `no_labels`; solución geométrica privada. |
| `sequence` | 3–12 ítems, 1–5 órdenes aceptados; respuesta es permutación exacta sin duplicados. | 1/0; explicación posterior separada. |
| `case` | 2–6 etapas con hijo no-case. | Wrapper no puntúa; hijos responden por separado y se entregan por etapa. |

Polígono válido: ≥3 puntos distintos, área >0, sin autointersección; borde incluido con ray casting y epsilon `1e-6` en coordenadas normalizadas. `match`, `sequence` e `image_target` pueden dar feedback parcial pero solo score 1 completo crea evidencia binaria. Tarjetas son presentación breve de `constructed_response`; comparaciones, micro-mapas, predicción y detección de errores se componen con estas ocho familias. Ninguna respuesta futura, rúbrica privada, reserva o polígono solución viaja en manifiesto público antes de autorizarlo.

## Validación y cobertura para publicar

| Regla | Valor o condición | Tarea / prueba |
|---|---|---|
| Base | ≥1 unidad y ≥1 objetivo requerido `core`; claves y referencias válidas, DAG sin ciclos | T005; P01–P03 |
| Orden DAG | Kahn; desempate por orden de unidad, objetivo y clave | T005; P03 |
| Ciclo por objetivo | Fragmento fuente; ≥1 explicación, ≥1 recuperación sin ayuda, ≥1 elaboración/conexión y ≥1 aplicación | T006; P04 |
| Objetivo requerido | **5 ítems objetivos** de aprendizaje/gate de familias distintas: ≥2 recuperación y ≥1 aplicación de representación diferente; **3 reservas disjuntas** `final`, `retention7`, `retention30`; total mínimo 8 familias sin diagnóstico | T006; P04 |
| Objetivo opcional | ≥1 recuperación y ≥1 aplicación; no afecta dominio global | T006 |
| Equivalencia | Mismo `equivalenceKey` cuenta una familia | T006, T016; P08 |
| `core` | Gate, error crítico identificable cuando corresponda, remediación y verificación resolubles; no se compensa con promedio | T006, T016; P09 |
| Umbral | `Assessment.thresholdPercent` entero 80–100; default **80** con `thresholdRationale` de 40–2000 caracteres. Diagnóstico guarda 80 como campo no operativo. | T006, T016 |
| Gate/checkpoint | Gate por unidad; checkpoint cada 3 unidades y para remanente ≥2; ruta de 1 unidad usa final sin checkpoint separado | T006, T019; P14 |
| Diagnóstico | 4–8 ítems de raíces y CORE representativos, o todos los disponibles si hay <4 objetivos con advertencia | T017; P11 |
| Casos | No anidar; hijos existentes, una vez en secuencia y no lanzados fuera salvo remediación explícita | T006, T014 |
| Imágenes | Obligatorias para `identify` en anatomía/histología cuando se evalúa reconocimiento espacial; falta produce `ASSET_REQUIRED` | T006; C03 |
| Revisión | Cubre hash exacto; editar invalida aprobación; servidor revalida en transacción | T012; M02 |

Errores estables: `SCHEMA_UNSUPPORTED`, `DUPLICATE_KEY`, `REFERENCE_MISSING`, `DAG_CYCLE`, `OBJECTIVE_COVERAGE`, `BANK_TOO_SMALL`, `RESERVE_LEAK`, `CRITICAL_GATE_MISSING`, `SOURCE_UNRESOLVED`, `SOURCE_CHANGED`, `ASSET_REQUIRED`, `ASSET_RIGHTS`, `ANSWER_INVALID`, `REVIEW_STALE`, `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `ACCESS_REVOKED`. Cada incidencia lleva JSON pointer, explicación en español y corrección sugerida. Fuentes `unverified`, derechos `unverified`, citas rotas o datos clínicos sin fuente impiden publicar hasta revisión.

## Evidencia, dominio y estados

- Elegible: corrección binaria del servidor, sin ayuda, fuera de diagnóstico/preview, intento válido y uso autorizado. Primera respuesta de una familia elegible; otra respuesta de la misma familia solo genera evidencia nueva tras ≥24 h desde la última respuesta o revelado. Receipt y deduplicación semántica impiden doble efecto.
- Ventana vigente: hasta **5** respuestas elegibles más recientes por objetivo, una por `equivalenceKey` (la última), empate por event ID. `objectiveScore=100*correctas/total`, sin redondear para decidir; sin respuestas es `null`.
- `mastered`: ≥3 familias en ventana, score ≥umbral de gate, ≥2 recuperaciones correctas de familias distintas, ≥1 aplicación correcta en representación distinta a explicación, ningún error crítico abierto y respuesta elegible más reciente correcta.
- Error crítico: solo mapping editorial de respuesta incorrecta; se cierra con remediación completada y verificación objetiva de otra familia o de la misma tras ≥24 h. Autorreporte fallido da refuerzo, no altera por sí solo medida objetiva.
- Estado UI por objetivo: `Reforzar` si error crítico abierto o fallo elegible posterior al último dominio; `Dominado` si cumple; `Aprendiendo` si hubo interacción; `Nuevo` si no. Chips `Con apoyo`, `Aplicación demostrada`, `Repaso pendiente` cuando procedan. Conservar `firstMasteredAt` y `firstConsolidatedAt` históricos.
- Gate de unidad: todos los `core` de esa unidad mastered, promedio simple de score de objetivos requeridos ≥threshold (faltante=0) y sin error crítico abierto. Pesos 4/3/2/1 por criticidad **solo** para prioridad de selección. Ramas independientes continúan disponibles.
- Progreso: actividades iniciales requeridas completadas / planificadas; las dispensadas tienen contador aparte; ni repaso infinito ni diagnóstico optativo entran. Quiz fallido puede contar como completitud, no como dominio.
- `completed`: todas las actividades iniciales requeridas realizadas/dispensadas y final enviado. `mastered`: todos los objetivos requeridos mastered, final objetivo ≥threshold y sin errores críticos. `consolidated`: esos objetivos conservan dominio y dos recuperaciones objetivas correctas, una ≥7 días y otra ≥30 días desde primer dominio, separadas ≥7 días y en familias diferentes. Mostrar logros históricos aun si el estado actual requiere refuerzo.

## Selección, agenda y evaluación

- Diagnóstico inicial optativo; correcto ofrece ir a comprobación, sin conceder dominio ni saltar gate. Incorrecto/omitido da soporte full. Un gate demostrado permite dispensar explicación con razón/política registradas.
- `nextAction`: reanudar intento abierto → remediar CORE bloqueante de rama seleccionada → evaluación diferida vencida → hasta 10 repasos vencidos → gate/checkpoint disponible → siguiente actividad inicial topológica/editorial. Selección de repaso: error crítico, vencimiento más antiguo, criticidad 4/3/2/1, posición y clave. Intercalar solo objetivos ya introducidos del mismo `comparisonGroup`.
- Tras 2 fallos consecutivos de sesión en un objetivo, explicación reforzada; tras 2 reintentos, pausa/otra rama/repaso posterior. Banco agotado se muestra, no desbloquea ni genera preguntas.
- Agenda por `(userId,pathVersionId,objectiveKey)`, `stage` 0–4, intervalos `[1,3,7,14,30]` días UTC. Primera recuperación/aplicación crea deuda antes de completar ruta. Fallo objetivo o `again`: +10 min en primeros 2 reintentos de sesión y después +1 día, stage 0, lapses +1 una vez. Ayuda/parcial o `hard/good`: +1 día sin aumentar stage. Acierto objetivo sin ayuda: +intervalo del stage actual y `min(stage+1,4)`, máximo una ampliación por 24 h. Segunda correcta antes de 24 h conserva agenda. Vencimiento tardío se calcula desde aceptación real; ausencia no es fallo. Fallo de la sesión prevalece sobre aciertos posteriores antes de 24 h.
- Retención reservada: primer dominio +7 y +30 días; segunda fecha no antes de `max(primerDominio+30d, primeraRetencionAceptada+7d)`. No usar reloj del cliente para decidir 24 h.
- Checkpoint: hasta 10 preguntas por segmento, prioridad CORE sin evidencia/errores y rotación, aproximadamente mitad reciente/anterior si existen. Más objetivos → segmentos hasta cubrir todos. Final: 1 reserva por objetivo requerido, segmentos de 10, macro-promedio por objetivo, omisión 0. Corrección de segmento después de enviarlo; reservas futuras privadas.

## Métricas, recompensas, API y experiencia

**Diseño aprobado (29/09/2026):** adaptar el nuevo sistema a la interfaz actual
de rutas y conservar su esencia. Se permiten elementos nuevos y mejoras de
compatibilidad, modernidad, claridad y facilidad de uso para alumno y
administrador. La [directriz de diseño](DISENO-RUTAS.md) prevalece sobre
propuestas visuales anteriores; no cambia reglas pedagógicas ni parámetros.

- Inmediato: primer final, incluyendo omitidas, con N matriculados/evaluados. Retención7: primer test días 7–14; Retención30: días 30–45; tardíos aparte con N elegibles/respondieron y días reales. Transferencia: primer intento objetivo, sin ayuda, representación nueva y `novelAtPresentation=true`. Eficiencia descriptiva `(final−diagnóstico comparable)/minutos activos`; null si diagnóstico omitido o tiempo 0. Heartbeat cada 30 s, pestaña visible e interacción en últimos 60 s; unir intervalos entre dispositivos. Finalización, dominio y consolidación se informan por separado, sin inferencia causal.
- XP v2: 0 por abrir/leer/ayuda; +5 primera recuperación objetiva correcta por objetivo (`v2_objective_recalled`), +10 primer dominio (`v2_objective_mastered`), +15 primera consolidación (`v2_objective_consolidated`). Clave única `(user,pathVersion,objective,eventKind)`. No reinterpretar ni restar XP v1.
- Mutaciones HTTP: `Idempotency-Key: UUID`; edición existente además `expectedVersion`; respuestas devuelven estado confirmado. Importación validate máx. 10/10 min por actor, preview 30/10 min, respuestas 120/min con reenvío idempotente. Sesión de importación 24 h. HTTP 400 estructura, 401 sesión, 403 capacidad, 404 recurso, 409 versión/estado/idempotencia, 413 tamaño, 422 pedagogía, 429 límite, 503 proveedor. `Cache-Control: private, no-store` en usuario/manifiestos.
- Flags servidor: `GUIDED_LEARNING_V2_ENABLED=false`, `GUIDED_LEARNING_V2_NEW_ENROLLMENTS=false`; allowlist privada para prueba. v1 sigue predeterminada. Fuente de versión es matrícula fijada; upgrade v1→v2 no importa dominio. Editor con 5 secciones: Datos y fuentes, Objetivos, Recorrido, Evaluación y repaso, Revisión.
- Accesibilidad a verificar en 360×800, 390×844, 768×1024, 1440×900 y zoom 200 %; teclado, foco, live feedback, alternativa a arrastre, imagen con alt sin solución y geometría sobre imagen real.

## Tabla de aceptación documental T002

| Comprobación | Evidencia requerida | Estado en T002 |
|---|---|---|
| Números, versiones y enums coinciden con §8 | Comparación de esta tabla con handoff | `evidencias/T002/` |
| D01–D17 y R01–R20 trazadas | `ADR-v2.md` y `registro-ejecucion.json` | `evidencias/T002/` |
| DAG de 46 tareas sin ciclo | Parseo de `tareas.json` y orden topológico | `evidencias/T002/` |
| Pruebas de referencia identificadas | `evidencias/T001/baseline.json` y logs originales | `evidencias/T002/` |

Las pruebas P/I/S/M/E/V/C/A/L/K y la aceptación Q02–Q28 siguen pendientes de sus tareas. Esta tabla solo acepta la fidelidad documental de T002.
