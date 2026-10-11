import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../../../',import.meta.url);
const privateDir=new URL('.env.rc01-staging-private/',root);
await mkdir(privateDir,{recursive:true});
const api='https://cediah-api-staging-v2.onrender.com';
const origin='https://cediah-git-codex-cierre-pendientes-guided-v2-jdqd1s-projects.vercel.app';
let accounts;try{accounts=JSON.parse(await readFile(new URL('accounts.json',privateDir),'utf8'));}catch{accounts={};}
const results=[];
for(const kind of ['editor','learner','outsider','fresh']){
 const existing=accounts[kind];
 const input=existing??{email:`rc01-${kind}-${randomBytes(8).toString('hex')}@example.test`,password:randomBytes(32).toString('hex'),name:`Prueba RC01 ${kind}`};
 const response=await fetch(api+'/api/auth/'+(existing?'sign-in':'sign-up')+'/email',{
  method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(input),signal:AbortSignal.timeout(120000)});
 assert.equal(response.status,200,`Staging ${kind} authentication failed`);
 const value=await response.json();assert.match(value.user.id,/^[a-f0-9-]{36}$/);
 const cookie=response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 assert(cookie.includes('session_token='));
 accounts[kind]={...input,id:value.user.id,cookie};
 await writeFile(new URL('accounts.json',privateDir),JSON.stringify(accounts,null,2)+'\n');
 const me=await fetch(api+'/v1/auth/me',{headers:{cookie}});assert.equal(me.status,200);
 results.push({kind,userId:value.user.id,authenticationStatus:response.status,identityStatus:me.status});
}
await writeFile(new URL('docs/aprendizaje-guiado/v2/evidencias/RC01/cloud-signups.json',root),JSON.stringify({status:'PASS',scope:'Real Better Auth accounts, new isolated RC01 staging database',accounts:results},null,2)+'\n');
console.log(JSON.stringify(results.map(({kind,userId})=>({kind,userId}))));
