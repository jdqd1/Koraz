const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium, expect } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const { AxeBuilder } = require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const dir = path.resolve('docs/aprendizaje-guiado/v2/evidencias/T034');
const web = 'http://127.0.0.1:31034', api = 'http://127.0.0.1:41034';
const report = { checks: [], requests: [], errors: [], viewports: [] };
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Caracas' });
    await context.addCookies([{ name: 't034', value: 'student', url: web }]);
    const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/api/v2/guided-learning/') && request.method() === 'POST') report.requests.push({ url: request.url(), body: request.postData(), key: request.headers()['idempotency-key'] }); });
    await page.goto(web + '/aprendizaje/rutas/t034-upgrade', { waitUntil: 'networkidle', timeout: 240000 });
    const notice = page.getByRole('complementary', { name: 'Actualización de la ruta' });
    await notice.getByRole('button', { name: 'Revisar actualización o recuperar solicitud' }).press('Enter');
    await notice.getByText('Identificar una posición actualizada: Requiere nueva evidencia', { exact: true }).waitFor();
    await expect(notice.getByRole('button', { name: 'Adoptar versión', exact: true })).toBeDisabled();
    report.checks.push('keyboard preview and acknowledgement required');
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert(geometry.scroll <= geometry.width + 1); report.viewports.push(geometry);
      await page.screenshot({ path: path.join(dir, `upgrade-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    const axe = await new AxeBuilder({ page }).include('[aria-label="Actualización de la ruta"]').analyze();
    report.axe = axe.violations.map(item => ({ id: item.id, impact: item.impact })); assert(!report.axe.some(item => ['serious', 'critical'].includes(item.impact)));
    let lost = false;
    await page.route('**/api/v2/guided-learning/enrollments/*/upgrade', async route => {
      if (route.request().method() === 'POST' && !lost) { lost = true; const response = await route.fetch(); assert.equal(response.status(), 200); await route.abort('failed'); }
      else await route.continue();
    });
    await notice.getByRole('checkbox').check(); await notice.getByRole('button', { name: 'Adoptar versión', exact: true }).press('Enter');
    await notice.getByText(/No pudimos confirmar la actualización/).waitFor();
    assert.equal((await (await fetch(api + '/__test/data')).json()).rows[0].row_version, 2);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('complementary', { name: 'Actualización de la ruta' }).getByRole('button', { name: 'Revisar actualización o recuperar solicitud' }).press('Enter');
    await expect(async () => { assert.equal(await page.evaluate(() => sessionStorage.getItem('koraz:v2:upgrade:71000000-0000-4000-8000-000000000008')), null); }).toPass({ timeout: 30000 });
    assert.equal(report.requests.length, 2); assert.equal(report.requests[0].body, report.requests[1].body); assert.equal(report.requests[0].key, report.requests[1].key);
    report.database = await (await fetch(api + '/__test/data')).json();
    assert.equal(report.database.histories[0].n, 1); assert.equal(report.database.responses[0].n, 0); assert.equal(report.database.rewards[0].n, 0);
    report.checks.push('lost receipt recovery preserves body/key and one adoption');
    await fetch(api + '/__test/off', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await page.reload({ waitUntil: 'networkidle' }); await page.getByText(/Ruta en mantenimiento\. Tu versión y tu historial se conservan/).waitFor();
    await expect(page.getByRole('button', { name: 'Adoptar versión', exact: true })).toHaveCount(0);
    await page.getByRole('heading', { name: 'Tu historial', exact: true }).waitFor();
    await page.screenshot({ path: path.join(dir, 'maintenance.png'), fullPage: true });
    report.checks.push('maintenance keeps history and removes mutation controls');
    assert.deepEqual(report.errors, []); fs.writeFileSync(path.join(dir, 'browser-upgrade.json'), JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { fs.writeFileSync(path.join(dir, 'browser-error.txt'), error.stack); process.exitCode = 1; });
