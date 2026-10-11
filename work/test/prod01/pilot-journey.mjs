import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { V2HttpContracts } from '../../../packages/contracts/dist/index.js';

const root = new URL('../../../', import.meta.url);
const out = new URL('docs/aprendizaje-guiado/v2/evidencias/PROD01/', root);
const qa = JSON.parse(await readFile(new URL('.env.prod01-qa.json', root), 'utf8'));
assert.match(qa.email, /^prod01-qa-[a-f0-9]+@example\.test$/);
const fixture = JSON.parse(await readFile(new URL('../RC01/fixture-run/pilot-server-fixture.json', out), 'utf8'));
const route = JSON.parse(await readFile(new URL('pilot-route.json', out), 'utf8'));
assert.equal(route.contentHash, fixture.contentHash);
assert.equal(route.status, 'published');
const base = 'https://koraz.app';
const prefix = '/v2/guided-learning';
const transcript = [];
const save = (name, data) => writeFile(new URL(name, out), JSON.stringify(data, null, 2) + '\n');
async function request(name, path, body, key = randomUUID()) {
  const contract = V2HttpContracts[name];
  if (body) contract.body.parse(body);
  const response = await fetch(base + '/api' + path, {
    method: contract.method,
    headers: { cookie: qa.cookie, origin: base,
      ...(body ? { 'content-type': 'application/json', 'idempotency-key': key } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000),
  });
  const value = await response.json();
  transcript.push({ name, path, status: response.status, key: body ? key : null,
    ...(response.status !== 200 ? { error: value.error } : {}) });
  await save('pilot-journey-transcript.json', transcript);
  assert.equal(response.status, 200, `${name}: ${JSON.stringify(value.error)}`);
  return contract.response.parse(value);
}
function answer(activity) {
  switch (activity.kind) {
    case 'study': return { kind: activity.kind, acknowledged: true };
    case 'single_choice': return { kind: activity.kind, optionKey: activity.payload.correctKey };
    case 'short_answer': return { kind: activity.kind, text: activity.payload.acceptedAnswers[0] };
    case 'match': return { kind: activity.kind, pairs: activity.payload.correctByPrompt };
    case 'sequence': return { kind: activity.kind, orderedKeys: activity.payload.acceptedOrders[0] };
    case 'constructed_response': return { kind: activity.kind, text: activity.payload.modelAnswer, selfRating: null };
    default: throw new Error('Unsupported approved activity');
  }
}
function stable(value) {
  const copy = structuredClone(value);
  if (copy.state?.maintenance) delete copy.state.maintenance.generatedAt;
  return copy;
}
let path = (await request('publicPath', `${prefix}/paths/${route.slug}`)).path;
if (!path.enrollmentId) {
  const body = { pathId: route.pathId }, key = randomUUID();
  const first = await request('enrollmentCreate', `${prefix}/enrollments`, body, key);
  assert.deepEqual(await request('enrollmentCreate', `${prefix}/enrollments`, body, key), first);
}
path = (await request('publicPath', `${prefix}/paths/${route.slug}`)).path;
const enrollmentId = path.enrollmentId;
assert(enrollmentId);
const state = async () => (await request('enrollmentState', `${prefix}/enrollments/${enrollmentId}/state`)).state;
const attempts = [];
let replayVerified = false;
for (let count = 0; count < 60; count++) {
  const s = await state();
  if (s.masteredAt || s.nextAction.kind === 'none') break;
  let attempt;
  if (s.nextAction.kind === 'resume') {
    attempt = (await request('attemptGet', `${prefix}/attempts/${s.nextAction.key}`)).attempt;
  } else {
    const action = s.nextAction;
    const target = { kind: ['gate', 'retention'].includes(action.kind) ? 'assessment' : action.kind === 'review' ? 'review' : 'activity', key: action.key };
    attempt = (await request('attemptCreate', `${prefix}/attempts`, {
      clientAttemptId: randomUUID(), enrollmentId, target, expectedEnrollmentVersion: s.rowVersion,
    })).attempt;
  }
  const attemptId = attempt.attemptId;
  for (let guard = 0; guard < 50 && attempt.activeActivity; guard++) {
    const publicJson = JSON.stringify(attempt.activeActivity);
    for (const key of ['correctKey', 'acceptedAnswers', 'correctByPrompt', 'acceptedOrders', 'modelAnswer', 'rubric']) {
      assert(!publicJson.includes(`"${key}"`));
    }
    const activity = fixture.package.activities.find(a => a.key === attempt.activeActivity.key);
    assert(activity);
    let body = { activityKey: activity.key, answer: answer(activity), confidence: null, expectedVersion: attempt.rowVersion };
    const key = randomUUID();
    let result = await request('attemptResponse', `${prefix}/attempts/${attemptId}/responses`, body, key);
    if (activity.kind === 'constructed_response') {
      assert.equal(result.accepted, false);
      const help = await request('attemptHelp', `${prefix}/attempts/${attemptId}/help`, {
        activityKey: activity.key, kind: 'reveal', expectedVersion: result.attempt.rowVersion,
      });
      body = { ...body, answer: { ...body.answer, selfRating: 'good' }, expectedVersion: help.attempt.rowVersion };
      result = await request('attemptResponse', `${prefix}/attempts/${attemptId}/responses`, body);
    } else if (!replayVerified) {
      assert.deepEqual(stable(await request('attemptResponse', `${prefix}/attempts/${attemptId}/responses`, body, key)), stable(result));
      replayVerified = true;
    }
    assert.equal(result.accepted, true);
    attempt = result.attempt;
    assert.equal(attempt.acceptedResponses.filter(r => r.activityKey === activity.key).length, 1);
    assert.deepEqual((await request('attemptGet', `${prefix}/attempts/${attemptId}`)).attempt, attempt);
  }
  assert.equal(attempt.activeActivity, null);
  const completed = await request('attemptComplete', `${prefix}/attempts/${attemptId}/complete`, { expectedVersion: attempt.rowVersion });
  assert.equal(completed.attempt.status, 'completed');
  attempts.push({ attemptId, status: completed.attempt.status, responses: completed.attempt.acceptedResponses.length });
  console.log(`Saved production pilot session ${attempts.length}`);
}
const final = await state();
assert(attempts.length > 0 || final.masteredAt);
assert(replayVerified || final.masteredAt);
await save('pilot-journey.json', {
  status: 'PASS', scope: 'Production Vercel BFF → Render API → existing Supabase, real Better Auth',
  qaUserId: qa.id, enrollmentId, contentHash: route.contentHash, attempts, replayVerified,
  masteredAt: final.masteredAt, nextAction: final.nextAction, exhaustedBanks: final.maintenance.exhaustedBanks,
  limitation: 'Only presently eligible work. No production clock override and no claim of unelapsed retention.',
});
await save('pilot-state-before-final-restart.json', final);
console.log(`PASS: ${attempts.length} saved production sessions; mastery=${Boolean(final.masteredAt)}`);
