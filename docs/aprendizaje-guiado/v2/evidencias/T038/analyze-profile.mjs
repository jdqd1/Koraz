import { readFile, writeFile } from 'node:fs/promises';
const tag = process.argv[2];
if (!/^[a-z0-9-]+$/.test(tag ?? '')) throw new Error('Expected a T038 evidence tag');
const profile = JSON.parse(await readFile(new URL(`${tag}-load-cpu-profile.json`, import.meta.url), 'utf8'));
const nodes = new Map(profile.nodes.map(node => [node.id, node]));
const parents = new Map();
for (const node of nodes.values()) for (const child of node.children ?? []) parents.set(child, node.id);
const totals = { self: new Map(), inclusive: new Map() };
function add(map, frame, ms) {
  const key = JSON.stringify(frame);
  const row = map.get(key) ?? { ...frame, ms: 0 };
  row.ms += ms;
  map.set(key, row);
}
for (let i = 0; i < profile.samples.length; i++) {
  let id = profile.samples[i];
  const ms = profile.timeDeltas[i] / 1000;
  add(totals.self, nodes.get(id).callFrame, ms);
  const seen = new Set();
  while (id) {
    const frame = nodes.get(id).callFrame;
    const key = JSON.stringify(frame);
    if (!seen.has(key)) { add(totals.inclusive, frame, ms); seen.add(key); }
    id = parents.get(id);
  }
}
const sorted = map => [...map.values()].sort((a,b) => b.ms-a.ms);
const result = { scope: 'Diagnostic CPU samples; inclusive times overlap and must not be summed',
  self: sorted(totals.self).slice(0,40),
  inclusiveProduct: sorted(totals.inclusive).filter(row => row.url.includes('/apps/api/src/')).slice(0,40) };
await writeFile(new URL(`${tag}-cpu-analysis.json`, import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
