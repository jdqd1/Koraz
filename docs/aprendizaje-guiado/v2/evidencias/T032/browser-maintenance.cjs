const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const { AxeBuilder } = require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const api = 'http://127.0.0.1:41032', web = 'http://127.0.0.1:31032', enrollmentId = '71000000-0000-4000-8000-000000000008';
const report = { scope: 'Hydrated actual learner pages -> Next BFF -> real Fastify/provider -> isolated serialized PGlite; synthetic cookie identity and content, controlled server Date. No independent PostgreSQL or production claim.', checks: [], viewports: [], axe: [], errors: [] };
async function control(url, body) {
  const response = await fetch(api + url, { method: body ? 'POST' : 'GET', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  assert(response.ok, `${url}: ${response.status} ${await response.clone().text()}`); return response.json();
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  let page;
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'UTC' });
    await context.addCookies([{ name: 't030', value: 'learner', url: web }]);
    page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
    const review = async () => { await page.goto(web + '/aprendizaje/repaso?motor=guided-v2&ruta=t032-route', { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.getByRole('heading', { name: 'Práctica y mantenimiento', exact: true }).waitFor({ timeout: 90000 }); await page.waitForLoadState('networkidle'); };
    const state = async () => { const r = await page.request.get(web + `/api/v2/guided-learning/enrollments/${enrollmentId}/state`); assert(r.ok(), await r.text()); return (await r.json()).state; };
    const seed = async mode => { await page.goto('about:blank'); await control(`/__test/reset/${mode}`, {}); await review(); };
    const severe = async label => { const result = await new AxeBuilder({ page }).include('[data-engine-version="guided-v2"]').analyze(); const bad = result.violations.filter(v => ['serious', 'critical'].includes(v.impact)); report.axe.push({ label, seriousCritical: bad.length }); assert.deepEqual(bad.map(v => v.id), []); };
    async function completeChoiceSession(count = 1, wrongFirst = false) {
      for (let i = 0; i < count; i++) {
        const radio = page.getByRole('radio', { name: wrongFirst && i === 0 ? 'El resultado precede al origen' : 'El origen precede al resultado' });
        await radio.waitFor({ timeout: 90000 }); await radio.press('Space');
        await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).press('Enter');
        const next = page.getByRole('button', { name: /^(Continuar|Ver cierre de sesión)$/ }); await next.waitFor({ timeout: 90000 }); await next.click();
      }
      await page.getByRole('button', { name: 'Finalizar sesión', exact: true }).click();
      await page.getByRole('heading', { name: 'Sesión completada', exact: true }).waitFor({ timeout: 90000 });
    }
    await seed('pending');
    const first = await state(); assert.equal(first.maintenance.diagnostic.status, 'pending');
    const initialStorage = await control('/__test/storage'); assert.equal(initialStorage.responses.length, 0); assert.equal(initialStorage.agenda.length, 0);
    await page.getByRole('button', { name: 'Comenzar diagnóstico', exact: true }).press('Enter');
    await completeChoiceSession(4, true); await review();
    const diagnosed = await state(); assert.equal(diagnosed.maintenance.diagnostic.status, 'completed');
    assert.equal(diagnosed.masteredAt, null); assert.equal(diagnosed.objectives[0].criticalErrorOpen, false); assert.equal(diagnosed.maintenance.agenda.length, 0);
    assert.equal(await page.getByRole('button', { name: 'Ir a comprobar', exact: true }).count() > 0, true);
    report.checks.push('Optional four-item diagnosis includes a wrong response; completed status changes support, no mastery, no critical error and no review debt; correct objectives offer server-authorized Ir a comprobar');
    await seed('pending'); await page.getByRole('button', { name: 'Aprender sin diagnóstico', exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click(); await page.getByRole('button', { name: 'Finalizar sesión' }).click();
    await page.getByRole('heading', { name: 'Sesión completada' }).waitFor(); await review();
    const omitted = await state(); assert.equal(omitted.maintenance.diagnostic.status, 'omitted'); assert.equal(omitted.masteredAt, null); assert.equal(omitted.maintenance.agenda.length, 0);
    report.checks.push('Omit diagnosis opens a real authorized study; server records omitted; acknowledged reading creates no mastery or review debt');
    await seed('critical'); assert.equal((await state()).objectives[0].criticalErrorOpen, true);
    await page.getByText('Confusión confirmada: invertir el origen y el resultado.', { exact: true }).waitFor();
    assert.equal((await state()).maintenance.blockers.some(item => item.objectiveKey === 'objective-12'), true);
    await page.getByRole('button', { name: 'Reforzar este objetivo', exact: true }).click();
    await page.getByText('El origen precede al resultado en este ejemplo sintético.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Continuar a la práctica', exact: true }).click(); await page.getByRole('button', { name: 'Finalizar sesión' }).click();
    await page.getByRole('heading', { name: 'Sesión completada' }).waitFor(); await review();
    report.checks.push('Confirmed critical error identifies the objective/dependent branch and confusion; Reforzar opens its specific source-based explanation via real provider');
    await seed('exhausted'); const exhausted = await state();
    assert(exhausted.maintenance.remediation.some(item => item.bankExhausted && item.availableAfter));
    await page.getByText('Ahora no hay una variante elegible para esta comprobación.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Reforzar este objetivo', exact: true }).count(), 0);
    for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); report.viewports.push({ viewport, pageOverflow: false });
    }
    await page.setViewportSize({ width: 390, height: 844 }); await severe('exhausted-mobile'); await page.screenshot({ path: path.join(__dirname, 'exhausted-real-mobile.png'), fullPage: true });
    await page.getByLabel('Otras ramas disponibles').getByRole('button', { name: 'Practicar este objetivo', exact: true }).first().press('Enter');
    await page.getByRole('button', { name: 'Continuar a la práctica' }).waitFor();
    assert.equal((await state()).nextAction.kind, 'resume');
    report.checks.push('Exhausted verification shows a server timestamp, no unavailable launch and a keyboard-operable independent branch; dependency remains blocked; four viewports have no page overflow');
    await page.setViewportSize({ width: 1440, height: 900 });
    await seed('review'); const due = await state(); assert.equal(due.dueReviews, 12); assert.equal(due.maintenance.reviewBatch.length, 10);
    assert.equal(await page.getByLabel('Grupo de repaso').getByRole('button', { name: /^Repasar objetivo / }).count(), 10);
    const beforeReads = await control('/__test/storage'); await page.reload(); await page.getByRole('heading', { name: 'Práctica y mantenimiento' }).waitFor(); const afterReads = await control('/__test/storage'); assert.deepEqual(afterReads, beforeReads);
    assert((await page.getByLabel('Grupo de repaso').textContent()).includes('America/Caracas'));
    await severe('review-desktop'); await page.screenshot({ path: path.join(__dirname, 'review-real-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Repasar objetivo 1', exact: true }).click(); await completeChoiceSession(); await review();
    assert.equal((await state()).dueReviews, 11); assert.equal((await control('/__test/storage')).responses.length, beforeReads.responses.length + 1);
    report.checks.push('Twelve due objectives produce exactly ten review offers; reload changes no lapse/response/agenda; choosing one commits one response, leaves eleven due and offers remain optional');
    await seed('retention'); const pendingRetention = await state(); assert.equal(pendingRetention.nextAction.kind, 'retention'); assert.equal(pendingRetention.maintenance.agenda[0].retention7.acceptedAt, null);
    await page.getByText('La ausencia no registra un fallo.', { exact: false }).waitFor();
    await page.getByLabel('Práctica recomendada').getByRole('button', { name: 'Repasar', exact: true }).click(); await completeChoiceSession(); await review();
    const measured = await state(); assert(Math.abs(measured.maintenance.agenda[0].retention7.elapsedDays - 10) < 0.01); assert.equal(measured.maintenance.agenda[0].retention30.acceptedAt, null);
    await control('/__test/clock/35', {}); await review(); await page.getByLabel('Práctica recomendada').getByRole('button', { name: 'Repasar', exact: true }).click(); await completeChoiceSession(); await review();
    const second = await state(); assert(Math.abs(second.maintenance.agenda[0].retention30.elapsedDays - 35) < 0.01); assert(second.objectives[0].firstConsolidatedAt);
    await severe('retention-measured'); await page.screenshot({ path: path.join(__dirname, 'retention-real-desktop.png'), fullPage: true });
    report.checks.push('Pending retention survives absence; day10/day35 measurements report actual server elapsed days and objective consolidation timestamp; second measurement remains separate from the first');
    await page.goto(web + '/aprendizaje/rutas/t032-route', { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.getByRole('heading', { name: 'Práctica y mantenimiento sintéticos', exact: true }).waitFor();
    await page.getByText('Refuerzo, repaso y mantenimiento', { exact: true }).click(); assert((await page.getByLabel('Mantenimiento de objetivos').textContent()).includes('35 días reales'));
    await page.goto(web + '/aprendizaje?tab=hoy', { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.getByRole('link', { name: 'Ver refuerzos y fechas de repaso', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Ver refuerzos y fechas de repaso', exact: true }).click(); await page.getByRole('heading', { name: 'Práctica y mantenimiento', exact: true }).waitFor();
    assert.equal((await state()).maintenance.agenda[0].retention30.elapsedDays, second.maintenance.agenda[0].retention30.elapsedDays);
    report.checks.push('Real route -> Today -> maintenance reads the same enrolled state and measured retention values; no v1 fallback replaces the pinned v2 route');
    assert.deepEqual(report.errors, []);
  } catch (error) { report.failure = error.message; if (page) { report.failureUrl = page.url(); fs.writeFileSync(path.join(__dirname, 'browser-failure.html'), await page.content()); await page.screenshot({ path: path.join(__dirname, 'browser-failure.png'), fullPage: true }); } throw error; }
  finally { fs.writeFileSync(path.join(__dirname, 'browser-maintenance.json'), JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
