import { defineConfig } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from '../../../docs/aprendizaje-guiado/v2/evidencias/T040/playwright.config.mts';
export default defineConfig({...base,testMatch:'guided-v2-journeys.spec.ts',projects:[base.projects[1]],
outputDir:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T042/mobile-artifacts/',import.meta.url)),
reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T042/mobile.json',import.meta.url))}]],globalTeardown:'./teardown.mts'});
