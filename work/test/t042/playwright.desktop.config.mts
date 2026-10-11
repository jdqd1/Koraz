import { defineConfig } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
import base from './playwright.mobile.config.mts';
import original from '../../../docs/aprendizaje-guiado/v2/evidencias/T040/playwright.config.mts';
export default defineConfig({...base,projects:[original.projects[0]],grep:/E02|E07/,
  outputDir:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T042/desktop-artifacts/',import.meta.url)),
  reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T042/desktop.json',import.meta.url))}]]});
