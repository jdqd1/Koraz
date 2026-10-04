const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const { V2HttpContracts, V2AttemptManifestSchema, V2RouteStateSchema, V2PublicActivitySchema } = require(path.resolve('apps/web/node_modules/@cediah/contracts'));
const { AxeBuilder } = require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const out = path.resolve('docs/aprendizaje-guiado/v2/evidencias/T029');
const id = n => `b2800000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const result = { scope: 'Typed HTTP mocks in local Next; no authenticated API persistence', checks: [], responsive: [], limitations: [], errors: [] };
const base = { key: 'practice-a', objectiveKey: 'objective-a', phase: 'retrieve', representation: 'text', prompt: 'Recupera la relación entre A y B' };
function activity(kind, key = 'practice-a') { return V2PublicActivitySchema.parse({ ...base, key, kind, phase: kind === 'study' ? 'learn' : 'retrieve', payload: kind === 'study' ? { body: 'EXPLICACION_PREVIA: A precede a B en este ejemplo sintético.', focusSpans: [{start:20,end:32}], assetKey:null, scaffold:'explanation', videoRange:null } : kind === 'single_choice' ? {options:[{key:'a',text:'A precede a B'},{key:'b',text:'B precede a A'}]} : {maxChars:kind === 'short_answer' ? 120 : 4000} }); }
const routeState = () => V2RouteStateSchema.parse({engineVersion:'guided-v2',enrollmentId:id(3),pathVersionId:id(2),rowVersion:4,completedActivities:2,dispensedActivities:0,plannedRequiredActivities:6,completedAt:null,masteredAt:null,consolidatedAt:null,dueReviews:0,objectives:[{objectiveKey:'objective-a',label:'learning',objectiveScore:50,criticalErrorOpen:false,assisted:false,applicationDemonstrated:false,reviewDue:false,firstMasteredAt:null,firstConsolidatedAt:null},{objectiveKey:'objective-b',label:'new',objectiveScore:null,criticalErrorOpen:false,assisted:false,applicationDemonstrated:false,reviewDue:false,firstMasteredAt:null,firstConsolidatedAt:null}],nextAction:{kind:'activity',key:'practice-a',reason:'Practica la relación entre los conceptos A y B'}});
let scenario;
function reset(kind) { scenario = { attempt:V2AttemptManifestSchema.parse({engineVersion:'guided-v2',attemptId:id(4),enrollmentId:id(3),pathVersionId:id(2),policyVersion:'guided-v2.0',purpose:'activity',rowVersion:1,status:'open',activeActivity:activity(kind),acceptedResponses:[]}),state:routeState(),requests:[],receipts:new Map(),submitted:null,revealed:false,effects:0,helpEffects:0,lose:false,conflict:false,delay:0 }; }
async function run() {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  page.on('console', msg => { if(msg.type()==='error') console.error('BROWSER',msg.text()); });
  page.on('requestfailed', req => console.error('REQUEST FAILED',req.url(),req.failure()));
  page.on('request', req => { if(req.url().includes('/api/v2/')) console.log('API REQUEST',req.method(),req.url()); });
  await page.route('**/api/v2/guided-learning/attempts/**', async route => {
    const request = route.request(), url = new URL(request.url()), suffix = url.pathname.split('/').at(-1);
    if(request.method()==='GET') { console.log('MOCK GET',url.pathname); return route.fulfill({json:V2HttpContracts.attemptGet.response.parse({attempt:scenario.attempt})}); }
    const body = request.postDataJSON(), key = request.headers()['idempotency-key'];
    scenario.requests.push({suffix,key,body});
    const identity = `${suffix}:${key}`, old = scenario.receipts.get(identity);
    if(old) { assert.deepEqual(old.body,body); return route.fulfill({json:old.value}); }
    if(scenario.conflict) return route.fulfill({status:409,json:{error:'version_conflict'}});
    assert.equal(body.expectedVersion,scenario.attempt.rowVersion);
    if(scenario.delay) await new Promise(resolve => setTimeout(resolve, scenario.delay));
    let value;
    if(suffix==='help') {
      V2HttpContracts.attemptHelp.body.parse(body);
      if(!scenario.attempt.activeActivity || body.activityKey!==scenario.attempt.activeActivity.key) return route.fulfill({status:409,json:{error:'conflict'}});
      if(body.kind==='reveal') assert(scenario.submitted);
      scenario.helpEffects++; scenario.attempt={...scenario.attempt,rowVersion:scenario.attempt.rowVersion+1};
      scenario.state.objectives[0].assisted=true;
      if(body.kind==='reveal') scenario.revealed=true;
      value=V2HttpContracts.attemptHelp.response.parse({attempt:scenario.attempt,help:{kind:body.kind,text:body.kind==='reveal'?'MODELO_AUTORIZADO: A precede a B.':body.kind==='source'?'FUENTE_AUTORIZADA: fragmento sintético A y B.':'PISTA_AUTORIZADA: piensa en el orden.'}});
    } else if(suffix==='responses') {
      V2HttpContracts.attemptResponse.body.parse(body);
      const active = scenario.attempt.activeActivity;
      assert(active && active.key===body.activityKey);
      const partial=body.answer.kind==='constructed_response' && body.answer.selfRating===null;
      scenario.attempt={...scenario.attempt,rowVersion:scenario.attempt.rowVersion+1};
      if(partial) scenario.submitted=body.answer.text;
      const score01=body.answer.kind==='study'||body.answer.kind==='constructed_response'?null:body.answer.kind==='single_choice'?(body.answer.optionKey==='a'?1:0):(body.answer.text==='A'?1:0);
      const feedback={explanation:partial?'':'FEEDBACK_AUTORIZADO: el orden importa.',commonError:score01===0?'ERROR_CRITICO: invertir A y B.':'',score01};
      if(!partial) {
        if(body.answer.kind==='constructed_response') {assert(scenario.revealed);assert.equal(body.answer.text,scenario.submitted);}
        scenario.effects++;
        scenario.attempt.acceptedResponses=[...scenario.attempt.acceptedResponses,{activityKey:body.activityKey,answer:body.answer,serverAcceptedAt:'2026-10-03T12:00:00Z',score01,feedback:{explanation:feedback.explanation,commonError:feedback.commonError}}];
        scenario.attempt.activeActivity=active.kind==='study'?activity('single_choice','choice-a'):null;
        scenario.state={...scenario.state,rowVersion:scenario.state.rowVersion+1,completedActivities:scenario.state.completedActivities+1};
        if(score01===0) {scenario.state.objectives[0]={...scenario.state.objectives[0],criticalErrorOpen:true,label:'reinforce'};scenario.state.nextAction={kind:'remediate',key:'remediate-a',reason:'Refuerza el objetivo esencial antes de continuar'};}
      }
      value=V2HttpContracts.attemptResponse.response.parse({accepted:!partial,feedback,attempt:scenario.attempt,state:scenario.state,nextStep:scenario.attempt.activeActivity});
    } else if(suffix==='complete') {
      assert.equal(scenario.attempt.activeActivity,null);
      scenario.attempt={...scenario.attempt,rowVersion:scenario.attempt.rowVersion+1,status:'completed'};
      value=V2HttpContracts.attemptComplete.response.parse({attempt:scenario.attempt,state:scenario.state});
    } else throw new Error(suffix);
    scenario.receipts.set(identity,{body,value:JSON.parse(JSON.stringify(value))});
    if(scenario.lose && suffix==='responses') {scenario.lose=false;return route.abort('failed');}
    return route.fulfill({json:value});
  });
  async function go(kind) {reset(kind); await page.goto(`http://localhost:3000/visual-fixtures/aprendizaje-v2?surface=player&estado=${kind}`,{waitUntil:'domcontentloaded',timeout:120000}); await page.locator('[data-engine-version="guided-v2"]').waitFor({timeout:30000}).catch(async error=>{console.error(await page.locator('body').innerText());await page.screenshot({path:path.join(out,'diagnostic-initial.png')});throw error;}); await page.evaluate(()=>sessionStorage.clear());}
  await go('study');
  await page.screenshot({path:path.join(out,'study-desktop.png')});
  await page.getByLabel('Resaltar ideas clave').check(); assert(await page.locator('mark').count()>0);
  await page.getByRole('button',{name:'Continuar a la práctica'}).click();
  await page.getByRole('radio',{name:'A precede a B'}).waitFor();
  assert(!(await page.locator('[data-engine-version="guided-v2"]').innerHTML()).includes('EXPLICACION_PREVIA'));
  assert(!(await page.locator('[data-engine-version="guided-v2"]').innerHTML()).includes('FEEDBACK_AUTORIZADO'));
  assert.equal(await page.locator('h2').evaluate(el=>el===document.activeElement),true);
  result.checks.push('Study focus optional; acknowledgment advances only after receipt; prior explanation and feedback absent from recall DOM; heading receives focus');
  await page.getByRole('button',{name:'Necesito ayuda',exact:true}).click(); await page.getByText('PISTA_AUTORIZADA', {exact:false}).waitFor();
  assert.equal(scenario.helpEffects,1);
  await page.getByRole('button',{name:'Consultar fuente con ayuda'}).click(); await page.getByRole('heading',{name:'Fuente para practicar con ayuda'}).waitFor();
  await page.getByRole('radio',{name:'B precede a A'}).check(); await page.getByRole('button',{name:'Comprobar respuesta'}).click();
  await page.getByRole('heading',{name:'Vamos a reforzar este punto'}).waitFor();
  assert(await page.getByRole('heading',{name:'Fuente consultada'}).count());
  assert((await page.locator('[data-engine-version="guided-v2"]').innerText()).includes('ERROR_CRITICO'));
  assert((await page.locator('[data-engine-version="guided-v2"]').innerText()).includes('Refuerza el objetivo esencial'));
  assert((await page.locator('[data-engine-version="guided-v2"]').innerText()).includes('Dominio por comprobar'));
  await page.screenshot({path:path.join(out,'feedback-desktop.png')});
  result.checks.push('E03 typed mocks: hint/source registered server-side; wrong answer, critical reinforcement, explanation, common error and consulted source appear only after receipt; no mastery claim');
  await page.getByRole('button',{name:'Ver cierre de sesión'}).click(); await page.getByRole('button',{name:'Finalizar sesión'}).click();
  await page.getByRole('heading',{name:'Sesión completada'}).waitFor(); await page.reload(); await page.getByRole('heading',{name:'Sesión completada'}).waitFor();
  result.checks.push('Explicit complete receipt; refresh recovers completed attempt and server accepted history');
  await go('single_choice'); scenario.lose=true;
  await page.getByRole('radio',{name:'A precede a B'}).check(); await page.getByRole('button',{name:'Comprobar respuesta'}).click();
  await page.getByRole('button',{name:'Reintentar solicitud pendiente'}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).count(),0);
  await page.screenshot({path:path.join(out,'pending-desktop.png')});
  await page.reload(); await page.getByRole('button',{name:'Reintentar solicitud pendiente'}).waitFor(); await page.getByRole('button',{name:'Reintentar solicitud pendiente'}).click();
  await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();
  assert.equal(scenario.effects,1); assert.deepEqual(scenario.requests[0],scenario.requests[1]);
  result.checks.push('Commit then lost response: no optimistic success, refresh recovers pending request, exact key/body replay, one effect');
  await go('short_answer'); scenario.delay=700;
  await page.getByLabel('Tu respuesta',{exact:true}).fill('A'); await page.getByRole('button',{name:'Comprobar respuesta'}).click();
  assert.equal(await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).count(),0);
  await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();
  result.checks.push('Short answer sends original text/max length; delayed server receipt is required for success');
  assert((await page.locator('[data-engine-version="guided-v2"]').innerText()).includes('La fuente no está disponible'));
  result.limitations.push('Post-answer source missing for unassisted answer: help API accepts active key only; client does not invent source');
  await go('constructed_response'); await page.getByLabel('Explica con tus palabras').fill('Mi explicación propia.');
  assert.equal(await page.getByRole('button',{name:'Comparar con el modelo'}).count(),0);
  await page.getByRole('button',{name:'Guardar mi respuesta'}).click(); await page.getByRole('button',{name:'Comparar con el modelo'}).waitFor();
  assert(!(await page.locator('[data-engine-version="guided-v2"]').innerHTML()).includes('MODELO_AUTORIZADO'));
  await page.reload(); await page.getByLabel('Explica con tus palabras').waitFor();
  assert.equal(await page.getByLabel('Explica con tus palabras').inputValue(),'');
  result.limitations.push('Constructed intermediate stage not recoverable from public manifest on refresh; server retains text but public manifest exposes neither text nor reveal state/rubric');
  await page.getByLabel('Explica con tus palabras').fill('Mi explicación propia.'); await page.getByRole('button',{name:'Guardar mi respuesta'}).click(); await page.getByRole('button',{name:'Comparar con el modelo'}).click();
  await page.getByRole('heading',{name:'Respuesta modelo',exact:true}).waitFor(); assert.equal(await page.getByRole('heading',{name:'Respuesta modelo',exact:true}).evaluate(el=>el===document.activeElement),true); await page.getByRole('button',{name:'Lo recuperé',exact:true}).click();
  await page.getByRole('heading',{name:'Práctica registrada'}).waitFor();
  assert.equal(scenario.attempt.acceptedResponses[0].score01,null);
  assert.deepEqual(scenario.requests.filter(r=>r.suffix==='responses').map(r=>r.body.answer.selfRating),[null,null,'good']);
  result.checks.push('Constructed ordered text → server save → explicit reveal → self-report; same submitted text and null score; no model before response');
  await go('single_choice'); scenario.conflict=true; await page.getByRole('radio',{name:'A precede a B'}).check(); await page.getByRole('button',{name:'Comprobar respuesta'}).click(); await page.getByRole('button',{name:'Recargar estado confirmado'}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).count(),0); assert.equal(scenario.effects,0);
  result.checks.push('409 displays reload action and leaves confirmed progress unchanged');
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]) {
    await page.setViewportSize(viewport); await go('short_answer'); await page.evaluate(()=>document.fonts.ready); await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('main button, main textarea')].map(el=>({text:el.textContent,rect:{left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}}))}));
    assert(geometry.scroll<=geometry.width+1,JSON.stringify(geometry)); for(const c of geometry.controls) assert(c.rect.left>=-1&&c.rect.right<=geometry.width+1,JSON.stringify(c));
    const axe=await new AxeBuilder({page}).include('[data-engine-version="guided-v2"]').analyze();
    const serious=axe.violations.filter(v=>['critical','serious'].includes(v.impact)); assert.equal(serious.length,0,JSON.stringify(serious));
    result.responsive.push({viewport,...geometry,axeViolations:axe.violations.map(v=>({id:v.id,impact:v.impact}))});
    if(viewport.width===390) await page.screenshot({path:path.join(out,'short-mobile.png')});
  }
  result.checks.push('Four required viewports: no page horizontal overflow/control clipping; axe serious/critical 0 in tested short-answer states');
  await page.setViewportSize({width:1440,height:900}); await page.evaluate(()=>{document.querySelector('[data-engine-version="guided-v2"]').style.zoom='2'});
  assert.equal(await page.getByLabel('Tu respuesta',{exact:true}).isVisible(),true);
  result.checks.push('CSS zoom 200% exploratory visibility (not native browser zoom)');
  await page.getByLabel('Tu respuesta',{exact:true}).focus(); await page.keyboard.type('A'); await page.keyboard.press('Tab'); assert.equal(await page.getByRole('button',{name:'Comprobar respuesta'}).evaluate(el=>el===document.activeElement),true); await page.keyboard.press('Enter'); await page.getByRole('heading',{name:'Respuesta correcta',exact:true}).waitFor();
  result.checks.push('Keyboard text input, Tab/Enter submit and feedback heading focus');
  assert.equal(result.errors.length,0,result.errors.join('\n'));
  await browser.close(); result.finishedAt=new Date().toISOString(); fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(result,null,2));
}
run().catch(error=>{result.failure=error.stack;fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(result,null,2));console.error(error);process.exit(1)});
