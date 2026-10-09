const fs = require('node:fs');
const path = require('node:path');
const reports = ['playwright.json', 'native-final-playwright.json', 'map-final-playwright.json', 'preview-final-playwright.json', 'closure-playwright.json', 'reflow-recheck-playwright.json'];
const latest = new Map();
const runs = [];
function visit(suites, report) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      const key = `${spec.file}|${spec.title}|${test.projectName}`;
      const history = latest.get(key)?.history ?? [];
      const outcome = { report, status: test.results.at(-1)?.status ?? test.status };
      latest.set(key, { file: spec.file, title: spec.title, project: test.projectName,
        ...outcome, history: [...history, outcome] });
    }
    visit(suite.suites ?? [], report);
  }
}
for (const name of reports) {
  const report = JSON.parse(fs.readFileSync(path.join(__dirname, name)));
  runs.push({ report: name, stats: report.stats, errors: report.errors });
  visit(report.suites, name);
}
const cases = [...latest.values()];
const result = { method: 'Latest affected-screen recheck per file/title/project; raw reports retained',
  passed: cases.filter(c => c.status === 'passed').length,
  skipped: cases.filter(c => c.status === 'skipped').length,
  failed: cases.filter(c => !['passed', 'skipped'].includes(c.status)).length, runs, cases };
fs.writeFileSync(path.join(__dirname, 'browser-matrix-summary.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, skipped: result.skipped, failed: result.failed }));
