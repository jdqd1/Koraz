import { defineConfig } from "@playwright/test";
import base from "./playwright.guided-v2.config";

export default defineConfig({ ...base, testMatch: "guided-v2-diagnostic-xp.spec.ts",
  outputDir: "../../docs/diagnostico-progresion-xp/browser-artifacts",
  reporter: [["list"], ["json", { outputFile: "../../docs/diagnostico-progresion-xp/playwright.json" }]],
  globalTeardown: "./tests/e2e/learning-xp-teardown.ts" });
