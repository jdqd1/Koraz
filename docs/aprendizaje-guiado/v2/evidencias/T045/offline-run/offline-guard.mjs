// Test-only guard. The exported validator itself remains byte-identical to T042.
import { registerHooks } from 'node:module';
const deniedModules = new Set(['net', 'http', 'https', 'http2', 'tls', 'dns', 'dns/promises', 'dgram', 'undici']);
const reject = (operation) => {
  const error = new Error(`Network disabled in T043 offline test: ${operation}`);
  error.code = 'ERR_KORAZ_OFFLINE';
  throw error;
};
registerHooks({ resolve(specifier, context, nextResolve) {
  if (deniedModules.has(specifier.replace(/^node:/, ''))) reject(specifier);
  return nextResolve(specifier, context);
} });
const getBuiltin = process.getBuiltinModule;
Object.defineProperty(process, 'getBuiltinModule', { value(id) {
  if (deniedModules.has(id.replace(/^node:/, ''))) reject(id);
  return getBuiltin(id);
}, writable: false, configurable: false });
for (const api of ['fetch', 'WebSocket', 'EventSource']) {
  Object.defineProperty(globalThis, api, { value: function () { reject(api); }, writable: false, configurable: false });
}
