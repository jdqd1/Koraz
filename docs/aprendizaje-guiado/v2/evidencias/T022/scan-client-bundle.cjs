const fs=require('fs');const path=require('path');const crypto=require('crypto');
const root=process.cwd(), output=path.join(root,'docs/aprendizaje-guiado/v2/evidencias/T022');
function walk(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(path.join(root,'apps/web/.next/static')).filter(f=>/\.(?:js|map)$/.test(f));
if(!files.length)throw Error('No production client chunks found');
const candidates=new Map();
function collect(key,value){if(!key.startsWith('NEXT_PUBLIC_') && /SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY|DATABASE_URL|SERVICE_ROLE|TOKEN/i.test(key) && typeof value==='string' && value.length>=16)candidates.set(value,key);}
Object.entries(process.env).forEach(([k,v])=>collect(k,v));
for(const dir of [root,path.join(root,'apps/web'),path.join(root,'apps/api')])for(const f of fs.readdirSync(dir)){if(!/^\.env(?:\.(?:local|production|production\.local|development|development\.local))?$/.test(f))continue;for(const line of fs.readFileSync(path.join(dir,f),'utf8').split(/\r?\n/)){const m=line.match(/^\s*(?:export\s+)?([\w]+)\s*=\s*(.*?)\s*$/);if(m)collect(m[1],m[2].replace(/^(['"])(.*)\1$/,'$2'));}}
const forbidden=['PRIVATE_HINT','PRIVATE_FEEDBACK','PRIVATE_ERROR','PRIVATE_MODEL','PRIVATE_RUBRIC','lock_guided_v2_actor','lock_guided_v2_catalog','postgres-guided-learning-v2','learning_v2_responses','learning_v2_attempts'];
const hits=[];const entries=[];
for(const file of files){const buffer=fs.readFileSync(file), source=buffer.toString('utf8');for(const marker of forbidden)if(source.includes(marker))hits.push({file:path.relative(root,file),marker});for(const [value,key] of candidates)if(source.includes(value))hits.push({file:path.relative(root,file),privateEnvironmentKey:key});entries.push({file:path.relative(root,file),bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});}
const result={taskId:'T022',status:hits.length?'FAIL':'PASS',surface:'Actual emitted production browser JS/source maps; generic contract field names are not answer material',privateEnvironmentValuesChecked:candidates.size,filesScanned:files.length,totalBytes:entries.reduce((n,f)=>n+f.bytes,0),forbiddenServerMarkers:forbidden,hits,files:entries};
fs.writeFileSync(path.join(output,'bundle-completion.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,filesScanned:files.length,privateEnvironmentValuesChecked:candidates.size,hits:hits.length}));if(hits.length)process.exitCode=1;
