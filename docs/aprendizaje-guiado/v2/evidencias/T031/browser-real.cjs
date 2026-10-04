const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.resolve('apps/web/node_modules/@playwright/test'));
const {AxeBuilder}=require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const out=__dirname,api='http://127.0.0.1:41031',web='http://127.0.0.1:31031',attemptId='b2800000-0000-4000-8000-000000000004';
const report={scope:'Chromium -> Next BFF -> real Fastify services -> fresh isolated PGlite; synthetic cookie identity and synthetic nonmedical content. No mocked learner API receipts.',checks:[],viewports:[],axe:[],errors:[],traffic:[]};
async function control(url,body){const r=await fetch(api+url,{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});assert(r.ok,`${url}: ${r.status}`);return r.json();}
async function main(){
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900}});await context.addCookies([{name:'t030',value:'learner',url:web}]);
    const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
    page.on('response',response=>{if(response.url().includes('/api/v2/'))report.traffic.push({path:new URL(response.url()).pathname,status:response.status(),method:response.request().method()});});
    const go=async()=>{await page.goto(web+'/visual-fixtures/aprendizaje-v2?surface=player&estado=study',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('[data-engine-version="guided-v2"]').waitFor({timeout:60000});};
    const seed=async key=>{await control(`/__test/seed/${key}`,{});await page.evaluate(()=>sessionStorage.clear());await go();};
    const manifest=async()=>{const r=await page.request.get(web+`/api/v2/guided-learning/attempts/${attemptId}`);assert(r.ok());return (await r.json()).attempt;};
    const absent=async text=>assert.equal(await page.getByText(text,{exact:false}).count(),0,`${text} unexpectedly in DOM`);
    const severe=async label=>{const result=await new AxeBuilder({page}).include('[data-engine-version="guided-v2"]').analyze();const violations=result.violations.filter(v=>['serious','critical'].includes(v.impact));assert.deepEqual(violations,[]);report.axe.push({state:label,seriousCritical:0});};
    await control('/__test/seed/progressive',{});await go();await page.getByText('Ejemplo con apoyo parcial.',{exact:false}).waitFor();
    const first=await manifest();assert.equal(first.activeActivity.key,'partial');assert(!JSON.stringify(first).match(/NARRATIVA_DOS|NARRATIVA_TRES|MODELO_AUTORIZADO|acceptedOrders|correctByPrompt|correctKey/));
    const skipped=await page.request.post(web+`/api/v2/guided-learning/attempts/${attemptId}/responses`,{headers:{origin:web,'idempotency-key':'b2800000-0000-4000-8000-000000009031'},data:{activityKey:'prediction',answer:{kind:'short_answer',text:'resultado'},confidence:null,expectedVersion:1}});
    assert.equal(skipped.status(),409);assert.equal((await control('/__test/storage')).responses.length,0);
    report.checks.push('Initial network and DOM contain only current case child/narrative; attempting a future mandatory child is rejected with 409 and no response persisted');
    let release,arrived;const reached=new Promise(resolve=>arrived=resolve),gate=new Promise(resolve=>release=resolve);
    await page.route('**/api/v2/guided-learning/attempts/*/responses',async route=>{const response=await route.fetch();arrived();await gate;await route.fulfill({response});},{times:1});
    await page.getByRole('button',{name:'Continuar a la práctica'}).focus();await page.keyboard.press('Enter');await reached;
    await absent('NARRATIVA_DOS');assert(await page.getByRole('button',{name:'Continuar a la práctica'}).isDisabled());release();
    await page.getByRole('button',{name:'Comprobar secuencia'}).waitFor();await absent('APOYO_PREVIO');await absent('Ejemplo con apoyo parcial');assert.equal(await page.locator('h2').evaluate(el=>el===document.activeElement),true);
    for(const viewport of [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
      await page.setViewportSize(viewport);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.viewports.push({viewport,pageOverflow:false});
    }
    await page.setViewportSize({width:390,height:844});await severe('sequence-mobile');await page.screenshot({path:path.join(out,'sequence-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Subir: Origen',exact:true}).focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Bajar: Origen');
    await page.getByRole('button',{name:'Subir: Cambio',exact:true}).focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Subir: Cambio');
    assert.deepEqual(await page.locator('fieldset ol li > span').allTextContents(),['Origen','Cambio','Resultado']);
    await page.getByRole('button',{name:'Comprobar secuencia'}).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();
    assert.deepEqual(await page.getByRole('heading',{name:'Tu orden confirmado'}).locator('..').locator('li').allTextContents(),['Origen','Cambio','Resultado']);await absent('NARRATIVA_TRES');
    await page.screenshot({path:path.join(out,'sequence-recap-desktop.png'),fullPage:true});await severe('sequence-confirmed-feedback');
    await page.getByRole('button',{name:'Continuar',exact:true}).focus();await page.keyboard.press('Enter');await page.getByLabel('Tu respuesta').waitFor();
    await absent('APOYO_PREVIO');await absent('Feedback autorizado');await page.reload();await page.getByLabel('Tu respuesta').waitFor();assert((await manifest()).activeActivity.prompt.includes('NARRATIVA_TRES'));
    await page.getByLabel('Tu respuesta').fill('respuesta incorrecta');await page.getByRole('button',{name:'Comprobar respuesta',exact:true}).click();await page.getByRole('heading',{name:'Vamos a reforzar este punto'}).waitFor();await absent('NARRATIVA_CUATRO');
    await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('group',{name:'Completa la tabla de comparación'}).waitFor();
    for(let i=0;i<2;i++){const select=page.locator('[data-engine-version="guided-v2"] select').nth(i);await select.focus();await page.keyboard.press('Home');for(let j=0;j<=i;j++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');}
    await page.getByRole('button',{name:'Comprobar relaciones'}).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();await page.getByRole('button',{name:'Continuar',exact:true}).click();
    await page.getByRole('radio',{name:'El resultado aparece antes del origen'}).focus();await page.keyboard.press('Space');await page.getByRole('button',{name:'Comprobar respuesta',exact:true}).click();await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();await absent('NARRATIVA_SEIS');await page.getByRole('button',{name:'Continuar',exact:true}).click();
    await page.getByLabel('Explica con tus palabras').fill('El origen causa el cambio; después aparece el resultado.');await absent('MODELO_AUTORIZADO');await page.getByRole('button',{name:'Guardar mi respuesta'}).click();await page.getByRole('button',{name:'Comparar con el modelo'}).waitFor();
    let storage=await control('/__test/storage');assert.equal(storage.responses.length,5);assert.equal(storage.attempt.resume_json.activeIndex,5);await absent('MODELO_AUTORIZADO');
    await page.reload();await page.getByRole('button',{name:'Comparar con el modelo'}).waitFor();await page.getByRole('button',{name:'Comparar con el modelo'}).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Respuesta modelo'}).waitFor();await page.reload();await page.getByRole('heading',{name:'Respuesta modelo'}).waitFor();
    await page.setViewportSize({width:390,height:844});await severe('case-constructed-revealed-mobile');await page.screenshot({path:path.join(out,'case-revealed-mobile.png'),fullPage:true});
    await page.getByRole('button',{name:'Lo recuperé'}).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Práctica registrada'}).waitFor();await page.getByRole('button',{name:'Ver cierre de sesión'}).click();await page.getByRole('button',{name:'Finalizar sesión'}).click();await page.getByRole('heading',{name:'Sesión completada'}).waitFor();await page.reload();await page.getByRole('heading',{name:'Sesión completada'}).waitFor();
    storage=await control('/__test/storage');assert.equal(storage.responses.length,6);assert.equal(storage.responses.filter(r=>r.activity_key==='progressive').length,0);assert.equal(storage.responses.find(r=>r.activity_key==='partial').score01,null);assert.equal(storage.responses.find(r=>r.activity_key==='prediction').score01,0);assert.equal(storage.responses.find(r=>r.activity_key==='correct').score01,null);assert.deepEqual(storage.activityStates.filter(r=>r.activity_key==='progressive'),[{activity_key:'progressive',state:'completed'}]);
    report.checks.push('Six-stage case uses study, sequence, prediction, table, detection and constructed correction; confirmation gates every stage; wrong prediction advances with server score 0; constructed submit/reveal/reload remains current until rating; exactly six child responses, no wrapper score/response. Existing wrapper bookkeeping marks completion once without scoring it');
    report.checks.push('Sequence completed only with keyboard; focus retained at boundaries, public-label recap follows confirmed orderedKeys; prior study/feedback absent during subsequent recall; four viewports without page overflow');
    await seed('sequence');await page.getByRole('button',{name:'Comprobar secuencia'}).waitFor();
    let requestBody,requestKey,lostDone,lostFail;const lost=new Promise((resolve,reject)=>{lostDone=resolve;lostFail=reject;});
    await page.route('**/api/v2/guided-learning/attempts/*/responses',async route=>{try{requestBody=route.request().postData();requestKey=route.request().headers()['idempotency-key'];await route.fetch();await route.abort('failed');lostDone();}catch(error){lostFail(error);}},{times:1});
    await page.getByRole('button',{name:'Comprobar secuencia'}).click();await lost;await page.getByRole('button',{name:'Reintentar solicitud pendiente'}).waitFor();await absent('Tu orden confirmado');assert.equal((await control('/__test/storage')).responses.length,1);
    await page.reload();await page.getByRole('button',{name:'Reintentar solicitud pendiente'}).waitFor();let retried=false;
    await page.route('**/api/v2/guided-learning/attempts/*/responses',async route=>{assert.equal(route.request().postData(),requestBody);assert.equal(route.request().headers()['idempotency-key'],requestKey);retried=true;await route.continue();},{times:1});
    await page.getByRole('button',{name:'Reintentar solicitud pendiente'}).click();await page.getByRole('heading',{name:'Vamos a reforzar este punto'}).waitFor();assert(retried);storage=await control('/__test/storage');assert.equal(storage.responses.length,1);assert.deepEqual(storage.responses[0].answer_json.orderedKeys,['result','origin','change']);
    report.checks.push('Lost real HTTP receipt after commit survives refresh; retry uses identical body/key, returns server score 0 and one persisted sequence response; no optimistic advancement');
    await seed('worked');await page.getByText('Ejemplo resuelto.',{exact:false}).waitFor();await page.getByRole('button',{name:'Continuar a la práctica'}).click();await page.getByRole('button',{name:'Finalizar sesión'}).waitFor();storage=await control('/__test/storage');assert.equal(storage.responses[0].score01,null);
    report.checks.push('Worked example is study acknowledgment with score null, independent of scored responses; partial example removed before sequence');
    assert.deepEqual(report.errors,[]);report.status='PASS';report.notVerified=['Full learner journey T035/T037, native browser zoom, screen-reader audit','Independent PostgreSQL concurrency, full API regression, production and editorial pilot','Accepted historical sequence DTO stores orderedKeys without item text; after reload the recap shows saved step count. Full labeled historical recap would require a separately authorized DTO expansion'];
  }catch(error){report.status='FAIL';report.errors.push(error.stack);throw error;}finally{await browser.close();fs.writeFileSync(path.join(out,'browser-real-checks.json'),JSON.stringify(report,null,2));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
