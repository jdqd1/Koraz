import { defineConfig } from "@playwright/test";
import base from "./playwright.guided-v2.config";
export default defineConfig({ ...base, testMatch: ["guided-v2-overview.spec.ts", "guided-v2-diagnostic-xp.spec.ts"],
  outputDir: "../../work/f05/overview-browser", reporter: [["list"]],
  globalTeardown: "./tests/e2e/learning-xp-teardown.ts" });
