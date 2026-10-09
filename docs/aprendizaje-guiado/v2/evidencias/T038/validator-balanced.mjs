import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { performance } from 'node:perf_hooks';
import { RoutePackageSchema, validateRoutePackage } from '../../../../../packages/contracts/dist/index.js';
import { guidedV2Fixture } from '../../../../../apps/api/test/helpers/guided-v2-fixtures.ts';
const directory=new URL('./',import.meta.url);
const source=await readFile(new URL('../../../../../apps/api/test/performance/guided-v2-load.mjs',directory),'utf8');
const expression=source.slice(source.indexOf('export function performanceFixture('),source.indexOf('\nasync function benchmark()')).replace('export function','function');
assert.ok(expression.startsWith('function performanceFixture('));
const fixture=runInNewContext(`(${expression})`,{guidedV2Fixture,RoutePackageSchema,structuredClone});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fixtures=[50,100,200].map(count=>fixture(count));
const tag=process.env.T038_CLOSURE_TAG ?? 'hotpath-indexed-final';
assert.match(tag,/^[a-z0-9-]+$/);
const load=JSON.parse(await readFile(new URL(`${tag}-load.json`,directory),'utf8'));
assert.equal(digest(fixtures[2]),load.fixture.sha256);
for(const pkg of fixtures) for(let warm=0;warm<5;warm++) assert.equal(validateRoutePackage(pkg).publishable,true);
const rows=fixtures.map(pkg=>({objectives:pkg.objectives.length,activities:pkg.activities.length,units:pkg.units.length,sha256:digest(pkg),runs:[]}));
for(let run=0;run<20;run++) for(let position=0;position<3;position++) {
  const index=(run+position)%3;
  const cpu=process.cpuUsage(),start=performance.now();
  const result=validateRoutePackage(fixtures[index]);
  const wallMs=performance.now()-start,consumed=process.cpuUsage(cpu);
  assert.equal(result.publishable,true);
  rows[index].runs.push({run:run+1,position,wallMs,cpuMs:(consumed.user+consumed.system)/1000,issues:result.issues.length});
}
const summarize=values=>{const ordered=[...values].sort((a,b)=>a-b);const at=fraction=>ordered[Math.ceil(ordered.length*fraction)-1];return {count:ordered.length,p50:at(.5),p95:at(.95),max:at(1)};};
for(const row of rows){row.wall=summarize(row.runs.map(item=>item.wallMs));row.cpu=summarize(row.runs.map(item=>item.cpuMs));}
const growth={doubling100to200:rows[2].wall.p50/rows[1].wall.p50,quadrupling50to200:rows[2].wall.p50/rows[0].wall.p50};
const report={status:rows[2].cpu.max<2000?'PASS_CPU':'FAIL_CPU',method:'Five warmups per scale; 20 measured runs per scale; rotating scale order; no samples excluded; exact same full fixture SHA256 as HTTP load',scales:rows,growth,at:new Date().toISOString()};
await writeFile(new URL('validator-balanced.json',directory),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,growth,scales:rows.map(({runs,...row})=>row)}));
assert.ok(rows[2].cpu.max<2000);
