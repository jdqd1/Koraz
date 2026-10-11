import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidenceDir, '../../../../..');
const relativeEvidence = 'docs/aprendizaje-guiado/v2/evidencias/T043/';
const read = (path) => readFileSync(resolve(root, path));
const json = (path) => JSON.parse(read(path).toString('utf8').replace(/^\uFEFF/, ''));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const predecessorPath = 'docs/aprendizaje-guiado/v2/evidencias/T042/result.json';
const actaPath = 'docs/aprendizaje-guiado/v2/acta-HITO-S.md';
const candidatePath = 'docs/aprendizaje-guiado/v2/evidencias/T042/candidate-hashes.json';
const registryPath = 'docs/aprendizaje-guiado/v2/registro-ejecucion.json';
const readerPath = 'docs/aprendizaje-guiado/v2/evidencias/T042/reader-manual/observations.json';
const predecessor = json(predecessorPath);
const candidate = json(candidatePath);
const reader = json(readerPath);
const registry = json(registryPath);
const registryTask = registry.tasks.find((task) => task.taskId === 'T042');
const acta = read(actaPath).toString('utf8');
const currentHashes = candidate.hashes.map(({ path, sha256 }) => {
  const present = existsSync(resolve(root, path));
  const actualSha256 = present ? hash(read(path)) : null;
  return { path, candidateSha256: sha256, actualSha256, matches: actualSha256 === sha256 };
});
const prerequisiteAccepted = predecessor.status === 'PASS'
  && predecessor.systemAcceptance === true && predecessor.decision === 'accept'
  && predecessor.contract?.accepted === true && predecessor.contract?.frozen === true
  && candidate.accepted === true && candidate.frozen === true
  && registryTask?.status === 'PASS' && registryTask?.systemAcceptance === true
  && !acta.includes('T043 sigue bloqueada') && !acta.includes('T043 bloqueada');
const allHashesMatch = currentHashes.every(({ matches }) => matches);
const report = {
  taskId: 'T043', recordedUtc: new Date().toISOString(), clientDate: '2026-10-10',
  timezone: 'America/Caracas', baseSha: git('rev-parse', 'HEAD'), runtime: process.version,
  prerequisiteAccepted, allCandidateHashesMatch: allHashesMatch,
  candidateHashesAreAcceptedContract: false,
  predecessor: {
    status: predecessor.status, decision: predecessor.decision,
    systemAcceptance: predecessor.systemAcceptance,
    summary: predecessor.summary, accepted: predecessor.contract?.accepted,
    frozen: predecessor.contract?.frozen,
  },
  registryPredecessor: {
    status: registryTask?.status, systemAcceptance: registryTask?.systemAcceptance,
    successorBlocked: registryTask?.successorBlocked,
  },
  reader: { status: reader.status, check: reader.check,
    steps: reader.steps.map(({ id, status, reason }) => ({ id, status, reason })) },
  inspectedEvidence: [predecessorPath, actaPath, candidatePath, registryPath, readerPath]
    .map((path) => ({ path, sha256: hash(read(path)) })),
  currentHashes,
  initialStatusShort: git('status', '--short', '--untracked-files=normal'),
  skillDirectoryExists: existsSync(resolve(root, 'tools/skills/crear-rutas-koraz')),
  conclusion: prerequisiteAccepted && allHashesMatch
    ? 'Prerequisite accepted; packaging can be considered within authorized T043 scope.'
    : 'NO VERIFICADO: T042 has not accepted/frozen Hito S. Do not package candidate resources as an accepted skill contract.',
};
writeFileSync(resolve(evidenceDir, 'prerequisite-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  prerequisiteAccepted, allCandidateHashesMatch: allHashesMatch,
  hashCount: currentHashes.length, predecessorStatus: predecessor.status,
  evidence: relativeEvidence + 'prerequisite-check.json',
}, null, 2));
if (!allHashesMatch) process.exitCode = 1;
