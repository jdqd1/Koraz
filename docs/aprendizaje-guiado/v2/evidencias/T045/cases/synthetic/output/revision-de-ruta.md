# Revisión de ruta: Circuito de señales Neral

Tema: Circuito de señales Neral. Disciplina: general. Fixture sintético, no médico. Audiencia universitaria supuesta. Guía versión 1 (T045, 10-10-2026), leída completa. Fuente única: fixture local Koraz T045; no bibliografía externa ni figuras.

SHA-256 de bytes originales de guía: `da9f4b5f40a47ddea41e448884114c33e9c4fbbf33a8eff4b6cde890fa5af812`.
SHA-256 del JSON exacto: `f6b9b40f90dda2ae057260b08a76342da0e47f98c1e83e649952333362f63195` (31862 bytes, UTF-8 sin BOM).
Contrato 2.0 / guided-v2.0. La identidad de recursos: PASS. Node v24.19.0. Aceptación provisional con excepción del usuario: Q19/V04, inspección Narrator y discrepancia del recorrido manual continúan **NO VERIFICADO**. No acredita Hito S original 24/24.

## Comprobaciones

| Comprobación | Resultado | Alcance |
|---|---|---|
| Estructura | PASS | valid=true; exit 0 |
| Cobertura portable | PASS | publishable=true; exit 0; solo validación local |
| Fidelidad a guía | PASS | Cotejo de las tres secciones, reglas, tablas y ejemplos; cálculos derivados explícitos |
| Familias y progresión | PASS limitado | Auditoría de autoría abajo; independencia pedagógica humana NO VERIFICADO |
| Revisión editorial humana | NO VERIFICADO | Requiere revisar el hash exacto |
| Catálogo, autorización, importación, publicación | NO VERIFICADO | No se efectuaron |
| Revisión médica | NO VERIFICADO | Fixture no médico; validación informática no la acredita |

## Matriz de cobertura

Una capacidad integrada evita dividir artificialmente la guía corta. CORE requerido porque la finalidad es decidir y comprobar el destino completo. DAG de objetivos: un nodo sin aristas, sin prerrequisitos externos. N→C→E es una dependencia de datos enseñada y evaluada.

| Objetivo observable | Evidencia esperada | Fuente/localizador | Prerrequisitos |
|---|---|---|---|
| integrar-neral: calcular, ordenar y comprobar N→C→E | Residuo correcto, codificación completa, prioridad de e, orden causal, reconocer datos insuficientes; después trazas, perturbaciones y auditoría | normalizacion: 1. Normalización del contador; codificacion: 2. Codificación del residuo; enrutamiento: 3. Enrutamiento de la salida | Ninguno entre objetivos; C usa r y E usa c/e |

Conteos reales: 1 unidad, 1 CORE requerido, 15 actividades, 3 fragmentos fuente, 5 evaluaciones, 0 assets. Explicación → ejemplo resuelto → parcial → intentos independientes, con feedback posterior. Las dos remediaciones no añaden familias objetivas.

| Familia / actividad | Demanda y evidencia | Uso | Fase / representación | Fragmentos |
|---|---|---|---|---|
| diagnostico-residuo | single_choice: Sin ayuda: ¿qué conserva N después de dividir n entre cuatro? | diagnostic | activate / text | normalizacion |
| explicacion-circuito | study: Lee la explicación del circuito ficticio Neral. | learning | learn / text | normalizacion, codificacion, enrutamiento |
| ejemplo-resuelto | study: Lee la explicación del circuito ficticio Neral. | learning | learn / text | normalizacion, codificacion, enrutamiento |
| ejemplo-parcial | study: Lee la explicación del circuito ficticio Neral. | learning | learn / text | normalizacion, codificacion, enrutamiento |
| elaboracion-perdida-informacion | constructed_response: Explica por qué el color no permite reconstruir n completo y por qué conocer r sin e no decide la salida. | learning | elaborate / text | normalizacion, codificacion, enrutamiento |
| calculo-residuo | single_choice: Para n=9, ¿cuál es la salida de N? | learning | retrieve / text | normalizacion |
| tabla-colores | match: Relaciona cada residuo con el color que entrega C. | learning | retrieve / table | codificacion |
| interruptor-cero | single_choice: Registro de entrada a E: c=rojo, e=0. ¿Qué destino debe registrar E? | learning | apply / case | enrutamiento |
| orden-compuertas | sequence: Ordena las tres operaciones para ejecutar el circuito desde n hasta destino. | gate | retrieve / diagram | normalizacion, codificacion, enrutamiento |
| datos-insuficientes | short_answer: Caso de registro incompleto: r=1, pero e no está registrado. Escribe «indeterminada» si la salida no puede decidirse. | gate | apply / case | codificacion, enrutamiento |
| remediar-cociente | study: Lee la explicación del circuito ficticio Neral. | learning | remediate / text | normalizacion |
| remediar-interruptor | study: Lee la explicación del circuito ficticio Neral. | learning | remediate / text | enrutamiento |
| reserva-final-trazas | match: Empareja entradas completas con su traza r/color/destino. Calcula sin ayuda los tres pasos. | final | apply / table | normalizacion, codificacion, enrutamiento |
| reserva-retencion-cambios | match: Desde (n=4,e=1), clasifica cada perturbación por lo que cambia en r, color y destino. | retention7 | apply / table | normalizacion, codificacion, enrutamiento |
| reserva-retencion-auditoria | single_choice: Audita este registro: A: n=2,r=2,c=ámbar,e=1,alarma; B: n=3,r=3,c=rojo,e=0,alarma; C: n=4,r=0,c=azul,e=1,pantalla; D: n=5,r=1,c=verde,e=1,pantalla. ¿Qué reparación restaura las reglas? | retention30 | apply / case | normalizacion, codificacion, enrutamiento |

Cinco familias iniciales objetivas: cálculo del residuo, tabla de codificación, prioridad del interruptor, secuencia causal, suficiencia de datos. Tres recuperaciones y dos aplicaciones; las aplicaciones case difieren de explicaciones text. La elaboración autorreportada enlaza datos-insuficientes como verificación objetiva. Respuestas y feedback son editoriales para el importador, no un manifiesto público de alumno.

Reservas exclusivas: final pide tres trazas completas; retention7 compara efectos de tres perturbaciones; retention30 localiza y repara un error en una tabla de ejecución. Son demandas distintas, no simples cambios de nombres/números. Familias y actividades reservadas no participan en diagnóstico, gate, remediación ni otra reserva. El diagnóstico tiene un ítem optativo del único CORE raíz: aviso de brevedad aceptado, no gate. Gate usa las cinco familias iniciales. Una unidad no exige checkpoint separado. Umbral 80 es decisión del producto/editorial, no afirmación científica. reviewPlan incluye el único requerido; no se crean agenda, dominio ni progreso.

Errores críticos: confundir cociente (respuesta dos de calculo-residuo) e ignorar e=0 (respuesta alarma de interruptor-cero); cada uno enlaza remediación específica y verificación inicial del mismo objetivo. La verificación repetida es comprobación, no nueva familia.

## Fuentes, conflictos y assets

Los excerpts son copias literales de las secciones completas con el mismo SHA-256 original, heading/sectionPath exactos y página null. verification=provided; checkedAt=null: material suministrado sin verificación externa. Las tres secciones se cotejaron para el contenido, sin certificar autoría/derechos fuera del fixture. Los cálculos 9 mod 4 y perturbaciones 4→8/5 son aplicaciones directas de reglas del documento. No se detectaron contradicciones materiales en los pasajes leídos ni cobertura fuera del tema solicitado.

Cero assets: lista en assets-pendientes.json; no hay archivo, hash, crédito o derecho de imagen que inventar. No hace falta imagen para esta capacidad; las tablas son texto revisable. coverKey=heart obedece al enum del contrato y no atribuye contenido médico a la ruta.

Issues del validador (conservar avisos):

```json
[
  {
    "code": "OBJECTIVE_COVERAGE",
    "severity": "warning",
    "path": "/assessments",
    "message": "Diagnóstico limitado por una ruta con menos de cuatro objetivos.",
    "suggestedFix": "Registra esta limitación editorial."
  },
  {
    "code": "OBJECTIVE_COVERAGE",
    "severity": "warning",
    "path": "/assessments",
    "message": "Diagnóstico limitado por una ruta con menos de cuatro objetivos.",
    "suggestedFix": "Registra esta limitación editorial."
  }
]
```

2 rondas de autoría y validación; no modificaciones de esquema, bundle, política ni guía. Se conservan JSON/hash y validaciones de la primera ronda en round-1-*. La reparación reemplazó la palabra española «todo» por «cualquier», que expresan la misma regla, para evitar su detección como marcador TODO. Detalles y exit codes en execution-log.json; resultados crudos en validation-draft.json y validation-publish.json. El paquete es estructuralmente válido e importable como borrador dentro del contrato portable. La cobertura portable es suficiente; no constituye autorización para publicar.

## Pasos pendientes

Abrir el editor de rutas Koraz → importar ruta.koraz-route.json como borrador → resolver tema y fuentes del catálogo → atender avisos/incidencias y revisar portada → previsualizar → solicitar revisión editorial humana del SHA-256 exacto → revalidar bindings, derechos y autorización antes de publicar. Esta entrega no importó, publicó, instaló ni modificó sistemas.
