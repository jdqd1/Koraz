import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base='D:/Jose (Datos)/Medicina/CEDIAH/Web/docs/aprendizaje-guiado/v2/evidencias/T045/cases/synthetic';
const skill=path.join(base,'skill'), out=path.join(base,'output'), guide=path.join(base,'guia.md');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const previous=fs.existsSync(path.join(out,'execution-log.json'))?JSON.parse(fs.readFileSync(path.join(out,'execution-log.json'),'utf8')):null;
if(previous){for(const name of ['ruta.koraz-route.json','validation-draft.json','validation-publish.json'])fs.copyFileSync(path.join(out,name),path.join(out,'round-1-'+name));}
const log={scope:'Solo guía synthetic y su copia de skill; escrituras solo output.',node:process.version,commands:[
{command:"Get-Content -LiteralPath '<synthetic>/skill/SKILL.md' -Raw",exitCode:0,result:'Skill leída completa.'},
{command:"Get-Content -LiteralPath '<synthetic>/guia.md' -Raw; Get-Content -LiteralPath '<skill>/references/contrato-koraz-2.0.md' -Raw; Get-Content -LiteralPath '<skill>/references/pedagogia.md' -Raw; Get-Content -LiteralPath '<skill>/references/cobertura-por-disciplina.md' -Raw",exitCode:0,result:'Guía y tres referencias leídas completas.'},
{command:"Get-Content -LiteralPath '<skill>/assets/ejemplo-valido.koraz-route.json' -Raw; Get-Content -LiteralPath '<skill>/assets/koraz-route-2.0.schema.json' -Raw",exitCode:0,result:'Ejemplo leído; salida del esquema truncada. Se consultaron después las propiedades relevantes directamente con Node.'},
{command:'Node 24 -e: leer schema y consultar activities.items.anyOf.find',exitCode:1,result:'TypeError: anyOf undefined. Diagnóstico de lectura; no se generó paquete.'},
{command:'Node 24 -e: leer schema y consultar activities.items.oneOf.find; emitir objective, match y study',exitCode:0,result:'Propiedades y payloads exactos del esquema leídos.'}
],pathAliases:{'<synthetic>':base,'<skill>':skill},validations:[],writes:['build.mjs','ruta.koraz-route.json','revision-de-ruta.md','assets-pendientes.json','execution-log.json','validation-draft.json','validation-publish.json']};
const run=(name,args)=>{const r=spawnSync(process.execPath,[path.join(skill,'scripts',name),...args],{cwd:skill,encoding:'utf8'});const e={executable:process.execPath,args:[path.join(skill,'scripts',name),...args],cwd:skill,exitCode:r.status,stdout:r.stdout,stderr:r.stderr};log.commands.push(e);return e;};
if(previous){log.commands=previous.commands;log.commands.push({executable:process.execPath,args:[path.join(out,'build.mjs')],exitCode:0,result:'Primera generación completada: estructura válida; cobertura bloqueada por palabra todo en feedback.'});log.previousRounds=[{round:1,package:previous.package,validations:previous.validations,artifacts:['round-1-ruta.koraz-route.json','round-1-validation-draft.json','round-1-validation-publish.json']}];log.repair='Se sustituyó todo por cualquier en feedback: frase española confundida con marcador TODO; no se cambió el validador ni las reglas.';}
const identity=run('verify-resources.mjs',[]);
if(identity.exitCode!==0){fs.writeFileSync(path.join(out,'execution-log.json'),JSON.stringify(log,null,2));throw Error('Identidad de recursos inválida; exportación detenida.');}
const original=fs.readFileSync(guide), text=original.toString('utf8'), guideHash=sha(original);
const title='Circuito de señales Neral';
const headings=['1. Normalización del contador','2. Codificación del residuo','3. Enrutamiento de la salida'];
const excerpts=headings.map((h,i)=>text.slice(text.indexOf('## '+h)+h.length+4,text.indexOf(i<2?'## '+headings[i+1]:'## Bibliografía y figuras')).trim());
const sourceKeys=['normalizacion','codificacion','enrutamiento'];
const sources=headings.map((h,i)=>({key:sourceKeys[i],kind:'guide',title,citation:'Fixture local Koraz T045. Circuito de señales Neral. Versión 1. 2026.',locator:{heading:h,sectionPath:[title,h],page:null},documentSha256:guideHash,excerpt:excerpts[i],url:null,verification:'provided',checkedAt:null}));
const all=[...sourceKeys], acts=[];
const add=(key,phase,kind,prompt,payload,explanation,src=all,representation='text',use='learning',commonError='',required=true)=>{const a={key,objectiveKey:'integrar-neral',relatedObjectiveKeys:[],phase,required,sourceKeys:src,representation,equivalenceKey:key,hints:[],use,prompt,feedback:{explanation,commonError,sourceKeys:src},misconceptionMappings:[],alternativeActivityKey:null,kind,payload};acts.push(a);return a;};
const study=(key,phase,body,scaffold='explanation',src=all)=>add(key,phase,'study','Lee la explicación del circuito ficticio Neral.',{body,focusSpans:[],assetKey:null,scaffold,videoRange:null},body,src);
const mc=(key,phase,prompt,options,correct,feedback,src=all,repr='text',use='learning',errors={},required=true)=>add(key,phase,'single_choice',prompt,{options:options.map(([key,text])=>({key,text})),correctKey:correct,distractorFeedback:Object.fromEntries(options.filter(([k])=>k!==correct).map(([k])=>[k,errors[k]||feedback]))},feedback,src,repr,use,'',required);
const match=(key,phase,prompt,rows,choices,answer,feedback,src=all,repr='table',use='learning')=>add(key,phase,'match',prompt,{presentation:'comparison_table',prompts:rows.map(([key,text])=>({key,text})),choices:choices.map(([key,text])=>({key,text})),correctByPrompt:answer,allowReuse:false,edges:[]},feedback,src,repr,use);
mc('diagnostico-residuo','activate','Sin ayuda: ¿qué conserva N después de dividir n entre cuatro?',[['residuo','El residuo'],['cociente','El cociente'],['entrada','Toda la entrada n']],'residuo','N conserva exclusivamente el residuo y descarta el cociente.',[sourceKeys[0]],'text','diagnostic',{},false);
study('explicacion-circuito','learn','N recibe un entero no negativo n y entrega r=n mod 4, en {0,1,2,3}. C transforma r=0,1,2,3 en azul, verde, ámbar, rojo. E recibe color e interruptor: e=0 lleva a archivo; e=1 lleva azul/verde a pantalla y ámbar/rojo a alarma. El orden es N→C→E. e no interviene en N ni C.');
study('ejemplo-resuelto','learn','Ejemplo de la guía: n=11,e=1. N conserva r=3; C entrega rojo; E dirige a alarma porque e=1 y c=rojo. Cambiar e a 0 solo cambia el destino a archivo.','worked_example');
study('ejemplo-parcial','learn','n=6,e=0. N ya produjo r=2. Antes de seguir, completa mentalmente color y salida; contrasta después con el modelo: ámbar y archivo. El interruptor cero domina el destino, cualquiera que sea el color.','partial_example');
add('elaboracion-perdida-informacion','elaborate','constructed_response','Explica por qué el color no permite reconstruir n completo y por qué conocer r sin e no decide la salida.',{rubric:[{key:'clase-residuo',criterion:'Distingue entrada y clase de residuo.',example:'2,6,10,14 comparten r=2 y ámbar.'},{key:'interruptor',criterion:'Explica la necesidad de e en E.',example:'Con r=2: e=1 da alarma y e=0 archivo.'}],modelAnswer:'El color identifica un residuo, pero varias entradas separadas por cuatro comparten ese residuo. Además, E necesita e: un mismo color puede enviarse a archivo con e=0 o a pantalla/alarma con e=1.',verificationActivityKey:'datos-insuficientes'},'C identifica r sin conservar n; E combina color e interruptor. Esta explicación es autorreporte y requiere comprobación objetiva.');
const nr=mc('calculo-residuo','retrieve','Para n=9, ¿cuál es la salida de N?',[['uno','1'],['dos','2'],['nueve','9']],'uno','9=4×2+1: el cociente es 2, se descarta; la salida es el residuo 1.',[sourceKeys[0]],'text','learning',{dos:'2 es el cociente, no la salida. Conserva el residuo 1.',nueve:'9 es la entrada completa; N entrega solo su residuo 1.'});
nr.misconceptionMappings=[{responseKey:'dos',misconceptionKey:'confundir-cociente'}];
match('tabla-colores','retrieve','Relaciona cada residuo con el color que entrega C.',[['cero','r=0'],['uno','r=1'],['dos','r=2'],['tres','r=3']],[['azul','azul'],['verde','verde'],['ambar','ámbar'],['rojo','rojo']],{cero:'azul',uno:'verde',dos:'ambar',tres:'rojo'},'La tabla completa de C codifica 0→azul, 1→verde, 2→ámbar, 3→rojo.',[sourceKeys[1]]);
const ez=mc('interruptor-cero','apply','Registro de entrada a E: c=rojo, e=0. ¿Qué destino debe registrar E?',[['archivo','archivo'],['alarma','alarma'],['pantalla','pantalla']],'archivo','Con e=0, cualquier color va a archivo. Alarma para rojo solo corresponde a e=1.',[sourceKeys[2]],'case','learning',{alarma:'Has aplicado la rama e=1 a un interruptor cero: aquí corresponde archivo.',pantalla:'La rama pantalla necesita e=1 y azul/verde; aquí e=0 obliga a archivo.'});
ez.misconceptionMappings=[{responseKey:'alarma',misconceptionKey:'ignorar-interruptor'}];
add('orden-compuertas','retrieve','sequence','Ordena las tres operaciones para ejecutar el circuito desde n hasta destino.',{items:[{key:'e',text:'E recibe c y e, y decide el destino.'},{key:'n',text:'N calcula r desde n.'},{key:'c',text:'C transforma r en color.'}],acceptedOrders:[['n','c','e']],whyActivityKey:'elaboracion-perdida-informacion'},'C requiere el residuo producido por N, y E requiere el color producido por C. El interruptor se utiliza en E.',all,'diagram','gate');
add('datos-insuficientes','apply','short_answer','Caso de registro incompleto: r=1, pero e no está registrado. Escribe «indeterminada» si la salida no puede decidirse.',{acceptedAnswers:['indeterminada','no se puede determinar','no puede determinarse'],maxChars:100,modelAnswer:'indeterminada',normalization:'nfkc-lower-space'},'r=1 implica verde. Con e=0 sería archivo y con e=1 pantalla: falta e para elegir.',[sourceKeys[1],sourceKeys[2]],'case','gate');
study('remediar-cociente','remediate','Revisa la división 9=4×2+1. El 2 cuenta grupos de cuatro y se descarta. La salida de N es el resto 1, siempre dentro de {0,1,2,3}. Después verifica de nuevo mediante calculo-residuo.','worked_example',[sourceKeys[0]]);
study('remediar-interruptor','remediate','Antes de clasificar el color en E, lee el interruptor. Si e=0, detente en archivo. Solo con e=1 separa azul/verde de ámbar/rojo. Verifica esta confusión con interruptor-cero.','explanation',[sourceKeys[2]]);
match('reserva-final-trazas','apply','Empareja entradas completas con su traza r/color/destino. Calcula sin ayuda los tres pasos.',[['a','n=8,e=1'],['b','n=11,e=1'],['c','n=6,e=0']],[['a','0 / azul / pantalla'],['b','3 / rojo / alarma'],['c','2 / ámbar / archivo']],{a:'a',b:'b',c:'c'},'8 mod 4=0: azul/pantalla; 11 mod 4=3: rojo/alarma; 6 mod 4=2: ámbar/archivo por e=0. Son las tres trazas completas de la guía.',all,'table','final');
match('reserva-retencion-cambios','apply','Desde (n=4,e=1), clasifica cada perturbación por lo que cambia en r, color y destino.',[['mas-cuatro','Cambiar a n=8,e=1'],['mas-uno','Cambiar a n=5,e=1'],['apagado','Cambiar a n=4,e=0']],[['igual','Nada cambia en r, color ni destino'],['interno','Cambian r y color; se conserva pantalla'],['destino','Se conservan r y color; cambia destino a archivo']],{'mas-cuatro':'igual','mas-uno':'interno',apagado:'destino'},'Sumar cuatro conserva r. De 4 a 5, r pasa 0→1 y color azul→verde, ambos en pantalla con e=1. Cambiar solo e a 0 conserva r/color y dirige a archivo.',all,'table','retention7');
mc('reserva-retencion-auditoria','apply','Audita este registro: A: n=2,r=2,c=ámbar,e=1,alarma; B: n=3,r=3,c=rojo,e=0,alarma; C: n=4,r=0,c=azul,e=1,pantalla; D: n=5,r=1,c=verde,e=1,pantalla. ¿Qué reparación restaura las reglas?',[['b','En B cambiar únicamente destino a archivo'],['a','En A cambiar únicamente destino a pantalla'],['c','En C cambiar únicamente r a 4'],['d','En D cambiar únicamente color a rojo']],'b','B tiene normalización y color correctos; su e=0 exige archivo. A,C,D son consistentes con las tres reglas. r=4 sería error de interfaz.',all,'case','retention30',{a:'Ámbar con e=1 exige alarma, ya registrada correctamente.',c:'N nunca produce r=4; C tiene r=0 correcto.',d:'r=1 se codifica verde, no rojo.'});
const objective={key:'integrar-neral',title:'Integrar N→C→E para calcular, ordenar y comprobar la salida del circuito Neral.',unitKey:'circuito-neral',verb:'integrate',criticality:'core',required:true,prerequisiteKeys:[],sourceKeys:all,comparisonGroup:null,misconceptions:[{key:'confundir-cociente',description:'Usar el cociente como salida de N.',critical:true,remediationActivityKey:'remediar-cociente',verificationActivityKeys:['calculo-residuo']},{key:'ignorar-interruptor',description:'Enviar rojo a alarma aunque e=0.',critical:true,remediationActivityKey:'remediar-interruptor',verificationActivityKeys:['interruptor-cero']}]};
const initial=['calculo-residuo','tabla-colores','interruptor-cero','orden-compuertas','datos-insuficientes'];
const assessment=(key,kind,candidates,after=null)=>({key,kind,afterUnitKey:after,objectiveKeys:[objective.key],candidateActivityKeys:candidates,thresholdPercent:80,thresholdRationale:kind==='diagnostic'?'Diagnóstico optativo y de bajo riesgo; el campo 80 no funciona como gate.':'Umbral editorial 80 de la política guided-v2.0 para este circuito sintético; no acredita eficacia educativa universal.'});
const pack={schemaVersion:'2.0',packageKey:'circuito-neral',revision:1,locale:'es',route:{slug:'circuito-neral',title,summary:'Ruta sintética: recuperar reglas, conectar dependencias y aplicar N→C→E; no representa contenido médico.',topicLabel:title,audience:'Audiencia universitaria como supuesto; fixture de software ficticio.',discipline:'general',coverKey:'heart'},policyVersion:'guided-v2.0',sources,assets:[],objectives:[objective],units:[{key:'circuito-neral',title:'De la entrada al destino',objectiveKeys:[objective.key],activityKeys:acts.map(a=>a.key),support:'full',estimatedMinutes:null}],activities:acts,assessments:[assessment('diagnostico','diagnostic',['diagnostico-residuo']),assessment('gate-circuito','unit_gate',initial,'circuito-neral'),assessment('final','final',['reserva-final-trazas']),assessment('retencion-siete','retention7',['reserva-retencion-cambios']),assessment('retencion-treinta','retention30',['reserva-retencion-auditoria'])],reviewPlan:{objectiveKeys:[objective.key]},editorial:{notes:'Guía íntegra versión 1, fixture T045, única fuente; fragmentos provided sin revisión externa. Una unidad integra las tres compuertas porque la capacidad observable es calcular/comprobar el circuito; CORE es indispensable para el único recorrido, sin objetivos redundantes. No hay dependencias entre objetivos (DAG de un nodo); el orden causal N→C→E sí se enseña. Cinco demandas iniciales: residuo, tabla de codificación, prioridad del interruptor, orden y suficiencia de datos. Las reservas cambian la demanda: trazas completas, clasificación de perturbaciones y auditoría de un registro multivariable. Todas tienen claves de familia exclusivas; variantes solo numéricas no se presentan como familias adicionales. Dos misconceptions críticas derivan de confusiones de las reglas expresas y tienen remediación/verificación inicial. Diagnóstico optativo breve por un solo CORE raíz. Una unidad no necesita checkpoint separado. coverKey heart es una opción de enum sin significado médico y requiere valoración editorial. Cero assets; tablas representadas como texto/pares. Contrato aceptado provisionalmente con excepción del usuario; Q19/V04, Narrator y discrepancia manual continúan NO VERIFICADO. Catálogo, aprobación editorial del hash, importación y publicación siguen pendientes.',unresolvedIssues:[]}};
const routePath=path.join(out,'ruta.koraz-route.json');fs.writeFileSync(routePath,JSON.stringify(pack,null,2)+'\n');
const packageHash=sha(fs.readFileSync(routePath));
const draft=run('validate-route.mjs',[routePath]), publish=run('validate-route.mjs',['--publish',routePath]);
const results=[draft,publish].map(r=>{try{return JSON.parse(r.stdout)}catch{return {valid:false,parseError:true,stdout:r.stdout}}});
fs.writeFileSync(path.join(out,'validation-draft.json'),JSON.stringify(results[0],null,2)+'\n');fs.writeFileSync(path.join(out,'validation-publish.json'),JSON.stringify(results[1],null,2)+'\n');
const assetList={count:0,assets:[],reason:'La guía no tiene figuras; las tablas son texto del fixture y no requieren reconocimiento espacial.',catalogBinding:'Pendiente de resolver tema y las tres claves de fuente en Koraz; ningún asset que vincular.'};fs.writeFileSync(path.join(out,'assets-pendientes.json'),JSON.stringify(assetList,null,2)+'\n');
log.validations=[{check:'resource-identity',status:identity.exitCode===0?'PASS':'FAIL',exitCode:identity.exitCode},{check:'structure',status:results[0].valid?'PASS':'FAIL',exitCode:draft.exitCode,result:results[0]},{check:'portable-coverage',status:results[1].publishable?'PASS':'FAIL',exitCode:publish.exitCode,result:results[1]}];
log.guide={path:guide,version:'1',sha256:guideHash,bytes:original.length,read:'Completo'};log.package={path:routePath,sha256:packageHash,bytes:fs.statSync(routePath).size};log.counts={units:1,objectives:1,requiredObjectives:1,activities:acts.length,initialObjectiveFamilies:5,reserveFamilies:3,diagnosticItems:1,assessments:5,sources:3,assets:0};
log.authoringRounds=previous?2:1;log.externalEffects='Ninguno: no importación, publicación, instalación ni cambio de sistema.';
fs.writeFileSync(path.join(out,'execution-log.json'),JSON.stringify(log,null,2)+'\n');
const issues=results.flatMap(r=>r.issues||[]);
const report=`# Revisión de ruta: Circuito de señales Neral

Tema: Circuito de señales Neral. Disciplina: general. Fixture sintético, no médico. Audiencia universitaria supuesta. Guía versión 1 (T045, 10-10-2026), leída completa. Fuente única: fixture local Koraz T045; no bibliografía externa ni figuras.

SHA-256 de bytes originales de guía: \`${guideHash}\`.
SHA-256 del JSON exacto: \`${packageHash}\` (${log.package.bytes} bytes, UTF-8 sin BOM).
Contrato 2.0 / guided-v2.0. La identidad de recursos: ${identity.exitCode===0?'PASS':'FAIL'}. Node ${process.version}. Aceptación provisional con excepción del usuario: Q19/V04, inspección Narrator y discrepancia del recorrido manual continúan **NO VERIFICADO**. No acredita Hito S original 24/24.

## Comprobaciones

| Comprobación | Resultado | Alcance |
|---|---|---|
| Estructura | ${results[0].valid?'PASS':'FAIL'} | valid=${results[0].valid}; exit ${draft.exitCode} |
| Cobertura portable | ${results[1].publishable?'PASS':'FAIL'} | publishable=${results[1].publishable}; exit ${publish.exitCode}; solo validación local |
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

Conteos reales: 1 unidad, 1 CORE requerido, ${acts.length} actividades, 3 fragmentos fuente, 5 evaluaciones, 0 assets. Explicación → ejemplo resuelto → parcial → intentos independientes, con feedback posterior. Las dos remediaciones no añaden familias objetivas.

| Familia / actividad | Demanda y evidencia | Uso | Fase / representación | Fragmentos |
|---|---|---|---|---|
${acts.map(a=>`| ${a.key} | ${a.kind}: ${a.prompt.replaceAll('|','/')} | ${a.use} | ${a.phase} / ${a.representation} | ${a.sourceKeys.join(', ')} |`).join('\n')}

Cinco familias iniciales objetivas: cálculo del residuo, tabla de codificación, prioridad del interruptor, secuencia causal, suficiencia de datos. Tres recuperaciones y dos aplicaciones; las aplicaciones case difieren de explicaciones text. La elaboración autorreportada enlaza datos-insuficientes como verificación objetiva. Respuestas y feedback son editoriales para el importador, no un manifiesto público de alumno.

Reservas exclusivas: final pide tres trazas completas; retention7 compara efectos de tres perturbaciones; retention30 localiza y repara un error en una tabla de ejecución. Son demandas distintas, no simples cambios de nombres/números. Familias y actividades reservadas no participan en diagnóstico, gate, remediación ni otra reserva. El diagnóstico tiene un ítem optativo del único CORE raíz: aviso de brevedad aceptado, no gate. Gate usa las cinco familias iniciales. Una unidad no exige checkpoint separado. Umbral 80 es decisión del producto/editorial, no afirmación científica. reviewPlan incluye el único requerido; no se crean agenda, dominio ni progreso.

Errores críticos: confundir cociente (respuesta dos de calculo-residuo) e ignorar e=0 (respuesta alarma de interruptor-cero); cada uno enlaza remediación específica y verificación inicial del mismo objetivo. La verificación repetida es comprobación, no nueva familia.

## Fuentes, conflictos y assets

Los excerpts son copias literales de las secciones completas con el mismo SHA-256 original, heading/sectionPath exactos y página null. verification=provided; checkedAt=null: material suministrado sin verificación externa. Las tres secciones se cotejaron para el contenido, sin certificar autoría/derechos fuera del fixture. Los cálculos 9 mod 4 y perturbaciones 4→8/5 son aplicaciones directas de reglas del documento. No se detectaron contradicciones materiales en los pasajes leídos ni cobertura fuera del tema solicitado.

Cero assets: lista en assets-pendientes.json; no hay archivo, hash, crédito o derecho de imagen que inventar. No hace falta imagen para esta capacidad; las tablas son texto revisable. coverKey=heart obedece al enum del contrato y no atribuye contenido médico a la ruta.

Issues del validador (conservar avisos):

\`\`\`json
${JSON.stringify(issues,null,2)}
\`\`\`

${log.authoringRounds} rondas de autoría y validación; no modificaciones de esquema, bundle, política ni guía. ${previous?'Se conservan JSON/hash y validaciones de la primera ronda en round-1-*. La reparación reemplazó la palabra española «todo» por «cualquier», que expresan la misma regla, para evitar su detección como marcador TODO.':''} Detalles y exit codes en execution-log.json; resultados crudos en validation-draft.json y validation-publish.json. ${results[0].valid?'El paquete es estructuralmente válido e importable como borrador dentro del contrato portable.':'El paquete es inválido y no debe llamarse importable.'} ${results[1].publishable?'La cobertura portable es suficiente; no constituye autorización para publicar.':'La publicación portable permanece bloqueada por los diagnósticos indicados.'}

## Pasos pendientes

Abrir el editor de rutas Koraz → importar ruta.koraz-route.json como borrador → resolver tema y fuentes del catálogo → atender avisos/incidencias y revisar portada → previsualizar → solicitar revisión editorial humana del SHA-256 exacto → revalidar bindings, derechos y autorización antes de publicar. Esta entrega no importó, publicó, instaló ni modificó sistemas.
`;
fs.writeFileSync(path.join(out,'revision-de-ruta.md'),report);
console.log(JSON.stringify({guideHash,packageHash,counts:log.counts,draft:results[0],publish:results[1]},null,2));
