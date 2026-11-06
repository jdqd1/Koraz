import { defineConfig } from "@playwright/test";
import activities from "./playwright.activities.config";

export default defineConfig({
  ...activities,
  testMatch: ["guided-review-regressions.spec.ts", "practice-library.spec.ts"],
  outputDir: "../../output/implementacion-aprendizaje-2026-11-04/browser",
  reporter: [["list"], ["json", { outputFile: "../../output/implementacion-aprendizaje-2026-11-04/browser.json" }]],
  use: { ...activities.use, baseURL: "http://127.0.0.1:31044" },
  webServer: {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 31044",
    url: "http://127.0.0.1:31044/visual-fixtures/aprendizaje-v2?surface=legacy-player",
    timeout: 180_000,
    reuseExistingServer: false,
    env: { API_BASE_URL: "http://127.0.0.1:41044" },
  },
});
