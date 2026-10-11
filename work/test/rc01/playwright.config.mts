import { defineConfig, devices } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
if(process.env.KORAZ_TEST_DATABASE!=='true') throw new Error('Explicit test database required');
const web = fileURLToPath(new URL('../../../apps/web/',import.meta.url));
export default defineConfig({
 testDir:'.',testMatch:'generated-package.spec.mts',workers:1,fullyParallel:false,timeout:600000,
 expect:{timeout:60000},
 use:{baseURL:'http://127.0.0.1:31035',actionTimeout:60000,trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
 webServer:[
  {command:'node ../api/node_modules/tsx/dist/cli.mjs ../../docs/aprendizaje-guiado/v2/evidencias/RC01/test-server.mts',cwd:web,url:'http://127.0.0.1:41035/__test/ready',reuseExistingServer:false,timeout:120000,env:{NODE_ENV:'test',KORAZ_GUIDED_V2_TEST_SERVER:'true'}},
  {command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 31035',cwd:web,url:'http://127.0.0.1:31035/acceder',reuseExistingServer:false,timeout:120000,env:{API_BASE_URL:'http://127.0.0.1:41035'}},
 ],
 outputDir:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/RC01/browser-artifacts/',import.meta.url)),
 reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/RC01/browser.json',import.meta.url))}]],
 globalTeardown:'./teardown.mts',
});
