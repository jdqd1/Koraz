# T017 — PASS

Se verificaron los PASS de T016 y T005 antes de implementar. Los cuatro hashes de fuentes de T016 coinciden con su result.json. La implementación se limita a selection.ts, su exportación desde service.ts, las pruebas de selección y esta carpeta de evidencia.

## Comportamiento comprobado

- P03: desempate topológico/editorial estable; dos raíces y una rama opcional siguen disponibles por separado. Una elección explícita de rama conserva su acceso aunque haya remediación en otra.
- P09: falta de dominio CORE bloquea descendientes aunque la puntuación sea 90; fallo opcional no cierra un gate demostrado. Agotar variantes no cambia evidencia, gates ni disponibilidad.
- P11: diagnóstico opcional raíz/CORE con hasta ocho familias distintas y advertencia de cobertura insuficiente; correcto ofrece comprobar únicamente ese objetivo. Incorrecto, no evaluado u omitido conserva explicación, ejemplo, parcial e independiente. El diagnóstico no concede dominio ni reduce avance.
- nextAction: intento abierto → remediación CORE de la rama elegida → retención vencida → lote de hasta diez objetivos de repaso → gate/checkpoint → actividad inicial. Las alternativas de ramas permanecen accesibles sin vaciar la cola de repaso.
- Remediación específica: confusión y referencias fuente, ejemplo y verificación editorial. También se ofrecen remediaciones de errores críticos en objetivos opcionales sin cerrar otras ramas. Se excluyen reservas final/retención y actividades autorreportadas de las comprobaciones objetivas.
- Dos fallos consecutivos ofrecen explicación reforzada; el tercer fallo corresponde al segundo reintento y ofrece pausa/otra rama/repaso posterior. Solo cuentan respuestas aceptadas de los intentos de la sesión autorizada; repetición semántica, diagnóstico, preview e inválidos no agotan reintentos.
- Agotamiento explícito del banco, incidencia para el editor y próxima fecha UTC cuando existe. Se respeta reutilización a las 24 horas desde la última respuesta o revelado; la misma familia del error también espera 24 horas. Si falta banco editorial, la fecha queda null y no se inventa una variante.
- La selección devuelve claves, razones y opciones de soporte; no incluye soluciones, rúbricas privadas ni payloads reservados. Es pura sobre el snapshot y el reloj inyectado.

## Verificación

Node 24.19.0; contratos compilados antes de verificar. Suite final: **70 PASS, 12 SKIPPED**, en cuatro archivos (29 selección, 28 evidencia, 6 grafo, 7 intentos). Typecheck y lint de API: PASS. Consultar tests.txt, contracts-build.txt, typecheck.txt y lint.txt.

Los 12 SKIPPED pertenecen a concurrencia PostgreSQL con conexiones independientes: no se proporcionó KORAZ_T015_TEST_DATABASE_URL en esta ejecución. No son pruebas de selección T017. Su PASS anterior está documentado en T015/T016; aquí no se afirma una nueva ejecución PostgreSQL real.

## Límites y handoff

El consumidor debe construir el snapshot autorizado de la versión matriculada y su evidencia al mismo instante del reloj, con IDs de sesión, intentos abiertos y dispensaciones verificadas en servidor. Este selector no autoriza peticiones HTTP ni acepta contadores del cliente. Las colas y fechas de review/retention se reciben del scheduler; no se calculan ni persisten en T017.

La incidencia y las opciones de pausa son descriptores de salida para la integración posterior, no nuevas tablas ni notificaciones. El alta de dispensaciones necesita registrar su motivo y política en la integración posterior; aquí solo se consumen dispensaciones autorizadas. La integración HTTP y UI corresponde a tareas posteriores.

No se han modificado v1, el banco real, LLM, esquema ni interfaz. Sigue vigente DISENO-RUTAS.md: adaptar el nuevo sistema al diseño actual de rutas. Se preservaron los cambios concurrentes de frontend presentes al cierre.

T018 no iniciada. No hay verificación de suite global, navegador, staging ni producción en esta tarea.
