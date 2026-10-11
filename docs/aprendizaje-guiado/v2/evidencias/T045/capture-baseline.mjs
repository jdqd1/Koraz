import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', ['-c', 'core.quotePath=false', ...args], { encoding: 'utf8' });
const files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const report = { taskId: 'T045', at: new Date().toISOString(), clientDate: '2026-10-10', timezone: 'America/Caracas',
  baseSha: git('rev-parse', 'HEAD').trim(), runtime: process.version, initialStatusShort: git('status', '--short'),
  files: files.filter((path) => !path.startsWith('docs/aprendizaje-guiado/v2/evidencias/T045/') && statSync(path).isFile())
    .map((path) => ({ path, sha256: sha(path) })) };
writeFileSync('docs/aprendizaje-guiado/v2/evidencias/T045/baseline.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ baseSha: report.baseSha, files: report.files.length }));
