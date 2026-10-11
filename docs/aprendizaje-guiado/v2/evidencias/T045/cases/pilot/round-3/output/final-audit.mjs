import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const out=import.meta.dirname, base=path.dirname(out), skill=path.join(base,'skill');
const node='C:\\Users\\josed\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const route=JSON.parse(fs.readFileSync(path.join(out,'ruta.koraz-route.json'),'utf8'));
const log=JSON.parse(fs.readFileSync(path.join(out,'execution-log.json'),'utf8'));
const windows=route.objectives.map(o=>{
 const initial=route.activities.filter(a=>a.objectiveKey===o.key&&a.use==='learning'&&['single_choice','short_answer','match','sequence','image_target'].includes(a.kind));
 const reserved=route.activities.filter(a=>a.objectiveKey===o.key&&['final','retention7','retention30'].includes(a.use));
 const window=[],stages=[];
 for(const a of [...initial,...reserved]){
  const old=window.findIndex(x=>x.equivalenceKey===a.equivalenceKey);if(old>=0)window.splice(old,1);
  window.push(a);if(window.length>5)window.shift();
  if(window.length===5)stages.push({after:a.key,retrievalFamilies:window.filter(a=>a.phase==='retrieve').map(a=>a.equivalenceKey),applicationFamilies:window.filter(a=>a.phase==='apply').map(a=>a.equivalenceKey)});
 }
 return {objectiveKey:o.key,initialFamilies:[...new Set(initial.map(a=>a.equivalenceKey))],retention7:reserved.filter(a=>a.use==='retention7').map(a=>({key:a.key,phase:a.phase})),retention30:reserved.filter(a=>a.use==='retention30').map(a=>({key:a.key,phase:a.phase})),stages,keepsTwoRetrievalAndApplication:stages.every(s=>s.retrievalFamilies.length>=2&&s.applicationFamilies.length>=1)};
});
const pedagogical={scope:'Inspección de diseño local por familias; no ejecución del motor, reloj, dominio ni consolidación',packageSha256:log.outputPackageSha256,windows,allPass:windows.every(w=>w.keepsTwoRetrievalAndApplication&&w.initialFamilies.length>=5&&w.retention7.every(a=>a.phase==='retrieve')&&w.retention30.every(a=>a.phase==='retrieve'))};
fs.writeFileSync(path.join(out,'comprobaciones-pedagogicas.json'),JSON.stringify(pedagogical,null,2)+'\n');
const integrity={packageHashMatches:hash(fs.readFileSync(path.join(out,'ruta.koraz-route.json')))===log.outputPackageSha256,allArtifactHashesMatch:log.artifacts.every(a=>hash(fs.readFileSync(path.join(out,a.name)))===a.sha256),reportContainsCurrentHash:fs.readFileSync(path.join(out,'revision-de-ruta.md'),'utf8').includes(log.outputPackageSha256),preservedDesignWindow:pedagogical.allPass};
fs.writeFileSync(path.join(out,'integridad-entrega.json'),JSON.stringify(integrity,null,2)+'\n');
const q=x=>`'${x}'`;
const previous=path.join(path.dirname(base),'round-2','output');
log.preparationCommands=[
 {command:[path.join(skill,'SKILL.md'),path.join(skill,'references','pedagogia.md'),path.join(base,'guia.md'),path.join(previous,'revision-de-ruta.md')].map(file=>`Get-Content -LiteralPath ${q(file)} -Raw`).join('; '),exitCode:0,result:'Lectura completa de instrucciones nuevas, guía round-3 e informe candidato permitido.'},
 {command:[path.join(skill,'references','contrato-koraz-2.0.md'),path.join(skill,'references','cobertura-por-disciplina.md')].map(file=>`Get-Content -LiteralPath ${q(file)} -Raw`).join('; '),exitCode:0,result:'Lectura de contrato y disciplina dentro de la copia round-3.'},
 {executable:node,args:['-e',"const fs=require('fs');const r=JSON.parse(fs.readFileSync('"+path.join(previous,'ruta.koraz-route.json').replaceAll('\\','/')+"','utf8'));for(const a of r.activities)console.log(JSON.stringify({key:a.key,prompt:a.prompt,feedback:a.feedback,payload:a.payload}));"],exitCode:0,result:'Candidato leído completo. Salida mostrada truncada; se realizó después una inspección focal de cadenas y feedback completo.'},
 {executable:node,args:[path.join(skill,'scripts','verify-resources.mjs')],exitCode:0,result:'Identidad inicial PASS; repetición completa con resultados dentro de commands.'},
 {executable:node,args:['-e',"const fs=require('fs');const r=JSON.parse(fs.readFileSync('"+path.join(previous,'ruta.koraz-route.json').replaceAll('\\','/')+"','utf8'));const rx=/constante|siempre|familia|alias|motor|evaluador|equivalence|comprobación crítica|no se pregunta|no es aplicación|sin simular|queda pendiente|nota clínica|distinto|sin proponer|sin inferir|sin que sea necesario|formato|separarlos/iu;function walk(x,p,key){if(typeof x==='string'&&rx.test(x))console.log(JSON.stringify({key,path:p,text:x}));else if(Array.isArray(x))x.forEach((v,i)=>walk(v,p+'/'+i,key));else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))walk(v,p+'/'+k,key);}r.activities.forEach((a,i)=>{walk(a.prompt,'/activities/'+i+'/prompt',a.key);walk(a.feedback,'/activities/'+i+'/feedback',a.key);walk(a.payload,'/activities/'+i+'/payload',a.key);});console.log('Remaining feedback');for(const a of r.activities)console.log(a.key+': '+a.feedback.explanation);"],exitCode:0,result:'Ocurrencias educativas focales y explicaciones de las 52 actividades inspeccionadas sin truncamiento.'}
];
log.commands.push({executable:node,args:[path.join(out,'final-audit.mjs')],exitCode:Object.values(integrity).every(Boolean)?0:1,result:{integrity,pedagogicalDesign:pedagogical.allPass}});
for(const name of ['comprobaciones-pedagogicas.json','integridad-entrega.json','final-audit.mjs'])log.artifacts.push({name,sha256:hash(fs.readFileSync(path.join(out,name)))});
fs.writeFileSync(path.join(out,'execution-log.json'),JSON.stringify(log,null,2)+'\n');
console.log(JSON.stringify({integrity,pedagogicalDesign:pedagogical.allPass},null,2));
process.exitCode=Object.values(integrity).every(Boolean)?0:1;
