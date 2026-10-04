const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.resolve('apps/web/node_modules/@playwright/test'));
const {AxeBuilder}=require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const out=__dirname,api='http://127.0.0.1:41030',web='http://127.0.0.1:31030';
const report={scope:'Real Chromium -> Next BFF -> Fastify -> isolated PGlite. Synthetic cookie identity and private-storage signer/media only; no mocked learner API.',checks:[],geometry:[],axe:[],apiTraffic:[],errors:[]};
async function control(pathname,body){const response=await fetch(api+pathname,{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});assert(response.ok,`${pathname}: ${response.status}`);return response.json();}
async function main(){
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    await context.addCookies([{name:'t030',value:'learner',url:web}]);
    const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
    let resources=[];
    page.on('response',async response=>{if(response.url().includes('/api/v2/')){const item={path:new URL(response.url()).pathname,status:response.status(),method:response.request().method()};report.apiTraffic.push(item);if(response.ok()){try{const body=await response.json();if(item.path.endsWith('/image'))resources.push(body);if(!item.path.endsWith('/responses'))assert(!JSON.stringify(body).match(/polygon|correctLabelByTarget|correctByPrompt|correctKey|PRIVATE_SPATIAL_SOLUTION/));}catch(error){report.errors.push(error.message);}}}});
    await page.route('https://t030-media.example.test/**',route=>route.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(out,'synthetic-image.png'))}));
    const go=async()=>{await page.goto(web+'/visual-fixtures/aprendizaje-v2?surface=player&estado=hotspot',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('[data-engine-version="guided-v2"]').waitFor({timeout:60000});};
    const ready=async()=>{await page.waitForFunction(()=>Array.from(document.images).some(img=>img.alt==='Figura sintética sin etiquetas ni soluciones'&&img.naturalWidth===800),{},{timeout:20000});};
    const seed=async kind=>{await control(`/__test/seed/${kind}`,{});resources=[];await go();};
    await seed('hotspot');await ready();
    assert(!await page.getByText('No pudimos cargar el resumen de progreso confirmado.',{exact:true}).count());
    assert.equal(resources.at(-1).image.assetKey,'figure');assert.equal(resources.at(-1).attemptVersion,1);
    report.checks.push('Real cookie forwarding, typed own attempt/state and authorized private image through Next BFF; initial state read from server');
    for(const viewport of [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
      await page.setViewportSize(viewport);await page.getByLabel('Ampliación de imagen').selectOption('1');
      const surface=page.getByRole('group',{name:'Imagen para responder'}),box=await surface.boundingBox(),scale=Math.min(box.width/800,box.height/400),w=800*scale,h=400*scale;
      const chosenX=(box.width-w)/2+w*.25,chosenY=(box.height-h)/2+h*.75;
      await surface.click({position:{x:chosenX,y:chosenY}});
      const x=Number(await page.getByLabel('Horizontal (%)').inputValue())/100,y=Number(await page.getByLabel('Vertical (%)').inputValue())/100;
      assert(Math.abs(x-.25)<=1.1/w);assert(Math.abs(y-.75)<=1.1/h);
      await page.getByLabel('Ampliación de imagen').selectOption('2');assert.equal(Number(await page.getByLabel('Horizontal (%)').inputValue())/100,x);assert.equal(Number(await page.getByLabel('Vertical (%)').inputValue())/100,y);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.geometry.push({viewport,point:{x,y},imageZoom:200,pageOverflow:false});
    }
    await page.getByLabel('Ampliación de imagen').selectOption('1');await page.getByLabel('Horizontal (%)').fill('20');await page.getByLabel('Vertical (%)').fill('50');
    await page.screenshot({path:path.join(out,'hotspot-real-desktop.png'),fullPage:true});
    const invalid=await page.request.post(web+'/api/v2/guided-learning/attempts/b2800000-0000-4000-8000-000000000004/alternative',{headers:{origin:'https://foreign.example.test','idempotency-key':'b2800000-0000-4000-8000-000000000099'},data:{activityKey:'hotspot',expectedVersion:1}});assert.equal(invalid.status(),403);
    await page.getByRole('button',{name:'Comprobar respuesta visual'}).click();await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();
    let storage=await control('/__test/storage');assert.deepEqual(storage.responses,[{activity_key:'hotspot',modality:'image',assisted:false,score01:1}]);
    await page.reload();await page.getByRole('button',{name:'Finalizar sesión'}).waitFor();await page.getByRole('button',{name:'Finalizar sesión'}).click();await page.getByRole('heading',{name:'Sesión completada'}).waitFor();await page.reload();await page.getByRole('heading',{name:'Sesión completada'}).waitFor();
    report.checks.push('Real normalized border response persisted exactly once, server feedback, same-origin rejection, completion and reload preserve state');
    await seed('hotspot');await ready();await page.getByRole('button',{name:'Practicar con variante de texto o tabla'}).click();await page.getByRole('radio',{name:'Relación A'}).waitFor();
    assert(await page.getByText('Esta práctica no acredita identificación espacial.',{exact:false}).count());assert.equal(await page.locator('h2').evaluate(el=>el===document.activeElement),true);
    await page.reload();await page.getByRole('radio',{name:'Relación A'}).waitFor();await page.getByRole('radio',{name:'Relación A'}).check();await page.getByRole('button',{name:'Comprobar respuesta',exact:true}).click();await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();
    storage=await control('/__test/storage');assert.deepEqual(storage.responses,[{activity_key:'alternative',modality:'text',assisted:true,score01:1}]);assert.deepEqual(storage.activityStates,[]);assert.equal(storage.attempt.resume_json.activeIndex,0);assert.equal(storage.attempt.resume_json.accessiblePractice,null);
    await page.getByRole('button',{name:'Continuar',exact:true}).click();await ready();assert.equal(await page.getByRole('button',{name:'Practicar con variante de texto o tabla'}).count(),0);await page.screenshot({path:path.join(out,'alternative-return-real.png'),fullPage:true});
    report.checks.push('Accessible detour confirmed and resumed by real server; text modality/assisted persisted once; original image and gate remain pending; no alternative activity completion or spatial evidence');
    await seed('labeling');await ready();await page.setViewportSize({width:390,height:844});await page.getByLabel('Punto 1: Identifica el punto numerado').selectOption('b');
    await page.getByLabel('Ampliación de imagen').selectOption('2');await page.screenshot({path:path.join(out,'labeling-real-mobile.png'),fullPage:true});
    const axe=await new AxeBuilder({page}).include('[data-engine-version="guided-v2"]').analyze();assert.deepEqual(axe.violations.filter(v=>['serious','critical'].includes(v.impact)),[]);report.axe.push({state:'labeling-mobile',seriousCritical:0});
    await page.getByRole('button',{name:'Comprobar respuesta visual'}).click();await page.getByRole('heading',{name:'Vamos a reforzar este punto'}).waitFor();storage=await control('/__test/storage');assert.deepEqual(storage.responses,[{activity_key:'labeling',modality:'image',assisted:false,score01:0}]);
    report.checks.push('Actual labeling/mappings sent without polygons; wrong label graded only by server and persisted as image; mobile zoom and axe');
    await seed('match');const selections=page.locator('[data-engine-version="guided-v2"] select');for(let i=0;i<4;i++){await selections.nth(i).focus();await page.keyboard.press('Home');for(let n=0;n<(i===3?3:i+1);n++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');}
    await page.getByRole('button',{name:'Comprobar relaciones'}).click();await page.getByRole('heading',{name:'Vamos a reforzar este punto'}).waitFor();
    assert(await page.getByText('Acierto parcial: 75 %. Aún falta una respuesta completamente correcta.',{exact:true}).count());storage=await control('/__test/storage');assert.deepEqual(storage.responses,[{activity_key:'match',modality:'table',assisted:false,score01:0}]);
    const actualReceipt=await page.request.get(web+'/api/v2/guided-learning/attempts/b2800000-0000-4000-8000-000000000004');assert(actualReceipt.ok());assert.equal((await actualReceipt.json()).attempt.acceptedResponses.length,1);
    report.checks.push('Matching completed with keyboard through real BFF/API; 3 of 4 pairs yields binary score 0 and table modality, persists and resumes');
    const other=await browser.newContext();await other.addCookies([{name:'t030',value:'other',url:web}]);const denied=await other.request.get(web+'/api/v2/guided-learning/attempts/b2800000-0000-4000-8000-000000000004/image?activityKey=match&expectedVersion=1');assert.equal(denied.status(),404);await other.close();
    assert.deepEqual(report.errors,[]);report.status='PASS';report.notVerified=['Real S3 credentials/object fetch; signer and PNG fixture are synthetic','Better Auth session issuance and production','Native browser zoom/screen reader and full journey T035/T037','Independent PostgreSQL concurrency in this run'];
  }catch(error){report.status='FAIL';report.errors.push(error.stack);throw error;}finally{await browser.close();fs.writeFileSync(path.join(out,'browser-real-checks.json'),JSON.stringify(report,null,2));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
