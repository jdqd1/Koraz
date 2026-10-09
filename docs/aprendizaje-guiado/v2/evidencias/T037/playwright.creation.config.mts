import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
export default defineConfig({ ...base, testMatch: "guided-v2-journeys.spec.ts", grep: /E01 /,
  projects: [base.projects![0]!], outputDir: fileURLToPath(new URL("creation-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("creation-playwright.json", import.meta.url)) }]] });
