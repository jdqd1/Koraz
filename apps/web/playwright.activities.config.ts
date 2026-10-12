import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  tsconfig: "./tsconfig.activities.json",
  testMatch: "activity-player-redesign.spec.ts",
  outputDir: "../../tmp/activity-redesign/final",
  reporter: [["list"], ["json", { outputFile: "../../tmp/activity-redesign/playwright.json" }]],
  timeout: 90_000,
  use: { ...base.use, permissions: ["local-network-access"] },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    { name: "compact", use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
