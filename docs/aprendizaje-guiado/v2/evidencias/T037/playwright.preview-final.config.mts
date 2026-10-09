import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
export default defineConfig({ ...base, grep: /V01\/V03\/V04|V02|V05/,
  projects: base.projects!.map(project => ({ ...project, grep: ['360', '390'].includes(project.name!)
    ? /V01\/V03\/V04|V02|V05/ : /V02/ })),
  outputDir: fileURLToPath(new URL("preview-final-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("preview-final-playwright.json", import.meta.url)) }]] });
