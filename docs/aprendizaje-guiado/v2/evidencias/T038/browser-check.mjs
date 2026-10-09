import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
const require=createRequire(new URL('../../../../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const {default:AxeBuilder}=require('@axe-core/playwright');
const base='http://127.0.0.1:31035', api='http://127.0.0.1:41035';
const output=new URL('./',import.meta.url);
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
try {
  const fixture=await (await fetch(api+'/__test/t038')).json();
  assert.equal(fixture.testOnly,true);assert.match(fixture.database,/^koraz_guided_v2_test_[a-f0-9]{32}$/);
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const context=await browser.newContext({viewport});
    await context.addCookies([{name:'t035',value:'editor',domain:'127.0.0.1',path:'/'}]);
    const page=await context.newPage();page.setDefaultTimeout(90000);
    const started=performance.now();
    await page.goto(base+`/panel/rutas/${fixture.editorPathId}`);
    await page.getByRole('tab',{name:'Recorrido',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-lazy-activity]').length===1600);
    const initialMs=performance.now()-started;
    assert.equal(await page.locator('[data-activity-form]').count(),0);
    const summaries=page.locator('summary[data-lazy-activity]');
    await summaries.first().focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelectorAll('[data-activity-form]').length===1);
    const prompt=page.getByLabel('Consigna',{exact:true});
    const changed=`T038 edición persistida ${viewport.width}`;
    await prompt.fill(changed);
    const second=page.locator('summary[data-lazy-activity]').first();
    await second.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-activity-form]')?.getAttribute('data-activity-form')!=='study-1');
    assert.equal(await page.locator('[data-activity-form]').count(),1);
    const study=page.locator('summary[data-field-path="package.activities.0"]');
    await study.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-activity-form]')?.getAttribute('data-activity-form')==='study-1');
    assert.equal(await prompt.inputValue(),changed,'Closing a lazy form lost draft input');
    const saved=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().endsWith(`/api/v2/editor/learning-paths/${fixture.editorPathId}`));
    await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
    assert.equal((await saved).status(),200);
    await page.reload();await page.getByRole('tab',{name:'Recorrido',exact:true}).click();
    await page.locator('summary[data-field-path="package.activities.0"]').click();
    await page.waitForFunction(()=>document.querySelector('[data-activity-form]')?.getAttribute('data-activity-form')==='study-1');
    assert.equal(await prompt.inputValue(),changed,'Persisted field changed after reload');
    // A save error must open a closed form and focus its exact required field.
    await prompt.fill('');
    await page.locator('summary[data-lazy-activity]').first().click();
    await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('data-field-path')==='package.activities.0.prompt');
    await prompt.fill(changed);
    await page.getByLabel('Tipo de nueva actividad').selectOption('study');
    await page.getByRole('button',{name:'Añadir actividad',exact:true}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('data-field-path')==='package.activities.1600.prompt');
    assert.equal(await page.locator('[data-activity-form]').count(),1);
    // Restore by reload, discarding the unsaved addition through the normal recovery choice.
    await page.screenshot({path:fileURLToPath(new URL(`editor-${viewport.width}.png`,output)),fullPage:false});
    const axe=await new AxeBuilder({page}).analyze();
    assert.equal(axe.violations.filter(v=>['serious','critical'].includes(v.impact)).length,0);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false);
    results.push({viewport,initialMs,activities:1600,initialForms:0,maxForms:1,keyboard:true,draftPreserved:true,persistence:true,errorFocus:true,newActivityFocus:true,seriousCritical:0,overflow});
    // Drop the unsaved fixture recovery copy before the next viewport.
    await page.evaluate(()=>sessionStorage.clear());
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addCookies([{name:'t035',value:'editor',domain:'127.0.0.1',path:'/'}]);
  const page=await context.newPage();page.setDefaultTimeout(90000);
  const ready=await (await fetch(api+'/__test/ready')).json();
  await page.goto(base+`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  await page.getByRole('tab',{name:'Recorrido',exact:true}).click();
  const kinds=['study','constructed','choice','short','match','sequence','image','case'];
  const controls=['Contenido de estudio','Verificación objetiva del mismo objetivo','Opción correcta','Respuesta aceptada 1','Tabla de correspondencias','Subir paso 2 del orden 1','Añadir punto por coordenadas','Subir etapa 2'];
  for(const [index,kind] of kinds.entries()) {
    // Summaries are identified by their stable position in this published T035 synthetic fixture.
    const positions={study:0,constructed:1,choice:2,short:3,match:5,sequence:6,image:7,case:8};
    const summary=page.locator(`summary[data-field-path="package.activities.${positions[kind]}"]`);
    await summary.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(key=>document.querySelector('[data-activity-form]')?.getAttribute('data-activity-form')===key,`${kind}-1`);
    const solution=page.getByText('Solución y feedback · solo edición',{exact:true});
    if(['constructed','choice','short','match','sequence','image'].includes(kind))await solution.click();
    const control=page.getByLabel(controls[index],{exact:true});
    if(await control.count())assert.equal(await control.first().isVisible(),true);
    else assert.equal(await page.getByRole('button',{name:controls[index],exact:true}).first().isVisible(),true);
    assert.equal(await page.locator('[data-activity-form]').count(),1);
  }
  results.push({smallEditorKinds:kinds,controlsVerified:controls,forms:1});
  await context.close();
  await writeFile(new URL('browser-results.json',output),JSON.stringify({status:'PASS',results},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',results}));
} catch(error) {
  await writeFile(new URL('browser-failure.json',output),JSON.stringify({error:String(error),stack:error.stack,results},null,2)+'\n');
  throw error;
} finally {await browser.close();}
