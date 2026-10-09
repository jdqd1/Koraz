import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
export default defineConfig({ ...base, grep: /stable map/,
  projects: base.projects!.map(project => ({ ...project, grep: /stable map/ })),
  outputDir: fileURLToPath(new URL("map-final-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("map-final-playwright.json", import.meta.url)) }]] });
