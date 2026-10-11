import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
export default async function teardown(){
 assert.equal(process.env.KORAZ_TEST_DATABASE,'true');
 const api='http://127.0.0.1:41035';
 let ready:any;try{ready=await(await fetch(api+'/__test/ready',{signal:AbortSignal.timeout(3000)})).json();}catch{return;}
 assert.equal(ready.testOnly,true);assert.match(ready.database,/^koraz_guided_v2_test_[a-f0-9]{32}$/);
 assert.equal((await fetch(api+'/__test/stop',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).ok,true);
 for(let n=0;n<40;n++){
  await new Promise(resolve=>setTimeout(resolve,250));
  try{await fetch(api+'/__test/ready',{signal:AbortSignal.timeout(500)});}catch{
   await writeFile(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/RC01/browser-cleanup.json',import.meta.url),JSON.stringify({database:ready.database,stopped:true},null,2)+'\n');return;
  }
 }
 throw new Error('Test database cleanup not completed');
}
