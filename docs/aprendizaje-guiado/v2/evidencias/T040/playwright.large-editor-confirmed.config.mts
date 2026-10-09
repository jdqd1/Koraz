import { defineConfig } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.large-editor.config.mts';
export default defineConfig({...base,
  outputDir:fileURLToPath(new URL('large-editor-confirmed-browser-artifacts/',import.meta.url)),
  reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('playwright-large-editor-confirmed.json',import.meta.url))}]],
});
