# T025 — Formularios de estudio, elección y recuperación

**PASS de los criterios locales de T025, 02/10/2026.** Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`. Se crearon y guardaron study, single_choice, short_answer y constructed_response; se verificó su lectura y recarga. La tarjeta utiliza la presentación de respuesta construida. E01 permanece parcial; T026 no se inició. Sin commit ni despliegue.

La solicitud de continuación se interpretó como la siguiente ficha tras el cierre PASS de T024. El handoff describe la especificación de T025; no autoriza ejecutar automáticamente las tareas restantes. Se comprobaron las evidencias PASS de T006, T013 y T024 antes de trabajar.

## Implementación y alcance

- Creación por tipo y objetivo con nombres. Cada actividad queda incorporada en la unidad de su objetivo. Moverla conserva la coherencia de esa pertenencia.
- Campos comunes: consigna, objetivo, fase, requerido, fuentes y organización opcional: representación, uso/reserva, familia de variantes, pistas, alternativa y objetivos relacionados.
- Estudio: contenido propio, señales sobre selección de texto y apoyo de explicación/ejemplo. Editar el texto retira las señales con aviso visible. No se convierte una explicación en respuesta correcta.
- Elección: opciones, solución y explicación obligatoria de cada distractor. Cambiar la opción correcta exige feedback para la opción que antes era correcta. Las fuentes del feedback también fundamentan los distractores.
- Respuesta breve: modelo, variantes explícitas y límite de caracteres; se conserva la normalización vigente, incluyendo negación, acentos y unidades.
- Respuesta construida/tarjeta: frente, modelo/reverso, criterios y ejemplos de rúbrica, verificación objetiva por nombre del mismo objetivo. Solo se ofrecen verificaciones de aprendizaje o gate; imagen únicamente con no_labels. Se excluyen diagnóstico, reservas y autoevaluación.
- Soluciones y feedback en un detalle editorial separado. Se informa expresamente que la autoevaluación es formativa y no acredita dominio. El DTO público existente mantiene privadas las soluciones, aliases y rúbrica.
- Validación por objetivo con el validador compartido. Errores estructurales de actividad bloquean guardar y enfocan el campo; los pendientes de cobertura/publicación permiten conservar un borrador estructuralmente válido.
- Eliminación con diálogo y protección de referencias desde evaluaciones, errores del objetivo y actividades. La eliminación permitida limpia la unidad y devuelve el foco a Añadir actividad.

Se reutilizan componentes y CSS actuales. Las cuatro familias de T026 se muestran y conservan, sin añadir sus formularios. No se modificaron grading, contratos ni UI v1.

La conexión mínima en `editor/v2/editor-shell.tsx` reutiliza la autorización anterior del usuario: «Sí, incluir la conexión mínima en el shell». Su aplicación a esta continuación es una interpretación limitada al montaje de los formularios y foco/guardado de sus incidencias; no es una autorización nueva. El catálogo autorizado en T024 se consume sin modificarlo. `source-hashes.json` registra **7 fuentes**; las comparaciones de preservación confirman que T024 no cambió fuera de shell/CSS y que el resto de T023 permanece intacto.

Las tarjetas no agregan un noveno kind ni campos portables: son constructed_response en fase retrieve, con los mismos campos de rúbrica, modelo y verificación. Este cierre acredita su autoría editorial; no acredita el renderer del alumno de las fichas posteriores.

## Comprobaciones finales

Runtime instalado: Node 24.19.0, pnpm 11.19.0. No se instalaron ni actualizaron dependencias.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Build de contratos | PASS, exit 0 | `contracts-build.txt` |
| Editor v2 sobre fuente final | PASS, **5 archivos / 49 pruebas**, incluidas 13 nuevas | `web-focused-final.txt` |
| Suite web completa sobre fuente final | PASS, **47 archivos / 310 pruebas** | `web-suite-final.txt` |
| Typecheck web | PASS, exit 0 | `web-typecheck-final.txt` |
| ESLint de fuentes TS/TSX afectadas | PASS, exit 0, cero warnings | `web-lint-final.txt` |
| HTTP real con almacenamiento aislado | PASS, **1 prueba** | `http-integration.txt`, `http-integration.test.ts` |
| UI → Next/BFF → Fastify/provider/PGlite | PASS para creación, edición, guardado, recarga y eliminación descritos | `browser-checks.json`, `ui-storage-checks.json` y snapshots |
| Geometría adaptable y foco móvil | PASS en los tamaños indicados | `browser-geometry.json`, `mobile-focus.json` |
| Preservación, hashes y diff | PASS | `t024-preservation.json`, `t023-preservation.json`, `closure-verification.json` |

Las pruebas nuevas cubren los cinco presets, serialización/JSON/contrato exactos, borradores incompletos sin contenido inventado, pertenencia de unidad, cambio de opción correcta, feedback y fuentes, filtros de verificación, privacidad del DTO, referencias de eliminación y etiquetas editoriales/formativas. No se suman las pruebas focalizadas a la suite completa.

El harness usa exclusivamente loopback e instancia PGlite en memoria, con identidad sintética. El test HTTP crea el borrador, añade los cinco presets, guarda, lee exactamente el paquete/bindings, verifica CAS/replay y preservación local ante conflicto. Su duración incluye la retención opcional para QA manual; no mide rendimiento.

## Navegador y persistencia

Se verificó la página editorial real en `127.0.0.1:3105`, usando su BFF y Fastify/provider en `127.0.0.1:4105`. La identidad y los endpoints `/__test/state/:id` y `/__test/stop` pertenecen solo al harness. Los snapshots se consultaron al provider y no se dedujeron del texto de la pantalla.

1. Navegación por pestañas con flechas/Enter. Añadir una actividad abre su detalle y enfoca la consigna.
2. Se crearon los cuatro tipos desde UI. El estudio incorporó una señal mediante selección con teclado. La breve guardó los aliases «no es igual» y «5 mm», fase apply, representación table y pista. La construida vinculó la elección nueva por nombre.
3. Un feedback general vacío enfocó `package.activities.13.feedback.explanation`; una explicación de distractor vacía enfocó `package.activities.14.payload.distractorFeedback.opcion-2`, con aria-invalid. Los datos incompletos no fueron guardados. Se corrigieron y guardaron.
4. Revisión 4: 17 actividades, incluidas las cuatro nuevas. La recarga conservó la revisión y sus datos; las 13 anteriores permanecieron idénticas (`storage-after-four-ui-created.json`).
5. La tarjeta nueva quedó guardada en revisión 5 como constructed_response/retrieve con solo rubric, modelAnswer y verificationActivityKey en payload (`storage-card-created.json`). Se probaron confirmación y eliminación por teclado.
6. La primera eliminación perdió el foco por la restauración del diálogo. Se corrigió mediante onCloseAutoFocus y se repitió con una actividad temporal. El foco volvió a Añadir actividad (`delete-focus.json`). Revisión final 7: 17 actividades, sin tarjeta temporal ni referencias rotas (`storage-final.json`).
7. Tamaños 360×800, 390×844, 768×1024, 1440×900 y 720×450: sin overflow horizontal del documento ni campos fuera del ancho. El último selector de verificación móvil está visible sobre la barra de guardado. 720×450 acredita reflow equivalente a 200 %, no zoom nativo.

Capturas: `card-desktop.png`, `card-mobile.png`, `distractor-pending.png` y `journey-final.png`. Las capturas de tarjeta preceden a la corrección de retorno del foco, que no modifica el diseño.

Se corrigieron dos incidencias de herramienta sin cambios de producto: los summary nativos se operaron por su locator tras no coincidir con button; la retirada de cookie por domain fue rechazada y se completó por URL. Se retiró la cookie sintética, se restableció el viewport, se cerró la pestaña temporal y se detuvieron ambos servidores. Sin listeners en los puertos de prueba al cerrar.

## Límites

E01 es parcial: aquí se acredita autoría/guardado de estas actividades en un borrador sintético; el flujo global de constructor, publicación y alumno corresponde a las tareas restantes. Los pendientes de publicación de la fixture se muestran como tales.

NO VERIFICADO en T025: producción, identidad real, despliegue, concurrencia PostgreSQL independiente, zoom nativo y auditoría completa axe/lector de pantalla de T037. Las comprobaciones de carga, conflicto y recuperación del editor existente se mantienen en la regresión v2; no se atribuye una nueva cobertura completa de esos flujos al navegador de T025.

La regresión API ampliada de T024 conserva su timeout de importación documentado en `../T024/README.md` y `../T024/result.json`. No se cambió ni reejecutó la suite API completa en T025; no se declara resuelto ese pendiente ni aceptado Hito S.

**Siguiente ficha: T026. No iniciada.**
