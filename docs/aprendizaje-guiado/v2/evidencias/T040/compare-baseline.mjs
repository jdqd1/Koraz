import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../../../../../', import.meta.url)));
const sha = '774b60d2d0d3bd0bceefe3612a2108f684f01048';
const hash = data => createHash('sha256').update(data).digest('hex');
const normalized = data => data.toString('utf8').replace(/\r\n/g, '\n');
const files = ['apps/web/src/components/learning/editor/material-picker.tsx', 'apps/web/src/components/learning/editor/activity-options.tsx',
 'apps/web/src/components/learning/editor/editor-fixtures.ts', 'apps/web/tests/e2e/route-editor.spec.ts'];
const compared = files.map(path => { const before = normalized(execFileSync('git', ['show', `${sha}:${path}`]));
 const after = normalized(readFileSync(path));
 const relevant = text => path.endsWith('editor-fixtures.ts') ? text.match(/initialResources:.*\n\s*resourceNextCursor:.*\n/)[0]
   : path.endsWith('route-editor.spec.ts') ? ['mantiene material fijado', 'contenido heredado conserva'].map(title=>{
     const start=text.indexOf(`  test("${title}`); const end=text.indexOf('\n  test(',start+1); return text.slice(start,end); }).join('\n') : text;
 const baselineSha256 = hash(relevant(before)), currentSha256 = hash(relevant(after));
 return { path, comparison: 'Relevant failing tests and fixture fields; whole module for picker/options; normalized CRLF/LF', baselineSha256, currentSha256, unchangedSinceT001: baselineSha256 === currentSha256 }; });
writeFileSync(new URL('baseline-compatibility.json', import.meta.url), JSON.stringify({ taskId:'T040', baselineSha:sha,
 videoPolicyCommit:'1f9f434099cdef5712eb5d858fdfcd830eb40c1e', compared,
 findings: ['Off-page fixture contains only a video-only resource on its first page; the established picker excludes video-only resources.',
 'The legacy test expects a visible Video alternative; the established options editor explicitly hides video alternatives.'],
 classification: compared.every(r=>r.unchangedSinceT001) ? 'Preexisting source/test incompatibility, unchanged since T001; four failures preserved, not counted as PASS' : 'Requires further comparison' }, null, 2));
console.log(compared.map(r=>`${r.unchangedSinceT001 ? 'IDENTICAL' : 'CHANGED'} ${r.path}`).join('\n'));
