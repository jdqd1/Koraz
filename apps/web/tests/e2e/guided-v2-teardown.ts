import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Close the fixture API cooperatively before Playwright kills Windows children. */
export default async function teardown(){
  if(process.env.KORAZ_TEST_DATABASE!=="true") throw new Error("Disposable database marker required for cleanup");
  const root="http://127.0.0.1:41035";
  let ready:{testOnly:boolean;database:string};
  try{ready=await (await fetch(root+"/__test/ready",{signal:AbortSignal.timeout(2000)})).json();}catch{return;}
  if(ready.testOnly!==true || !/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(ready.database)) throw new Error("Refusing to stop a server without T035 fixture provenance");
  const response=await fetch(root+"/__test/stop",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(3000)});
  if(!response.ok) throw new Error("Fixture server did not accept cleanup");
  await new Promise(resolve=>setTimeout(resolve,1000));
  await writeFile(resolve("../../docs/aprendizaje-guiado/v2/evidencias/T035/cleanup.json"),JSON.stringify({database:ready.database,cooperativeShutdownRequested:true,scope:"disposable local PostgreSQL only"},null,2));
}
