import assert from 'node:assert/strict';
import { connect } from 'node:net';
import { writeFileSync } from 'node:fs';
const ports = [55435, 31041, 41041, 41042];
const probes = await Promise.all(ports.map(port => new Promise(resolve => {
  const socket = connect({ host: '127.0.0.1', port });
  socket.setTimeout(2000);
  socket.once('connect', () => { socket.destroy(); resolve({ port, listening: true }); });
  socket.once('error', error => { socket.destroy(); resolve({ port, listening: false, code: error.code }); });
  socket.once('timeout', () => { socket.destroy(); resolve({ port, listening: null, code: 'TIMEOUT' }); });
})));
assert.ok(probes.every(p => p.listening === false && p.code === 'ECONNREFUSED'));
writeFileSync(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T041/services-final.json', import.meta.url), JSON.stringify({ status: 'PASS', at: new Date().toISOString(), probes }, null, 2));
console.log('All four T041 ports closed');
