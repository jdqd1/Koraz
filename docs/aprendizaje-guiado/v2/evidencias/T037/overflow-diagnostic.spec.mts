import { test, expect } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { writeFile } from 'node:fs/promises';
test('inspect review overflow at narrow doubled text', async ({ page }, info) => {
  const ready = await (await page.request.get('http://127.0.0.1:41035/__test/ready')).json();
  await page.context().addCookies([{ name: 't035', value: 'editor', domain: '127.0.0.1', path: '/' }]);
  await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  const tab = page.getByRole('tab', { name: 'Revisión', exact: true });
  await expect.poll(() => tab.evaluate(e => Object.keys(e).some(k => k.startsWith('__reactProps')))).toBe(true);
  await tab.focus(); await tab.press('Enter');
  await page.getByRole('heading', { name: 'Revisión editorial', exact: true }).waitFor();
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await writeFile(info.outputPath('overflow-elements.json'), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('body *')]
    .filter(e => e.getClientRects().length && (e.getBoundingClientRect().right > innerWidth + 1 || e.getBoundingClientRect().left < -1))
    .map(e => ({ tag: e.tagName, class: e.className, text: e.textContent?.slice(0, 140), rect: e.getBoundingClientRect().toJSON(),
      overflowWrap: getComputedStyle(e).overflowWrap, minWidth: getComputedStyle(e).minWidth, whiteSpace: getComputedStyle(e).whiteSpace }))), null, 2));
  await page.screenshot({ path: info.outputPath('review-overflow.png'), fullPage: true });
});
