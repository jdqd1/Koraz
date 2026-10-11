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
const candidatePath = 'docs/aprendizaje-guiado/v2/evidencias/T042/accepted-contract-hashes.json';
const deferralPath = 'docs/aprendizaje-guiado/v2/evidencias/T042/reader-deferral.json';
const registryPath = 'docs/aprendizaje-guiado/v2/registro-ejecucion.json';
const readerPath = 'docs/aprendizaje-guiado/v2/evidencias/T042/reader-manual/observations.json';
const predecessor = json(predecessorPath);
const candidate = json(candidatePath);
const deferral = json(deferralPath);
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
  && predecessor.implementationAcceptance === true && predecessor.decision === 'accept_with_exception'
  && predecessor.contract?.accepted === true && predecessor.contract?.frozen === true
  && candidate.accepted === true && candidate.frozen === true
  && hash(read(candidatePath)) === predecessor.contract.manifestSha256
  && deferral.implementationAcceptance === true && deferral.doesNotVerifyAccessibility === true
  && registryTask?.status === 'PASS' && registryTask?.implementationAcceptance === true
  && acta.includes('T043 puede continuar');
const allHashesMatch = currentHashes.every(({ matches }) => matches);
const report = {
  taskId: 'T043', recordedUtc: new Date().toISOString(), clientDate: '2026-10-10',
  timezone: 'America/Caracas', baseSha: git('rev-parse', 'HEAD'), runtime: process.version,
  prerequisiteAccepted, allCandidateHashesMatch: allHashesMatch,
  candidateHashesAreAcceptedContract: prerequisiteAccepted,
  acceptanceKind: candidate.acceptanceKind,
  originalFullSystemAcceptance: false,
  scopeAmendment: deferralPath,
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
  inspectedEvidence: [predecessorPath, actaPath, candidatePath, registryPath, readerPath, deferralPath]
    .map((path) => ({ path, sha256: hash(read(path)) })),
  currentHashes,
  initialStatusShort: git('status', '--short', '--untracked-files=normal'),
  skillDirectoryExists: existsSync(resolve(root, 'tools/skills/crear-rutas-koraz')),
  conclusion: prerequisiteAccepted && allHashesMatch
    ? 'PASS: exact implementation contract frozen with explicit user exception; Q19/V04 remains NO VERIFICADO. T043 packaging authorized.'
    : 'NO VERIFICADO: accepted contract or explicit scope exception not verified.',
};
writeFileSync(resolve(evidenceDir, 'prerequisite-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  prerequisiteAccepted, allCandidateHashesMatch: allHashesMatch,
  hashCount: currentHashes.length, predecessorStatus: predecessor.status,
  evidence: relativeEvidence + 'prerequisite-check.json',
}, null, 2));
if (!allHashesMatch) process.exitCode = 1;
