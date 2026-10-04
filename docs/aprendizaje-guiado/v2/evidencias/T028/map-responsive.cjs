const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const evidence = path.resolve('docs/aprendizaje-guiado/v2/evidencias/T028');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const page = await browser.newPage();
    for (const size of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(size);
      await page.goto('http://127.0.0.1:3000/visual-fixtures/aprendizaje-v2?surface=map&estado=critical&node=b2800000-0000-4000-8000-000000000001&item=b2800000-0000-4000-8000-000000000001&unit=unit-a', { timeout: 120000, waitUntil: 'domcontentloaded' });
      await page.getByRole('complementary', { name: 'Detalle de práctica por objetivos' }).waitFor({ timeout: 60000 });
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const geometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, controls: [...document.querySelectorAll('[data-engine-version="guided-v2"] button, [data-engine-version="guided-v2"] a')].map(el => { const box = el.getBoundingClientRect(); return { text: el.textContent, left: box.left, right: box.right }; }) }));
      results.push(geometry);
      fs.writeFileSync(path.join(evidence, 'map-responsive-in-progress.json'), JSON.stringify(results, null, 2));
      if (geometry.documentWidth > geometry.clientWidth + 1) {
        await page.screenshot({ path: path.join(evidence, 'map-responsive-overflow.png'), fullPage: true });
        const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 25).map(el => ({ tag: el.tagName, class: el.className?.toString(), right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width, text: el.textContent?.slice(0, 100), overflow: getComputedStyle(el).overflowX, whiteSpace: getComputedStyle(el).whiteSpace })));
        fs.writeFileSync(path.join(evidence, 'map-overflow-elements.json'), JSON.stringify(offenders, null, 2));
      }
      assert(geometry.documentWidth <= geometry.clientWidth + 1, JSON.stringify(geometry));
      assert(geometry.controls.every(control => control.left >= -1 && control.right <= geometry.width + 1));
    }
    fs.writeFileSync(path.join(evidence, 'map-responsive.json'), JSON.stringify({ status: 'PASS', method: 'Actual DOM viewports, final header and active unit detail', measurements: results }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
