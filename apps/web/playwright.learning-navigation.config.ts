import { defineConfig } from "@playwright/test";
import base from "./playwright.guided-v2.config";
export default defineConfig({ ...base, testMatch: ["guided-learning-navigation.spec.ts", "guided-v2-journeys.spec.ts"], grep: /F06|E04/,
  outputDir: "../../work/f06/browser", reporter: [["list"]], globalTeardown: "./tests/e2e/learning-xp-teardown.ts",
  webServer: base.webServer instanceof Array ? base.webServer.map(server => ({ ...server, env: { ...server.env, KORAZ_LEARNING_NAVIGATION_TESTS: "true" } })) : base.webServer,
});
