const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require(path.resolve('apps/web/node_modules/@playwright/test'));
const { AxeBuilder } = require(path.resolve('apps/web/node_modules/@axe-core/playwright'));
const report = { scope: 'Static SSR preview only, real local CSS. No hydration, HTTP mutations, persisted learner flow, native zoom or full accessibility acceptance.', geometry: [], axe: [] };
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    for (const mode of ['critical', 'review', 'consolidated', 'none', 'missing', 'revoked']) {
      for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(viewport);
        await page.goto(pathToFileURL(path.join(__dirname, `preview-${mode}.html`)).href);
        await page.evaluate(() => document.fonts.ready);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode} overflow ${viewport.width}`);
        report.geometry.push({ mode, viewport, pageOverflow: false });
      }
      const result = await new AxeBuilder({ page }).analyze();
      const violations = result.violations.filter(v => ['serious', 'critical'].includes(v.impact));
      report.axe.push({ mode, seriousCritical: violations.length });
      assert.deepEqual(violations.map(v => v.id), [], `axe ${mode}`);
      if (['critical', 'consolidated'].includes(mode)) {
        await page.screenshot({ path: path.join(__dirname, `${mode}-desktop.png`), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(__dirname, `${mode}-mobile.png`), fullPage: true });
      }
    }
  } finally {
    fs.writeFileSync(path.join(__dirname, 'browser-preview.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
