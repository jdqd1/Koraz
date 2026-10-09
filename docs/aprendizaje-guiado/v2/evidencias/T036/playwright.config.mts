import { defineConfig, devices } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import { fileURLToPath } from "node:url";
const web = fileURLToPath(new URL("../../../../../apps/web/", import.meta.url));
if (process.env.KORAZ_TEST_DATABASE !== "true") throw new Error("T036 requires a disposable database");
export default defineConfig({ testDir: fileURLToPath(new URL("../../../../../apps/web/tests/e2e/", import.meta.url)), testMatch: "guided-v2-security.spec.ts",
  workers: 1, fullyParallel: false, timeout: 240000, expect: { timeout: 60000 },
  use: { baseURL: "http://127.0.0.1:31035", ignoreHTTPSErrors: true, actionTimeout: 60000, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: [
    { command: "pnpm --config.verify-deps-before-run=false --filter @cediah/api test:guided-v2-server", cwd: web,
      url: "http://127.0.0.1:41035/__test/ready", reuseExistingServer: false, timeout: 120000, env: { NODE_ENV: "test", KORAZ_GUIDED_V2_TEST_SERVER: "true" } },
    { command: "pnpm --config.verify-deps-before-run=false exec next start --hostname 127.0.0.1 --port 31035", cwd: web,
      url: "http://127.0.0.1:31035/acceder", reuseExistingServer: false, timeout: 120000,
      env: { API_BASE_URL: "http://127.0.0.1:41035", NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN: "https://127.0.0.1:41036" } },
  ],
  outputDir: fileURLToPath(new URL("browser-artifacts/", import.meta.url)), reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("playwright.json", import.meta.url)) }]],
  globalTeardown: "./teardown.mts" });
