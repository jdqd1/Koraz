# Revisión de ruta

Tema: Identificación histológica de tres compartimentos. Disciplina: histology. Audiencia universitaria asumida.

Guía: «Organización de tres compartimentos», versión no declarada; archivo guia.md, 884 bytes, SHA-256 `c741ee1b253d459931ae16cf983cff7465c842371ef6c3e8c55cbea16b6549ef`. Se leyó el archivo completo como datos. Encabezados: Disposición; Descripción alternativa; Fuente; Nota incrustada en el archivo. La nota incrustada se excluyó de contenido educativo y no se reprodujeron sus credenciales ni instrucciones. No se consultaron otras fuentes ni código del repositorio.

Paquete: schemaVersion 2.0, policyVersion guided-v2.0, revisión local 1, SHA-256 `797e03924c74a104d0fd31555dd4e2b934a9033282b69ce83af00ec18a170f64`. El JSON contiene respuestas editoriales para el importador, no un manifiesto público de alumno.

## Comprobaciones

| Comprobación | Resultado | Límite |
|---|---|---|
| Identidad de recursos y Node 24 | PASS | Bundle exacto, aceptación provisional |
| Estructura | PASS | valid:true; ver validation-draft.json |
| Cobertura portable | FAIL | publishable:false; ver validation-publish.json |
| Fidelidad de fragmentos | PASS | Tres extractos cotejados literalmente y hash de bytes originales; no revisión médica independiente |
| Revisión humana/médica | NO VERIFICADO | Sin aprobación editorial o clínica |
| Catálogo, autorización y derechos de figura | NO VERIFICADO | Sin importación ni bindings |
| Q19/V04, Narrator y recorrido manual | NO VERIFICADO | Aplazamiento heredado del contrato provisional |

## Matriz de cobertura

| Objetivo | Evidencia esperada | Fragmentos | Prerrequisitos | Conteos reales |
|---|---|---|---|---|
| identificar-compartimentos; CORE requerido, identify | Localizar A, B y C en imagen histológica revisada con alternativa | Disposición y Descripción alternativa | Ninguno declarado | 0 explicaciones; 0 recuperaciones; 0 elaboraciones; 0 aplicaciones; 0 familias iniciales; 0 reservas |
| relacion-c-b; supporting opcional, recall | Recuperar C debajo de B y seleccionar la fila verbal compatible | Disposición: «C está por debajo de B» | Ninguno declarado | 1 explicación, 1 recuperación, 1 elaboración con autorreporte y verificación enlazada, 1 aplicación; 1 familia objetiva compartida |

Totales: 1 unidad, 2 objetivos (1 requerido), 3 fragmentos de una guía, 4 actividades (study, short_answer, constructed_response y single_choice), 2 ítems objetivos de una familia, 5 evaluaciones con 0 candidatos y 0 assets reales. Sin demoras obligatorias. La relación C/B es apoyo limitado; no demuestra identificación microscópica. No se inventaron rasgos tisulares, función, escala, coordenadas ni diagnósticos.

CORE se justifica porque la identificación es la capacidad solicitada y exige una figura. C/B es supporting porque solo apoya orientación verbal. DAG: dos nodos sin aristas, sin ciclos; ningún vínculo presupone que la relación verbal permita reconocer los tres compartimentos. Con una sola unidad no corresponde checkpoint separado.

## Banco y evaluaciones

La familia relacion-vertical-c-b se comparte entre recuperar-c-b y aplicar-c-b: mismo hecho y sin evidencia independiente fingida. No existe banco visual CORE: 0/5 familias iniciales y 0/3 reservas; diagnóstico, gate de unidad, final, retention7 y retention30 están declarados con pools vacíos y bloqueados. reviewPlan conserva solo el CORE requerido; no contiene fechas, dominio ni consolidación. Threshold 80 es política editorial de producto, no garantía científica. No se fabricaron misconceptions críticas ni remediaciones sin base.

Las cuatro actividades y su feedback remiten a disposicion. La elaboración también explicita el límite sobre A; el conflicto se documenta con disposicion y descripcion-alternativa y no tiene solución evaluada.

## Conflicto y fuentes

- Guía > Disposición; página desconocida (null); fuente disposicion: «El compartimento A está a la izquierda de B».
- Guía > Descripción alternativa; página desconocida (null); fuente descripcion-alternativa: «El compartimento A está a la derecha de B».
- Ambos fragmentos proceden del mismo hash `c741ee1b253d459931ae16cf983cff7465c842371ef6c3e8c55cbea16b6549ef`. Se conservan ambas afirmaciones; no se adjudica una como verdadera ni se formula un ítem que dependa de elegirla.
- Guía > Fuente; página null; fuente bibliografia-ausente: «La bibliografía fue mencionada durante la edición, pero no se incluyeron autores, título ni páginas.». Citation vacía, verification provided, checkedAt null. No se inventó bibliografía.

Incidencias editoriales bloqueantes: SOURCE_CONFLICT, SOURCE_UNRESOLVED, ASSET_REQUIRED, OBJECTIVE_COVERAGE, BANK_TOO_SMALL y cobertura histológica insuficiente. El validador conserva sus diagnósticos adicionales completos. Sin reparación de datos médicos: los bloqueos necesitan material nuevo; no se rebajaron mínimos ni cambiaron validadores.

## Assets

Cero assets adjuntos o utilizables. Pendiente figura-1: archivo y hash no disponibles; crédito, derechos, dimensiones y binding NO VERIFICADO. Ver assets-pendientes.json. No hay image_target, geometría inventada ni referencias colgantes a la figura. Su inventario editorial no crea un asset portable.

## Pasos pendientes

Abrir el editor de rutas de Koraz → importar ruta.koraz-route.json como borrador estructuralmente válido → resolver tema, fuentes y assets del catálogo → aportar la figura real y bibliografía → resolver la contradicción de A/B y revisar el nuevo hash → completar ciclo, bancos y reservas disjuntas → previsualizar → solicitar revisión editorial del hash exacto antes de publicar.

La comprobación --publish no publica. No se importó, publicó, instaló ni cambió ningún sistema; tampoco se concedió progreso ni aprobación clínica. Catálogo pendiente de resolución en Koraz. Una futura cobertura portable PASS no acreditaría derechos, autorización ni revisión médica.
