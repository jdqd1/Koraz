import { test, expect } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('T040 L03 large editor mounts one form, preserves closed edits and persists through the real BFF', async ({ page }, info) => {
  await page.context().addCookies([{ name:'t035', value:'editor', domain:'127.0.0.1', path:'/' }]);
  const ready = await (await page.request.get('http://127.0.0.1:41035/__test/ready')).json();
  expect(ready.testOnly).toBe(true);
  const response = await page.request.get(`/api/v2/editor/learning-paths/${ready.fixtures.large.pathId}`);
  expect(response.status()).toBe(200);
  const original = (await response.json()).route;
  const pkg = JSON.parse(await readFile(resolve(__dirname,'large-editor-package.json'),'utf8'));
  expect(pkg.objectives).toHaveLength(200); expect(pkg.units).toHaveLength(30); expect(pkg.activities).toHaveLength(1600);
  pkg.packageKey = `t040-l03-${info.project.name}`; pkg.route.slug = pkg.packageKey; pkg.route.title = `Editor grande T040 ${info.project.name}`;
  const created = await page.request.post('/api/v2/editor/learning-paths', { data:{ package:pkg, bindings:original.bindings }, headers:{ 'idempotency-key':crypto.randomUUID() } });
  expect(created.status(), await created.text()).toBe(200);
  const pathId = (await created.json()).pathId;
  await page.goto(`/panel/rutas/${pathId}`);
  await page.getByRole('tab', { name:'Recorrido', exact:true }).click();
  const summaries = page.locator('summary[data-lazy-activity]');
  await expect(summaries).toHaveCount(1600); await expect(page.locator('[data-activity-form]')).toHaveCount(0);
  await summaries.first().focus(); await summaries.first().press('Enter');
  await expect(page.locator('[data-activity-form]')).toHaveCount(1);
  const prompt = page.getByLabel('Consigna', { exact:true }), changed = `Edición T040 ${info.project.name}`;
  await prompt.fill(changed);
  await summaries.nth(1).click(); await expect(page.locator('[data-activity-form]')).toHaveCount(1);
  await summaries.first().click(); await expect(prompt).toHaveValue(changed);
  const saved = page.waitForResponse(r => r.request().method()==='PATCH' && r.url().endsWith(`/api/v2/editor/learning-paths/${pathId}`));
  await page.getByRole('button', { name:'Guardar borrador', exact:true }).click();
  expect((await saved).status()).toBe(200);
  // Headers arriving do not imply that the UI has read and confirmed the receipt.
  await expect(page.getByText('Borrador al día',{exact:true})).toBeVisible();
  await expect.poll(() => page.evaluate(id => Object.keys(sessionStorage).filter(key=>key.startsWith('cediah:route-editor:v2:') && key.endsWith(':'+id)).length,pathId)).toBe(0);
  await page.reload(); await page.getByRole('tab', { name:'Recorrido', exact:true }).click();
  await summaries.first().click(); await expect(prompt).toHaveValue(changed);
  await expect(prompt).toBeEnabled();
  await expect(page.getByText('Hay una copia local de otra revisión',{exact:true})).toHaveCount(0);
  await expect(page.locator('[data-activity-form]')).toHaveCount(1);
  const widths = [];
  for (const width of [320,360,390,768,1024,1440]) {
    await page.setViewportSize({ width, height:900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await prompt.scrollIntoViewIfNeeded();
    const bounds = await prompt.boundingBox(); expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(-1); expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
    widths.push({ width, fieldReachable:true });
  }
  await prompt.fill(''); await summaries.first().click();
  await page.getByRole('button', { name:'Guardar borrador', exact:true }).click();
  await expect(prompt).toBeFocused(); await expect(page.locator('[data-activity-form]')).toHaveCount(1);
  await prompt.fill(changed);
  const geometry = await page.evaluate(() => ({ viewport:innerWidth, pageWidth:document.documentElement.scrollWidth,
    summaries:document.querySelectorAll('summary[data-lazy-activity]').length, forms:document.querySelectorAll('[data-activity-form]').length }));
  expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewport+1);
  await writeFile(info.outputPath('large-editor.json'), JSON.stringify({ status:'PASS', objectives:200, activities:1600, initialForms:0, maximumForms:1, keyboard:true, draftPreserved:true, persisted:true, errorFocus:true, widths, geometry }, null, 2));
  await page.screenshot({ path:info.outputPath('large-editor.png') });
});
