import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {realpathSync} from 'node:fs';
const require=createRequire(new URL('../../../../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const {default:AxeBuilder}=require('@axe-core/playwright');
const esbuild=createRequire(realpathSync(fileURLToPath(new URL('../../../../../apps/api/node_modules/tsx/package.json',import.meta.url))))('esbuild');
const dir=new URL('./',import.meta.url);
await esbuild.build({entryPoints:[fileURLToPath(new URL('component-entry.tsx',dir))],outfile:fileURLToPath(new URL('component-bundle.js',dir)),nodePaths:[fileURLToPath(new URL('../../../../../apps/web/node_modules',dir))],bundle:true,format:'iife',platform:'browser',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
try {
  for(const width of [1440,390]) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:900}});
    const page=await context.newPage();
    page.setDefaultTimeout(60000);
    await page.setContent('<!doctype html><html lang="es"><head><title>Fixture aislada T038</title></head><body><main id="root"></main></body></html>');
    await page.addStyleTag({path:fileURLToPath(new URL('component-bundle.css',dir))});
    await page.addScriptTag({path:fileURLToPath(new URL('component-bundle.js',dir))});
    await page.waitForFunction(()=>document.querySelectorAll('[data-lazy-activity]').length===1600);
    assert.equal(await page.locator('[data-activity-form]').count(),0);
    await page.locator('summary[data-lazy-activity]').first().focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-activity-form]')?.dataset.activityForm==='study-1');
    const prompt=page.getByLabel('Consigna',{exact:true});
    const text=`Edición T038 ${width}`;
    await prompt.fill(text);
    await page.locator('summary[data-lazy-activity]').first().click();
    await page.waitForFunction(()=>document.querySelector('[data-activity-form]')?.dataset.activityForm==='choice-1');
    assert.equal(await page.locator('[data-activity-form]').count(),1);
    await page.getByRole('button',{name:'Localizar consigna de estudio'}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('data-field-path')==='package.activities.0.prompt');
    assert.equal(await prompt.inputValue(),text);
    // Persist the actual edited DTO through the real HTTP API; no simulated success.
    const fixture=JSON.parse(await readFile(new URL('browser-fixture.json',dir),'utf8'));
    const current=await (await fetch(`http://127.0.0.1:41035/v2/editor/learning-paths/${fixture.pathId}`,{headers:{cookie:'t035=editor'}})).json();
    const draft=await page.evaluate(()=>window.t038.draft);
    const saved=await fetch(`http://127.0.0.1:41035/v2/editor/learning-paths/${fixture.pathId}`,{method:'PATCH',headers:{cookie:'t035=editor',origin:'http://127.0.0.1:31035','content-type':'application/json','idempotency-key':crypto.randomUUID()},body:JSON.stringify({package:draft.package,bindings:draft.bindings,expectedVersion:current.route.editVersion})});
    assert.equal(saved.status,200,await saved.text());
    const persisted=await (await fetch(`http://127.0.0.1:41035/v2/editor/learning-paths/${fixture.pathId}`,{headers:{cookie:'t035=editor'}})).json();
    assert.equal(persisted.route.definition.activities[0].prompt,text);
    await page.getByLabel('Tipo de nueva actividad').selectOption('study');
    await page.getByRole('button',{name:'Añadir actividad',exact:true}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('data-field-path')==='package.activities.1600.prompt');
    assert.equal(await page.locator('[data-activity-form]').count(),1);
    const audit=await new AxeBuilder({page}).analyze();
    const violations=audit.violations.filter(v=>['serious','critical'].includes(v.impact));
    assert.equal(violations.length,0,JSON.stringify(violations.map(v=>({id:v.id,impact:v.impact}))));
    await page.screenshot({path:fileURLToPath(new URL(`component-${width}.png`,dir)),fullPage:false});
    await page.getByRole('button',{name:'Cargar fixture pequeña'}).click();
    await page.waitForFunction(()=>window.t038.draft.package.activities.length===16);
    const kinds=['study','constructed','choice','short','match','sequence','image','case'];
    const positions=[0,1,2,3,5,6,7,8];
    const controls=['Contenido de estudio','Verificación objetiva del mismo objetivo','Opción correcta','Respuesta aceptada 1','Tabla de correspondencias','Subir paso 2 del orden 1','Añadir punto por coordenadas','Subir etapa 2'];
    for(const [index,kind] of kinds.entries()) {
      await page.locator(`summary[data-field-path="package.activities.${positions[index]}"]`).focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(key=>document.querySelector('[data-activity-form]')?.dataset.activityForm===key,`${kind}-1`);
      if(['constructed','choice','short','match','sequence','image'].includes(kind))await page.getByText('Solución y feedback · solo edición',{exact:true}).click();
      const control=page.getByLabel(controls[index],{exact:true});
      if(await control.count())assert.equal(await control.first().isVisible(),true);
      else assert.equal(await page.getByRole('button',{name:controls[index],exact:true}).first().isVisible(),true);
      assert.equal(await page.locator('[data-activity-form]').count(),1);
    }
    results.push({width,activities:1600,initialForms:0,maxForms:1,keyboard:true,draftPreserved:true,exactFieldFocus:true,newActivityFocus:true,httpPersistence:true,seriousCritical:0,eightKinds:kinds,controlsVerified:controls});
    await context.close();
  }
  await writeFile(new URL('component-results.json',dir),JSON.stringify({status:'PASS',scope:'Isolated actual React component and CSS; actual Fastify/PostgreSQL HTTP persistence; no Next/BFF/shell',results},null,2)+'\n');
  console.log(JSON.stringify(results));
} catch(error) {
  await writeFile(new URL('component-failure.json',dir),JSON.stringify({error:String(error),stack:error.stack,results},null,2)+'\n');
  throw error;
} finally {await browser.close();}
