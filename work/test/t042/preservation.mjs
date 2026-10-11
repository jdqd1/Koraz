import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const dir=root+'docs/aprendizaje-guiado/v2/evidencias/T042/';
const hash=data=>createHash('sha256').update(data).digest('hex');
const baseline=JSON.parse(readFileSync(dir+'repair-baseline.json','utf8'));
const changed=[],missing=[];
for(const [path,before] of Object.entries(baseline.hashes)){
  if(!existsSync(root+path)){missing.push(path);continue;}
  const after=hash(readFileSync(root+path));if(after!==before)changed.push({path,before,after});
}
const previous=JSON.parse(readFileSync(dir+'registry-before-repair.json','utf8'));
const current=JSON.parse(readFileSync(root+'docs/aprendizaje-guiado/v2/registro-ejecucion.json','utf8'));
function otherRegistry(record){return {...record,tasks:record.tasks.filter(task=>task.taskId!=='T042')};}
const result={at:new Date().toISOString(),baselineFiles:Object.keys(baseline.hashes).length,changed,missing,
  otherRegistryUnchanged:JSON.stringify(otherRegistry(previous))===JSON.stringify(otherRegistry(current)),
  headUnchanged:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()===baseline.head};
writeFileSync(dir+'preservation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({baselineFiles:result.baselineFiles,changed:changed.map(x=>x.path),missing,otherRegistryUnchanged:result.otherRegistryUnchanged,headUnchanged:result.headUnchanged}));
