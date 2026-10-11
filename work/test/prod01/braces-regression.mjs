import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const webRequire = createRequire(new URL('../../../apps/web/package.json', import.meta.url));
const nextRequire = createRequire(webRequire.resolve('eslint-config-next'));
const pluginRequire = createRequire(nextRequire.resolve('@next/eslint-plugin-next'));
const globRequire = createRequire(pluginRequire.resolve('fast-glob'));
const matchRequire = createRequire(globRequire.resolve('micromatch'));
const braces = matchRequire('braces');

assert.deepEqual(braces.expand('src/{api,web}/file.{js,ts}'), [
  'src/api/file.js', 'src/api/file.ts', 'src/web/file.js', 'src/web/file.ts',
]);
assert.equal(braces.compile('src/{api,web}'), 'src/(api|web)');
assert.equal(braces.stringify(braces.parse('a/{b,{c,d}}')), 'a/{b,{c,d}}');
for (const input of [
  '{'.repeat(4000) + 'x' + '}'.repeat(4000),
  '('.repeat(4000) + 'x' + ')'.repeat(4000),
  '{'.repeat(4000),
]) {
  for (const method of ['parse', 'compile', 'expand', 'stringify']) {
    assert.throws(() => braces[method](input), {
      name: 'SyntaxError', message: /nesting exceeds the safe limit/,
    });
  }
}
let ast = { type: 'text', value: 'x' };
for (let n = 0; n < 10000; n++) ast = { type: 'root', nodes: [ast] };
for (const method of ['compile', 'expand', 'stringify']) {
  assert.throws(() => braces[method](ast), {
    name: 'SyntaxError', message: /nesting exceeds the safe limit/,
  });
}
console.log('PASS: ordinary globs, 12 hostile patterns and 3 hostile ASTs');
