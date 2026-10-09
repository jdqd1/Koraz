import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.legacy.config.mts';

export default defineConfig({ ...base,
  webServer: [base.webServer[1]],
  outputDir: fileURLToPath(new URL('editor-repair-final-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-editor-repair-final.json', import.meta.url)) }]],
});
