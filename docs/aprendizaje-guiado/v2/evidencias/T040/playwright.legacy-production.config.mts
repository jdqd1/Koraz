import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.legacy.config.mts';
const web=fileURLToPath(new URL('../../../../../apps/web/',import.meta.url));
// One object overrides webServer; defineConfig(base, overrides) concatenates that array.
export default defineConfig({
  ...base,
  webServer:[base.webServer[0], {
    command:'pnpm --config.verify-deps-before-run=false exec next start --hostname 127.0.0.1 --port 3000',cwd:web,
    url:'http://localhost:3000/acceder',reuseExistingServer:false,timeout:120000,
    env:{API_BASE_URL:'http://127.0.0.1:4100'},
  }],
  outputDir:fileURLToPath(new URL('legacy-production-browser-artifacts/',import.meta.url)),
  reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('playwright-legacy-production.json',import.meta.url))}]],
});
