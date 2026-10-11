import { readFileSync } from 'node:fs';
export default async function teardown() {
  const ready = await (await fetch('http://127.0.0.1:41042/ready')).json() as { database: string };
  const response = await fetch('http://127.0.0.1:41042/stop', { method: 'POST' });
  if (!response.ok) throw new Error('T041 harness did not accept cleanup');
  for (let n = 0; n < 120; n++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const receipt = JSON.parse(readFileSync(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T041/database-cleanup.json', import.meta.url), 'utf8'));
      if (receipt.status === 'PASS' && receipt.removedOwnedDatabases.includes(ready.database)) return;
    } catch { /* Wait for the current run's completed database cleanup, not just a closed socket. */ }
  }
  throw new Error('T041 harness did not finish cleanup');
}
