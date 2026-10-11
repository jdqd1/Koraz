import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
const out=path.dirname(fileURLToPath(import.meta.url)), root=path.dirname(out), skill=path.join(root,'skill'), input=path.join(root,'guia.md');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const log={node:process.version,scope:'Autoría aislada: solo guía y bundle round-2; escrituras solo output.',commands:[
{command:'Get-Content -LiteralPath <round-2>/skill/SKILL.md -Raw; Get-Content -LiteralPath <round-2>/guia.md -Raw',exitCode:0,result:'Lectura completa de skill y guía.'},
{command:'Get-Content contrato-koraz-2.0.md, pedagogia.md y cobertura-por-disciplina.md desde <round-2>/skill/references',exitCode:0,result:'Tres referencias completas; se incorporan recuperación diferida y distinción hash archivo/snapshot.'},
{executable:process.execPath,command:'-e leer esquema completo; emitir campos root/route/objective y payloads study/single_choice/short_answer/constructed_response/match/sequence; leer ejemplo estructural.',exitCode:0,result:'Consulta directa del esquema y ejemplo completos pertinentes, solo desde assets del bundle.'}
],aliases:{'<round-2>':root},validationRounds:[],externalEffects:'Ninguno: sin importación, publicación, instalación, SQL, red ni modificación de sistemas.'};
const saveLog=()=>fs.writeFileSync(path.join(out,'execution-log.json'),JSON.stringify(log,null,2)+'\n');
const run=(name,args)=>{const r=spawnSync(process.execPath,[path.join(skill,'scripts',name),...args],{cwd:skill,encoding:'utf8'});const entry={executable:process.execPath,args:[path.join(skill,'scripts',name),...args],cwd:skill,exitCode:r.status,stdout:r.stdout,stderr:r.stderr};log.commands.push(entry);saveLog();return entry;};
const identity=run('verify-resources.mjs',[]);if(identity.exitCode!==0)throw Error('Identidad fallida: exportación detenida.');
const bytes=fs.readFileSync(input), guide=bytes.toString('utf8'), guideHash=sha(bytes), title='Circuito de señales Neral';
const headings=['1. Normalización del contador','2. Codificación del residuo','3. Enrutamiento de la salida'], keys=['normalizacion','codificacion','enrutamiento'];
const sources=headings.map((heading,i)=>({key:keys[i],kind:'guide',title,citation:'Fixture local Koraz T045. Circuito de señales Neral. Versión 1. 2026.',locator:{heading,sectionPath:[title,heading],page:null},documentSha256:guideHash,excerpt:guide.slice(guide.indexOf('## '+heading)+heading.length+4,guide.indexOf('## '+(headings[i+1]||'Bibliografía y figuras'))).trim(),url:null,verification:'provided',checkedAt:null}));
const acts=[], all=[...keys];
function add(key,phase,kind,prompt,payload,explanation,sourceKeys=all,representation='text',use='learning',required=true){const a={key,objectiveKey:'integrar-circuito',relatedObjectiveKeys:[],phase,required,sourceKeys,representation,equivalenceKey:key,hints:[],use,prompt,feedback:{explanation,commonError:'',sourceKeys},misconceptionMappings:[],alternativeActivityKey:null,kind,payload};acts.push(a);return a;}
function study(key,phase,body,scaffold='explanation',src=all){return add(key,phase,'study','Estudia las reglas y dependencias del circuito ficticio.',{body,focusSpans:[],assetKey:null,scaffold,videoRange:null},body,src);}
function choice(key,phase,prompt,options,correct,explanation,src=all,repr='text',use='learning',incorrect={},required=true){return add(key,phase,'single_choice',prompt,{options:options.map(([key,text])=>({key,text})),correctKey:correct,distractorFeedback:Object.fromEntries(options.filter(([k])=>k!==correct).map(([k])=>[k,incorrect[k]||explanation]))},explanation,src,repr,use,required);}
function short(key,phase,prompt,answers,model,explanation,src=all,repr='text',use='learning'){return add(key,phase,'short_answer',prompt,{acceptedAnswers:answers,maxChars:100,modelAnswer:model,normalization:'nfkc-lower-space'},explanation,src,repr,use);}
function pairs(key,phase,prompt,prompts,choices,correctByPrompt,explanation,src=all,use='learning'){return add(key,phase,'match',prompt,{presentation:'comparison_table',prompts:prompts.map(([key,text])=>({key,text})),choices:choices.map(([key,text])=>({key,text})),correctByPrompt,allowReuse:false,edges:[]},explanation,src,'table',use);}
choice('diagnostico-preservacion','activate','Sin ayuda: además de decidir destino, ¿qué variables de entrada altera E?',[['ninguna','No altera n, r ni c'],['residuo','Recalcula r'],['color','Cambia c']],'ninguna','E decide el destino sin alterar n, r ni c, según la sección 3.',[keys[2]],'text','diagnostic',{residuo:'La normalización pertenece a N; E no altera r.',color:'La codificación pertenece a C; E no altera el color.'},false);
study('explicacion','learn','El sistema Neral es ficticio. N normaliza n mediante r=n mod 4; descarta el cociente. C convierte 0,1,2,3 en azul, verde, ámbar, rojo. E usa c y e: e=0 lleva a archivo; con e=1 azul/verde llevan a pantalla y ámbar/rojo a alarma. El orden causal es N→C→E, y e no modifica r ni c.');
study('ejemplo-resuelto','learn','Ejemplo de guía: n=8,e=1. 8 mod 4=0; C produce azul; E dirige a pantalla. El resto es la entrada de C; no se pasa el cociente.','worked_example');
study('ejemplo-parcial','learn','n=6,e=0. Ya se calculó r=2. Antes de consultar el feedback, completa color y destino mentalmente.','partial_example');
acts.at(-1).feedback.explanation='El modelo es r=2, c=ámbar, destino=archivo. El color depende del residuo y e=0 dirige a archivo cualquiera que sea c.';
add('elaborar-datos','elaborate','constructed_response','Explica por qué conocer el color no permite recuperar n completo y por qué r no basta para decidir destino sin e.',{rubric:[{key:'entrada-residuo',criterion:'Distingue la entrada original de la clase de residuo.',example:'2,6,10,14 tienen r=2, aunque n sea distinto.'},{key:'dependencia-e',criterion:'Relaciona color e interruptor al destino.',example:'r=1 implica verde, pero e decide archivo o pantalla.'}],modelAnswer:'C conserva la identidad del residuo, no la de la entrada: valores separados por cuatro comparten color. Para el destino falta e: r=1/verde puede ir a archivo con e=0 o pantalla con e=1.',verificationActivityKey:'inferir-dato-faltante'},'La sección 2 describe pérdida de n; la sección 3 exige e para elegir destino. Esta elaboración es autorreporte; la comprobación objetiva es inferir-dato-faltante.',[keys[0],keys[1],keys[2]]);
const n=choice('recuperar-regla-n','retrieve','Recupera la regla de N: ¿cuál es exactamente su salida?',[['residuo','El residuo de dividir n entre cuatro'],['cociente','El cociente de dividir n entre cuatro'],['entrada','La entrada n completa']],'residuo','N conserva r=n mod 4 y descarta el cociente y n completo como salida.',[keys[0]],'text','learning',{cociente:'El cociente se descarta; la salida es el residuo.',entrada:'La entrada n no es la salida; se conserva exclusivamente r.'});
n.misconceptionMappings=[{responseKey:'cociente',misconceptionKey:'cociente-por-residuo'}];
pairs('recuperar-tabla-c','retrieve','Reconstruye la tabla completa de C relacionando residuo y color.',[['r-cero','r=0'],['r-uno','r=1'],['r-dos','r=2'],['r-tres','r=3']],[['color-rojo','rojo'],['color-verde','verde'],['color-azul','azul'],['color-ambar','ámbar']],{'r-cero':'color-azul','r-uno':'color-verde','r-dos':'color-ambar','r-tres':'color-rojo'},'La sección 2 define 0→azul, 1→verde, 2→ámbar y 3→rojo.',[keys[1]]);
const e=choice('aplicar-prioridad-e','apply','Caso sintético: E recibe rojo con e=0. El operador propone alarma. ¿Qué destino cumple la regla?',[['archivo','archivo'],['alarma','alarma'],['pantalla','pantalla']],'archivo','e=0 dirige a archivo cualquiera que sea el color. Rojo va a alarma solamente con e=1.',[keys[2]],'case','learning',{alarma:'Ignora e=0; alarma para rojo corresponde a e=1.',pantalla:'Pantalla exige e=1 y azul/verde; aquí corresponde archivo.'});
e.misconceptionMappings=[{responseKey:'alarma',misconceptionKey:'ignorar-e'}];
add('recuperar-orden','retrieve','sequence','Reconstruye el orden de las compuertas recordando sus dependencias de datos.',{items:[{key:'e',text:'E recibe c y e para decidir destino.'},{key:'c',text:'C recibe r para producir c.'},{key:'n',text:'N recibe n para producir r.'}],acceptedOrders:[['n','c','e']],whyActivityKey:'elaborar-datos'},'N produce r para C, y C produce c para E. El orden establecido es N→C→E.',all,'diagram','gate');
short('inferir-dato-faltante','apply','Un registro contiene r=1 y ningún valor de e. ¿El destino es único? Escribe «indeterminado» si faltan datos para elegir.', ['indeterminado','indeterminada','no se puede determinar','no puede determinarse'],'indeterminado','r=1 implica verde. Con e=0 iría a archivo y con e=1 a pantalla: falta e.',[keys[1],keys[2]],'case','gate');
study('remediar-n','remediate','Divide n entre cuatro y separa cociente de residuo: solo r se transmite a C. r está en {0,1,2,3}. Verifica la confusión nuevamente con recuperar-regla-n.','explanation',[keys[0]]);
study('remediar-e','remediate','Primero lee e: si vale cero, el destino es archivo. Solo con e=1 clasifica azul/verde frente a ámbar/rojo. Verifica esta prioridad con aplicar-prioridad-e.','explanation',[keys[2]]);
pairs('final-trazas','apply','Calcula las trazas completas de estas entradas sintéticas y empareja r/color/destino.',[['entrada-a','n=8,e=1'],['entrada-b','n=11,e=1'],['entrada-c','n=6,e=0']],[['traza-b','3 / rojo / alarma'],['traza-c','2 / ámbar / archivo'],['traza-a','0 / azul / pantalla']],{'entrada-a':'traza-a','entrada-b':'traza-b','entrada-c':'traza-c'},'Son los tres ejemplos completos de la sección 3: N calcula residuo, C codifica y E considera e.',all,'final');
short('retencion-siete-dominio-e','retrieve','Sin ayuda ni caso de entrada: escribe los dos únicos valores permitidos del interruptor e, de menor a mayor.', ['0,1','0, 1','0 y 1','0 1','{0,1}','{0, 1}','cero y uno'],'0 y 1','La sección 3 admite exclusivamente 0 y 1 para e. Se recupera el dominio permitido, sin calcular una traza.',[keys[2]],'text','retention7');
short('retencion-treinta-invarianza','retrieve','Recupera la regla memorizada de invariancia: «Sumar ___ a n conserva r; con e=1 también conserva color y destino». Escribe el incremento que menciona la guía.', ['4','cuatro'],'4','La sección 1 establece sumar cuatro; la sección 3 conserva además color y salida con e=1. Se recupera la regla explícita sin resolver nuevas entradas.',[keys[0],keys[2]],'text','retention30');
const initial=['recuperar-regla-n','recuperar-tabla-c','aplicar-prioridad-e','recuperar-orden','inferir-dato-faltante'];
const objective={key:'integrar-circuito',title:'Integrar las reglas N→C→E para calcular y comprobar el destino del circuito Neral.',unitKey:'unidad-circuito',verb:'integrate',criticality:'core',required:true,prerequisiteKeys:[],sourceKeys:all,comparisonGroup:null,misconceptions:[{key:'cociente-por-residuo',description:'Transmitir el cociente en lugar del residuo de N.',critical:true,remediationActivityKey:'remediar-n',verificationActivityKeys:['recuperar-regla-n']},{key:'ignorar-e',description:'Enviar rojo a alarma sin respetar e=0.',critical:true,remediationActivityKey:'remediar-e',verificationActivityKeys:['aplicar-prioridad-e']}]};
const assess=(key,kind,candidates,afterUnitKey=null)=>({key,kind,afterUnitKey,objectiveKeys:[objective.key],candidateActivityKeys:candidates,thresholdPercent:80,thresholdRationale:kind==='diagnostic'?'Diagnóstico optativo de bajo riesgo; el campo 80 no funciona como gate ni concede dominio.':'Umbral editorial 80 de guided-v2.0 para el fixture sintético; no se atribuye eficacia universal ni competencia clínica.'});
const notes='Guía sintética versión 1, leída completa. Una sola unidad y un CORE de integración porque el resultado observable es comprobar el circuito, sin inflar tres reglas cortas en objetivos redundantes. DAG de un nodo sin aristas; N→C→E se evalúa como dependencia de datos. Cinco familias iniciales distintas: regla de N, tabla de C, prioridad de e, orden causal y suficiencia de datos; tres recuperaciones y dos aplicaciones case distintas de explicación text. Final integra trazas completas. retention7 recupera dominio de e y retention30 recupera invariancia +4: demandas de memoria explícita, no aplicaciones renombradas; familias reservadas exclusivas. Orden inicial retrieve,retrieve,apply,retrieve,apply; final apply y retenciones retrieve,retrieve permiten ventanas de cinco con dos recuperaciones y aplicación en una trayectoria correcta de familias nuevas. No se afirma dominio ni consolidación real: depende del servidor, tiempos, respuestas y errores. Dos confusiones críticas derivadas de reglas tienen mapeo incorrecto, remediación y verificación inicial. Diagnóstico de un CORE raíz optativo y breve; una unidad no requiere checkpoint. Cero assets, tablas textuales. coverKey heart obedece al enum; no es contenido médico. provided sin revisión independiente. documentSha256 es hash de bytes originales; payload_hash del snapshot canónico del catálogo puede diferir y sigue pendiente. Una importación posterior autorizada deberá cotejar revisión/excerpts, conservar ambos hashes y cambios y revalidar paquete; no inventar ni forzar igualdad. Contrato provisional con excepción del usuario; Q19/V04, Narrator y discrepancia manual NO VERIFICADO. Catálogo, importación, revisión humana y publicación pendientes.';
const pack={schemaVersion:'2.0',packageKey:'circuito-neral',revision:1,locale:'es',route:{slug:'circuito-neral',title,summary:'Ruta de software ficticio sobre normalización, codificación y destino de señales. No representa contenido médico.',topicLabel:title,audience:'Audiencia universitaria supuesta; ejercicio sintético de software.',discipline:'general',coverKey:'heart'},policyVersion:'guided-v2.0',sources,assets:[],objectives:[objective],units:[{key:'unidad-circuito',title:'De la entrada al destino',objectiveKeys:[objective.key],activityKeys:acts.map(a=>a.key),support:'full',estimatedMinutes:null}],activities:acts,assessments:[assess('diagnostico','diagnostic',['diagnostico-preservacion']),assess('gate-unidad','unit_gate',initial,'unidad-circuito'),assess('final','final',['final-trazas']),assess('retencion-siete','retention7',['retencion-siete-dominio-e']),assess('retencion-treinta','retention30',['retencion-treinta-invarianza'])],reviewPlan:{objectiveKeys:[objective.key]},editorial:{notes,unresolvedIssues:[]}};
const file=path.join(out,'ruta.koraz-route.json');fs.writeFileSync(file,JSON.stringify(pack,null,2)+'\n');const packageHash=sha(fs.readFileSync(file));
const checks=[run('validate-route.mjs',[file]),run('validate-route.mjs',['--publish',file])], results=checks.map(c=>JSON.parse(c.stdout));
checks.forEach((c,i)=>fs.writeFileSync(path.join(out,i?'validation-publish.json':'validation-draft.json'),JSON.stringify(results[i],null,2)+'\n'));
const assets={count:0,assets:[],reason:'No hay figuras; las tablas son texto del fixture. Ningún archivo de imagen, hash ni licencia que inventar.',pendingBindings:{topic:'Circuito de señales Neral',sourceKeys:keys,assetKeys:[]}};fs.writeFileSync(path.join(out,'assets-pendientes.json'),JSON.stringify(assets,null,2)+'\n');
const sequence=[...initial,'final-trazas','retencion-siete-dominio-e','retencion-treinta-invarianza'];const windows=[];
for(let end=4;end<sequence.length;end++){const names=sequence.slice(end-4,end+1), rows=names.map(k=>acts.find(a=>a.key===k));windows.push({after:sequence[end],families:names,retrieval:rows.filter(a=>a.phase==='retrieve').length,application:rows.filter(a=>a.phase==='apply').length});}
log.guide={path:input,version:'1',sha256:guideHash,bytes:bytes.length,read:'Completo'};log.package={path:file,sha256:packageHash,bytes:fs.statSync(file).size};log.counts={units:1,objectives:1,requiredObjectives:1,activities:acts.length,initialFamilies:5,initialRetrievalFamilies:3,initialApplicationFamilies:2,reserveFamilies:3,retentionRetrievalFamilies:2,assessments:5,sources:3,assets:0};
log.validationRounds.push({round:1,packageSha256:packageHash,draft:{exitCode:checks[0].exitCode,result:results[0]},publish:{exitCode:checks[1].exitCode,result:results[1]}});
log.authorAudit={sourceExcerptsLiteral:sources.every(s=>guide.includes(s.excerpt)),reserveFamiliesExclusive:true,plannedNewFamilyWindows:windows,scope:'Auditoría del diseño local; no ejecución del servidor, dominio o consolidación.'};saveLog();
const report=`# Revisión de Circuito de señales Neral

Tema: Circuito de señales Neral; disciplina general. Fixture sintético de software no médico. Audiencia universitaria asumida. Guía versión 1, autoría fixture local Koraz T045, 2026; lectura completa de título, tres secciones, tablas, ejemplos y Bibliografía y figuras. No hay bibliografía externa ni figuras.

SHA-256 de bytes originales de guía: \`${guideHash}\`.
SHA-256 del paquete editorial exacto: \`${packageHash}\` (${log.package.bytes} bytes; UTF-8 sin BOM).
Contrato schema 2.0 / guided-v2.0; Node ${process.version}. Recursos congelados: ${identity.exitCode===0?'PASS':'FAIL'}. Aceptación provisional con excepción del usuario: Q19/V04, inspección real Narrator y discrepancia manual **NO VERIFICADO**; no acredita Hito S original 24/24.

## Resultados y límites

| Comprobación | Resultado | Evidencia/límite |
|---|---|---|
| Estructura | ${results[0].valid?'PASS':'FAIL'} | valid=${results[0].valid}, exit ${checks[0].exitCode} |
| Cobertura portable | ${results[1].publishable?'PASS':'FAIL'} | publishable=${results[1].publishable}, exit ${checks[1].exitCode}; no publicación |
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

Conteos: 1 unidad, 1 objetivo CORE requerido, ${acts.length} actividades, 5 familias objetivas iniciales (3 retrieve, 2 apply), 3 reservas, 5 evaluaciones, 3 fragmentos fuente, 0 assets.

| Actividad / familia | Formato | Fase / uso / representación | Fuentes y feedback |
|---|---|---|---|
${acts.map(a=>`| ${a.key} | ${a.kind} | ${a.phase} / ${a.use} / ${a.representation} | ${a.sourceKeys.join(', ')} |`).join('\n')}

Familias iniciales: salida exclusiva de N, tabla completa de C, prioridad del interruptor en caso, secuencia dependiente y suficiencia de datos. Son demandas distintas, no variantes léxicas. Las aplicaciones case difieren de explicaciones text. Final integra tres trazas y evalúa aplicación completa. retention7 recupera valores permitidos de e, sin calcular; retention30 recupera la invariancia de sumar cuatro, sin perturbación nueva. Sus demandas son diferentes entre sí y de las iniciales. Reservas exclusivas, fuera de gate, diagnóstico, remediación y otras reservas. Diagnóstico optativo de un CORE raíz; aviso breve conservado. Gate usa cinco familias iniciales. Una unidad no necesita checkpoint separado. Umbral 80 es política/editorial de producto, no evidencia científica universal.

Ventanas del orden planeado con familias nuevas y respuestas correctas: 

| Después de | Cinco familias | retrieve | apply |
|---|---|---:|---:|
${windows.map(w=>`| ${w.after} | ${w.families.join(', ')} | ${w.retrieval} | ${w.application} |`).join('\n')}

Cada ventana planeada conserva al menos dos recuperaciones y una aplicación. Repetir gate/remediación no crea una familia nueva. No se ejecutó el motor ni se verificaron tiempos, puntuación, último acierto o errores cerrados; cobertura portable y diseño de ventanas no prueban consolidación. reviewPlan solo incluye la clave requerida.

## Fuentes, catálogo y assets

Se usa una única guía con tres claves de fragmento. Cada excerpt es literal, heading/sectionPath exactos y page=null; hash igual al archivo original. verification=provided y checkedAt=null, sin revisión independiente. No se detectaron conflictos materiales en pasajes leídos. La guía declara todas las reglas; no se añadió conocimiento clínico ni citas externas.

**Catálogo pendiente:** documentSha256 portable conserva SHA-256 de bytes originales. Koraz lo debe comparar con payload_hash de la revisión de recurso seleccionada, calculado sobre snapshot canónico; puede diferir pese al mismo texto. Un SOURCE_CHANGED exige cotejar versión, contenido y cada excerpt con esa revisión exacta. Solo una importación posterior autorizada podrá sustituir documentSha256 por el hash comprobado del catálogo, conservando original, ambos hashes y lista de cambios. No forzar igualdad ni suprimir controles. Revalidar y revisar el nuevo hash del paquete. No se consultó ni modificó catálogo.

Cero assets: assets-pendientes.json lo declara; no hay archivo, hash, créditos o derechos de imagen que inventar. Las tablas son texto revisable. coverKey=heart es una opción obligatoria del enum sin significado médico; requiere criterio editorial de portada.

Issues del validador:

\`\`\`json
${JSON.stringify(results[1].issues,null,2)}
\`\`\`

Una ronda de autoría/validación. Se conservan stdout, stderr, exit codes y hashes en execution-log.json; resultados completos en validation-draft.json y validation-publish.json. ${results[0].valid?'Paquete estructuralmente válido, importable como borrador bajo contrato portable.':'Paquete inválido, no importable.'} ${results[1].publishable?'Cobertura portable suficiente; publicación requiere comprobaciones dentro de Koraz.':'Cobertura portable bloqueada; corregir incidencias antes de publicar.'}

## Pendientes

Abrir editor de rutas Koraz → importar como borrador → resolver tema y las tres fuentes del catálogo, cotejando snapshot/excerpts y hashes → atender avisos y portada → previsualizar → solicitar revisión editorial humana del hash exacto → revalidar bindings, derechos y autorización antes de publicar. No hay assets que vincular. No se importó, publicó ni instaló; no se modificaron sistemas.
`;
fs.writeFileSync(path.join(out,'revision-de-ruta.md'),report);
console.log(JSON.stringify({guideHash,packageHash,counts:log.counts,results,windows},null,2));
