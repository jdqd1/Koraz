/** T041 only: guarded, disposable PostgreSQL restore drill. No .env loading. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGuidedV2Postgres } from '../../../apps/api/test/helpers/guided-v2-postgres.js';
import { guidedV2Fixture, guidedV2FixtureId as id, guidedV2FixtureBindings, guidedV2GuidePayload, guidedV2GuideHash, guidedV2Image } from '../../../apps/api/test/helpers/guided-v2-fixtures.js';
import { createPostgresGuidedLearningV2Provider } from '../../../apps/api/src/providers/postgres-guided-learning-v2.js';
import { createGuidedV2HttpProvider } from '../../../apps/api/src/guided-learning/v2/routes.js';
import { createPostgresGuidedLearningProvider } from '../../../apps/api/src/providers/postgres-guided-learning.js';
import { applySqlMigrations } from '../../../apps/api/src/db/migrate.js';
import { readEnvironment } from '../../../apps/api/src/config.js';
import { buildApp } from '../../../apps/api/src/app.js';
import { LearningPathCreateRequestSchema, type LearningAttempt } from '../../../packages/contracts/src/index.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/T041');
mkdirSync(out, { recursive: true });
const requireApi = createRequire(resolve(root, 'apps/api/package.json'));
const Fastify = requireApi('fastify');
const cluster = JSON.parse(readFileSync(join(out, 'cluster.json'), 'utf8'));
assert.equal(process.env.KORAZ_TEST_DATABASE, 'true');
assert.equal(cluster.disposable, true);
assert.equal(cluster.controlUrl, 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test');
process.env.KORAZ_GUIDED_V2_TEST_DATABASE_URL = cluster.controlUrl;
const save = (name: string, value: unknown) => writeFileSync(join(out, name), JSON.stringify(value, null, 2) + '\n');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const commands: unknown[] = [], checks: unknown[] = [];
const started = new Date().toISOString();
function native(binary: string, args: string[], label: string) {
  const before = performance.now();
  const r = spawnSync(join(cluster.postgresBin, binary + '.exe'), args, { windowsHide: true, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 });
  writeFileSync(join(out, label + '.txt'), (r.stdout ?? '') + (r.stderr ?? ''));
  commands.push({ binary, args, exitCode: r.status, elapsedMs: performance.now() - before, evidence: label + '.txt' });
  save('native-commands.json', commands);
  if (r.error) throw r.error;
  assert.equal(r.status, 0, `${label}: ${r.stderr}`);
  return performance.now() - before;
}
function check(name: string, detail: unknown) { checks.push({ name, status: 'PASS', detail }); save('checks.json', checks); console.log('PASS ' + name); }
function guardDb(url: string) {
  const u = new URL(url);
  assert.equal(u.hostname, '127.0.0.1'); assert.equal(u.port, '55435'); assert.equal(u.username, 'koraz_test');
  assert.match(u.pathname, /^\/koraz_guided_v2_test_[a-f0-9]{32}$/); assert.equal(u.password, ''); assert.equal(u.search, '');
}
let serial = 0;
async function snapshot(db: Awaited<ReturnType<typeof createGuidedV2Postgres>>, label: string) {
  guardDb(db.url);
  const tables = (await db.pool.query("select schemaname,tablename from pg_tables where schemaname in ('public','private') order by schemaname,tablename")).rows;
  const rows: Record<string, { count: number; sha256: string }> = {};
  for (const t of tables) {
    assert.match(t.schemaname, /^[a-z_]+$/); assert.match(t.tablename, /^[a-z0-9_]+$/);
    const data = (await db.pool.query(`select to_jsonb(t)::text as row from "${t.schemaname}"."${t.tablename}" t order by to_jsonb(t)::text`)).rows.map(r => r.row);
    rows[t.schemaname + '.' + t.tablename] = { count: data.length, sha256: sha(data.join('\n')) };
  }
  const schemaFile = join(out, `schema-${++serial}.sql`);
  native('pg_dump', ['--dbname', db.url, '--schema-only', '--no-owner', '--file', schemaFile], `schema-dump-${serial}`);
  // PostgreSQL randomizes psql restrict nonces. They do not describe schema objects.
  const schema = readFileSync(schemaFile, 'utf8').replace(/^\\(?:un)?restrict .*\r?\n/gm, '');
  const sequences = (await db.pool.query("select schemaname,sequencename,last_value from pg_sequences where schemaname in ('public','private') order by schemaname,sequencename")).rows;
  const result = { rows, schemaSha256: sha(schema), sequences };
  save(label + '.json', result); return result;
}
function equalData(a: Awaited<ReturnType<typeof snapshot>>, b: Awaited<ReturnType<typeof snapshot>>, except: string[] = []) {
  const filter = (s: typeof a) => Object.fromEntries(Object.entries(s.rows).filter(([t]) => !except.includes(t)));
  assert.deepEqual(filter(a), filter(b)); assert.deepEqual(a.sequences, b.sequences);
}
const migrations = resolve(root, 'database/migrations');
const initialDir = mkdtempSync(join(tmpdir(), 'koraz-t041-initial-'));
const faultDir = mkdtempSync(join(tmpdir(), 'koraz-t041-fault-'));
for (const f of readdirSync(migrations).filter(f => f.endsWith('.sql'))) {
  copyFileSync(join(migrations, f), join(faultDir, f));
  if (f.localeCompare('0035') < 0) copyFileSync(join(migrations, f), join(initialDir, f));
}
writeFileSync(join(faultDir, '9999_t041_fault.sql'), "create table private.t041_fault(id integer); update public.auth_users set name='SIMULATED FAILED MIGRATION'; select 1/0;\n");
const assets = { bucket: 'test-assets', createDownloadUrl: async () => 'http://127.0.0.1:41042/fixture.png' };
const now = () => new Date('2026-10-08T12:00:00Z');
let source: Awaited<ReturnType<typeof createGuidedV2Postgres>> | undefined;
let restored: Awaited<ReturnType<typeof createGuidedV2Postgres>> | undefined;
let sourceApp: Awaited<ReturnType<typeof buildApp>> | undefined;
let targetApp: Awaited<ReturnType<typeof buildApp>> | undefined;
let control: ReturnType<typeof Fastify> | undefined;
const actors = new Map(Array.from({ length: 9 }, (_, n) => ['student-' + (n + 1), { id: id(n + 1), name: 'Alumno T041 ' + (n + 1), email: `t041-${n + 1}@example.test` }] as const));
async function makeApp(db: NonNullable<typeof source>, mode: 'on' | 'off' | 'admission-off' | 'allowlist') {
  return buildApp(readEnvironment({ NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '41041', DATABASE_URL: db.url,
    DATABASE_MIGRATIONS_ENABLED: 'false', GUIDED_LEARNING_ENABLED: 'true', GUIDED_LEARNING_V2_ENABLED: mode === 'off' ? 'false' : 'true',
    GUIDED_LEARNING_V2_NEW_ENROLLMENTS: mode === 'on' || mode === 'allowlist' ? 'true' : 'false',
    GUIDED_LEARNING_V2_ALLOWLIST: mode === 'allowlist' ? id(2) : '', WEB_ORIGINS: 'http://127.0.0.1:31041' }), {
    identityProvider: { getUser: async r => actors.get(/(?:^|;\s*)t041=([^;]+)/.exec(r.cookie ?? '')?.[1] ?? '') ?? null, revokeSessions: async () => {} },
    guidedLearningProvider: createPostgresGuidedLearningProvider(db.database, { clock: now }),
    guidedLearningV2Provider: createGuidedV2HttpProvider(db.database, { now, assetStorage: assets }),
  });
}
async function request(app: Awaited<ReturnType<typeof buildApp>>, actor: number, path: string, payload?: unknown, expected = 200) {
  const r = await app.inject({ method: payload === undefined ? 'GET' : 'POST', url: path,
    headers: { cookie: `t041=student-${actor}`, 'idempotency-key': randomUUID() }, ...(payload === undefined ? {} : { payload: payload as object }) });
  assert.equal(r.statusCode, expected, `${path}: ${r.body}`); return r.json();
}
let fixtures: any;
try {
  source = await createGuidedV2Postgres({ directory: initialDir }); guardDb(source.url);
  save('owned-databases.json', { source: source.name, restored: null });
  for (const a of actors.values()) await source.pool.query('insert into auth_users(id,name,email) values($1,$2,$3)', [a.id, a.name, a.email]);
  await source.pool.query("insert into user_roles(user_id,role,assigned_by) values($1,'administrator',$1)", [id(1)]);
  await source.pool.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,catalog_visibility,published_at,published_by) values($1,'topic','t041-topic','Tema T041','Fixture','Tema T041',$3,'published','catalog',now(),$3),($2,'guide','t041-guide','Guía T041','Fixture','Tema T041',$3,'published','catalog',now(),$3)", [id(20), id(21), id(1)]);
  await source.pool.query('update content_items set content=$2 where id=$1', [id(20), { introduction: 'Fixture', objectives: ['Verificar recuperación'], regions: ['Tema'] }]);
  await source.pool.query('update content_items set content=$2 where id=$1', [id(21), { document: null, sections: guidedV2GuidePayload.content.sections, keyPoints: [], linkedVideoId: null,
    quiz: { questions: Array.from({ length: 5 }, (_, i) => ({ id: id(200 + i), memoryVersion: 1, optionIds: [id(300 + 2 * i), id(301 + 2 * i)], prompt: `Pregunta T041 ${i + 1}`, options: ['Correcta', 'Otra'], correctOptionIndex: 0, explanation: 'Explicación sintética' })) }, regions: ['Tema'] }]);
  await source.pool.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [id(22), id(21)]);
  await source.pool.query('insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)', [id(23), id(22), guidedV2GuidePayload, guidedV2GuideHash]);
  await source.pool.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test-assets','fixture.png','fixture.png','image/png',$4,'ready',now())", [id(24), id(20), id(1), guidedV2Image.length]);
  const editor = createPostgresGuidedLearningV2Provider(source.database, { now, assetStorage: assets });
  const pkg = guidedV2Fixture(); pkg.packageKey = 't041-v2'; pkg.route.slug = 't041-v2'; pkg.route.title = 'Ruta v2 T041';
  let created = await editor.createDraft({ actorUserId: id(1), canCreate: true, canEditAll: true, enforceAccess: true, package: pkg, bindings: guidedV2FixtureBindings });
  assert.equal(created.status, 'success'); let route = (created as any).value;
  for (const status of ['in_review', 'approved', 'published'] as const) {
    const r = await editor.transitionPath({ actorUserId: id(1), canEdit: true, canEditAll: true, canReview: true, canPublish: true, pathId: route.pathId, expectedVersion: route.editVersion, status, reviewNote: 'Fixture sintético del simulacro, sin validación clínica' });
    assert.equal(r.status, 'success', JSON.stringify(r)); route = (r as any).value;
  }
  const v1 = createPostgresGuidedLearningProvider(source.database, { clock: now });
  const objective = randomUUID();
  const draft = LearningPathCreateRequestSchema.parse({ title: 'Ruta v1 T041', slug: 't041-v1', summary: 'Fixture de recuperación v1', coverKey: 'heart', topicContentId: id(20),
    definition: { units: [{ title: 'Unidad v1', stableKey: 'unit', objectives: [{ id: objective, title: 'Comprobar recuperación', importance: 1 }],
      steps: ['quiz', 'guide'].map(projection => ({ title: projection === 'quiz' ? 'Cuestionario v1' : 'Lectura v1', stableKey: projection, purpose: projection === 'quiz' ? 'check' : 'understand', isEssential: true, objectiveIds: [objective],
        options: [{ label: projection === 'quiz' ? 'Responder cuestionario' : 'Leer guía', projection, sourceContentId: id(21), rewardIdentity: randomUUID(), isDefault: true, estimatedMinutes: 1 }] })) }] } });
  const legacy = await v1.createPath({ actorUserId: id(1), draft }); assert.equal(legacy.status, 'success', JSON.stringify(legacy));
  const legacyRoute = (legacy as any).value;
  await source.pool.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [legacyRoute.version.id, id(1)]);
  await source.pool.query('update learning_paths set published_version_id=$1 where id=$2', [legacyRoute.version.id, legacyRoute.id]);
  sourceApp = await makeApp(source, 'on');
  const v1Sessions: Record<string, string> = {}, v2Sessions: Record<string, string> = {};
  for (const actor of [8, 9]) {
    await request(sourceApp, actor, '/v1/guided-learning/enrollments', { pathId: legacyRoute.id }, 201);
    let a: LearningAttempt = (await request(sourceApp, actor, '/v1/guided-learning/attempts', { clientAttemptId: randomUUID(), stepOptionId: legacyRoute.version.units[0].steps[0].options[0].id }, 201)).attempt;
    assert.equal(a.manifest.projection, 'quiz');
    if (a.manifest.projection !== 'quiz') throw new Error('Expected the persisted quiz fixture');
    for (const question of a.manifest.questions) a = (await request(sourceApp, actor, `/v1/guided-learning/attempts/${a.id}/responses`, { expectedVersion: a.rowVersion, itemId: question.itemId, kind: 'quiz', optionId: question.options[0].id })).attempt;
    assert.equal(a.status, 'completed', 'The final v1 quiz response completes the attempt');
    const active = (await request(sourceApp, actor, '/v1/guided-learning/attempts', { clientAttemptId: randomUUID(), stepOptionId: legacyRoute.version.units[0].steps[1].options[0].id }, 201)).attempt;
    v1Sessions[actor] = active.id;
  }
  let enrollment2: string;
  for (const actor of [2, 3, 4]) {
    let state = (await request(sourceApp, actor, '/v2/guided-learning/enrollments', { pathId: route.pathId })).state;
    if (actor === 2) enrollment2 = state.enrollmentId;
    for (const key of actor === 2 ? ['study-1', 'constructed-1', 'choice-1', 'short-1', 'apply-1'] : ['study-1']) {
      let a = (await request(sourceApp, actor, '/v2/guided-learning/attempts', { clientAttemptId: randomUUID(), enrollmentId: state.enrollmentId, expectedEnrollmentVersion: state.rowVersion, target: { kind: 'activity', key } })).attempt;
      if (actor !== 2) { v2Sessions[actor] = a.attemptId; break; }
      const answer = key === 'study-1' ? { kind: 'study', acknowledged: true } : key === 'constructed-1' ? { kind: 'constructed_response', text: 'Relación sintética', selfRating: null } : key === 'short-1' ? { kind: 'short_answer', text: 'respuesta' } : { kind: 'single_choice', optionKey: 'yes' };
      a = (await request(sourceApp, actor, `/v2/guided-learning/attempts/${a.attemptId}/responses`, { activityKey: key, answer, confidence: null, expectedVersion: a.rowVersion })).attempt;
      if (key === 'constructed-1') {
        a = (await request(sourceApp, actor, `/v2/guided-learning/attempts/${a.attemptId}/help`, { activityKey: key, kind: 'reveal', expectedVersion: a.rowVersion })).attempt;
        a = (await request(sourceApp, actor, `/v2/guided-learning/attempts/${a.attemptId}/responses`, { activityKey: key, answer: { ...answer, selfRating: 'good' }, confidence: null, expectedVersion: a.rowVersion })).attempt;
      }
      await request(sourceApp, actor, `/v2/guided-learning/attempts/${a.attemptId}/complete`, { expectedVersion: a.rowVersion });
      state = (await request(sourceApp, actor, `/v2/guided-learning/enrollments/${state.enrollmentId}/state`)).state;
    }
  }
  fixtures = { v1: { pathId: legacyRoute.id, versionId: legacyRoute.version.id, slug: 't041-v1', sessions: v1Sessions }, v2: { pathId: route.pathId, versionId: route.pathVersionId, slug: 't041-v2', enrollment2: enrollment2!, sessions: v2Sessions }, now: now().toISOString() };
  save('fixtures.json', fixtures);
  await sourceApp.close(); sourceApp = undefined;
  const before = await snapshot(source, 'before-backup');
  for (const t of ['auth_users', 'learning_enrollments', 'learning_enrollment_versions', 'learning_attempts', 'learning_responses', 'learning_review_states', 'learning_v2_attempts', 'learning_v2_responses', 'learning_v2_review_state', 'learning_resources', 'learning_resource_revisions', 'learning_v2_bindings']) assert.ok(before.rows['public.' + t]?.count > 0, `Nonempty coverage: ${t}`);
  check('nonempty-v1-v2-history-responses-agenda-and-sources', before.rows);
  const backup = join(out, 'v1-v2-backup.dump');
  const dumpMs = native('pg_dump', ['--dbname', source.url, '--format=custom', '--no-owner', '--file', backup], 'backup');
  const backupInfo = { sha256: sha(readFileSync(backup)), bytes: readFileSync(backup).length, dumpMs, sourceDatabase: source.name, capturedUtc: new Date().toISOString(), containsSyntheticDataOnly: true };
  save('backup.json', backupInfo);
  const applied = await applySqlMigrations(source.pool, migrations, { legacyContentMode: 'empty' });
  assert.deepEqual(applied.filter(r => r.status === 'applied').map(r => r.fileName), ['0035_guided_v2_media_access.sql']);
  const migrated = await snapshot(source, 'after-migrations'); equalData(before, migrated, ['public.cediah_schema_migrations']);
  save('migration-rehearsal.json', { status: 'PASS', results: applied, dataUnchanged: true });
  check('pending-real-migrations-preserve-v1-v2-data', applied.filter(r => r.status === 'applied'));
  let faultCode: string | undefined;
  try { await applySqlMigrations(source.pool, faultDir, { legacyContentMode: 'empty' }); } catch (e: any) { faultCode = e.code; }
  assert.equal(faultCode, '22012');
  const faultAfter = await snapshot(source, 'after-failed-migration'); assert.deepEqual(faultAfter, migrated);
  check('failed-migration-rolls-back-DDL-data-and-ledger', { sqlState: faultCode, allDataAndSchemaUnchanged: true });
  // Committed damage exists only in this owned fixture database, to prove restore is useful.
  await source.pool.query("update auth_users set name='SIMULATED INCIDENT' where id=$1", [id(2)]);
  await source.pool.query("update learning_v2_review_state set due_at='2099-01-01T00:00:00Z'");
  const damaged = await snapshot(source, 'simulated-incident');
  assert.notEqual(damaged.rows['public.auth_users'].sha256, migrated.rows['public.auth_users'].sha256);
  assert.notEqual(damaged.rows['public.learning_v2_review_state'].sha256, migrated.rows['public.learning_v2_review_state'].sha256);
  check('committed-fixture-incident-detected-by-hashes', { changedTables: ['auth_users', 'learning_v2_review_state'] });
  restored = await createGuidedV2Postgres({ migrate: false }); guardDb(restored.url); assert.notEqual(restored.name, source.name);
  save('owned-databases.json', { source: source.name, restored: restored.name });
  const restoreMs = native('pg_restore', ['--dbname', restored.url, '--exit-on-error', '--single-transaction', '--no-owner', backup], 'restore');
  const restoredBefore = await snapshot(restored, 'restored-before-migrations'); assert.deepEqual(restoredBefore, before);
  check('different-database-full-restore-matches-all-table-hashes-schema-and-sequences', { source: source.name, target: restored.name, tables: Object.keys(before.rows).length });
  const replay = await applySqlMigrations(restored.pool, migrations, { legacyContentMode: 'empty' });
  const restoredAfter = await snapshot(restored, 'restored-after-migrations'); assert.deepEqual(restoredAfter.rows['public.cediah_schema_migrations'].count, migrated.rows['public.cediah_schema_migrations'].count);
  equalData(restoredAfter, migrated, ['public.cediah_schema_migrations']); assert.equal(restoredAfter.schemaSha256, migrated.schemaSha256);
  const repeat = await applySqlMigrations(restored.pool, migrations, { legacyContentMode: 'empty' }); assert.ok(repeat.every(r => r.status !== 'applied'));
  save('restore.json', { status: 'PASS', ...backupInfo, restoreMs, targetDatabase: restored.name, allTablesMatched: true, schemaAndSequencesMatched: true, migrationsAfterRestore: replay, repeatedMigrationRun: repeat, observedOnlyNoProductionRpoRto: true });
  check('restored-database-migration-replay-and-checksums', { files: repeat.length, noRepeatApplied: true });
  targetApp = await makeApp(restored, 'off');
  const offBefore = await snapshot(restored, 'maintenance-before');
  for (const path of ['/v2/guided-learning/paths/t041-v2', `/v2/guided-learning/enrollments/${enrollment2!}/state`, `/v2/guided-learning/attempts/${v2Sessions[3]}`]) {
    const r = await request(targetApp, path.includes('attempts/') ? 3 : 2, path);
    if (r.attempt) assert.equal(r.attempt.attemptId, v2Sessions[3]);
    else assert.equal((r.path ?? r.state).availability, 'maintenance');
  }
  await request(targetApp, 3, `/v2/guided-learning/attempts/${v2Sessions[3]}/responses`, { activityKey: 'study-1', answer: { kind: 'study', acknowledged: true }, confidence: null, expectedVersion: 1 }, 503);
  await request(targetApp, 5, '/v2/guided-learning/enrollments', { pathId: route.pathId }, 503);
  const offAfter = await snapshot(restored, 'maintenance-after'); assert.deepEqual(offAfter, offBefore);
  check('v2-disabled-maintenance-private-reads-no-writes-and-mutations-blocked', { allTablesUnchanged: true, mutationStatus: 503 });
  const legacyRead = await request(targetApp, 8, `/v1/guided-learning/attempts/${v1Sessions[8]}`); assert.equal(legacyRead.manifest.projection, 'guide');
  const v1Path = await request(targetApp, 8, '/v1/guided-learning/paths/t041-v1'); assert.equal(v1Path.version.policyVersion, 'guided-v1');
  check('restored-v1-sessions-and-route-readable-with-v2-off', { attemptId: v1Sessions[8] });
  await targetApp.close();
  targetApp = await makeApp(restored, 'admission-off');
  await request(targetApp, 5, '/v2/guided-learning/enrollments', { pathId: route.pathId }, 403);
  await request(targetApp, 2, `/v2/guided-learning/enrollments/${enrollment2!}/state`);
  check('freeze-new-v2-enrollments-preserves-existing-enrollment-access', { admissionStatus: 403 });
  await targetApp.close();
  targetApp = await makeApp(restored, 'allowlist');
  await request(targetApp, 2, '/v2/guided-learning/paths/t041-v2');
  await request(targetApp, 3, '/v2/guided-learning/paths/t041-v2', undefined, 403);
  await request(targetApp, 8, '/v1/guided-learning/paths/t041-v1');
  check('v2-allowlist-keeps-v1-available', { allowed: id(2), excludedStatus: 403 });
  await targetApp.close(); targetApp = await makeApp(restored, 'off');
  save('api-result.json', { status: 'PASS LOCAL', startedUtc: started, finishedUtc: new Date().toISOString(), checks, commands, fixtures, syntheticIdentity: true, productionTouched: false });
  if (process.argv.includes('--hold')) {
    await targetApp.listen({ host: '127.0.0.1', port: 41041 });
    control = Fastify({ logger: false }); let mode = 'off';
    control.get('/ready', async () => ({ ready: true, testOnly: true, fixtures, mode, database: restored!.name }));
    control.get('/snapshot', async () => snapshot(restored!, `browser-snapshot-${Date.now()}`));
    control.get('/fixture.png', async (_r: any, reply: any) => reply.type('image/png').send(guidedV2Image));
    control.post('/mode/:mode', async (r: any) => {
      assert.ok(['on', 'off', 'admission-off'].includes(r.params.mode));
      await targetApp!.close(); targetApp = await makeApp(restored!, r.params.mode); await targetApp.listen({ host: '127.0.0.1', port: 41041 }); mode = r.params.mode;
      return { mode };
    });
    let finish!: () => void;
    const held = new Promise<void>(r => { finish = r; });
    const timer = setTimeout(finish, 1200000);
    control.post('/stop', async () => { setTimeout(finish, 200); return { stopping: true }; });
    await control.listen({ host: '127.0.0.1', port: 41042 });
    console.log('T041 restored API ready: 41041; control:41042; Next:31041');
    await held; clearTimeout(timer);
  }
} catch (e: any) {
  save('failure-' + Date.now() + '.json', { status: 'FAIL', message: e.message, stack: e.stack, checks });
  throw e;
} finally {
  await control?.close(); await targetApp?.close(); await sourceApp?.close();
  const owned = [source?.name, restored?.name].filter(Boolean);
  await restored?.close(); await source?.close();
  save('database-cleanup.json', { status: 'PASS', removedOwnedDatabases: owned, completedUtc: new Date().toISOString() });
}
