# Revisión de Circuito de señales Neral

Tema: Circuito de señales Neral; disciplina general. Fixture sintético de software no médico. Audiencia universitaria asumida. Guía versión 1, autoría fixture local Koraz T045, 2026; lectura completa de título, tres secciones, tablas, ejemplos y Bibliografía y figuras. No hay bibliografía externa ni figuras.

SHA-256 de bytes originales de guía: `da9f4b5f40a47ddea41e448884114c33e9c4fbbf33a8eff4b6cde890fa5af812`.
SHA-256 del paquete editorial exacto: `672cca71f2117e6640b71ea3653bd52ea23a95fe29aa3955f6b256f9fc029cd4` (30946 bytes; UTF-8 sin BOM).
Contrato schema 2.0 / guided-v2.0; Node v24.19.0. Recursos congelados: PASS. Aceptación provisional con excepción del usuario: Q19/V04, inspección real Narrator y discrepancia manual **NO VERIFICADO**; no acredita Hito S original 24/24.

## Resultados y límites

| Comprobación | Resultado | Evidencia/límite |
|---|---|---|
| Estructura | PASS | valid=true, exit 0 |
| Cobertura portable | PASS | publishable=true, exit 0; no publicación |
| Fidelidad de fuente | PASS | Excerpts literales de tres secciones y cotejo de reglas/soluciones |
| Reservas de recuperación | PASS de autoría | Ambas retrieve y realmente recuperan reglas, sin entradas nuevas |
| Ventana de cinco familias | PASS de diseño | Trayectoria teórica de aciertos/familias nuevas abajo; ejecución NO VERIFICADO |
| Catálogo y bindings | NO VERIFICADO | Hash de snapshot y recursos productivos desconocidos |
| Revisión editorial humana | NO VERIFICADO | Requiere hash exacto; no se inventó aprobación |
| Importación y publicación | NO VERIFICADO | No realizadas |
| Consolidación/dominio | NO VERIFICADO | Calculados por servidor y tiempos reales; archivo no los concede |
| Revisión médica | NO VERIFICADO | Fixture no médico; informática no la acredita |

## Matriz de cobertura y diseño

| Objetivo observable | Evidencia esperada | Fragmentos | Prerrequisitos |
|---|---|---|---|
| integrar-circuito: calcular y comprobar N→C→E | Recuperar normalización/codificación/orden; aplicar prioridad e y detectar dato faltante; integrar trazas; recuperar reglas diferidas | normalizacion: 1. Normalización del contador; codificacion: 2. Codificación del residuo; enrutamiento: 3. Enrutamiento de la salida | Ninguno entre objetivos; C depende de r y E depende de c/e |

Una unidad con un CORE requerido basta para la capacidad integrada del tema breve; no se crean objetivos redundantes. DAG de un nodo sin ciclos. N→C→E es dependencia de datos enseñada, no una arista ficticia del grafo de objetivos. Estimación de minutos null. Explicación → ejemplo resuelto → parcial → intento independiente; feedback posterior. La elaboración autorreportada usa rúbrica y verifica inferir-dato-faltante. Dos errores críticos: cociente-por-residuo y ignorar-e, mapeados a respuestas incorrectas concretas y con remediación más verificación inicial del mismo objetivo.

Conteos: 1 unidad, 1 objetivo CORE requerido, 15 actividades, 5 familias objetivas iniciales (3 retrieve, 2 apply), 3 reservas, 5 evaluaciones, 3 fragmentos fuente, 0 assets.

| Actividad / familia | Formato | Fase / uso / representación | Fuentes y feedback |
|---|---|---|---|
| diagnostico-preservacion | single_choice | activate / diagnostic / text | enrutamiento |
| explicacion | study | learn / learning / text | normalizacion, codificacion, enrutamiento |
| ejemplo-resuelto | study | learn / learning / text | normalizacion, codificacion, enrutamiento |
| ejemplo-parcial | study | learn / learning / text | normalizacion, codificacion, enrutamiento |
| elaborar-datos | constructed_response | elaborate / learning / text | normalizacion, codificacion, enrutamiento |
| recuperar-regla-n | single_choice | retrieve / learning / text | normalizacion |
| recuperar-tabla-c | match | retrieve / learning / table | codificacion |
| aplicar-prioridad-e | single_choice | apply / learning / case | enrutamiento |
| recuperar-orden | sequence | retrieve / gate / diagram | normalizacion, codificacion, enrutamiento |
| inferir-dato-faltante | short_answer | apply / gate / case | codificacion, enrutamiento |
| remediar-n | study | remediate / learning / text | normalizacion |
| remediar-e | study | remediate / learning / text | enrutamiento |
| final-trazas | match | apply / final / table | normalizacion, codificacion, enrutamiento |
| retencion-siete-dominio-e | short_answer | retrieve / retention7 / text | enrutamiento |
| retencion-treinta-invarianza | short_answer | retrieve / retention30 / text | normalizacion, enrutamiento |

Familias iniciales: salida exclusiva de N, tabla completa de C, prioridad del interruptor en caso, secuencia dependiente y suficiencia de datos. Son demandas distintas, no variantes léxicas. Las aplicaciones case difieren de explicaciones text. Final integra tres trazas y evalúa aplicación completa. retention7 recupera valores permitidos de e, sin calcular; retention30 recupera la invariancia de sumar cuatro, sin perturbación nueva. Sus demandas son diferentes entre sí y de las iniciales. Reservas exclusivas, fuera de gate, diagnóstico, remediación y otras reservas. Diagnóstico optativo de un CORE raíz; aviso breve conservado. Gate usa cinco familias iniciales. Una unidad no necesita checkpoint separado. Umbral 80 es política/editorial de producto, no evidencia científica universal.

Ventanas del orden planeado con familias nuevas y respuestas correctas: 

| Después de | Cinco familias | retrieve | apply |
|---|---|---:|---:|
| inferir-dato-faltante | recuperar-regla-n, recuperar-tabla-c, aplicar-prioridad-e, recuperar-orden, inferir-dato-faltante | 3 | 2 |
| final-trazas | recuperar-tabla-c, aplicar-prioridad-e, recuperar-orden, inferir-dato-faltante, final-trazas | 2 | 3 |
| retencion-siete-dominio-e | aplicar-prioridad-e, recuperar-orden, inferir-dato-faltante, final-trazas, retencion-siete-dominio-e | 2 | 3 |
| retencion-treinta-invarianza | recuperar-orden, inferir-dato-faltante, final-trazas, retencion-siete-dominio-e, retencion-treinta-invarianza | 3 | 2 |

Cada ventana planeada conserva al menos dos recuperaciones y una aplicación. Repetir gate/remediación no crea una familia nueva. No se ejecutó el motor ni se verificaron tiempos, puntuación, último acierto o errores cerrados; cobertura portable y diseño de ventanas no prueban consolidación. reviewPlan solo incluye la clave requerida.

## Fuentes, catálogo y assets

Se usa una única guía con tres claves de fragmento. Cada excerpt es literal, heading/sectionPath exactos y page=null; hash igual al archivo original. verification=provided y checkedAt=null, sin revisión independiente. No se detectaron conflictos materiales en pasajes leídos. La guía declara todas las reglas; no se añadió conocimiento clínico ni citas externas.

**Catálogo pendiente:** documentSha256 portable conserva SHA-256 de bytes originales. Koraz lo debe comparar con payload_hash de la revisión de recurso seleccionada, calculado sobre snapshot canónico; puede diferir pese al mismo texto. Un SOURCE_CHANGED exige cotejar versión, contenido y cada excerpt con esa revisión exacta. Solo una importación posterior autorizada podrá sustituir documentSha256 por el hash comprobado del catálogo, conservando original, ambos hashes y lista de cambios. No forzar igualdad ni suprimir controles. Revalidar y revisar el nuevo hash del paquete. No se consultó ni modificó catálogo.

Cero assets: assets-pendientes.json lo declara; no hay archivo, hash, créditos o derechos de imagen que inventar. Las tablas son texto revisable. coverKey=heart es una opción obligatoria del enum sin significado médico; requiere criterio editorial de portada.

Issues del validador:

```json
[
  {
    "code": "OBJECTIVE_COVERAGE",
    "severity": "warning",
    "path": "/assessments",
    "message": "Diagnóstico limitado por una ruta con menos de cuatro objetivos.",
    "suggestedFix": "Registra esta limitación editorial."
  }
]
```

Una ronda de autoría/validación. Se conservan stdout, stderr, exit codes y hashes en execution-log.json; resultados completos en validation-draft.json y validation-publish.json. Paquete estructuralmente válido, importable como borrador bajo contrato portable. Cobertura portable suficiente; publicación requiere comprobaciones dentro de Koraz.

## Pendientes

Abrir editor de rutas Koraz → importar como borrador → resolver tema y las tres fuentes del catálogo, cotejando snapshot/excerpts y hashes → atender avisos y portada → previsualizar → solicitar revisión editorial humana del hash exacto → revalidar bindings, derechos y autorización antes de publicar. No hay assets que vincular. No se importó, publicó ni instaló; no se modificaron sistemas.
