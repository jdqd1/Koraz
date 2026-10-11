# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery.spec.ts >> M04 v1 restored session can write and complete while v2 is disabled
- Location: ..\..\work\test\t041\recovery.spec.ts:19:5

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:41042
Call log:
  - → GET http://127.0.0.1:41042/snapshot
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - generic [ref=f2e2]:
    - complementary "Navegación principal" [ref=f2e3]:
      - navigation [ref=f2e4]:
        - generic [ref=f2e5]:
          - link "Inicio" [ref=f2e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f2e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f2e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f2e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f2e20]:
      - banner [ref=f2e21]:
        - button "Expandir menú principal" [ref=f2e23] [cursor=pointer]
        - search "Buscar guías" [ref=f2e27]:
          - combobox "Buscar guías" [ref=f2e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f2e32]
        - generic [ref=f2e33]:
          - button "Notificaciones" [ref=f2e35] [cursor=pointer]
          - link "Acceder" [ref=f2e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f2e43]:
        - generic [ref=f2e44]:
          - link "Mi ruta" [ref=f2e45] [cursor=pointer]:
            - /url: /aprendizaje/rutas/t041-v1
          - generic [ref=f2e48]:
            - text: Guía
            - heading "Guía T041" [level=1] [ref=f2e49]
          - generic [ref=f2e50]: Guardado
        - paragraph [ref=f2e53]
        - generic [ref=f2e54]:
          - generic [ref=f2e58]: Progreso guardado
          - heading "Actividad completada" [level=2] [ref=f2e59]
          - paragraph [ref=f2e60]: La evidencia quedó confirmada por el servidor. Puedes detenerte aquí o elegir cómo continuar.
          - generic [ref=f2e61]:
            - generic [ref=f2e62]:
              - strong [ref=f2e63]: 100% de la ruta
              - generic [ref=f2e64]: 2 de 2 actividades esenciales
            - progressbar "Avance actualizado de la ruta" [ref=f2e65]
          - generic [ref=f2e66]:
            - link "Continuar" [ref=f2e67] [cursor=pointer]:
              - /url: /aprendizaje?tab=hoy
            - link "Volver a mi ruta" [ref=f2e70] [cursor=pointer]:
              - /url: /aprendizaje/rutas/t041-v1
  - button "Open Next.js Dev Tools" [ref=f2e78] [cursor=pointer]
  - alert [ref=f2e82]
```

# Test source

```ts
  1  | import { test, expect } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
  2  | const control = 'http://127.0.0.1:41042';
  3  | const api = 'http://127.0.0.1:41041';
> 4  | async function snapshot(request: any) { const r = await request.get(control + '/snapshot'); expect(r.ok()).toBeTruthy(); return r.json(); }
     |                                                                 ^ Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:41042
  5  | async function mode(request: any, value: string) { const r = await request.post(control + '/mode/' + value); expect(r.ok()).toBeTruthy(); }
  6  | async function actor(page: any, n: number) { await page.context().addCookies([{ name: 't041', value: 'student-' + n, domain: '127.0.0.1', path: '/' }]); }
  7  | test('M04 restored v2 displays maintenance and preserves all data', async ({ page, request }, info) => {
  8  |   await mode(request, 'off'); await actor(page, 2);
  9  |   const before = await snapshot(request);
  10 |   await page.goto('/aprendizaje/rutas/t041-v2');
  11 |   await expect(page.locator('[data-engine-version="guided-v2"]')).toBeVisible();
  12 |   await expect(page.getByText('Ruta en mantenimiento; tu versión y tu historial se conservan.', { exact: true })).toBeVisible();
  13 |   await expect(page.getByRole('button', { name: /^(Comenzar|Continuar|Repasar objetivo)/ })).toHaveCount(0);
  14 |   await page.screenshot({ path: info.outputPath('maintenance-route.png'), fullPage: true });
  15 |   await page.reload();
  16 |   await expect(page.getByText('Ruta en mantenimiento; tu versión y tu historial se conservan.', { exact: true })).toBeVisible();
  17 |   expect(await snapshot(request)).toEqual(before);
  18 | });
  19 | test('M04 v1 restored session can write and complete while v2 is disabled', async ({ page, request }, info) => {
  20 |   await mode(request, 'off'); const n = info.project.name === 'mobile' ? 9 : 8; await actor(page, n);
  21 |   const fixture = (await (await request.get(control + '/ready')).json()).fixtures;
  22 |   const v2Before = await snapshot(request);
  23 |   await page.goto('/aprendizaje/rutas/t041-v1');
  24 |   await expect(page.getByRole('heading', { name: 'Ruta v1 T041', exact: true })).toBeVisible();
  25 |   await page.goto('/aprendizaje/sesiones/' + fixture.v1.sessions[n]);
  26 |   const complete = page.getByRole('button', { name: 'Terminé esta lectura', exact: true });
  27 |   await expect(complete).toBeVisible();
  28 |   await expect.poll(() => complete.evaluate(el => Object.keys(el).some(k => k.startsWith('__reactProps') && typeof (el as any)[k]?.onClick === 'function'))).toBe(true);
  29 |   await complete.click(); await expect(page.getByText('Progreso guardado.', { exact: true })).toBeVisible();
  30 |   const r = await page.request.get(api + '/v1/guided-learning/attempts/' + fixture.v1.sessions[n]); expect(r.ok()).toBeTruthy(); expect((await r.json()).status).toBe('completed');
  31 |   await page.reload(); await expect(page.getByRole('button', { name: 'Terminé esta lectura', exact: true })).toHaveCount(0);
  32 |   await page.screenshot({ path: info.outputPath('v1-completed.png'), fullPage: true });
  33 |   const after = await snapshot(request);
  34 |   for (const table of Object.keys(v2Before.rows).filter(t => t.startsWith('public.learning_v2_'))) expect(after.rows[table]).toEqual(v2Before.rows[table]);
  35 | });
  36 | test('M04 restored v2 active session resumes after controlled reenable', async ({ page, request }, info) => {
  37 |   await mode(request, 'off'); const n = info.project.name === 'mobile' ? 4 : 3; await actor(page, n);
  38 |   const fixture = (await (await request.get(control + '/ready')).json()).fixtures;
  39 |   await page.goto('/aprendizaje/sesiones/' + fixture.v2.sessions[n]);
  40 |   await expect(page.getByRole('heading', { name: 'Tu sesión de aprendizaje', exact: true })).toBeVisible();
  41 |   await page.screenshot({ path: info.outputPath('v2-session-off.png'), fullPage: true });
  42 |   await mode(request, 'on'); await page.reload();
  43 |   const proceed = page.getByRole('button', { name: 'Continuar a la práctica', exact: true }); await expect(proceed).toBeVisible();
  44 |   await expect.poll(() => proceed.evaluate(el => Object.keys(el).some(k => k.startsWith('__reactProps') && typeof (el as any)[k]?.onClick === 'function'))).toBe(true);
  45 |   await proceed.click();
  46 |   await page.getByRole('button', { name: 'Ver cierre de sesión', exact: true }).click();
  47 |   await page.getByRole('button', { name: 'Finalizar sesión', exact: true }).click();
  48 |   await expect(page.getByRole('heading', { name: 'Sesión completada', exact: true })).toBeVisible();
  49 |   await page.reload(); await expect(page.getByRole('heading', { name: 'Sesión completada', exact: true })).toBeVisible();
  50 |   const r = await page.request.get(api + '/v2/guided-learning/attempts/' + fixture.v2.sessions[n]); expect(r.ok()).toBeTruthy();
  51 |   const attempt = (await r.json()).attempt; expect(attempt.status).toBe('completed'); expect(attempt.pathVersionId).toBe(fixture.v2.versionId); expect(attempt.acceptedResponses).toHaveLength(1);
  52 |   await page.screenshot({ path: info.outputPath('v2-resumed-completed.png'), fullPage: true });
  53 | });
  54 | 
```