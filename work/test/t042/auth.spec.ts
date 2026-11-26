import { test, expect } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { randomUUID } from 'node:crypto';
test('S07 actual signed Better Auth cookie expires and BFF rejects exact replay without writes',async({request},info)=>{
  const api='http://127.0.0.1:41043',web='http://127.0.0.1:31043';
  const ready=await(await request.get(api+'/__test/ready')).json();expect(ready.realBetterAuth).toBe(true);
  const issued=await(await request.post(api+'/__test/signup',{data:{}})).json();
  const headers={cookie:issued.cookie,origin:web,'idempotency-key':randomUUID()};
  const url=web+'/api/v2/guided-learning/enrollments',data={pathId:ready.pathId};
  const accepted=await request.post(url,{headers,data});expect(accepted.status()).toBe(200);
  const first=await accepted.json();
  const replay=await request.post(url,{headers,data});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(first);
  const before=await(await request.get(api+'/__test/fingerprint')).json();
  const expiry=await request.post(api+'/__test/expire',{data:{userId:issued.userId}});expect(expiry.status()).toBe(200);
  const expiredAt=await expiry.text();
  await expect.poll(async()=>Date.now(),{timeout:5000}).toBeGreaterThan(Date.parse(expiredAt)+100);
  const denied=await request.post(url,{headers,data});expect(denied.status()).toBe(401);
  const deniedApi=await request.post(api+'/v2/guided-learning/enrollments',{headers,data});expect(deniedApi.status()).toBe(401);
  expect(await(await request.get(api+'/__test/fingerprint')).json()).toEqual(before);
  await info.attach('actual-session-expiry.json',{body:JSON.stringify({issuedBy:'createBetterAuthService',accepted:200,replay:200,expiredAt,bffAfterExpiry:401,apiAfterExpiry:401,learningTablesUnchanged:true}),contentType:'application/json'});
});

for (const profile of [
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
]) {
  test.describe(profile.name, () => {
    test.use({ viewport: profile.viewport, isMobile: profile.isMobile, hasTouch: profile.hasTouch });

    test('F08 signed learner session recovers saved progress after a cold start', async ({ page, request }, info) => {
      const api = 'http://127.0.0.1:41043';
      const web = 'http://127.0.0.1:31043';
      const route = '/aprendizaje/rutas/t035-small';
      const signup = await request.post(`${api}/__test/signup`, { data: {} });
      expect(signup.ok()).toBe(true);
      const { cookie }: { cookie: string } = await signup.json();
      await page.context().addCookies(cookie.split('; ').map(pair => {
        const separator = pair.indexOf('=');
        return { name: pair.slice(0, separator), value: pair.slice(separator + 1), url: web };
      }));

      await page.goto(web + route);
      await page.getByRole('button', { name: 'Comenzar', exact: true }).click();
      await page.getByRole('button', { name: 'Continuar', exact: true }).first().click();
      await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
      await page.getByRole('button', { name: 'Guardar lectura', exact: true }).click();
      const completed = page.getByRole('heading', { name: 'Sesión completada', exact: true });
      const finish = page.getByRole('button', { name: 'Finalizar sesión', exact: true });
      await expect(completed.or(finish)).toBeVisible();
      if (await finish.isVisible()) await finish.click();
      await expect(completed).toBeVisible();

      const pathResponse = await page.request.get(`${api}/v2/guided-learning/paths/t035-small`);
      expect(pathResponse.ok()).toBe(true);
      const { path } = await pathResponse.json();
      const readState = async () => {
        const result = await page.request.get(`${api}/v2/guided-learning/enrollments/${path.enrollmentId}/state`);
        expect(result.ok()).toBe(true);
        const { state } = await result.json();
        return {
          pathVersionId: state.pathVersionId,
          rowVersion: state.rowVersion,
          completedActivities: state.completedActivities,
          totalXp: state.motivation.totalXp,
        };
      };
      const confirmed = await readState();
      expect(confirmed.completedActivities).toBe(1);
      expect(confirmed.totalXp).toBe(0);

      await page.reload();
      await expect(completed).toBeVisible();
      await page.getByRole('link', { name: 'Volver a la unidad', exact: true }).first().click();
      await expect(page).toHaveURL(/\/aprendizaje\/rutas\/t035-small\?.*actividad=study-1/);
      const resources = page.getByRole('tab', { name: 'Recursos', exact: true });
      await resources.click();
      await expect(resources).toHaveAttribute('aria-selected', 'true');
      const selectedUrl = page.url();
      expect(new URL(selectedUrl).searchParams.get('pestana')).toBe('resources');
      const fingerprint = async () => {
        const response = await request.get(`${api}/__test/fingerprint`);
        expect(response.ok()).toBe(true);
        return response.json();
      };
      const before = await fingerprint();

      const navigations: string[] = [];
      page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) navigations.push(new URL(frame.url()).pathname);
      });
      const unavailable = page.getByRole('heading', { name: 'No pudimos verificar tu sesión' });
      const outage = await request.post(`${api}/__test/cold-start`);
      expect(outage.ok()).toBe(true);
      let identityAbortsMs: number[];
      try {
        await page.reload();
        await expect(unavailable).toBeVisible();
        await expect(page.getByText(/El servidor tardó demasiado/)).toBeVisible();
        await expect(page.getByRole('status').filter({ hasText: 'Koraz volverá a intentar' })).toBeVisible();
        await expect(page).toHaveURL(selectedUrl);
      } finally {
        const warm = await request.post(`${api}/__test/warm`);
        expect(warm.ok()).toBe(true);
        ({ identityAbortsMs } = await warm.json());
      }

      expect(identityAbortsMs).toHaveLength(2);
      for (const elapsed of identityAbortsMs) expect(elapsed).toBeGreaterThanOrEqual(2_400);
      const warmed = performance.now();
      await expect(resources).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 });
      const recoveredAfterMs = Math.round(performance.now() - warmed);
      await expect(page.getByRole('tabpanel', { name: 'Recursos' })).toBeVisible();
      await expect(unavailable).toHaveCount(0);
      await expect(page).toHaveURL(selectedUrl);
      expect(navigations).not.toContain('/acceder');
      expect(await readState()).toEqual(confirmed);
      expect(await fingerprint()).toEqual(before);

      await info.attach('f08-cold-start.json', {
        body: JSON.stringify({
          profile: profile.name, viewport: profile.viewport, signedSession: true,
          url: selectedUrl, selectedTab: 'Recursos', identityAbortsMs, recoveredAfterMs,
          stateBeforeAndAfter: confirmed, learningTablesUnchanged: true,
        }),
        contentType: 'application/json',
      });
    });
  });
}
