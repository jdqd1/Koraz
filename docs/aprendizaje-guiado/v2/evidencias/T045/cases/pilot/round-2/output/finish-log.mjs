import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const out=import.meta.dirname, base=path.dirname(out), skill=path.join(base,'skill');
const node='C:\\Users\\josed\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const logFile=path.join(out,'execution-log.json');
const log=JSON.parse(fs.readFileSync(logFile,'utf8'));
const q=x=>`'${x}'`;
log.preparationCommands[1].command=[...['contrato-koraz-2.0.md','pedagogia.md','cobertura-por-disciplina.md'].map(name=>`Get-Content -LiteralPath ${q(path.join(skill,'references',name))} -Raw`),`& ${q(node)} ${q(path.join(skill,'scripts','verify-resources.mjs'))}`].join('; ');
log.preparationCommands[2].command=`& ${q(node)} -e "const fs=require('fs');const p='${path.join(skill,'assets').replaceAll('\\','/')}/';const s=JSON.parse(fs.readFileSync(p+'koraz-route-2.0.schema.json','utf8'));for(const k of ['route','sources','objectives','units','assessments','editorial']) console.log(k,JSON.stringify(s.properties[k]));for(const a of s.properties.activities.items.oneOf)console.log(a.properties.kind.const,JSON.stringify(a.properties.payload));const e=JSON.parse(fs.readFileSync(p+'ejemplo-valido.koraz-route.json','utf8'));console.log('example',JSON.stringify({root:Object.keys(e),activity:e.activities[0],elaboration:e.activities[1]}));"`;
const checks={
 packageHashMatches:hash(fs.readFileSync(path.join(out,'ruta.koraz-route.json')))===log.packageSha256,
 guideHashMatches:hash(fs.readFileSync(path.join(base,'guia.md')))===log.input.sha256,
 artifactsMatch:log.artifacts.every(a=>hash(fs.readFileSync(path.join(out,a.name)))===a.sha256),
 initialJsonPreserved:hash(fs.readFileSync(path.join(out,'validation-round-0','ruta.koraz-route.json')))==='fc95e96c056c5f31a15b57b980b117573b527857046b0df1b4901c3d43be0ddc',
 finalReportHashMatches:fs.readFileSync(path.join(out,'revision-de-ruta.md'),'utf8').includes(log.packageSha256)
};
const result={checks,allPass:Object.values(checks).every(Boolean),scope:'Integridad local de entregables y baseline preservado; no motor ni catálogo real'};
fs.writeFileSync(path.join(out,'integridad-entrega.json'),JSON.stringify(result,null,2)+'\n');
log.commands.push({executable:node,args:[path.join(out,'finish-log.mjs')],exitCode:result.allPass?0:1,result});
for(const name of ['finish-log.mjs','integridad-entrega.json'])log.artifacts.push({name,sha256:hash(fs.readFileSync(path.join(out,name)))});
log.preservedBaseline={directory:'validation-round-0',packageSha256:'fc95e96c056c5f31a15b57b980b117573b527857046b0df1b4901c3d43be0ddc',finalPackageSha256:log.packageSha256,files:['ruta.koraz-route.json','validation-draft.json','validation-publish.json','execution-log.json','revision-de-ruta.md']};
fs.writeFileSync(logFile,JSON.stringify(log,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
process.exitCode=result.allPass?0:1;
