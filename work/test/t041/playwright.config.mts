import { defineConfig, devices } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
if (process.env.KORAZ_TEST_DATABASE !== 'true') throw new Error('Explicit disposable database marker required');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T041/', import.meta.url));
export default defineConfig({
  testDir: fileURLToPath(new URL('./', import.meta.url)), testMatch: 'recovery.spec.ts', workers: 1, fullyParallel: false,
  timeout: 120000, expect: { timeout: 30000 }, retries: 0,
  reporter: [['list'], ['json', { outputFile: out + 'playwright.json' }]], outputDir: out + 'browser-artifacts',
  use: { baseURL: 'http://127.0.0.1:31041', actionTimeout: 30000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  globalTeardown: fileURLToPath(new URL('./teardown.mts', import.meta.url)),
  webServer: [
    { command: 'pnpm --config.verify-deps-before-run=false --filter @cediah/api exec tsx ../../work/test/t041/recovery.mts --hold', cwd: root,
      url: 'http://127.0.0.1:41042/ready', reuseExistingServer: false, timeout: 120000, env: { KORAZ_TEST_DATABASE: 'true' } },
    { command: 'pnpm --config.verify-deps-before-run=false exec next start --hostname 127.0.0.1 --port 31041', cwd: root + 'apps/web',
      url: 'http://127.0.0.1:31041/acceder', reuseExistingServer: false, timeout: 120000, env: { API_BASE_URL: 'http://127.0.0.1:41041' } },
  ],
});
