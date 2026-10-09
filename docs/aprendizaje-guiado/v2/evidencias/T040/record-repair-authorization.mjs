import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const here = fileURLToPath(new URL('./', import.meta.url));
const root = resolve(here, '../../../../..');
const target = resolve(here, 'repair-authorization.json');
if (existsSync(target)) throw new Error('Authorization already recorded');
const archive = resolve(here, 'before-authorized-repair');
mkdirSync(archive);
for (const name of ['README.md', 'result.json', 'counts-and-omissions.json', 'preservation.json', 'closure-check.json', 'artifact-integrity.json', 'registry-mutation.json']) {
  copyFileSync(resolve(here, name), resolve(archive, name));
}
copyFileSync(resolve(root, 'docs/aprendizaje-guiado/v2/registro-ejecucion.json'), resolve(archive, 'registro-ejecucion.json'));
writeFileSync(target, JSON.stringify({
  status: 'AUTORIZADO', recordedUtc: new Date().toISOString(),
  authorizationSource: 'Mensaje directo del usuario en este chat: autorizo',
  context: 'Autoriza aplicar la propuesta preparada para los dos tests legacy de T040, ejecutar sus controles y actualizar el cierre. No autoriza iniciar T041.',
  proposal: 'REPARACION-LEGADO-PROPUESTA.md',
  proposalSha256: createHash('sha256').update(readFileSync(resolve(here, 'REPARACION-LEGADO-PROPUESTA.md'))).digest('hex'),
  baseSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  authorizedSourceFiles: [
    'apps/web/src/components/learning/editor/editor-fixtures.ts',
    'apps/web/src/components/learning/editor/editor-fixtures.test.ts',
    'apps/web/tests/e2e/route-editor.spec.ts',
  ],
  productionBehaviorChanged: false, videoPolicyChanged: false, nextTaskStarted: false,
}, null, 2));
console.log('User authorization and previous closure archived');
