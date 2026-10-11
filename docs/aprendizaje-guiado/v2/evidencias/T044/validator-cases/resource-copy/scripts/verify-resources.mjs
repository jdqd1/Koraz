#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
try {
  const manifest = JSON.parse(readFileSync(resolve(root, 'references/contract-runtime.json'), 'utf8'));
  const checks = manifest.resources.map(({ path, sha256, bytes }) => {
    const target = resolve(root, path);
    const within = relative(root, target);
    if (within.startsWith('..') || isAbsolute(within) || within === '') throw new Error('Ruta de recurso fuera de la skill.');
    const data = readFileSync(target);
    return { path, expectedSha256: sha256, actualSha256: hash(data), matches: hash(data) === sha256 && data.length === bytes };
  });
  const manifestHash = hash(readFileSync(resolve(root, 'references/accepted-contract-hashes.json')));
  const runtimeMatches = Number(process.versions.node.split('.')[0]) === 24;
  const valid = runtimeMatches && manifest.schemaVersion === '2.0'
    && manifest.policyVersion === 'guided-v2.0' && manifest.accepted === true && manifest.frozen === true
    && manifestHash === manifest.acceptedManifestSha256
    && checks.length === 6 && checks.every(({ matches }) => matches);
  console.log(JSON.stringify({ valid, runtime: process.version, runtimeMatches,
    schemaVersion: manifest.schemaVersion, policyVersion: manifest.policyVersion,
    validatorVersion: manifest.validatorVersion, acceptanceKind: manifest.acceptanceKind,
    deferredCheck: manifest.deferredCheck, deferredCheckStatus: manifest.deferredCheckStatus,
    scope: 'portable', catalogueResolution: 'PENDING_AT_IMPORT',
    acceptedManifestMatches: manifestHash === manifest.acceptedManifestSha256, checks }, null, 2));
  process.exitCode = valid ? 0 : 1;
} catch (error) {
  console.log(JSON.stringify({ valid: false, code: 'RESOURCE_ERROR', message: error.message,
    suggestedFix: 'Solicita el contrato aceptado actualizado; no modifiques el bundle para aceptar la salida.' }));
  process.exitCode = 1;
}
