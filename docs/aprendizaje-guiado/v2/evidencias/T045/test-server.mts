import { randomUUID, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createGuidedV2Postgres } from '../../../../../apps/api/test/helpers/guided-v2-postgres.js';
import { createPostgresGuidedLearningV2Provider } from '../../../../../apps/api/src/providers/postgres-guided-learning-v2.js';
import { createGuidedV2HttpProvider } from '../../../../../apps/api/src/guided-learning/v2/routes.js';
import { createPostgresLearningMapProvider } from '../../../../../apps/api/src/providers/postgres-learning-map.js';
import { buildApp } from '../../../../../apps/api/src/app.js';
import { createPostgresContentProvider } from '../../../../../apps/api/src/providers/postgres-content.js';
import { readEnvironment } from '../../../../../apps/api/src/config.js';
import { hashLearningSnapshot } from '../../../../../apps/api/src/guided-learning/snapshot-hash.js';
import { hashRoutePackage } from '../../../../../apps/api/src/guided-learning/v2/validation.js';
import { RoutePackageSchema, V2HttpContracts, validateRoutePackage } from '../../../../../packages/contracts/src/index.js';
import assert from 'node:assert/strict';

const here = new URL('./', import.meta.url);
const read = (name: string) => JSON.parse(readFileSync(new URL(name, here), 'utf8').replace(/^\uFEFF/, ''));
const out = (name: string, value: unknown) => writeFileSync(new URL(name, here), JSON.stringify(value, null, 2) + '\n');
const hashBytes = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
export async function createT045Server() {
  assert.equal(process.env.KORAZ_TEST_DATABASE, 'true');
  assert.equal(process.env.KORAZ_GUIDED_V2_TEST_SERVER, 'true');
  assert.equal(process.env.NODE_ENV, 'test');
  const isolated = await createGuidedV2Postgres();
  const { database: db, pool } = isolated;
  const operator = randomUUID(), student = randomUUID(), studentHttp = randomUUID();
  const actors = new Map([
    ['editor', { id: operator, name: 'Revisor técnico de fixture T045', email: 't045-editor@example.test' }],
    ['student-2', { id: student, name: 'Alumno navegador T045', email: 't045-browser@example.test' }],
    ['student-3', { id: studentHttp, name: 'Alumno HTTP T045', email: 't045-http@example.test' }],
  ]);
  let clock = new Date();
  let clockOffsetMs = 0;
  const now = () => new Date(Date.now() + clockOffsetMs);
  const editor = createPostgresGuidedLearningV2Provider(db, { now });
  const fixtures: Record<string, any> = {};
  const transcript: unknown[] = [];
  let app: any;
  const identityProvider = { getUser: async (r: any) => actors.get(/(?:^|;\s*)t035=([^;]+)/.exec(r.cookie ?? '')?.[1] ?? '') ?? null, revokeSessions: async () => {} };
  const open = async () => {
    app = await buildApp(readEnvironment({ NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '41035',
      DATABASE_URL: isolated.url, DATABASE_MIGRATIONS_ENABLED: 'false', GUIDED_LEARNING_ENABLED: 'true',
      GUIDED_LEARNING_MAP_ENABLED: 'true', GUIDED_LEARNING_V2_ENABLED: 'true', GUIDED_LEARNING_V2_NEW_ENROLLMENTS: 'true',
      WEB_ORIGINS: 'http://127.0.0.1:31035' }), {
      identityProvider, contentProvider: createPostgresContentProvider(db),
      guidedLearningV2Provider: createGuidedV2HttpProvider(db, { now }), guidedLearningV2EditorProvider: editor,
      learningMapProvider: createPostgresLearningMapProvider(db, { clock: now }),
    });
    app.get('/__test/ready', async () => ({ testOnly: true, database: isolated.name, fixtures, now: now().toISOString() }));
    app.get('/__test/package/:name', async (r: any) => ({ package: fixtures[r.params.name]?.package }));
    app.get('/__test/response-count/:attempt', async (r: any) => ({ count: (await pool.query('select count(*)::int n from learning_v2_responses where attempt_id=$1', [r.params.attempt])).rows[0].n }));
    app.get('/__test/durable', async () => ({
      database: (await pool.query('select current_database() name, version() version')).rows[0],
      attempts: (await pool.query('select id, enrollment_id, status, row_version from learning_v2_attempts order by created_at,id')).rows,
      responses: (await pool.query('select id, attempt_id, enrollment_id, activity_key, objective_key, purpose, grading_source, score01, assisted, accepted_at from learning_v2_responses order by accepted_at,id')).rows,
      audit: (await pool.query('select action,actor_user_id,target_id,metadata from private.guided_v2_audit order by occurred_at')).rows,
    }));
    app.post('/__test/clock', async (r: any) => {
      assert(Number.isInteger(r.body.days) && r.body.days >= 1 && r.body.days <= 40);
      clockOffsetMs += r.body.days * 86400000; return { now: now().toISOString() };
    });
    app.post('/__test/stop', async () => {
      setTimeout(() => void (async () => {
        await app.close(); await isolated.close();
        out('database-cleanup.json', { status: 'PASS', removedDatabase: isolated.name, closed: true });
        process.exit(0);
      })(), 100);
      return { stopped: true };
    });
    app.post('/__test/restart', async () => {
      setTimeout(() => void (async () => {
        await app.close(); await open(); await app.listen({ host: '127.0.0.1', port: 41035 });
        out('application-restart.json', { database: isolated.name, restarted: true, at: new Date().toISOString() });
      })(), 100);
      return { restarting: true };
    });
  };
  const request = async (name: keyof typeof V2HttpContracts, url: string, body?: any, who = 'editor', key = randomUUID()) => {
    const contract = V2HttpContracts[name];
    const response = await app.inject({ method: contract.method, url,
      headers: { cookie: `t035=${who}`, ...(body ? { 'content-type': 'application/json', 'idempotency-key': key } : {}) },
      ...(body ? { payload: JSON.stringify(body) } : {}) });
    const value = response.json();
    transcript.push({ name, url, who, status: response.statusCode, value });
    return { status: response.statusCode, value: response.statusCode < 300 ? contract.response.parse(value) as any : value };
  };
  try {
    for (const actor of actors.values()) await pool.query('insert into auth_users(id,name,email) values($1,$2,$3)', [actor.id, actor.name, actor.email]);
    await pool.query("insert into user_roles(user_id,role,assigned_by) values($1,'administrator',$1)", [operator]);
    for (const id of [student, studentHttp]) await pool.query("insert into learning_preferences(user_id,timezone) values($1,'America/Caracas')", [id]);
    await open();
    const editorRoot = '/v2/editor/learning-paths';
    for (const name of ['synthetic', 'pilot', 'adversarial']) {
      const generatedDir = [3, 2].map(round => `cases/${name}/round-${round}/output`).find(dir => existsSync(new URL(`${dir}/ruta.koraz-route.json`, here))) ?? `cases/${name}/output`;
      const raw = read(`${generatedDir}/ruta.koraz-route.json`);
      const portable = validateRoutePackage(raw);
      const parsed = RoutePackageSchema.parse(raw);
      const sourceText = readFileSync(new URL(`cases/${name}/guia.md`, here), 'utf8');
      const fileHash = hashBytes(sourceText);
      const snapshot = { title: parsed.route.title, originalDocumentSha256: fileHash, text: sourceText };
      const digest = hashLearningSnapshot(snapshot);
      const topic = randomUUID(), guide = randomUUID(), resource = randomUUID(), revision = randomUUID();
      for (const [id, kind, slug, title] of [[topic, 'topic', `t045-${name}-topic`, parsed.route.topicLabel], [guide, 'guide', `t045-${name}-guide`, parsed.sources[0]?.title ?? parsed.route.title]])
        await pool.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,catalog_visibility,published_at,published_by) values($1,$2,$3,$4,'Fuente de prueba T045',$5,$6,'published','catalog',$7,$6)", [id, kind, slug, title, parsed.route.topicLabel, operator, clock]);
      await pool.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [resource, guide]);
      await pool.query('insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)', [revision, resource, snapshot, digest]);
      const bindings = { topicContentId: topic, sources: parsed.sources.map((s) => ({ key: s.key, sourceContentId: guide, resourceRevisionId: revision })), assets: [] };
      const unresolved = await request('importValidate', `${editorRoot}/imports/validate`, { package: parsed, bindings, targetPathId: null, expectedVersion: null });
      out(`${name}-raw-import.json`, { generatedDir, rawPackageSha256: hashBytes(readFileSync(new URL(`${generatedDir}/ruta.koraz-route.json`, here))), fileHash, snapshotHash: digest, result: unresolved });
      assert.equal(unresolved.status, 200);
      assert.equal(unresolved.value.readyToImport, false, 'Raw file digest cannot silently equal catalogue snapshot digest');
      assert.ok(unresolved.value.issues.some((issue: any) => issue.code === 'SOURCE_CHANGED'));
      // This is an explicit editorial resolution, never a backend relaxation. The raw
      // generated package and both digests are preserved. Bind only the same supplied text.
      assert.ok(parsed.sources.every((s) => s.documentSha256 === fileHash));
      assert.ok(parsed.sources.every((s) => sourceText.includes(s.excerpt)), 'Source excerpts must occur literally in supplied guide');
      const pkg = structuredClone(parsed);
      for (const source of pkg.sources) source.documentSha256 = digest;
      out(`${name}-resolved.koraz-route.json`, pkg);
      out(`${name}-source-resolution.json`, { rawFileHash: fileHash, snapshotHash: digest, snapshot,
        changedFields: pkg.sources.map((_s, i) => `/sources/${i}/documentSha256`),
        excerptFidelity: 'Every excerpt matched literally before source hash resolution', sourceTextUnchanged: true, bindings });
      const checked = await request('importValidate', `${editorRoot}/imports/validate`, { package: pkg, bindings, targetPathId: null, expectedVersion: null });
      out(`${name}-resolved-import.json`, checked);
      assert.equal(checked.status, 200);
      assert.equal(checked.value.readyToImport, true, JSON.stringify(checked.value));
      assert.deepEqual(checked.value.issues, validateRoutePackage(pkg).issues, 'Server portable issues equal exact CLI validator after source binding');
      const persistedIssues = (await pool.query('select issues_json, jsonb_typeof(issues_json) shape from learning_v2_imports where id=$1', [checked.value.importId])).rows[0];
      assert.equal(persistedIssues.shape, 'array'); assert.deepEqual(persistedIssues.issues_json, checked.value.issues);
      out(`${name}-stored-import-issues.json`, { status: 'PASS', importId: checked.value.importId, shape: persistedIssues.shape, issues: persistedIssues.issues_json });
      const commitKey = randomUUID();
      const committed = await request('importCommit', `${editorRoot}/imports/${checked.value.importId}/commit`, { hash: checked.value.hash, expectedVersion: null }, 'editor', commitKey);
      assert.equal(committed.status, 200);
      assert.deepEqual(await request('importCommit', `${editorRoot}/imports/${checked.value.importId}/commit`, { hash: checked.value.hash, expectedVersion: null }, 'editor', commitKey), committed);
      let route = (await request('editorGet', `${editorRoot}/${committed.value.pathId}`)).value.route;
      const exported = (await request('editorExport', `${editorRoot}/${route.pathId}/export`)).value.package;
      assert.deepEqual(exported, pkg);
      const again = await request('importValidate', `${editorRoot}/imports/validate`, { package: exported, bindings, targetPathId: route.pathId, expectedVersion: route.editVersion });
      assert.equal(again.value.readyToImport, true);
      const reimported = await request('importCommit', `${editorRoot}/imports/${again.value.importId}/commit`, { hash: again.value.hash, expectedVersion: route.editVersion });
      assert.equal(reimported.status, 200);
      assert.equal(hashRoutePackage((await request('editorExport', `${editorRoot}/${reimported.value.pathId}/export`)).value.package), hashRoutePackage(pkg));
      route = (await request('editorGet', `${editorRoot}/${route.pathId}`)).value.route;
      const learnerCountBefore = (await pool.query('select count(*)::int n from learning_enrollments')).rows[0].n;
      const preview = await request('editorPreview', `${editorRoot}/${route.pathId}/preview`, { package: pkg, bindings });
      assert.equal(preview.status, 200); assert.ok(preview.value.activeActivity);
      assert.equal((await pool.query('select count(*)::int n from learning_enrollments')).rows[0].n, learnerCountBefore);
      out(`${name}-editor-preview.json`, { status: 'PASS', result: preview, createsLearnerEnrollment: false });
      if (portable.publishable) {
        route = (await request('editorTransition', `${editorRoot}/${route.pathId}/transition`, { status: 'in_review', expectedVersion: route.editVersion, reviewNote: 'Revisión técnica del paquete generado T045, sin atribución de aprobación clínica.' })).value.route;
        const reviewPath = new URL('pilot-human-review.json', here);
        const humanReview = name === 'pilot' && existsSync(reviewPath) ? read('pilot-human-review.json') : null;
        if (name === 'synthetic' || (humanReview?.contentHash === hashRoutePackage(pkg) && humanReview?.approved === true)) {
          for (const status of ['approved', 'published']) {
            const transitioned = await request('editorTransition', `${editorRoot}/${route.pathId}/transition`, { status, expectedVersion: route.editVersion,
              reviewNote: name === 'synthetic' ? 'Revisión técnica de reglas de un fixture ficticio no médico T045.' : humanReview.statement });
            assert.equal(transitioned.status, 200, JSON.stringify(transitioned)); route = transitioned.value.route;
          }
        }
      } else {
        const validation = await request('editorValidate', `${editorRoot}/${route.pathId}/validate`, { expectedVersion: route.editVersion });
        assert.equal(validation.value.ready, false);
        const blocked = await request('editorTransition', `${editorRoot}/${route.pathId}/transition`, { status: 'in_review', expectedVersion: route.editVersion, reviewNote: 'Prueba de borrador incompleto T045.' });
        assert.equal(blocked.status, 422);
        const publicPath = await request('publicPath', `/v2/guided-learning/paths/${pkg.route.slug}`, undefined, 'student-3');
        assert.equal(publicPath.status, 404);
        out(`${name}-publication-blocked.json`, { validation, transition: blocked, publicPath });
      }
      fixtures[name] = { pathId: route.pathId, pathVersionId: route.pathVersionId, status: route.status, slug: pkg.route.slug,
        package: pkg, contentHash: hashRoutePackage(pkg), rawContentHash: hashRoutePackage(parsed),
        generatedDir, rawPortable: portable, roundtrip: true, importReplay: true, cliServerIssuesAgree: true };
      out(`${name}-server-fixture.json`, { ...fixtures[name], database: isolated.name });
    }
    const rejectionChecks: any[] = [];
    for (const [name, packageValue] of [['unknown-major', { ...fixtures.synthetic.package, schemaVersion: '3.0' }], ['corrupt-package', '{invalid-json']]) {
      const response = await request('importValidate', `${editorRoot}/imports/validate`, { package: packageValue, bindings: { topicContentId: randomUUID(), sources: [], assets: [] }, targetPathId: null, expectedVersion: null });
      assert.equal(response.status, 400); assert.equal(response.value.error, 'invalid_request');
      rejectionChecks.push({ name, ...response });
    }
    out('server-schema-rejections.json', { status: 'PASS', checks: rejectionChecks });
    out('server-transcript.json', transcript);
    out('test-environment.json', { database: isolated.name, port: 41035, node: process.version,
      independentPostgres: true, syntheticIdentityProvider: true, realBetterAuth: false, productionTouched: false });
    const close = async () => { await app.close(); await isolated.close(); out('database-cleanup.json', { status: 'PASS', removedDatabase: isolated.name, closed: true }); };
    return { get app() { return app; }, db, pool, fixtures, close, request,
      async restart() { await app.close(); await open(); }, setClock(value: Date) { clockOffsetMs = value.getTime() - Date.now(); } };
  } catch (error) {
    out('server-initialization-failure.json', { error: String(error), stack: (error as Error).stack, transcript });
    await app?.close(); await isolated.close(); throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await createT045Server();
  await server.app.listen({ host: '127.0.0.1', port: 41035 });
  console.log('T045 disposable PostgreSQL API ready on 127.0.0.1:41035');
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => void server.close().then(() => process.exit(0)));
}
