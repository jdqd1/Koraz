import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.legacy.config.mts';
export default defineConfig(base, {
  outputDir: fileURLToPath(new URL('legacy-recheck-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-legacy-recheck.json', import.meta.url)) }]],
});
