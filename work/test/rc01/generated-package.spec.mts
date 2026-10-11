import { test, expect, type Page } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { writeFileSync } from 'node:fs';
const api='http://127.0.0.1:41035';
async function server(page:Page,path:string){const r=await page.request.get(api+path);expect(r.ok()).toBeTruthy();return r.json();}
async function hydrated(page:Page){await expect.poll(async()=>page.locator('.learning-path-hero button').first().evaluate(e=>Object.keys(e).some(k=>k.startsWith('__reactProps')&&typeof(e as any)[k]?.onClick==='function'))).toBe(true);}
async function answer(page:Page,a:any){
 switch(a.kind){
 case 'study':{
  await page.getByRole('button',{name:'Continuar a la práctica',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Respuesta confirmada y guardada.'})).toBeVisible();return;
 }
 case 'single_choice':await page.getByRole('radio',{name:a.payload.options.find((o:any)=>o.key===a.payload.correctKey).text,exact:true}).check();await page.getByRole('button',{name:'Comprobar respuesta',exact:true}).click();break;
 case 'short_answer':await page.getByLabel('Tu respuesta',{exact:true}).fill(a.payload.acceptedAnswers[0]);await page.getByRole('button',{name:'Comprobar respuesta',exact:true}).click();break;
 case 'constructed_response':await page.getByLabel('Explica con tus palabras').fill(a.payload.modelAnswer);await page.getByRole('button',{name:'Guardar mi respuesta',exact:true}).click();await page.getByRole('button',{name:'Comparar con el modelo',exact:true}).click();await page.getByRole('button',{name:'Lo recuperé',exact:true}).click();break;
 case 'match':for(const p of a.payload.prompts)await page.getByRole('combobox',{name:p.text,exact:true}).selectOption(a.payload.correctByPrompt[p.key]);await page.getByRole('button',{name:'Comprobar relaciones',exact:true}).click();break;
 case 'sequence':{
  const order=a.payload.items.map((i:any)=>i.key);
  for(let target=0;target<order.length;target++){
   const key=a.payload.acceptedOrders[0][target];let index=order.indexOf(key);
   while(index>target){await page.getByRole('button',{name:`Subir: ${a.payload.items.find((i:any)=>i.key===key).text}`,exact:true}).click();[order[index],order[index-1]]=[order[index-1],order[index]];index--;}
  }
  await page.getByRole('button',{name:'Comprobar secuencia',exact:true}).click();break;
 }
 default:throw new Error(`Unsupported generated kind ${a.kind}`);
 }
 await page.getByRole('button',{name:/^(Continuar|Ver cierre de sesión)$/}).last().click();
}
for(const name of ['synthetic','pilot'])test(`${name}: generated package persists through UI, reload, final and deferred retention`,async({page},info)=>{
 const ready=await server(page,'/__test/ready');expect(ready.testOnly).toBe(true);
 const fixture=ready.fixtures[name],pkg=fixture.package;expect(fixture.status).toBe('published');
 const actor=name==='pilot'?(info.project.name==='mobile'?'student-5':'student-4'):(info.project.name==='mobile'?'student-3':'student-2');
 await page.context().addCookies([{name:'t035',value:actor,domain:'127.0.0.1',path:'/'}]);
 const route=`/aprendizaje/rutas/${fixture.slug}`;
 await page.goto(route);await hydrated(page);await page.getByRole('button',{name:'Comenzar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Continuar',exact:true}).first()).toBeVisible();
 const path=await server(page,`/v2/guided-learning/paths/${fixture.slug}`);const enrollmentId=path.path.enrollmentId;
 const state=async()=>(await server(page,`/v2/guided-learning/enrollments/${enrollmentId}/state`)).state;
 const attempts:any[]=[];let reloadVerified=false;
 for(let stage=0;stage<3;stage++){
  if(stage){const clock=await page.request.post(api+'/__test/clock',{data:{days:stage===1?8:24}});expect(clock.ok()).toBe(true);}
  for(let count=0;count<60;count++){
   const s=await state();if(stage===0?s.masteredAt:stage===1?s.maintenance.agenda.every((o:any)=>o.retention7.acceptedAt):s.consolidatedAt)break;
   if(s.nextAction.kind==='none'){
    const banks=s.maintenance.exhaustedBanks;expect(banks.length,'A paused bank must explain the next eligible date').toBeGreaterThan(0);
    const next=Math.min(...banks.map((b:any)=>Date.parse(b.availableAfter)));
    const days=Math.max(0,(next-Date.parse(s.maintenance.generatedAt))/86400000)+1/86400;
    const clock=await page.request.post(api+'/__test/clock',{data:{days}});expect(clock.ok()).toBe(true);continue;
   }
   if(stage===1&&s.nextAction.kind!=='retention'){
    // A completed immediate route may offer maintenance before the reserved assessment.
    if(s.maintenance.agenda.every((o:any)=>o.retention7.acceptedAt))break;
   }
   await page.goto(route);await hydrated(page);
   await page.locator('.learning-path-hero').getByRole('button').first().click();
   await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
   const attemptId=page.url().split('/sesiones/')[1]!.split('?')[0]!;
   for(let guard=0;guard<50;guard++){
    const manifest=(await server(page,`/v2/guided-learning/attempts/${attemptId}`)).attempt;
    if(!manifest.activeActivity)break;
    const serialized=JSON.stringify(manifest.activeActivity);
    for(const privateKey of ['correctKey','acceptedAnswers','correctByPrompt','acceptedOrders','modelAnswer','rubric'])expect(serialized).not.toContain(`"${privateKey}"`);
    const activity=pkg.activities.find((a:any)=>a.key===manifest.activeActivity.key);expect(activity).toBeTruthy();
    await expect(page.getByRole('heading',{name:activity.prompt,exact:true})).toBeVisible();
    await answer(page,activity);
    await expect.poll(async()=>((await server(page,`/v2/guided-learning/attempts/${attemptId}`)).attempt.acceptedResponses as any[]).some(r=>r.activityKey===activity.key)).toBe(true);
    if(!reloadVerified){
     const expected=(await server(page,`/v2/guided-learning/attempts/${attemptId}`)).attempt;
     await page.reload();expect((await server(page,`/v2/guided-learning/attempts/${attemptId}`)).attempt).toEqual(expected);reloadVerified=true;
    }
   }
   await page.getByRole('button',{name:'Finalizar sesión',exact:true}).click();
   await expect(page.getByRole('heading',{name:'Sesión completada',exact:true})).toBeVisible();
   attempts.push({attemptId,stage,state:await state()});
  }
  const finished=await state();expect(finished.masteredAt).toBeTruthy();
  if(stage===0)expect(finished.consolidatedAt).toBeNull();
  if(stage===2)expect(finished.consolidatedAt).toBeTruthy();
 }
 await page.goto(route);await page.reload();const final=await state();expect(final.consolidatedAt).toBeTruthy();expect(reloadVerified).toBe(true);
 const facts=await server(page,'/__test/durable');const own=facts.attempts.filter((a:any)=>a.enrollment_id===enrollmentId);expect(own.length).toBe(attempts.length);expect(own.every((a:any)=>a.status==='completed')).toBe(true);
 await page.screenshot({path:info.outputPath('generated-complete.png'),fullPage:true});
 writeFileSync(new URL(`../../../docs/aprendizaje-guiado/v2/evidencias/RC01/browser-${name}-${info.project.name}-journey.json`,import.meta.url),JSON.stringify({status:'PASS',scope:'Built Next/BFF/HTTP/independent local PostgreSQL; fixture identity; pilot human review exact hash, test only',database:ready.database,contentHash:fixture.contentHash,enrollmentId,attempts,reloadVerified,final},null,2)+'\n');
});
