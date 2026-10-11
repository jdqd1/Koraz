import {writeFileSync} from 'node:fs';
const base='https://cediah-api-staging-v2.onrender.com';
const checks=[];
for(const path of ['/health','/__test/ready','/auth/get-session']){
 const response=await fetch(base+path,{signal:AbortSignal.timeout(60000),redirect:'manual'});
 checks.push({path,status:response.status,body:(await response.text()).slice(0,1500)});
}
writeFileSync(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/RC01/cloud-http.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),base,checks,scope:'Read-only HTTP smoke; no real DB/auth/journey verification'},null,2)+'\n');
console.log(JSON.stringify(checks));
