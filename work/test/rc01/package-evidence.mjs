import {readFile,readdir,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../../',import.meta.url),ev=new URL('docs/aprendizaje-guiado/v2/evidencias/RC01/',root);
const files=[];
async function visit(dir,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=prefix+entry.name,url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);
  if(entry.isDirectory())await visit(url,path+'/');
  else if(path.includes('/browser-artifacts/')||/browser-run[^/]*\/fixture-run\//.test(path)){
   const bytes=await readFile(url);files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
 }
}
await visit(ev);
await writeFile(new URL('retained-local-artifacts.json',ev),JSON.stringify({scope:'Full failed and final browser traces plus duplicate fixtures remain on this workstation, excluded from Git; receipts and logs are versioned',at:new Date().toISOString(),files},null,2)+'\n');
await mkdir(new URL('screenshots/',ev),{recursive:true});
const artifacts=new URL('browser-artifacts/',ev);
try{for(const entry of await readdir(artifacts,{withFileTypes:true})){
 if(!entry.isDirectory())continue;
 for(const filename of await readdir(new URL(entry.name+'/',artifacts)))if(filename.endsWith('.png'))await copyFile(new URL(entry.name+'/'+filename,artifacts),new URL('screenshots/'+entry.name+'-'+filename,ev));
}}catch(error){if(error.code!=='ENOENT')throw error;}
const gitLines=args=>execFileSync('git',args,{cwd:fileURLToPath(root),encoding:'utf8'}).trim().split('\n').filter(Boolean);
const changed=[...new Set([...gitLines(['ls-files','--others','--exclude-standard']),...gitLines(['diff','--cached','--name-only']),...gitLines(['diff','--name-only','d5b6f051f1a9a47d216bb0f834e39df2b2273725','HEAD'])])];
const suspicious=[];
for(const path of changed){
 if(!/\.(?:json|txt|md|mjs|mts|ps1|gitignore)$/.test(path))continue;
 const value=await readFile(new URL(path.replaceAll('\\','/'),root),'utf8');
 // Raw external/admin URLs and Vercel access links must remain in ignored private files.
 if(/postgres(?:ql)?:\/\/[^\s"']+:[^\s"'@]+@(?!127\.0\.0\.1|localhost)/i.test(value)||/[?&]_vercel_share=[a-zA-Z0-9_-]{20,}|session_token=[a-zA-Z0-9%._-]{20,}/.test(value))suspicious.push(path);
}
if(suspicious.length)throw new Error('Potential secret material in changed files: '+suspicious.join(', '));
await writeFile(new URL('evidence-packaging.json',ev),JSON.stringify({status:'PASS',at:new Date().toISOString(),retainedLocalFiles:files.length,retainedLocalBytes:files.reduce((s,f)=>s+f.bytes,0),untrackedTextFilesChecked:changed.length,rawSecretPatternsFound:0},null,2)+'\n');
console.log('Evidence packaging: PASS; '+files.length+' local artifact fingerprints');
