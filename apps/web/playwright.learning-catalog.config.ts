import { defineConfig } from "@playwright/test";
import base from "./playwright.functional.config";

export default defineConfig({
  ...base,
  testMatch: "practice-library.spec.ts",
  outputDir: "../../work/f05/catalog-browser",
  reporter: [["list"]],
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 31044",
    url: "http://127.0.0.1:31044/acceder",
    timeout: 120_000,
    reuseExistingServer: false,
    env: { API_BASE_URL: "http://127.0.0.1:41044" },
  },
});
