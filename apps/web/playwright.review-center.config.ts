import { defineConfig } from "@playwright/test";
import base from "./playwright.learning-xp.config";
export default defineConfig({ ...base, testMatch: "guided-review-center.spec.ts",
  outputDir: "../../tmp/f03-browser", reporter: [["list"]] });
