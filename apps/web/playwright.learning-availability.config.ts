import { defineConfig } from "@playwright/test";
import base from "./playwright.guided-v2.config";

export default defineConfig({
  ...base,
  testMatch: process.env.F07_PERFORMANCE === "true" ? "guided-learning-performance.spec.ts" : process.env.F07_REGRESSION === "true"
    ? ["guided-learning-availability.spec.ts", "guided-v2-accessibility.spec.ts", "guided-v2-diagnostic-xp.spec.ts", "guided-learning-navigation.spec.ts"]
    : ["guided-learning-availability.spec.ts", "guided-learning-detail-performance.spec.ts"],
  outputDir: "../../work/f07/browser",
  expect: { timeout: 12_000 },
  use: { ...base.use, actionTimeout: 15_000,
    ...(process.env.F07_WEBKIT === "true" ? { baseURL: "https://127.0.0.1:41036" } : {}),
  },
  projects: process.env.F07_WEBKIT === "true" ? base.projects?.filter(project => project.name === "mobile").map(project => ({
    ...project, use: { ...project.use, defaultBrowserType: "webkit", browserName: "webkit" },
  })) : base.projects,
  reporter: [["list"]],
  globalTeardown: "./tests/e2e/learning-xp-teardown.ts",
  webServer: Array.isArray(base.webServer) ? base.webServer.map(server => ({
    ...server, env: { ...server.env, KORAZ_LEARNING_NAVIGATION_TESTS: "true" },
  })) : base.webServer,
});
