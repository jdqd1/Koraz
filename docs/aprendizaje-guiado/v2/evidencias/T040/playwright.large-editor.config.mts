import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.config.mts';
export default defineConfig(base, {
  testDir: fileURLToPath(new URL('./', import.meta.url)), testMatch: 'large-editor.spec.ts',
  outputDir: fileURLToPath(new URL('large-editor-browser-artifacts/', import.meta.url)),
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('playwright-large-editor.json', import.meta.url)) }]],
});
