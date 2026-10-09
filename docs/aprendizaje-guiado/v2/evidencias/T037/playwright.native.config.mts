import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
export default defineConfig({ ...base, grep: /native browser zoom|stable map|V01\/V03\/V04/,
  projects: base.projects!.map(project => ({ ...project, grep: project.name === 'desktop' ? /native browser zoom|stable map/
    : project.name === '768' ? /stable map|V01\/V03\/V04/ : /stable map/ })),
  outputDir: fileURLToPath(new URL("native-final-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("native-final-playwright.json", import.meta.url)) }]] });
