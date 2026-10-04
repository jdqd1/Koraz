const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const { AxeBuilder } = require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const dir = path.resolve('docs/aprendizaje-guiado/v2/evidencias/T033'), web = 'http://127.0.0.1:31033', api = 'http://127.0.0.1:41033';
const report = { checks: [], learnerRequests: [], viewports: [], axe: [], errors: [] };
(async () => {
  const browser = await chromium.launch({ headless: true }); let page;
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Caracas' });
    await context.addCookies([{ name: 't030', value: 'editor', url: web }]);
    page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
    await page.route('**/api/v2/guided-learning/**', route => { report.learnerRequests.push(route.request().url()); return route.abort(); });
    await page.route('https://t033-media.example.test/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="5" y="5" width="90" height="90" fill="#ccddee"/></svg>' }));
    await page.goto(web + '/panel/rutas/71000000-0000-4000-8000-000000000004', { waitUntil: 'domcontentloaded', timeout: 240000 });
    await page.waitForLoadState('networkidle');
    const reviewTab = page.getByRole('tab', { name: 'Revisión', exact: true });
    await require(path.resolve('apps/web/node_modules/@playwright/test')).expect(async () => {
      await reviewTab.press('Enter');
      assert.equal(await reviewTab.getAttribute('aria-selected'), 'true');
    }).toPass({ timeout: 60000, intervals: [500, 1000] });
    const preview = page.locator('[data-editor-preview]');
    await preview.getByRole('button', { name: 'Abrir vista previa', exact: true }).press('Enter');
    await preview.getByRole('button', { name: 'Abrir punto seleccionado', exact: true }).waitFor({ timeout: 90000 });
    async function start(key) {
      await preview.getByLabel('Explorar un punto de la ruta').selectOption('activity:' + key);
      await preview.getByRole('button', { name: 'Abrir punto seleccionado', exact: true }).click();
      await preview.getByRole('heading', { name: new RegExp((key === 'case' ? 'choice' : key) + ': actividad sintética') }).waitFor({ timeout: 90000 });
    }
    async function feedback() { const next = preview.getByRole('button', { name: /^(Continuar|Ver cierre de sesión)$/ }); await next.waitFor({ timeout: 30000 }); await next.click(); }
    async function finish() { await preview.getByRole('button', { name: 'Finalizar sesión', exact: true }).click(); await preview.getByRole('heading', { name: 'Sesión completada', exact: true }).waitFor({ timeout: 30000 }); }
    await start('study'); await preview.getByRole('button', { name: 'Continuar a la práctica' }).click(); await finish(); report.checks.push('study -> simulated close');
    await start('case');
    assert(!(await preview.textContent()).includes('Etapa 2'));
    await preview.getByRole('button', { name: 'Necesito ayuda', exact: true }).click();
    await preview.getByRole('heading', { name: 'Pista', exact: true }).waitFor();
    await preview.getByRole('radio', { name: 'B', exact: true }).check(); await preview.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click(); await feedback();
    await preview.getByLabel('Tu respuesta', { exact: true }).fill('respuesta'); await preview.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click(); await feedback(); await finish(); report.checks.push('case -> choice/help/wrong -> short -> close');
    await start('constructed'); await preview.getByLabel('Explica con tus palabras').fill('Mi razonamiento sintético'); await preview.getByRole('button', { name: 'Guardar mi respuesta' }).click(); await preview.getByRole('button', { name: 'Comparar con el modelo' }).click(); await preview.getByRole('heading', { name: 'Respuesta modelo', exact: true }).waitFor(); await preview.getByRole('button', { name: 'Lo recuperé', exact: true }).click(); await feedback(); await finish(); report.checks.push('constructed -> submit/reveal/self rating');
    await start('match'); await preview.getByRole('combobox', { name: /^P/ }).selectOption('c'); await preview.getByRole('button', { name: 'Comprobar relaciones' }).click(); await feedback(); await finish(); report.checks.push('match');
    await start('sequence'); await preview.getByRole('button', { name: 'Comprobar secuencia' }).click(); await feedback(); await finish(); report.checks.push('sequence');
    await start('image'); await preview.getByLabel('Horizontal (%)').fill('20'); await preview.getByLabel('Vertical (%)').fill('20');
    await page.screenshot({ path: path.join(dir, 'preview-image-desktop.png'), fullPage: true });
    await preview.getByRole('button', { name: 'Comprobar respuesta visual' }).click(); await feedback(); await finish(); report.checks.push('signed editorial image -> hotspot');
    await preview.getByRole('button', { name: 'Avanzar 7 días', exact: true }).click(); await page.waitForTimeout(300); report.checks.push('simulated clock +7 days');
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await preview.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth, document: document.documentElement.clientWidth, documentScroll: document.documentElement.scrollWidth }));
      report.viewports.push({ viewportWidth: width, ...dimensions });
      assert(dimensions.scrollWidth <= dimensions.width + 1, JSON.stringify(dimensions));
      assert(dimensions.documentScroll <= dimensions.document + 1, JSON.stringify(dimensions));
    }
    await page.screenshot({ path: path.join(dir, 'preview-mobile.png'), fullPage: true });
    const audit = await new AxeBuilder({ page }).include('[data-editor-preview]').analyze();
    report.axe = audit.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
    assert.deepEqual(report.axe, []);
    await preview.getByRole('button', { name: 'Cerrar vista previa', exact: true }).first().click();
    await require(path.resolve('apps/web/node_modules/@playwright/test')).expect(preview.getByRole('button', { name: 'Abrir vista previa', exact: true })).toBeFocused(); report.checks.push('close returns focus to trigger');
    await preview.getByLabel('Perfil de vista previa').selectOption('core_error'); await preview.getByRole('button', { name: 'Abrir vista previa', exact: true }).click(); await preview.getByRole('button', { name: 'Abrir punto seleccionado' }).waitFor(); report.checks.push('CORE error profile');
    assert((await preview.textContent()).includes('Confusión CORE de prueba'));
    const counts = await (await fetch(api + '/__test/counts')).json(); assert.deepEqual(counts.current, counts.baseline); report.database = counts;
    assert.deepEqual(report.learnerRequests, []); assert.deepEqual(report.errors, []);
    fs.writeFileSync(path.join(dir, 'browser-preview.json'), JSON.stringify(report, null, 2));
  } catch (error) { if (page) { await page.screenshot({ path: path.join(dir, 'browser-failure.png'), fullPage: true, timeout: 5000 }).catch(() => {}); fs.writeFileSync(path.join(dir, 'browser-failure.html'), await page.content()); } report.failure = String(error); fs.writeFileSync(path.join(dir, 'browser-preview.json'), JSON.stringify(report, null, 2)); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
