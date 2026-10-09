import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
export default defineConfig({ ...base,
  outputDir: fileURLToPath(new URL("closure-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("closure-playwright.json", import.meta.url)) }]] });
