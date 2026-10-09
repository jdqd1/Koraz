const { chromium } = require('../../../../../apps/web/node_modules/@playwright/test');
chromium.launch({ channel: 'msedge', headless: true }).then(async browser => {
  console.log('Edge launch PASS ' + browser.version()); await browser.close();
}).catch(error => { console.error(error.message); process.exitCode = 1; });
