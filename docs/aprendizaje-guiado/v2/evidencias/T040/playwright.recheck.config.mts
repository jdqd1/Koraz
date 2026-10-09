import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.config.mts';
export default defineConfig(base, {
  outputDir: fileURLToPath(new URL('recheck-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-guided-recheck.json', import.meta.url)) }]],
});
