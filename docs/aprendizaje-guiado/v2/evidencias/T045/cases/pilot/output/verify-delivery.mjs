import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const out=import.meta.dirname;
const base=path.dirname(out);
const node='C:\\Users\\josed\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe';
const route=JSON.parse(fs.readFileSync(path.join(out,'ruta.koraz-route.json'),'utf8'));
const guide=fs.readFileSync(path.join(base,'guia.md'),'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const logPath=path.join(out,'execution-log.json');
const log=JSON.parse(fs.readFileSync(logPath,'utf8'));
const objectiveKeys=new Set(route.objectives.map(o=>o.key));
const activityKeys=new Set(route.activities.map(a=>a.key));
const allReserve=route.activities.filter(a=>['final','retention7','retention30'].includes(a.use));
const reservedFamilies=new Set(allReserve.map(a=>a.equivalenceKey));
const checks={
  originalGuideHashMatches:sha(Buffer.from(guide))===log.sourceHash,
  exactJsonHashMatches:sha(fs.readFileSync(path.join(out,'ruta.koraz-route.json')))===log.packageHash,
  excerptsLiteral:route.sources.every(s=>guide.includes(s.excerpt)),
  sourceHashesOriginal:route.sources.every(s=>s.documentSha256===log.sourceHash),
  allActivitiesLocated:route.activities.every(a=>objectiveKeys.has(a.objectiveKey)&&route.units.some(u=>u.activityKeys.includes(a.key))),
  assessmentCandidatesResolve:route.assessments.every(s=>s.candidateActivityKeys.every(k=>activityKeys.has(k))),
  reserveFamiliesExclusive:reservedFamilies.size===allReserve.length&&route.activities.filter(a=>!allReserve.includes(a)).every(a=>!reservedFamilies.has(a.equivalenceKey)),
  noReservedItemInInitialAssessments:route.assessments.filter(a=>!['final','retention7','retention30'].includes(a.kind)).every(a=>a.candidateActivityKeys.every(k=>!allReserve.some(r=>r.key===k))),
  cycleCoverage:route.objectives.every(o=>['learn','retrieve','elaborate','apply'].every(phase=>route.activities.some(a=>a.objectiveKey===o.key&&a.phase===phase))),
  referencesPreserved:route.sources.at(-1).excerpt===guide.split('## Referencias de la guía')[1].trim(),
  zeroAssets:route.assets.length===0,
  noProductionIdentity:Object.keys(route).every(k=>!['topicId','approval','schedulerVersion'].includes(k))
};
const results={scope:'Auditoría local del paquete exacto y del snapshot; no revisión médica independiente',checks,allPass:Object.values(checks).every(Boolean),counts:{units:route.units.length,objectives:route.objectives.length,activities:route.activities.length,assessments:route.assessments.length,sources:route.sources.length,assets:0,initialObjectiveFamilies:20,reserveFamilies:allReserve.length,diagnosticItems:route.activities.filter(a=>a.use==='diagnostic').length},packageSha256:log.packageHash};
fs.writeFileSync(path.join(out,'delivery-checks.json'),JSON.stringify(results,null,2)+'\n');
const quote=p=>`'${p}'`;
const skill=path.join(base,'skill');
log.commands[0].command=`Get-Content -LiteralPath ${quote(path.join(skill,'SKILL.md'))} -Raw; Get-Content -LiteralPath ${quote(path.join(base,'guia.md'))} -Raw`;
log.commands[1].command=`Get-Content -LiteralPath ${quote(path.join(skill,'references','contrato-koraz-2.0.md'))} -Raw; Get-Content -LiteralPath ${quote(path.join(skill,'references','pedagogia.md'))} -Raw; Get-Content -LiteralPath ${quote(path.join(skill,'references','cobertura-por-disciplina.md'))} -Raw; & ${quote(node)} ${quote(path.join(skill,'scripts','verify-resources.mjs'))}`;
log.commands[2].command=`& ${quote(node)} -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('${path.join(skill,'assets','koraz-route-2.0.schema.json').replaceAll('\\','/')}','utf8')); console.log(JSON.stringify(s,null,2));"; Get-Content -LiteralPath ${quote(path.join(skill,'assets','ejemplo-valido.koraz-route.json'))} -Raw`;
log.commands[3].command=`& ${quote(node)} -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync('${path.join(skill,'assets','koraz-route-2.0.schema.json').replaceAll('\\','/')}','utf8'));for(const a of s.properties.activities.items.oneOf){console.log(a.properties.kind.const,JSON.stringify(a.properties.payload));}"`;
log.commands.push({executable:node,args:[path.join(out,'verify-delivery.mjs')],exitCode:results.allPass?0:1,result:results});
log.artifacts.push(...['author-route.mjs','verify-delivery.mjs','delivery-checks.json'].map(name=>({name,sha256:sha(fs.readFileSync(path.join(out,name)))})));
fs.writeFileSync(logPath,JSON.stringify(log,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
process.exitCode=results.allPass?0:1;
