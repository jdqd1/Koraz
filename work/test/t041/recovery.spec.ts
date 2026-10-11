import { test, expect } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
const control = 'http://127.0.0.1:41042';
const api = 'http://127.0.0.1:41041';
async function snapshot(request: any) { const r = await request.get(control + '/snapshot'); expect(r.ok()).toBeTruthy(); return r.json(); }
async function mode(request: any, value: string) { const r = await request.post(control + '/mode/' + value); expect(r.ok()).toBeTruthy(); }
async function actor(page: any, n: number) { await page.context().addCookies([{ name: 't041', value: 'student-' + n, domain: '127.0.0.1', path: '/' }]); }
test('M04 restored v2 displays maintenance and preserves all data', async ({ page, request }, info) => {
  await mode(request, 'off'); await actor(page, 2);
  const before = await snapshot(request);
  await page.goto('/aprendizaje/rutas/t041-v2');
  await expect(page.locator('[data-engine-version="guided-v2"]:visible')).toHaveCount(1);
  await expect(page.locator('p:visible').filter({ hasText: /^Ruta en mantenimiento; tu versión y tu historial se conservan\.$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Comenzar|Continuar|Repasar objetivo)/ })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('maintenance-route.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('p:visible').filter({ hasText: /^Ruta en mantenimiento; tu versión y tu historial se conservan\.$/ })).toBeVisible();
  expect(await snapshot(request)).toEqual(before);
});
test('M04 v1 restored session can write and complete while v2 is disabled', async ({ page, request }, info) => {
  await mode(request, 'off'); const n = info.project.name === 'mobile' ? 9 : 8; await actor(page, n);
  const fixture = (await (await request.get(control + '/ready')).json()).fixtures;
  const v2Before = await snapshot(request);
  await page.goto('/aprendizaje/rutas/t041-v1');
  await expect(page.getByRole('heading', { name: 'Ruta v1 T041', exact: true })).toBeVisible();
  await page.goto('/aprendizaje/sesiones/' + fixture.v1.sessions[n]);
  const complete = page.getByRole('button', { name: 'Terminé esta lectura', exact: true });
  await expect(complete).toBeVisible();
  await expect.poll(() => complete.evaluate(el => Object.keys(el).some(k => k.startsWith('__reactProps') && typeof (el as any)[k]?.onClick === 'function'))).toBe(true);
  await complete.click(); await expect(page.getByText('Progreso guardado.', { exact: true })).toBeVisible();
  const r = await page.request.get(api + '/v1/guided-learning/attempts/' + fixture.v1.sessions[n]); expect(r.ok()).toBeTruthy(); expect((await r.json()).status).toBe('completed');
  await page.reload(); await expect(page.getByRole('button', { name: 'Terminé esta lectura', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('v1-completed.png'), fullPage: true });
  const after = await snapshot(request);
  for (const table of Object.keys(v2Before.rows).filter(t => t.startsWith('public.learning_v2_'))) expect(after.rows[table]).toEqual(v2Before.rows[table]);
});
test('M04 restored v2 active session resumes after controlled reenable', async ({ page, request }, info) => {
  await mode(request, 'off'); const n = info.project.name === 'mobile' ? 4 : 3; await actor(page, n);
  const fixture = (await (await request.get(control + '/ready')).json()).fixtures;
  await page.goto('/aprendizaje/sesiones/' + fixture.v2.sessions[n]);
  await expect(page.getByRole('heading', { name: 'Tu sesión de aprendizaje', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('v2-session-off.png'), fullPage: true });
  await mode(request, 'on'); await page.reload();
  const proceed = page.getByRole('button', { name: 'Continuar a la práctica', exact: true }); await expect(proceed).toBeVisible();
  await expect.poll(() => proceed.evaluate(el => Object.keys(el).some(k => k.startsWith('__reactProps') && typeof (el as any)[k]?.onClick === 'function'))).toBe(true);
  await proceed.click();
  // Study responses go directly to the close action; they do not render graded feedback.
  await page.getByRole('button', { name: 'Finalizar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sesión completada', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Sesión completada', exact: true })).toBeVisible();
  const r = await page.request.get(api + '/v2/guided-learning/attempts/' + fixture.v2.sessions[n]); expect(r.ok()).toBeTruthy();
  const attempt = (await r.json()).attempt; expect(attempt.status).toBe('completed'); expect(attempt.pathVersionId).toBe(fixture.v2.versionId); expect(attempt.acceptedResponses).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('v2-resumed-completed.png'), fullPage: true });
});
