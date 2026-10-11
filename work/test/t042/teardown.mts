import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
export default async function teardown(){
  assert.equal(process.env.KORAZ_TEST_DATABASE,'true');
  const root=process.env.T042_AUTH_RUN==='true'?'http://127.0.0.1:41043':'http://127.0.0.1:41035';
  let ready:{testOnly:boolean;database:string};
  try{ready=await(await fetch(root+'/__test/ready',{signal:AbortSignal.timeout(3000)})).json();}catch{return;}
  assert.equal(ready.testOnly,true);assert.match(ready.database,/^koraz_guided_v2_test_[a-f0-9]{32}$/);
  assert.equal((await fetch(root+'/__test/stop',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).ok,true);
  for(let n=0;n<30;n++){
    await new Promise(resolve=>setTimeout(resolve,250));
    try{await fetch(root+'/__test/ready',{signal:AbortSignal.timeout(500)});}catch{
      await writeFile(new URL(`../../../docs/aprendizaje-guiado/v2/evidencias/T042/${process.env.T042_AUTH_RUN==='true'?'auth':'mobile'}-cleanup.json`,import.meta.url),JSON.stringify({database:ready.database,stopped:true},null,2)+'\n');return;
    }
  }
  throw new Error('Disposable fixture did not finish cooperative cleanup');
}
