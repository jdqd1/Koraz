import { defineConfig } from "../../../../../apps/web/node_modules/@playwright/test/index.mjs";
import base from "./playwright.config.mts";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
const report = JSON.parse(fs.readFileSync(new URL("closure-playwright.json", import.meta.url), 'utf8'));
const failedProjects = new Map<string, Set<string>>();
function visit(suites: typeof report.suites) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      if (test.results.at(-1)?.status !== 'failed') continue;
      if (!spec.title.includes('V01/V03/V04') && !spec.title.includes('stable map')) throw new Error('Inspect failure before recheck');
      const titles = failedProjects.get(test.projectName) ?? new Set<string>();
      titles.add(spec.title.includes('V01/V03/V04') ? 'V01/V03/V04' : 'stable map');
      failedProjects.set(test.projectName, titles);
    }
    visit(suite.suites ?? []);
  }
}
visit(report.suites);
if (!failedProjects.size) throw new Error('No affected gallery to repeat');
export default defineConfig({ ...base, workers: 2, grep: /V01\/V03\/V04|stable map/,
  projects: base.projects!.filter(project => failedProjects.has(project.name!))
    .map(project => ({ ...project, grep: new RegExp([...failedProjects.get(project.name!)!].join('|')) })),
  outputDir: fileURLToPath(new URL("reflow-recheck-artifacts/", import.meta.url)),
  reporter: [["list"], ["json", { outputFile: fileURLToPath(new URL("reflow-recheck-playwright.json", import.meta.url)) }]] });
