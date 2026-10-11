// Optional manual V04 session. No screen-reader inputs or PASS decision are automated.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGuidedV2Server } from '../../../apps/api/test/helpers/guided-v2-server.js';

assert.equal(process.env.KORAZ_TEST_DATABASE,'true');
assert.equal(process.env.NODE_ENV,'test');
assert.equal(process.env.KORAZ_GUIDED_V2_TEST_SERVER,'true');
const web=fileURLToPath(new URL('../../../apps/web/',import.meta.url));
const require=createRequire(web+'package.json');
const h=await createGuidedV2Server();
await h.app.listen({host:'127.0.0.1',port:41035});
const next=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','31035'],{
  cwd:web,windowsHide:true,stdio:'inherit',env:{...process.env,API_BASE_URL:'http://127.0.0.1:41035',NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN:'https://127.0.0.1:41036'},
});
let browser:Awaited<ReturnType<typeof require>>|undefined;
let closing=false;
async function close(){if(closing)return;closing=true;await browser?.close();await h.close();next.kill();}
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>void close().then(()=>process.exit(0)));
try{
  let ready=false;
  for(let n=0;n<120;n++){
    try{ready=(await fetch('http://127.0.0.1:31035/acceder')).ok;}catch{}
    if(ready)break;await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert.equal(ready,true,'Built test frontend must start');
  browser=await require('@playwright/test').chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:false});
  const context=await browser.newContext({ignoreHTTPSErrors:true});
  await context.addCookies([{name:'t035',value:'student-30',domain:'127.0.0.1',path:'/'}]);
  const page=await context.newPage();await page.goto('http://127.0.0.1:31035/aprendizaje/rutas/t035-small');
  console.log('V04 manual environment ready. Synthetic learner, disposable PostgreSQL. Follow reader-manual.md; Ctrl+C cleans this session.');
}catch(error){await close();throw error;}
