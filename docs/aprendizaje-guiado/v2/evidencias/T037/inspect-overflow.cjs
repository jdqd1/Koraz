const { chromium } = require('../../../../../apps/web/node_modules/@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    await context.addCookies([{ name: 't035', value: 'editor', domain: '127.0.0.1', path: '/' }]);
    const page = await context.newPage();
    const ready = await (await context.request.get('http://127.0.0.1:41035/__test/ready')).json();
    if (!ready.testOnly) throw Error('Test-only fixture required');
    await page.goto('http://127.0.0.1:31035/panel/rutas/' + ready.fixtures.editorial.pathId);
    const tab = page.getByRole('tab', { name: 'Revisión', exact: true });
    await tab.waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('[role=tab]')].some(e => Object.keys(e).some(k => k.startsWith('__reactProps'))));
    await tab.focus(); await tab.press('Enter');
    await page.getByRole('heading', { name: 'Revisión editorial', exact: true }).waitFor();
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const report = await page.evaluate(() => ({ width: innerWidth, pageWidth: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll('body *')].filter(e => e.getClientRects().length && e.getBoundingClientRect().right > innerWidth + 1)
        .map(e => ({ tag: e.tagName, class: e.className, text: e.textContent?.slice(0, 140), rect: e.getBoundingClientRect().toJSON(),
          wrap: getComputedStyle(e).overflowWrap, whiteSpace: getComputedStyle(e).whiteSpace, minWidth: getComputedStyle(e).minWidth })) }));
    fs.writeFileSync(__dirname + '/overflow-elements.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
