import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.legacy.config.mts';
const web = fileURLToPath(new URL('../../../../../apps/web/', import.meta.url));
export default defineConfig(base, {
  // Persistence uses real application routes and does not require dev-only visual fixtures.
  // Use the already-built production Next server, avoiding JIT compilation in the original 45s test budget.
  webServer: [base.webServer[0], {
    command:'pnpm --config.verify-deps-before-run=false exec next start --hostname 127.0.0.1 --port 3000', cwd:web,
    url:'http://localhost:3000/acceder', reuseExistingServer:false, timeout:120000,
    env:{ API_BASE_URL:'http://127.0.0.1:4100' },
  }],
  outputDir: fileURLToPath(new URL('legacy-final-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-legacy-final.json', import.meta.url)) }]],
});
