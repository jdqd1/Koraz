# Pedagogía de autoría — guided-v2.0

Estas son reglas de producto del contrato congelado, no cifras científicas universales. El bundle decide la compatibilidad del paquete; esta referencia ayuda a diseñarlo sin reimplementar el motor. Lectura, confianza, autorreporte, respuesta asistida y preview no conceden dominio. Completar, dominar y consolidar son estados separados, calculados por el servidor.

## Objetivos y recorrido

Redacta una capacidad observable por objetivo, con fuentes y dependencia solo cuando la capacidad previa sea necesaria. Usa `identify`, `recall`, `relate`, `differentiate`, `explain`, `predict`, `order`, `apply` o `integrate`. Ordena unidades/objetivos topológicamente, sin ciclos, autoprerrequisitos, huérfanos ni referencias inexistentes. El orden del índice no crea dependencias.

| Criticidad | Uso editorial |
|---|---|
| `core` | Capacidad indispensable para la rama; siempre `required:true`. Justifica la necesidad. |
| `high_yield` | Capacidad frecuente/relevante; decide si es requerida con razón curricular. |
| `supporting` | Apoya las anteriores; puede ser opcional. |
| `detail` | Precisión complementaria; no convertirla en gate sin fundamento. |

Una ruta completa requiere al menos una unidad y un CORE requerido. No conviertas todos los objetivos en CORE. Cada objetivo, también opcional, necesita explicación (`study`, fase `learn`), recuperación objetiva (`retrieve`), elaboración con respuesta (`elaborate`, distinta de `study`/`case`) y aplicación objetiva (`apply`). Son etapas con interacción; titular un párrafo «aplicación» no cumple.

Usa explicación → ejemplo resuelto → ejemplo parcial → intento independiente cuando proceda; `study.scaffold` permite `explanation`, `worked_example`, `partial_example`. `support` de unidad es `full` o `standard`; `estimatedMinutes` puede ser null. No impongas sesiones de duración fija. Las pistas (0–3) ayudan, no otorgan evidencia no asistida. Señalización solo en explicación, nunca para revelar la solución del intento.

## Formatos y corrección

| `kind` | Uso y límite |
|---|---|
| `study` | Explicación/ejemplo; no puntúa dominio. Fragmento, asset opcional y focusSpans reales. |
| `single_choice` | Discriminación o decisión acotada: 2–6 opciones, una correcta, feedback de todas y solo las incorrectas. |
| `short_answer` | Recuperación breve con alias explícitos completos (1–30), maxChars 1–500 y normalización `nfkc-lower-space`; no calificar razonamiento causal por palabras sueltas. |
| `constructed_response` | Autoexplicación con rúbrica 1–8 y respuesta modelo. Siempre autorreporte; para objetivo requerido enlazar verificación objetiva inicial del mismo objetivo. Tarjetas usan este kind, no un tipo nuevo. |
| `match` | Pares/tabla comparativa/micro-mapa causal. Correspondencias completas; aristas solo en `causal_map`. La respuesta totalmente correcta aporta evidencia binaria. |
| `image_target` | Identificación en imagen real revisada, hotspot o labeling. Polígonos normalizados [0,1], ≥3 puntos distintos, área positiva, sin cruces; alternativa accesible vinculada. Solo `masking:no_labels` es objetivo. Alt, caption y prompt no revelan soluciones. |
| `sequence` | Orden causal/temporal de 3–12 elementos, 1–5 permutaciones válidas completas. Explicación posterior separada mediante `whyActivityKey` si existe. |
| `case` | Caso progresivo con 2–6 hijos no-case; wrapper sin puntuación propia. Cada hijo aparece una sola vez, inmediatamente después del wrapper en orden de etapas. No meter esos hijos en evaluaciones independientes, salvo remediación explícita. |

Una actividad objetiva es `single_choice`, `short_answer`, `match`, `sequence` o `image_target` sin etiquetas. Un caso o respuesta libre no reemplaza una comprobación objetiva. Elabora conexiones con `constructed_response` y su verificación, o tabla/micro-mapa/otra actividad pertinente. Feedback explica la razón, el error y el fragmento que lo corrige. No crear distractores basados en hechos médicos inventados.

## Banco y familias

Por **cada objetivo requerido**:

- Al menos cinco familias objetivas distintas en `use:learning|gate`, con ≥2 familias de recuperación y ≥1 aplicación en representación distinta de todas sus explicaciones.
- Tres familias objetivas adicionales exclusivas: una `final`, una `retention7`, una `retention30`. Ocho familias mínimas, sin contar diagnóstico ni elaboración autorreportada.
- Reserva no aparece en aprendizaje, diagnóstico, remediación, otro objetivo ni otra reserva. Cada ítem reservado tiene familia exclusiva.

`equivalenceKey` identifica demanda equivalente, no solo archivo/pregunta. Reformular el mismo enunciado o cambiar nombres no crea evidencia independiente. Escribe variantes con diferencias reales sustentadas; si la guía no permite el banco, registra `BANK_TOO_SMALL`, sin inventar conceptos ni reducir el mínimo.

Objetivos opcionales necesitan ≥1 recuperación y ≥1 aplicación objetiva, además de explicación y elaboración. No exigen las ocho familias ni bloquean dominio global. `reviewPlan.objectiveKeys` incluye todos los requeridos; el servidor fija agenda, no un campo de fechas inventado.

## Evaluaciones

| Evaluación | Cobertura y pools |
|---|---|
| `diagnostic` | Siempre presente, participación optativa, bajo riesgo. 4–8 ítems CORE raíz; con menos de cuatro objetivos cubre todos los CORE raíz y registra aviso por diagnóstico breve. Ítems `use:diagnostic` exclusivos, separados del banco inicial y reservas. `thresholdPercent:80` es campo no operativo, no gate. |
| `unit_gate` | Uno por unidad (`afterUnitKey`), incluye todos sus objetivos requeridos y candidatos objetivos propios de `learning|gate`. CORE debe comprobarse objetivamente. |
| `checkpoint` | Después de cada tercera unidad; remanente de dos unidades tiene otro checkpoint. Una unidad no necesita checkpoint separado. Cubrir requeridos del segmento con candidatos iniciales; nunca usar reservas. |
| `final` | Cubre todos los requeridos, candidatos exclusivos `use:final`. |
| `retention7` / `retention30` | Cubren todos los requeridos con candidatos de su respectivo uso exclusivo. |

Umbral de gate/final predeterminado 80, o 80–100 con justificación editorial; `thresholdRationale` tiene al menos 40 caracteres. No atribuir a ciencia universal. Las reservas no se comparten entre evaluaciones; los ítems iniciales pueden participar en gate/checkpoint. Segmentación de hasta diez preguntas y selección pertenecen al motor.

Los errores críticos son confusiones sustentadas y mapeadas a una respuesta incorrecta identificable. Para cada misconception crítica del CORE enlaza actividad `remediate` y una verificación objetiva del mismo objetivo, no una reserva. No infieras error clínico crítico por texto libre o autoevaluación. Banco agotado se informa, no desbloquea gates ni genera nuevas preguntas en ejecución.

## Repaso y límites de evidencia

El servidor exige al menos tres familias elegibles, dos recuperaciones y aplicación en otra representación, score del gate suficiente, último acierto y ningún error crítico abierto para dominio. La reutilización inmediata de una familia no aporta nueva evidencia; ayuda y diagnóstico tampoco. La skill suministra el banco, no concede esos estados.

Agenda del sistema: intervalos `[1,3,7,14,30]` días, refuerzo tras fallo, una ampliación por objetivo en 24 h según reloj servidor. Reservas diferidas a ≥7 y ≥30 días del primer dominio, separadas ≥7 días. Consolidación requiere evidencia objetiva diferida y dominio conservado. No escribir `schedulerVersion`, fechas o progreso en el paquete: `reviewPlan` solo contiene claves. Estos parámetros son política de producto y no prueban eficacia educativa ni competencia clínica.
