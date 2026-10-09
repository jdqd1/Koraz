import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.legacy.config.mts';

export default defineConfig({ ...base,
  // These two cases use the in-memory fixture transport, without a database or API.
  webServer: [base.webServer[1]],
  outputDir: fileURLToPath(new URL('editor-repair-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-editor-repair.json', import.meta.url)) }]],
});
