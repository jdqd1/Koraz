import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.editor.config";

export default defineConfig({
  ...base,
  testMatch: "route-editor-v2-usability.spec.ts",
  outputDir: "../../tmp/editor-v2-authoring/browser",
  reporter: [["list"], ["json", { outputFile: "../../tmp/editor-v2-authoring/playwright.json" }]],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "narrow", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 780 } } },
  ],
});
