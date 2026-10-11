import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRoutePackage, routePackageJsonSchema } from '../dist/learning-route-validation.js';

// Export accepted bytes. Never rebuild or replace the accepted validation rules.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const target = resolve(root, 'tools/skills/crear-rutas-koraz');
const read = (path) => readFileSync(resolve(root, path));
const parse = (path) => JSON.parse(read(path).toString('utf8').replace(/^\uFEFF/, ''));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const result = parse('docs/aprendizaje-guiado/v2/evidencias/T042/result.json');
const acceptedPath = 'docs/aprendizaje-guiado/v2/evidencias/T042/accepted-contract-hashes.json';
const accepted = parse(acceptedPath);
const deferralPath = 'docs/aprendizaje-guiado/v2/evidencias/T042/reader-deferral.json';
const deferral = parse(deferralPath);
if (result.status !== 'PASS' || !result.implementationAcceptance
  || !result.contract.accepted || !result.contract.frozen
  || !accepted.accepted || !accepted.frozen
  || accepted.acceptanceKind !== 'provisional_implementation_with_user_exception'
  || !deferral.implementationAcceptance || !deferral.doesNotVerifyAccessibility
  || result.contract.manifestSha256 !== sha256(read(acceptedPath))) {
  throw new Error('T042 debe aceptar y congelar el contrato exacto con su excepción documentada.');
}
for (const { path, sha256: expected } of accepted.hashes) {
  if (sha256(read(path)) !== expected) throw new Error(`Contrato congelado modificado: ${path}`);
}
const schemaSource = 'packages/contracts/schemas/koraz-route-2.0.schema.json';
if (sha256(Buffer.from(`${JSON.stringify(routePackageJsonSchema(), null, 2)}\n`)) !== sha256(read(schemaSource))) {
  throw new Error('El esquema generado por los módulos aceptados difiere del congelado.');
}
const exampleSource = 'docs/aprendizaje-guiado/v2/evidencias/T027/ui-package.json';
const exampleValidation = validateRoutePackage(parse(exampleSource));
if (!exampleValidation.valid || !exampleValidation.publishable) {
  throw new Error(`Ejemplo sintético inválido: ${JSON.stringify(exampleValidation)}`);
}
const files = [
  [schemaSource, 'assets/koraz-route-2.0.schema.json'],
  ['packages/contracts/bin/validate-learning-route.bundle.mjs', 'scripts/validate-route.mjs'],
  [exampleSource, 'assets/ejemplo-valido.koraz-route.json'],
  [acceptedPath, 'references/accepted-contract-hashes.json'],
  [deferralPath, 'references/reader-deferral.json'],
  ['node_modules/.pnpm/zod@4.4.3/node_modules/zod/LICENSE', 'references/LICENSE-ZOD.txt'],
];
const resources = files.map(([sourcePath, relativePath]) => {
  const bytes = read(sourcePath);
  const path = join(target, relativePath);
  if (existsSync(path) && sha256(readFileSync(path)) !== sha256(bytes)) {
    throw new Error(`Recurso existente diferente; preservarlo y revisar antes de sustituir: ${relativePath}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  return { path: relativePath, sourcePath, sha256: sha256(bytes), bytes: bytes.length };
});
const manifest = {
  schemaVersion: accepted.schemaVersion,
  validatorVersion: `contracts@0.1.0/sha256:${result.contract.validatorSourceSha256}`,
  policyVersion: accepted.policyVersion,
  schedulerVersion: accepted.schedulerVersion,
  requiredRuntime: 'Node.js 24',
  accepted: true, frozen: true,
  acceptanceKind: accepted.acceptanceKind,
  originalFullSystemAcceptance: false,
  deferredCheck: 'Q19/V04', deferredCheckStatus: 'NO VERIFICADO',
  acceptedManifestSha256: sha256(read(acceptedPath)),
  schemaSha256: result.contract.schemaSha256,
  validatorSourceSha256: result.contract.validatorSourceSha256,
  bundleSha256: result.contract.bundleSha256,
  validationScope: 'portable',
  catalogueResolution: 'PENDING_AT_IMPORT',
  editorialReview: 'REQUIRED_IN_KORAZ_BEFORE_PUBLICATION',
  automaticPublication: false,
  example: { synthetic: true, medicalContent: false, sourcePath: exampleSource, validation: exampleValidation },
  resources,
};
writeFileSync(join(target, 'references/contract-runtime.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS', target, resources: resources.length,
  schemaSha256: manifest.schemaSha256, bundleSha256: manifest.bundleSha256,
  catalogueResolution: manifest.catalogueResolution, acceptanceKind: manifest.acceptanceKind }, null, 2));
