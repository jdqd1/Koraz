import { writeFile } from 'node:fs/promises';
export default async function teardown() {
  if (process.env.KORAZ_TEST_DATABASE !== 'true') throw new Error('Disposable database marker required');
  const root = 'http://127.0.0.1:41035';
  let ready: { testOnly: boolean; database: string };
  try { ready = await (await fetch(root + '/__test/ready', { signal: AbortSignal.timeout(2000) })).json(); } catch { return; }
  if (ready.testOnly !== true || !/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(ready.database)) throw new Error('Refusing non-test shutdown');
  const response = await fetch(root + '/__test/stop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  if (!response.ok) throw new Error('Cooperative shutdown rejected');
  await new Promise(resolve => setTimeout(resolve, 1500));
  const run = process.env.T040_BROWSER_RUN ?? 'browser';
  if (!['browser', 'guided-recheck', 'security-recheck'].includes(run)) throw new Error('Unknown browser run');
  await writeFile(new URL(`${run}-cleanup.json`, import.meta.url), JSON.stringify({ database: ready.database, cooperativeShutdownRequested: true }, null, 2));
}
