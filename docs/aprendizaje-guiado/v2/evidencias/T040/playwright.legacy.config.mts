import { defineConfig, devices } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
const web = fileURLToPath(new URL('../../../../../apps/web/', import.meta.url));
if (process.env.KORAZ_TEST_DATABASE !== 'true') throw new Error('Disposable environment required');
process.env.MAP_E2E_REAL = 'true';
export default defineConfig({
  testDir: fileURLToPath(new URL('../../../../../apps/web/tests/e2e/', import.meta.url)),
  testMatch: ['learning-map*.spec.ts', 'route-editor.spec.ts'],
  workers: 1, fullyParallel: false, timeout: 45000, expect: { timeout: 10000 },
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    { command: 'pnpm --config.verify-deps-before-run=false --filter @cediah/api test:map-server', cwd: web,
      url: 'http://127.0.0.1:4100/v1/guided-learning/map', reuseExistingServer: false, timeout: 120000,
      env: { NODE_ENV: 'test', MAP_E2E_TEST_SERVER: 'true' } },
    { command: 'pnpm --config.verify-deps-before-run=false exec next dev --webpack --hostname 127.0.0.1 --port 3000', cwd: web,
      url: 'http://localhost:3000/visual-fixtures/editor-rutas', reuseExistingServer: false, timeout: 120000,
      env: { API_BASE_URL: 'http://127.0.0.1:4100' } },
  ],
  outputDir: fileURLToPath(new URL('legacy-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-legacy.json', import.meta.url)) }]],
});
