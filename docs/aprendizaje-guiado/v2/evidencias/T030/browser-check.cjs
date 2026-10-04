const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = process.cwd(), out = path.join(root,'docs/aprendizaje-guiado/v2/evidencias/T030');
const vitest = require.resolve('vitest',{paths:[path.join(root,'apps/web/node_modules')]});
const esbuild = require(require.resolve('esbuild',{paths:[path.dirname(vitest)]}));
const {chromium} = require(path.join(root,'apps/web/node_modules/@playwright/test'));
const {AxeBuilder} = require(path.join(root,'apps/web/node_modules/@axe-core/playwright'));
const {V2HttpContracts} = require(path.join(root,'apps/web/node_modules/@cediah/contracts'));
const report = {scope:'Standalone browser harness of real renderers and V2Player; authorized media, alternative and HTTP receipts are synthetic mocks. No BFF/API persistence.',checks:[],geometry:[],axe:[],errors:[],notVerified:['Native browser zoom','Real authorized image/alternative resolution','Full route journey and production']};
async function main() {
  const built = await esbuild.build({entryPoints:[path.join(out,'browser-fixture.tsx')],absWorkingDir:path.join(root,'apps/web'),bundle:true,write:false,outdir:path.join(out,'bundle'),jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},banner:{js:'var process = { env: { NODE_ENV: "production" } };'},nodePaths:[path.join(root,'apps/web/node_modules')]});
  const js = built.outputFiles.find(file=>file.path.endsWith('.js')).text, css = built.outputFiles.find(file=>file.path.endsWith('.css')).text;
  const server = http.createServer((req,res)=>{
    const url = new URL(req.url,'http://localhost');
    if(url.pathname==='/bundle.js'){res.setHeader('Content-Type','application/javascript');return res.end(js);}
    if(url.pathname==='/bundle.css'){res.setHeader('Content-Type','text/css');return res.end(css);}
    if(url.pathname==='/fail.svg'){res.statusCode=404;return res.end();}
    if(url.pathname.endsWith('.svg')){res.setHeader('Content-Type','image/svg+xml');const portrait=url.pathname==='/portrait.svg';return res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="${portrait?200:800}" height="400"><rect width="100%" height="100%" fill="#e2e8f0"/><circle cx="50%" cy="50%" r="40" fill="#64748b"/></svg>`);}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="es"><head><title>T030 QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>body{margin:0;font:16px system-ui;color:#172554;background:#fff}*{box-sizing:border-box}button{font:inherit;border:1px solid #94a3b8;border-radius:8px;padding:10px;background:white;color:#172554}main{min-width:0}output{display:block;overflow-wrap:anywhere}input{font:inherit}.learning-primary-button{background:#172554;color:white}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=`http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    page.on('pageerror',error=>report.errors.push(error.message));
    const go=async mode=>{await page.goto(`${address}/?mode=${mode}`);await page.getByRole('heading',{name:'Prueba local T030'}).waitFor();};
    const result=async()=>JSON.parse(await page.getByLabel('Respuesta de prueba').textContent());
    const submit=async()=>{await page.getByRole('button',{name:'Comprobar respuesta visual'}).click();await page.waitForFunction(()=>document.querySelector('output')?.textContent!=='null',{},{timeout:5000});};
    const coords=async()=>({x:Number(await page.getByLabel('Horizontal (%)').inputValue())/100,y:Number(await page.getByLabel('Vertical (%)').inputValue())/100});
    for(const viewport of [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
      await page.setViewportSize(viewport);await go('hotspot');await page.getByLabel('Ampliación de imagen').waitFor();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);await page.getByLabel('Ampliación de imagen').selectOption('1');
      const surface=page.getByRole('group',{name:'Imagen para responder'});
      await surface.click({position:{x:4,y:4}});assert.deepEqual(await coords(),{x:0,y:0}); // empty fields become numeric zero only in this read
      assert.equal(await page.getByLabel('Horizontal (%)').inputValue(),'');
      const box=await surface.boundingBox(),scale=Math.min(box.width/800,box.height/400),w=800*scale,h=400*scale;
      await surface.click({position:{x:(box.width-w)/2+w*.25,y:(box.height-h)/2+h*.75}});
      const chosen=await coords();assert(Math.abs(chosen.x-.25)<=1.1/w);assert(Math.abs(chosen.y-.75)<=1.1/h);
      await page.getByLabel('Ampliación de imagen').selectOption('2');assert.deepEqual(await coords(),chosen);
      await page.setViewportSize({...viewport,width:viewport.width+20});assert.deepEqual(await coords(),chosen);
      await submit();const submitted=await result();assert.equal(submitted.kind,'image_target');assert.equal(submitted.targetKey,'target');assert(Math.abs(submitted.point.x-chosen.x)<1e-6);assert(Math.abs(submitted.point.y-chosen.y)<1e-6);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      report.geometry.push({viewport,requestedPoint:{x:.25,y:.75},submittedPoint:submitted.point,clickTolerance:'1.1 CSS pixel for integer clientX/clientY; selection unchanged through zoom and resize',zoom:200,resize:true,letterboxRejected:true});
    }
    await page.setViewportSize({width:1440,height:900});await go('hotspot&portrait=1');await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth===200);
    await page.getByRole('group',{name:'Imagen para responder'}).click({position:{x:4,y:150}});assert.equal(await page.getByLabel('Horizontal (%)').inputValue(),'');
    await page.getByRole('group',{name:'Imagen para responder'}).focus();await page.keyboard.press('ArrowRight');assert.deepEqual(await coords(),{x:.51,y:.5});
    await page.getByLabel('Horizontal (%)').fill('0');await page.getByLabel('Vertical (%)').fill('100');await submit();assert.deepEqual((await result()).point,{x:0,y:1});
    report.checks.push('Portrait horizontal letterbox rejected; hotspot arrows and numeric keyboard controls; normalized border submitted without local grading');
    await go('hotspot');await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);await page.getByLabel('Horizontal (%)').fill('25');await page.getByLabel('Vertical (%)').fill('75');
    await page.getByLabel('Bloquear controles').check();assert(await page.getByRole('button',{name:'Comprobar respuesta visual'}).isDisabled());await page.getByRole('group',{name:'Imagen para responder'}).focus();await page.keyboard.press('ArrowRight');assert.deepEqual(await coords(),{x:.25,y:.75});
    report.checks.push('Disabled renderer does not mutate selection or submit');
    await go('hotspot&fail=1');await page.getByText('No pudimos cargar la imagen.',{exact:false}).waitFor();assert(await page.getByRole('button',{name:'Comprobar respuesta visual'}).isDisabled());
    await page.route('**/fail.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="gray"/></svg>'}));
    await page.getByRole('button',{name:'Reintentar imagen'}).click();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth===800);await page.getByLabel('Horizontal (%)').fill('50');await page.getByLabel('Vertical (%)').fill('50');await submit();assert.equal((await result()).point.x,.5);
    await go('hotspot&missing=1');assert(await page.getByRole('button',{name:'Comprobar respuesta visual'}).isDisabled());await page.getByRole('button',{name:'Usar variante de texto o tabla'}).click();await page.getByText('Solicitud de alternativa registrada',{exact:false}).waitFor();assert.equal(await result(),null);
    report.checks.push('Missing image blocks submit; failed image retries successfully; alternative callback does not submit an image response or invent modality');
    await page.setViewportSize({width:390,height:844});await go('labeling');await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);await page.getByLabel('Punto 1: Identifica').selectOption('a');await page.getByLabel('Punto 2: Relaciona').selectOption('b');await submit();assert.deepEqual(await result(),{kind:'image_target',mode:'labeling',labelsByTarget:{t1:'a',t2:'b'}});
    const marker=await page.locator('span').filter({hasText:/^1$/}).boundingBox();const imageBox=await page.locator('img').boundingBox();const h=imageBox.width/2;assert(Math.abs(marker.x+marker.width/2-(imageBox.x+imageBox.width*.25))<1);assert(Math.abs(marker.y+marker.height/2-(imageBox.y+(imageBox.height-h)/2+h*.75))<1);
    await page.getByLabel('Ampliación de imagen').selectOption('2');await submit();assert.equal((await result()).labelsByTarget.t1,'a');await page.screenshot({path:path.join(out,'labeling-mobile.png'),fullPage:true});
    report.checks.push('Labeling public numbered markers align to contained rectangle, keyboard selectors and zoom preserve submitted mappings');
    for(const mode of ['pairs','comparison_table','causal_map']){
      await go(mode);const selections=page.locator('select');await selections.nth(0).focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
      for(let i=0;i<4;i++) {await selections.nth(i).focus();await page.keyboard.press('Home');for(let n=0;n<=i;n++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');}
      await page.getByRole('button',{name:'Comprobar relaciones'}).click({timeout:2000});assert.deepEqual(await result(),{p1:'c1',p2:'c2',p3:'c3',p4:'c4'});
      await selections.nth(1).selectOption('c1');assert.equal(await selections.nth(0).inputValue(),'c1');assert(await page.getByRole('button',{name:'Comprobar relaciones'}).isDisabled());assert(await page.getByText('Hay opciones repetidas',{exact:false}).count());
      const axe=await new AxeBuilder({page}).analyze();const severe=axe.violations.filter(v=>['serious','critical'].includes(v.impact));assert.deepEqual(severe,[]);report.axe.push({mode,seriousCritical:0});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(mode==='causal_map')await page.screenshot({path:path.join(out,'match-mobile.png'),fullPage:true});
    }
    await go('pairs&reuse=1');for(const select of await page.locator('select').all())await select.selectOption('c1');await page.getByRole('button',{name:'Comprobar relaciones'}).click();assert.equal((await result()).p4,'c1');
    report.checks.push('All matching presentations completed only with keyboard; intermediate arrow selections preserve other pairs; nonreuse duplicates block submission with message; reuse allowed explicitly; mobile no page overflow');
    await page.setViewportSize({width:1440,height:900});await go('hotspot');await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);await page.getByLabel('Horizontal (%)').fill('25');await page.getByLabel('Vertical (%)').fill('75');await page.screenshot({path:path.join(out,'hotspot-desktop.png'),fullPage:true});
    const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations.filter(v=>['serious','critical'].includes(v.impact)),[]);report.axe.push({mode:'hotspot',seriousCritical:0});
    let submissions=0;
    await page.route('**/api/v2/guided-learning/attempts/*/responses',async route=>{
      const body=V2HttpContracts.attemptResponse.body.parse(route.request().postDataJSON());assert.deepEqual(body.answer,{kind:'match',pairs:{p1:'c1',p2:'c2',p3:'c3',p4:'c4'}});assert(route.request().headers()['idempotency-key']);submissions++;
      // Capture initial manifest/state from fixture constants using only public contract-shaped data.
      const id=n=>`b2800000-0000-4000-8000-${String(n).padStart(12,'0')}`;
      const feedback={score01:0,explanation:'Feedback parcial confirmado: 3 de 4 relaciones.',commonError:'Revisa la cuarta relación.',sources:[]};
      const attempt={engineVersion:'guided-v2',attemptId:id(4),enrollmentId:id(3),pathVersionId:id(2),policyVersion:'guided-v2.0',purpose:'activity',rowVersion:body.expectedVersion+1,status:'open',activeActivity:null,acceptedResponses:[{activityKey:body.activityKey,answer:body.answer,serverAcceptedAt:'2026-10-03T12:00:00Z',score01:0,feedback:{explanation:feedback.explanation,commonError:feedback.commonError,sources:[]}}]};
      const state={engineVersion:'guided-v2',enrollmentId:id(3),pathVersionId:id(2),rowVersion:5,completedActivities:3,dispensedActivities:0,plannedRequiredActivities:6,completedAt:null,masteredAt:null,consolidatedAt:null,dueReviews:0,objectives:[],nextAction:{kind:'activity',key:'next',reason:'Revisa la relación pendiente'}};
      await route.fulfill({json:V2HttpContracts.attemptResponse.response.parse({accepted:true,attempt,state,feedback,nextStep:null})});
    });
    await go('player');for(let i=0;i<4;i++)await page.locator('select').nth(i).selectOption(`c${i+1}`);await page.getByRole('button',{name:'Comprobar relaciones'}).click();await page.getByRole('heading',{name:'Vamos a reforzar este punto'}).waitFor();assert.equal(submissions,1);assert(await page.getByText('3 de 4 relaciones.',{exact:false}).count());report.checks.push('Actual V2Player matching submits existing typed HTTP/CAS/idempotency contract and displays server-confirmed partial feedback without local mastery');
    assert.deepEqual(report.errors,[]);report.status='PASS';
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(report,null,2));}
}
main().catch(error=>{report.status='FAIL';report.errors.push(error.stack);fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;});
