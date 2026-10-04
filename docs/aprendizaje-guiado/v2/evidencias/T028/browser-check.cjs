const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const output = path.resolve('docs/aprendizaje-guiado/v2/evidencias/T028');
const origin = 'http://127.0.0.1:3000';
const id = n => `b2800000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const result = { scope: 'Development fixtures and typed HTTP mocks; no authenticated persistence', checks: [], responsive: [], pageErrors: [], nativeZoom200: 'NO VERIFICADO', startedAt: new Date().toISOString() };
const browser = awaitable();
async function awaitable() {
  let instance;
  try {
    instance = await chromium.launch({ headless: true });
    const page = await instance.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => result.pageErrors.push(error.message));
    const go = async (surface, mode = 'critical') => { await page.goto(`${origin}/visual-fixtures/aprendizaje-v2?surface=${surface}&estado=${mode}`, { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.locator('main[data-engine-version="guided-v2"], [data-engine-version="guided-v2"]').first().waitFor({ timeout: 60000 }); };
    await page.goto(`${origin}/visual-fixtures/mapa`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'Abrir Anatomía', exact: true }).waitFor({ timeout: 60000 });
    await page.screenshot({ path: path.join(output, 'v1-reference-desktop.png') });
    result.checks.push('Existing v1 map fixture loads and retains its controls');
    for (const surface of ['route', 'hoy', 'rutas', 'progreso', 'session']) {
      await go(surface);
      const text = await page.locator('[data-engine-version="guided-v2"]').first().innerText();
      assert(text.includes('Recorrido completado'), surface);
      assert(text.includes('Dominio alcanzado'), surface);
      assert(text.includes('Consolidación pendiente'), surface);
      assert(text.includes('por reforzar'), surface);
    }
    result.checks.push('E06: route, today, cards, progress and session show the same confirmed critical state');
    await go('route', 'completed');
    assert((await page.locator('main[data-engine-version="guided-v2"]').innerText()).includes('Dominio por comprobar'));
    assert(!(await page.locator('main[data-engine-version="guided-v2"]').innerText()).includes('Dominio alcanzado'));
    result.checks.push('A completed route does not become mastered');
    await go('route', 'review');
    await page.getByRole('button', { name: 'Repasar', exact: true }).waitFor();
    assert((await page.locator('main[data-engine-version="guided-v2"]').innerText()).includes('2 repasos pendientes'));
    await go('route', 'missing');
    assert((await page.locator('main[data-engine-version="guided-v2"]').innerText()).includes('No pudimos cargar el estado confirmado'));
    assert.equal(await page.getByRole('button', { name: 'Continuar', exact: true }).count(), 0);
    await go('route', 'revoked');
    assert((await page.locator('main[data-engine-version="guided-v2"]').innerText()).includes('Tu historial se conserva'));
    await go('route', 'empty');
    assert((await page.locator('main[data-engine-version="guided-v2"]').innerText()).includes('no tiene unidades disponibles'));
    result.checks.push('Review, missing state, revoked access and empty units remain distinct and actionable');
    for (const size of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(size); await go('route');
      const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      assert(dimensions.documentWidth <= dimensions.clientWidth + 1, JSON.stringify(dimensions));
      result.responsive.push({ ...size, ...dimensions });
    }
    await page.screenshot({ path: path.join(output, 'route-critical-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Reforzar', exact: true }).focus();
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Reforzar');
    await page.locator('summary').nth(1).focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('details.learning-unit').nth(1).getAttribute('open'), '');
    result.checks.push('Keyboard reaches the action and expands a second unit using Enter');
    await page.goto(`${origin}/visual-fixtures/aprendizaje-v2?surface=map&estado=critical`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'Abrir Fisiología', exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: 'Abrir Fisiología', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir Práctica por objetivos', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Abrir Práctica por objetivos', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir Comprender y recuperar', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Abrir Comprender y recuperar', exact: true }).click();
    await page.getByRole('complementary', { name: 'Detalle de práctica por objetivos' }).waitFor();
    assert((await page.getByRole('complementary', { name: 'Detalle de práctica por objetivos' }).innerText()).includes('Necesita refuerzo'));
    const routeLink = await page.getByRole('link', { name: 'Ver en la ruta', exact: true }).getAttribute('href');
    assert(routeLink.includes('leccion=unit-a') && routeLink.includes('returnTo='));
    assert.equal(await page.getByRole('button', { name: 'Completar bloque', exact: true }).count(), 0);
    await page.screenshot({ path: path.join(output, 'map-critical-desktop.png') });
    result.checks.push('Map retains topic → route → unit navigation, shows objective blocker and safe returnTo; no completion action');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('dialog', { name: 'Detalle del mapa' }).waitFor();
    await page.getByRole('dialog', { name: 'Detalle del mapa' }).screenshot({ path: path.join(output, 'map-critical-mobile.png') });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'Detalle del mapa' }).waitFor({ state: 'hidden' });
    const focus = await page.evaluate(() => ({ tag: document.activeElement.tagName, inert: !!document.querySelector('[data-map-background]')?.inert }));
    assert.equal(focus.inert, false);
    result.mobileFocusAfterEscape = focus;
    result.checks.push('Mobile detail closes with Escape and releases background inert state');
    await go('route'); await page.screenshot({ path: path.join(output, 'route-critical-mobile.png'), fullPage: true });
    await page.evaluate(() => document.documentElement.style.zoom = '2');
    const zoomDimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    result.cssZoom200 = zoomDimensions;
    await page.evaluate(() => document.documentElement.style.zoom = '');
    const calls = [];
    await page.route('**/api/v2/guided-learning/attempts', async route => {
      const request = route.request(); calls.push({ headers: request.headers(), body: request.postDataJSON() });
      if (calls.length === 1) return route.abort('failed');
      return route.fulfill({ json: { attempt: { engineVersion: 'guided-v2', policyVersion: 'guided-v2.0', attemptId: id(4), enrollmentId: id(3), pathVersionId: id(2), purpose: 'activity', rowVersion: 1, status: 'open', activeActivity: null, acceptedResponses: [] } } });
    });
    await page.getByRole('button', { name: 'Reforzar', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'No pudimos confirmar la apertura' }).waitFor();
    await page.getByRole('button', { name: 'Reforzar', exact: true }).click();
    await page.waitForURL(`**/aprendizaje/sesiones/${id(4)}`, { timeout: 60000 });
    assert.deepEqual(calls[0].body, calls[1].body);
    assert.equal(calls[0].headers['idempotency-key'], calls[1].headers['idempotency-key']);
    assert.equal(calls[0].body.expectedEnrollmentVersion, 4);
    result.launcherRequests = calls.map(call => ({ body: call.body, idempotencyKey: call.headers['idempotency-key'] }));
    result.checks.push('Browser launcher retries a network failure with the same key/clientAttemptId/CAS and reaches the session URL');
    result.status = result.pageErrors.length ? 'FAIL' : 'PASS';
    assert.equal(result.pageErrors.length, 0, result.pageErrors.join('\n'));
  } catch (error) { result.status = 'FAIL'; result.error = error.stack; throw error; }
  finally { result.completedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'browser-checks.json'), JSON.stringify(result, null, 2)); if (instance) await instance.close(); }
}
browser.catch(error => { console.error(error); process.exitCode = 1; });
