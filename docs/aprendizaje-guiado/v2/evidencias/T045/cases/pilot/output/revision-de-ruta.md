# Revisión de ruta: Vascularización del abdomen

Borrador editorial portable 2.0, disciplina anatomy, revisión 1. Audiencia universitaria asumida. Fuente única: snapshot de fragmentos suministrado, captura declarada 2026-10-08; no exportación íntegra. Se leyó el archivo completo como UTF-8 y se hashó el original, sin modificarlo.

- SHA-256 guía: 06de028c80081dadc1fb1148c9da10bb8eb0aef7baeeefde6e6452822087c7d1
- SHA-256 JSON exacto: 22d28427d884a5c3c4bd76c784500a000d3b8bc8264a12e2e6bf14319b6d2e56
- Validador: contracts@0.1.0/sha256:c78006a46569f5ec0c15894677ec5038b9034529515b4abcbad45b95b8b2be48
- Aceptación: provisional_implementation_with_user_exception; Q19/V04, Narrator y discrepancia manual: **NO VERIFICADO**.

|Comprobación|Estado|Evidencia y límite|
|---|---|---|
|Identidad de recursos y Node 24|PASS|resource-validation.json; no instalación|
|Estructura portable|PASS|validation-draft.json; valid:true|
|Cobertura portable publicable|FAIL|validation-publish.json; publishable:false; incidencias preservadas|
|Fidelidad al snapshot|PASS limitado|Excerpts de cinco secciones extraídos literalmente; soluciones y feedback remiten a esos fragmentos; no cotejo independiente de libros|
|Revisión humana del hash exacto|NO VERIFICADO|La declaración de revisión previa del snapshot no se convierte en aprobación de esta ruta|
|Catálogo, autorización y publicación Koraz|NO VERIFICADO|No importación, bindings ni mutaciones de sistemas|
|Reconocimiento espacial y práctica clínica|NO VERIFICADO|Fuera del alcance textual suministrado|

## Matriz y decisiones

|Unidad/objetivo|Verbo y criticidad|Evidencia observable|Prerrequisitos|Fuente|Familias iniciales / reservas|
|---|---|---|---|---|---|
|arterias / territorios-arteriales|relate, high_yield, requerido|Relacionar el trayecto aórtico, los territorios mesentéricos y sus continuidades|Sin prerrequisitos|arterias|5 / 3|
|cava / retorno-cava|relate, core, requerido|Relacionar formación, trayecto y asimetrías tributarias de la vena cava inferior|Sin prerrequisitos|cava|5 / 3|
|porta / flujo-portal|order, core, requerido|Ordenar el retorno portal y relacionar la formación y topografía de la vena porta|retorno-cava|porta, cava|5 / 3|
|anastomosis / comunicaciones-venosas|differentiate, high_yield, requerido|Diferenciar las vías intercavas de las comunicaciones portosistémicas por sus extremos|retorno-cava, flujo-portal|anastomosis|5 / 3|

Cuatro unidades, cuatro objetivos requeridos (dos CORE, dos high_yield), 42 actividades, 9 evaluaciones, cinco fragmentos/fuentes de un mismo archivo y cero assets. Por objetivo: explicación, dos recuperaciones, elaboración objetiva mediante tabla y dos aplicaciones en secuencia/escenario. Cinco familias iniciales y tres reservas disjuntas, con demanda diferenciada; las reservas no entran en diagnóstico, gates, checkpoint ni remediación. Dos estudios de remediación se enlazan a verificaciones objetivas iniciales para errores críticos de CORE. Diagnóstico opcional: cuatro ítems exclusivos del CORE raíz cava. Cuatro gates, checkpoint tras tercera unidad y final más dos reservas diferidas. El plan de repaso incluye los cuatro requeridos; no genera fechas o estados.

CORE cava y porta son base para distinguir retorno sistémico y flujo a través del hígado. Arterias y comunicaciones son high_yield requeridos por el alcance de vascularización. El DAG cava → porta → comunicaciones (también cava → comunicaciones) sigue las capacidades necesarias; arterias es independiente. No existe dependencia por simple orden del índice. No se impone duración. Apoyo completo inicial y estándar posterior, sin pistas en los intentos. Umbral 80 % editorial, sin afirmar eficacia educativa o competencia clínica.

La matriz-cobertura.json vincula cada actividad y feedback con sourceKeys; inventario-guia.json guarda encabezados exactos, bibliografía suministrada y hash. Las secuencias son mapas verbales del trayecto, no imágenes anatómicas. Los escenarios combinan relaciones ya descritas sin pacientes, tratamientos o datos clínicos nuevos.

## Incidencias y cobertura pendiente

1. SOURCE_UNRESOLVED en /sources/0: el fragmento arterial dice «En el patrón más frecuente se divide en tres ramas» después de describir la aorta y enumera gástrica izquierda, hepática común y esplénica sin explicitar el antecedente. Se conservó el excerpt original y se omitió la asignación del origen de dichas ramas. Hace falta el pasaje completo y su cotejo antes de ampliar esa cobertura.
2. SOURCE_CONFLICT en /sources/3: localizador exacto «Vías intercavas / Anastomosis portosistémicas / Nota clínica y diferencia entre fuentes», párrafo «Nota clínica y diferencia entre fuentes», hash 06de028c80081dadc1fb1148c9da10bb8eb0aef7baeeefde6e6452822087c7d1. Se conserva literalmente: «García-Porrero incluye la dilatación del plexo rectal entre las manifestaciones de la hipertensión portal» y «Moore destaca que las hemorroides no se relacionan típicamente con la hipertensión portal y que las venas submucosas del conducto anal poseen normalmente un aspecto plexiforme y dilatado». Se preservan las dos atribuciones; no se decide su interpretación, ni se crean soluciones clínicas dependientes. La comunicación rectal anatómica permanece porque no requiere decidir ese desacuerdo. Aportar páginas y revisión humana de las obras para resolverlo.

Cobertura incompleta del tema general: este snapshot excluye reconocimiento espacial por figuras, cirugía, diagnóstico y tratamiento; no ofrece guía íntegra ni todos los vasos abdominales. No se añaden objetivos identify, figuras o conocimientos para simular cobertura total.

## Fuentes y assets

- arterias: encabezado «Aorta abdominal / Ramas viscerales impares / Continuidad entre los territorios arteriales digestivos», página null, verification provided, checkedAt null; mismo hash de guía.
- cava: encabezado «Vena cava inferior / Formación, trayecto y terminación / Tributarias viscerales», página null, verification provided, checkedAt null; mismo hash de guía.
- porta: encabezado «Sistema porta hepático / Formación / Trayecto y relaciones / Terminación», página null, verification provided, checkedAt null; mismo hash de guía.
- anastomosis: encabezado «Vías intercavas / Anastomosis portosistémicas / Nota clínica y diferencia entre fuentes», página null, verification provided, checkedAt null; mismo hash de guía.
- bibliografia: encabezado «Referencias de la guía», página null, verification provided, checkedAt null; mismo hash de guía.

Bibliografía suministrada (no obras leídas, páginas cotejadas ni fuentes independientes verificadas):

1. García-Porrero Pérez JA, Hurlé González JM. Anatomía humana. 2.ª ed. Madrid: Editorial Médica Panamericana; 2020.
2. Moore KL, Dalley AF II, Agur AMR. Anatomía con orientación clínica. 8.ª ed. Barcelona: Wolters Kluwer; 2017.
3. Pró EA. Anatomía clínica. 2.ª ed. Buenos Aires: Editorial Médica Panamericana; 2014.

Assets a vincular: **0**. assets-a-vincular.json enumera la lista vacía; no archivos, hashes, créditos, derechos o bindings de medios inventados. Para una ampliación espacial futura hará falta imagen revisada con procedencia, derechos, dimensiones y alternativa accesible; fuera de la entrega presente.

## Siguientes pasos

La estructura permite proponer importación como borrador portable; queda pendiente la aceptación real de Koraz. Abrir el editor de rutas de Koraz → importar como borrador → resolver tema y fuentes de catálogo → resolver las dos incidencias → previsualizar → solicitar revisión editorial del hash exacto antes de publicar. --publish solo comprueba requisitos portables; no publica ni acredita revisión médica, permisos, derechos o catálogo. No se ejecutaron esos pasos.
