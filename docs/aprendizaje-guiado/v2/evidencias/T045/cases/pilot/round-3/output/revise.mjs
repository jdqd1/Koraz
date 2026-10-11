import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const out=import.meta.dirname, base=path.dirname(out), skill=path.join(base,'skill');
const previous=path.join(path.dirname(base),'round-2','output');
const node='C:\\Users\\josed\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const json=(file,value)=>fs.writeFileSync(path.join(out,file),JSON.stringify(value,null,2)+'\n','utf8');
const candidateBytes=fs.readFileSync(path.join(previous,'ruta.koraz-route.json'));
const candidate=JSON.parse(candidateBytes), route=structuredClone(candidate);
const previousReportBytes=fs.readFileSync(path.join(previous,'revision-de-ruta.md'));
const guideBytes=fs.readFileSync(path.join(base,'guia.md')), guide=guideBytes.toString('utf8');
const guideHash=sha(guideBytes), oldHash=sha(candidateBytes), changes=[];
const schema=JSON.parse(fs.readFileSync(path.join(skill,'assets','koraz-route-2.0.schema.json'),'utf8'));
if(schema.properties.schemaVersion.const!==route.schemaVersion)throw Error('Versión incompatible: exportación detenida.');
if(!route.sources.every(s=>s.documentSha256===guideHash&&guide.includes(s.excerpt)))throw Error('Fuente distinta del candidato: cotejo y revisión necesarios.');
const act=key=>route.activities.find(a=>a.key===key);
const set=(key,parts,value,reason)=>{
 const index=route.activities.findIndex(a=>a.key===key),a=route.activities[index];
 if(index<0)throw Error(`Clave no encontrada: ${key}`);
 let target=a;for(const part of parts.slice(0,-1))target=target[part];
 const field=parts.at(-1),before=target[field];
 if(before===value)return;
 target[field]=value;
 changes.push({activityKey:key,path:`/activities/${index}/${parts.join('/')}`,before,after:value,reason,sourceKeys:a.sourceKeys,sourceLocators:a.sourceKeys.map(k=>route.sources.find(s=>s.key===k).locator),sourceDocumentSha256:guideHash});
};
const feedback=(key,value,reason)=>{
 set(key,['feedback','explanation'],value,reason);
 for(const option of Object.keys(act(key).payload.distractorFeedback??{}))set(key,['payload','distractorFeedback',option],value,reason);
};
const body=(key,value,reason)=>{set(key,['payload','body'],value,reason);feedback(key,value,reason);};
const meta='Lenguaje del tema: retirar notas de implementación o decisiones editoriales del texto educativo; conservarlas en notas/informe.';
const scope='Conservar alcance, aproximación o variabilidad de la guía; no añadir cuantificadores absolutos.';

feedback('porta-r1','La guía describe la formación de la porta por la unión de VMS y vena esplénica detrás del cuello del páncreas. La terminación de VMI es variable.','Eliminar «constante», calificador que la guía no proporciona para la formación de porta.');
feedback('cava-a2','La vena gonadal izquierda desemboca habitualmente en la vena renal izquierda, mientras que la derecha lo hace habitualmente en la VCI.',meta+' '+scope);
feedback('porta-a2','La sangre portal pasa por ramas portales y sinusoides hepáticos; después regresa por venas centrales y colectoras y venas hepáticas hacia la VCI.',meta);
feedback('cava-r30','Los principales troncos hepáticos superiores descritos son las venas hepáticas derecha, media e izquierda.',meta);
set('cava-r30',['prompt'],'Recuperación diferida sin ayudas: nombra los tres principales troncos hepáticos superiores descritos.',meta+' Retirar instrucción de formato ligada a alias del evaluador; los alias y respuestas aceptadas se conservan en el paquete editorial.');

body('arterias-estudio','La aorta abdominal comienza aproximadamente en T12 después del hiato aórtico, baja algo a la izquierda y termina habitualmente en L4 por bifurcación ilíaca común. La AMS irriga, en términos generales, yeyuno, íleon, ciego, apéndice, colon ascendente y gran parte del transverso. AMI nace aproximadamente en L3, baja retroperitonealmente hacia la izquierda próxima al uréter y continúa como rectal superior; abarca transverso izquierdo, descendente, sigmoide y recto superior. Pancreaticoduodenales comunican sistema celíaco–AMS; la marginal conecta AMS–AMI.',meta+' '+scope+' La omisión del origen ambiguo se conserva como incidencia editorial, sin cambiar la fuente.');
body('arterias-ejemplo','Ejemplo resuelto de discriminación: el inicio aórtico se sitúa aproximadamente en T12; la bifurcación aórtica ocurre habitualmente en L4 y el origen de AMI se sitúa aproximadamente en L3. Asocia cada nivel a su hito para distinguirlos.',scope);
feedback('arterias-r1','La guía sitúa el origen de AMI aproximadamente en L3, inferior a AMS; T12 y L4 corresponden a los hitos aórticos descritos.',scope);
feedback('arterias-a1','La AMI nace de la cara anterior de la aorta aproximadamente en L3, desciende retroperitonealmente hacia la izquierda, próxima al uréter izquierdo, y continúa como rectal superior en la región sigmoidea.',meta);
set('arterias-a2',['payload','options','0','text'],'Aproximadamente T12 tras hiato aórtico → descenso algo a la izquierda → bifurcación ilíaca habitual en L4',scope);
feedback('arterias-r7','La arteria gástrica izquierda asciende hacia la unión esofagogástrica y después recorre la curvatura menor del estómago.',meta+' La incidencia del origen se conserva fuera de la explicación al alumno.');
feedback('arterias-r30','La arteria esplénica sigue un trayecto tortuoso hacia la izquierda, relacionado con el borde superior del páncreas.',meta);

body('cava-estudio','La VCI nace por unión de ilíacas comunes aproximadamente en L5, algo a la derecha y debajo de la bifurcación aórtica. Asciende retroperitonealmente a la derecha de la aorta, ocupa un surco posterior del hígado y atraviesa el centro tendinoso aproximadamente en T8 hasta el atrio derecho. La renal izquierda, más larga, pasa delante de la aorta y detrás de AMS; recibe habitualmente las venas suprarrenal y gonadal izquierdas. La suprarrenal derecha desemboca en VCI; la gonadal derecha termina habitualmente en VCI. Las venas hepáticas derecha, media e izquierda desembocan en VCI retrohepática.',scope);
feedback('cava-r2','La guía describe la suprarrenal derecha hacia VCI y la izquierda hacia la renal izquierda. La gonadal derecha termina habitualmente en VCI y la izquierda en la renal izquierda.',scope);
const cavaElab='Las ilíacas comunes forman la VCI. La vena renal izquierda recibe habitualmente las venas suprarrenal y gonadal izquierdas; la suprarrenal derecha desemboca directamente en VCI y la gonadal derecha termina habitualmente en VCI.';
feedback('cava-elaborar',cavaElab,scope);
set('cava-elaborar',['payload','modelAnswer'],cavaElab,scope);
set('cava-elaborar',['payload','rubric','0','example'],cavaElab,scope);
set('cava-a2',['prompt'],'Revisa un esquema didáctico de drenaje gonadal izquierdo. ¿Qué continuación habitual describe la guía?',scope);
body('cava-remediar','La vena gonadal izquierda termina habitualmente en la vena renal izquierda y la derecha en la VCI. Compara ambos lados con las desembocaduras suprarrenales antes de responder de nuevo sin ayuda.',scope);
feedback('cava-a3','La VCI recibe directamente retorno de miembros inferiores; la mayor parte de la sangre del tubo digestivo atraviesa primero el sistema porta y el hígado.',meta);
feedback('cava-r7','La vena renal izquierda es más larga que la derecha, según la guía.',meta);

feedback('porta-r3','La VMS asciende por la raíz del mesenterio a la derecha de la arteria mesentérica superior.',meta);
feedback('porta-r4','La VMI recoge sangre del recto superior, sigmoide, descendente y sector izquierdo del transverso; sus principales tributarias son rectal superior, sigmoideas y cólica izquierda.',meta);
set('porta-r7',['prompt'],'Recuperación diferida: asocia la terminación de VMI con las posibilidades descritas en la guía.','Conservar variabilidad sin una advertencia de autoría en el enunciado; el feedback conserva frecuencia y alternativas.');
feedback('porta-r30','La porta se forma detrás del cuello del páncreas, pasa por detrás del duodeno superior y por delante de VCI, y después entra en el ligamento hepatoduodenal.',meta);

body('comunicaciones-estudio','Las intercavas unen ambos extremos sistémicos: lumbares ascendentes con ácigos y conexiones inferiores iliolumbares y sacras; toracoepigástricas entre territorios axilar e ilíaco-femoral. Las portosistémicas unen una tributaria portal con una vena sistémica: gástrica izquierda con esofágicas hacia ácigos y hemiácigos; paraumbilicales con superficiales; rectal superior con rectales media e inferior; cólicas con lumbares y retroperitoneales. Las anastomosis portosistémicas normalmente transportan poco flujo y adquieren importancia cuando aumenta la resistencia portal o hepática.',meta+' '+scope+' Precisar que el calificativo de flujo corresponde a portosistémicas y mantener el conflicto clínico en incidencias.');
const communicationsExample='Ejemplo resuelto: lumbares ascendentes y ácigos pertenecen al retorno sistémico, por ello su comunicación es intercava. Gástrica izquierda pertenece al portal y las esofágicas hacia ácigos al sistémico, por ello su conexión es portosistémica.';
body('comunicaciones-ejemplo',communicationsExample,meta);
feedback('comunicaciones-r2','Las conexiones descritas son gástrica izquierda con esofágicas hacia ácigos y hemiácigos; paraumbilicales con venas superficiales; y rectal superior con rectales media e inferior. Conectan un extremo portal con otro sistémico.',meta+' El conflicto clínico permanece en la incidencia, sin retirar la anatomía sustentada.');
feedback('comunicaciones-a1','Las venas lumbares ascendentes se comunican inferiormente con iliolumbares y sacras y se continúan superiormente con el sistema ácigos. Esta vía puede ofrecer un trayecto alternativo hacia VCS ante una obstrucción importante de VCI.',meta+' '+scope);
feedback('comunicaciones-a2','La rectal superior continúa hacia VMI en el sistema porta. Las rectales media e inferior drenan hacia el sistema ilíaco interno y pudendo. La comunicación es portosistémica.',meta+' Se conserva el conflicto clínico y se explica solo la clase anatómica.');
feedback('comunicaciones-r7','Las anastomosis portosistémicas transportan poco flujo en condiciones normales.',meta);

route.revision=candidate.revision+1;
route.editorial.notes+=' Revisión focal de lenguaje: se retiró el calificador no sustentado «constante» de formación portal. Detalles sobre equivalenceKey, conteos de familias y alias del evaluador se mantienen exclusivamente en metadatos editoriales y este informe. Cava-a2 comparte familia cava-r2 y porta-a2 comparte familia porta-a1; no suman familias nuevas. Las permutaciones aceptadas de cava-r30 son alias de respuesta, no nuevas familias ni afirmación de orden anatómico. Se restauraron calificadores aproximado, habitual y en términos generales donde corresponde a la guía. No se cambió temario, respuestas aceptadas, rúbricas de evaluación, objetivos, prerequisitos, reservas, incidencias, fuentes o assets.';
const finalPath=path.join(out,'ruta.koraz-route.json');
const commands=[];
function run(script,args,name){
 const executableScript=path.join(skill,'scripts',script),r=spawnSync(node,[executableScript,...args],{cwd:skill,encoding:'utf8'});
 let result;try{result=JSON.parse(r.stdout)}catch{result={stdout:r.stdout}};
 commands.push({executable:node,args:[executableScript,...args],cwd:skill,exitCode:r.status,stderr:r.stderr,result,packageSha256:args.includes(finalPath)?sha(fs.readFileSync(finalPath)):null});json(name,result);return result;
}
const resources=run('verify-resources.mjs',[],'resource-validation.json');
if(!resources.valid)throw Error('Identidad de recursos inválida: exportación detenida.');
json('ruta.koraz-route.json',route);
const finalHash=sha(fs.readFileSync(finalPath));
const draft=run('validate-route.mjs',[finalPath],'validation-draft.json');
const publish=run('validate-route.mjs',['--publish',finalPath],'validation-publish.json');
const educationalLeaves=[];
function leaves(value,pointer){if(typeof value==='string')educationalLeaves.push({path:pointer,text:value});else if(Array.isArray(value))value.forEach((v,i)=>leaves(v,`${pointer}/${i}`));else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))leaves(v,`${pointer}/${k}`);}
route.activities.forEach((a,i)=>{leaves(a.prompt,`/activities/${i}/prompt`);leaves(a.feedback.explanation,`/activities/${i}/feedback/explanation`);leaves(a.feedback.commonError,`/activities/${i}/feedback/commonError`);leaves(a.hints,`/activities/${i}/hints`);leaves(a.payload,`/activities/${i}/payload`);});
const metadataPattern=/\bfamilias?\b|\balias\b|\bequivalenceKey\b|\bevaluador\b|\bmotor\b|comprobación crítica|no se cuenta como/iu;
const qualifierPattern=/\bconstante\b|\bsiempre\b/iu;
const residualMetadata=educationalLeaves.filter(x=>metadataPattern.test(x.text));
const residualAbsolute=educationalLeaves.filter(x=>qualifierPattern.test(x.text));
const same=x=>JSON.stringify(route[x])===JSON.stringify(candidate[x]);
const protectedActivityFields=['key','objectiveKey','relatedObjectiveKeys','phase','required','sourceKeys','representation','equivalenceKey','hints','use','misconceptionMappings','alternativeActivityKey','kind'];
const protectedPayloadFields=['acceptedAnswers','acceptedOrders','correctKey','correctByPrompt','allowReuse','normalization','maxChars','verificationActivityKey','presentation'];
const checks={
  predecessorUnchanged:sha(fs.readFileSync(path.join(previous,'ruta.koraz-route.json')))===oldHash&&sha(fs.readFileSync(path.join(previous,'revision-de-ruta.md')))===sha(previousReportBytes),
  sameSources:same('sources'),sameObjectives:same('objectives'),sameUnits:same('units'),sameAssessments:same('assessments'),sameReviewPlan:same('reviewPlan'),sameAssets:same('assets'),sameUnresolvedIssues:JSON.stringify(route.editorial.unresolvedIssues)===JSON.stringify(candidate.editorial.unresolvedIssues),
  sameActivityCount:route.activities.length===candidate.activities.length,
  sameActivityBindings:route.activities.every((a,i)=>protectedActivityFields.every(k=>JSON.stringify(a[k])===JSON.stringify(candidate.activities[i][k]))),
  sameCorrectionAnswers:route.activities.every((a,i)=>protectedPayloadFields.every(k=>JSON.stringify(a.payload[k])===JSON.stringify(candidate.activities[i].payload[k]))),
  excerptsLiteral:route.sources.every(s=>guide.includes(s.excerpt)&&s.documentSha256===guideHash),
  noEducationalImplementationMetadata:residualMetadata.length===0,
  noAbsoluteQualifierInEducationalText:residualAbsolute.length===0,
  bothDeferredReservationsRetrieve:route.objectives.every(o=>['retention7','retention30'].every(use=>route.activities.some(a=>a.objectiveKey===o.key&&a.use===use&&a.phase==='retrieve')))
};
json('registro-antes-despues.json',{scope:'Revisión focal sin regenerar temario; todos los campos educativos cotejados. Fuentes originales e incidencias preservadas.',inputPackageSha256:oldHash,outputPackageSha256:finalHash,guideSha256:guideHash,changeCount:changes.length,affectedActivities:[...new Set(changes.map(c=>c.activityKey))],changes,residualMetadata,residualAbsoluteQualifiers:residualAbsolute});
json('comprobaciones-revision.json',{checks,allPass:Object.values(checks).every(Boolean),educationalStringCount:educationalLeaves.length,changedFields:changes.length,limits:'Cotejo editorial local y preservación estructural. No revisión médica independiente ni ejecución de dominio/retención o catálogo.'});
const bank=route.objectives.map(o=>{const initial=route.activities.filter(a=>a.objectiveKey===o.key&&['learning','gate'].includes(a.use)&&['single_choice','short_answer','match','sequence','image_target'].includes(a.kind));return {objectiveKey:o.key,title:o.title,criticality:o.criticality,prerequisites:o.prerequisiteKeys,sourceKeys:o.sourceKeys,evidenceExpected:o.title,initialActivities:initial.length,initialFamilies:[...new Set(initial.map(a=>a.equivalenceKey))],reserves:Object.fromEntries(['final','retention7','retention30'].map(use=>[use,route.activities.filter(a=>a.objectiveKey===o.key&&a.use===use).map(a=>({key:a.key,phase:a.phase,equivalenceKey:a.equivalenceKey}))]))};});
json('matriz-cobertura.json',{packageSha256:finalHash,objectives:bank,activityTrace:route.activities.map(a=>({key:a.key,objectiveKey:a.objectiveKey,sourceKeys:a.sourceKeys,feedbackSourceKeys:a.feedback.sourceKeys,locators:a.sourceKeys.map(k=>route.sources.find(s=>s.key===k).locator)})),sourceIssues:route.editorial.unresolvedIssues,limits:'Cobertura conservada del candidato; no ampliación del snapshot ni reconocimiento espacial.'});
json('assets-a-vincular.json',{count:route.assets.length,assets:route.assets,reason:'Lista conservada íntegramente; cero assets. Guía sin figuras y alcance excluye reconocimiento espacial. No archivos, derechos, créditos ni hashes de medios inventados.'});
json('inventario-guia.json',{path:path.join(base,'guia.md'),title:route.sources[0].title,declaredVersion:'Snapshot local, captura declarada 2026-10-08; no exportación íntegra',sha256:guideHash,read:'Archivo UTF-8 completo',headings:route.sources.map(s=>s.locator.heading),figures:[],bibliography:route.sources.at(-1).excerpt,bibliographicWorksRead:false,catalogueResolution:'PENDING_AT_IMPORT'});
let report=previousReportBytes.toString('utf8').replace('revisión 1, anatomy','revisión '+route.revision+', anatomy').replaceAll(oldHash,finalHash);
report+='\n## Revisión focal de lenguaje educativo\n\nCandidato original conservado intacto: SHA-256 '+oldHash+'. Paquete corregido: '+finalHash+'. '+changes.length+' campos educativos de '+new Set(changes.map(c=>c.activityKey)).size+' actividades corregidos, con antes/después y localizadores en registro-antes-despues.json. El tema, cuatro unidades, cuatro objetivos, 52 actividades, nueve evaluaciones, 20 familias iniciales y 12 reservas se conservan. Dos incidencias de fuente se mantienen sin resolver.\n\nSe retiró «constante» de la formación portal porque la guía no lo proporciona; se mantiene la unión VMS–esplénica y la variabilidad de VMI. Se retiraron conteos/familias y comentarios sobre alias de prompts, feedback principal y feedback de distractores. Las notas del evaluador quedan editoriales. Cava-a2 mantiene equivalenceKey cava-r2, porta-a2 mantiene equivalenceKey porta-a1 y las permutaciones aceptadas de cava-r30 son alias, sin contar nuevas familias ni afirmar orden anatómico. Se restituyeron aproximación y habitualidad en los pasajes pertinentes y se precisó que poco flujo normal corresponde a las anastomosis portosistémicas. Se retiraron notas sobre alcance de tareas de las explicaciones al alumno; las limitaciones e incidencias se conservan en este informe y en editorial.unresolvedIssues.\n\nCotejo focal: '+(Object.values(checks).every(Boolean)?'PASS':'FAIL')+' local; '+educationalLeaves.length+' cadenas educativas inspeccionadas; metadatos técnicos residuales '+residualMetadata.length+' y calificadores absolutos residuales '+residualAbsolute.length+'. Preservación de fuente, incidencias, respuestas, familias, fases, referencias y reservas registrada en comprobaciones-revision.json. La fidelidad PASS se limita al cotejo del snapshot y al retiro de sobreafirmaciones detectadas; no equivale a aprobación médica.\n\nValidación final: estructura '+(draft.valid?'PASS':'FAIL')+' (valid:'+draft.valid+'); publicación portable '+(publish.publishable?'PASS':'FAIL')+' (publishable:'+publish.publishable+'). Solo permanecen las incidencias editoriales abiertas; no se eliminan para obtener PASS. Revisión humana del nuevo hash, catálogo/payload_hash canónico, importación real y evidencia del motor siguen NO VERIFICADO. Q19/V04 permanece NO VERIFICADO. Sin importación/publicación/instalación ni backend.\n';
fs.writeFileSync(path.join(out,'revision-de-ruta.md'),report,'utf8');
const artifactNames=['ruta.koraz-route.json','revision-de-ruta.md','assets-a-vincular.json','inventario-guia.json','matriz-cobertura.json','registro-antes-despues.json','comprobaciones-revision.json','resource-validation.json','validation-draft.json','validation-publish.json','revise.mjs'];
const log={scope:'Lecturas exclusivamente de skill/guía round-3 y candidato JSON/informe round-2; escrituras exclusivamente round-3/output.',runtime:process.version,inputPackage:{path:path.join(previous,'ruta.koraz-route.json'),sha256:oldHash},inputReport:{path:path.join(previous,'revision-de-ruta.md'),sha256:sha(previousReportBytes)},guideSha256:guideHash,outputPackageSha256:finalHash,commands,repairRounds:0,revisionPass:1,validation:{structure:draft.valid,publishable:publish.publishable,editorialChecks:checks},artifacts:artifactNames.map(name=>({name,sha256:sha(fs.readFileSync(path.join(out,name)))}))};
log.commands.push({executable:node,args:[path.join(out,'revise.mjs')],exitCode:Object.values(checks).every(Boolean)?0:1,result:{changedFields:changes.length,affectedActivities:new Set(changes.map(c=>c.activityKey)).size,checks}});
json('execution-log.json',log);
console.log(JSON.stringify({oldHash,finalHash,changeCount:changes.length,affectedActivities:[...new Set(changes.map(c=>c.activityKey))],draft,publish,checks,residualMetadata,residualAbsolute},null,2));
process.exitCode=Object.values(checks).every(Boolean)?0:1;
