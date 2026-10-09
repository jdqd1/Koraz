import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
export default defineConfig({ ...base, testDir: fileURLToPath(new URL('.', import.meta.url)), testMatch: 'overflow-diagnostic.spec.mts', grep: /.*/,
  projects: [base.projects![1]!], outputDir: fileURLToPath(new URL("overflow-diagnostic-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("overflow-diagnostic-playwright.json", import.meta.url)) }]] });
