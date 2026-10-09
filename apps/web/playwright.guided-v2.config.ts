import { defineConfig, devices } from "@playwright/test";
if(process.env.KORAZ_TEST_DATABASE!=="true") throw new Error("T035 requires an explicitly disposable database");
export default defineConfig({
  testDir:"./tests/e2e",testMatch:"guided-v2-*.spec.ts",outputDir:"../../docs/aprendizaje-guiado/v2/evidencias/T035/browser-artifacts",workers:1,fullyParallel:false,timeout:240000,
  expect:{timeout:60000},reporter:[["list"],["json",{outputFile:"../../docs/aprendizaje-guiado/v2/evidencias/T035/playwright.json"}]],
  globalTeardown:"./tests/e2e/guided-v2-teardown.ts",
  use:{baseURL:"http://127.0.0.1:31035",ignoreHTTPSErrors:true,actionTimeout:60000,trace:"retain-on-failure",screenshot:"only-on-failure"},
  projects:[{name:"desktop",use:{...devices["Desktop Chrome"],viewport:{width:1440,height:900}}},{name:"mobile",use:{...devices["iPhone 13"],defaultBrowserType:"chromium"}}],
  webServer:[
    {command:"pnpm --config.verify-deps-before-run=false --filter @cediah/api test:guided-v2-server",url:"http://127.0.0.1:41035/__test/ready",reuseExistingServer:false,timeout:120000,env:{NODE_ENV:"test",KORAZ_GUIDED_V2_TEST_SERVER:"true"}},
    {command:"pnpm --config.verify-deps-before-run=false exec next start --hostname 127.0.0.1 --port 31035",url:"http://127.0.0.1:31035/acceder",reuseExistingServer:false,timeout:120000,env:{API_BASE_URL:"http://127.0.0.1:41035",NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN:"https://127.0.0.1:41036"}},
  ],
});
