# Revisión de ruta: Vascularización del abdomen

Borrador editorial portable 2.0, revisión 1, anatomy. Audiencia universitaria asumida. Fuente exclusiva: snapshot local de fragmentos, captura declarada 2026-10-08, no exportación íntegra. Archivo completo UTF-8 leído sin modificación.

- SHA-256 original: 06de028c80081dadc1fb1148c9da10bb8eb0aef7baeeefde6e6452822087c7d1
- SHA-256 JSON exacto: fc95e96c056c5f31a15b57b980b117573b527857046b0df1b4901c3d43be0ddc
- Validador: contracts@0.1.0/sha256:c78006a46569f5ec0c15894677ec5038b9034529515b4abcbad45b95b8b2be48
- Aceptación: provisional_implementation_with_user_exception; Q19/V04, Narrator y discrepancia manual **NO VERIFICADO**.

|Comprobación|Estado|Límite|
|---|---|---|
|Identidad de recursos / Node 24|PASS|resource-validation.json; runtime v24.19.0|
|Estructura portable|PASS|valid:true; no acredita importación real|
|Cobertura portable publicable|FAIL|publishable:false; incidencias de fuente abiertas|
|Fidelidad al archivo|PASS limitada|Excerpts literales y referencias internas cotejadas; no libros independientes|
|Banco y recuperación diferida diseñada|PASS local|comprobaciones-pedagogicas.json, sin motor real|
|Revisión editorial humana / médica|NO VERIFICADO|No se hereda revisión declarada de guía ni aprobación productiva|
|Catálogo, permisos, derechos e importación real|NO VERIFICADO|Sin consulta ni mutación de sistemas|
|Dominio, agenda y consolidación|NO VERIFICADO|No ejecución del recorrido en Koraz ni evidencia temporal real|

## Matriz y banco

|Objetivo|Verbo / criticidad|Fuente|Prerrequisitos|Iniciales / familias / reservas|
|---|---|---|---|---|
|Relacionar trayectos y territorios arteriales abdominales descritos|relate / high_yield, requerido|arterias|Ninguno|5 / 5 / 3|
|Relacionar la VCI con sus trayectos y tributarias|relate / core, requerido|cava|Ninguno|6 / 5 / 3|
|Ordenar el flujo portal y relacionar su topografía|order / core, requerido|porta, cava|retorno-sistemico|6 / 5 / 3|
|Diferenciar comunicaciones intercavas y portosistémicas por sus extremos|differentiate / high_yield, requerido|comunicaciones|retorno-sistemico, retorno-portal|5 / 5 / 3|

Conteos reales: {"units":4,"objectives":4,"activities":52,"assessments":9,"sources":5,"assets":0,"initialActivities":22,"initialFamilies":20,"reserveFamilies":12,"diagnosticItems":4}. Cada objetivo tiene explicación y ejemplo resuelto, recuperación sin ayudas, elaboración con rúbrica/modelo y verificación objetiva, y aplicación con respuesta explícita. Las confusiones críticas se remedian y verifican sin usar reservas. En cava y porta, las comprobaciones críticas comparten equivalenceKey con una familia previa: repetir una demanda no infla el banco. Tres reservas exclusivas por objetivo; retention7 y retention30 son recuperación real de hechos/relaciones, sin escenarios de aplicación renombrados. Final también recupera. Cada segmento de cinco familias inspeccionado conserva dos recuperaciones y una aplicación; esto describe el diseño, no prueba selección/elegibilidad del servidor o consolidación.

DAG: retorno-sistemico → retorno-portal; ambos → tipos-comunicacion. Son capacidades previas necesarias para distinguir extremos de una comunicación y paso hepático del retorno. Arterias independiente. CORE se limita a VCI y porta por ser bases indispensables; arterias y comunicaciones high_yield son requeridas para completar el alcance. No duraciones obligatorias. Apoyo completo inicial y estándar posterior; ejemplos resueltos separados de los intentos sin pistas. Diagnóstico opcional de cuatro ítems CORE raíz VCI; cuatro gates, checkpoint tras tercera unidad y final/retenciones para todos. Umbral 80 % editorial de producto, sin promesa clínica o científica.

matriz-cobertura.json registra por actividad y feedback claves de fuente y encabezados exactos. Las secuencias son diagramas verbales, sin imágenes espaciales. Escenarios didácticos recombinan únicamente datos descritos.

## Incidencias y límites de contenido

SOURCE_UNRESOLVED, /sources/0, encabezado «Aorta abdominal / Ramas viscerales impares / Continuidad entre los territorios arteriales digestivos»: «En el patrón más frecuente se divide en tres ramas» carece de antecedente explícito tras la descripción aórtica. No se atribuye el origen de gástrica izquierda/hepática común/esplénica. Sus trayectos expresamente descritos siguen utilizables porque no dependen de resolver el origen. Solicitar el pasaje completo y cotejo.

SOURCE_CONFLICT, /sources/3, encabezado «Vías intercavas / Anastomosis portosistémicas / Nota clínica y diferencia entre fuentes», párrafo «Nota clínica y diferencia entre fuentes», hash 06de028c80081dadc1fb1148c9da10bb8eb0aef7baeeefde6e6452822087c7d1: se preservan «García-Porrero incluye la dilatación del plexo rectal entre las manifestaciones de la hipertensión portal» y «Moore destaca que las hemorroides no se relacionan típicamente con la hipertensión portal y que las venas submucosas del conducto anal poseen normalmente un aspecto plexiforme y dilatado». Ambos pasajes provienen del mismo snapshot con atribuciones distintas. No se resuelve su interpretación ni se generan diagnósticos dependientes. La conexión rectal anatómica sí se utiliza sin convertirla en signo clínico. Cotejar obras/páginas y someter distinción a revisión humana.

La cobertura del tema general sigue incompleta por ser un snapshot: excluye figuras, técnicas quirúrgicas, diagnóstico y tratamiento, y no contiene todos los vasos abdominales. No se añade identify ni se inventan figuras para aparentar alcance espacial.

## Fuentes, catálogo y assets

- arterias: «Aorta abdominal / Ramas viscerales impares / Continuidad entre los territorios arteriales digestivos», página null, verification provided, checkedAt null; excerpt literal y mismo hash original.
- cava: «Vena cava inferior / Formación, trayecto y terminación / Tributarias viscerales», página null, verification provided, checkedAt null; excerpt literal y mismo hash original.
- porta: «Sistema porta hepático / Formación / Trayecto y relaciones / Terminación», página null, verification provided, checkedAt null; excerpt literal y mismo hash original.
- comunicaciones: «Vías intercavas / Anastomosis portosistémicas / Nota clínica y diferencia entre fuentes», página null, verification provided, checkedAt null; excerpt literal y mismo hash original.
- bibliografia: «Referencias de la guía», página null, verification provided, checkedAt null; excerpt literal y mismo hash original.

Bibliografía suministrada, conservada sin afirmar lectura independiente de las obras ni inventar páginas:

1. García-Porrero Pérez JA, Hurlé González JM. Anatomía humana. 2.ª ed. Madrid: Editorial Médica Panamericana; 2020.
2. Moore KL, Dalley AF II, Agur AMR. Anatomía con orientación clínica. 8.ª ed. Barcelona: Wolters Kluwer; 2017.
3. Pró EA. Anatomía clínica. 2.ª ed. Buenos Aires: Editorial Médica Panamericana; 2014.

Cero assets: assets-a-vincular.json contiene lista vacía; no archivos, hashes de medios, créditos, derechos o bindings ficticios. Una futura ampliación espacial requerirá imagen revisada y derechos/procedencia/dimensiones/alternativa accesible, fuera del alcance actual.

El SHA-256 original identifica los bytes del archivo. Catálogo **pendiente**: sources.documentSha256 utiliza esa procedencia portable, sin afirmar igualdad con payload_hash de un snapshot canónico Koraz. Si una importación autorizada futura arroja SOURCE_CHANGED, cotejar versión, contenido y cada excerpt con la revisión exacta; solo entonces podrá sustituirse el campo por el hash comprobado de catálogo. Conservar el archivo original, ambos hashes y lista de cambios, revalidar y revisar el hash del JSON resultante. No forzar igualdad ni suprimir controles. No se hizo esa operación en esta entrega.

## Entrega e importación siguiente

Estructura válida para proponer importación como borrador portable, con aceptación real de Koraz pendiente. Abrir editor de rutas Koraz → importar archivo como borrador → resolver tema/fuentes/assets del catálogo y cotejar revisión canónica → atender incidencias → previsualizar → pedir revisión editorial del hash exacto antes de publicar. --publish valida condiciones portables; no importa ni publica. Sin instalación, red, credenciales, backend ni cambios fuera de output.
