import assert from 'node:assert/strict';
import { readFile,readdir,writeFile } from 'node:fs/promises';
const directory=new URL('./',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,directory),'utf8'));
const [load,old,validator,ordered,components,preservation,sources,payload,cleanup,services,differential,integrity,authorization,initial]=await Promise.all([
  read('authorized-final-load.json'),read('optimized-load.json'),read('validator-balanced.json'),read('authorized-final-validator.json'),
  read('component-results.json'),read('preservation.json'),read('source-hashes.json'),read('payload-summary.json'),
  read('database-cleanup-verification.json'),read('services-cleanup.json'),read('differential.json'),read('reference-integrity.json'),read('authorization.json'),read('initial-result.json')]);
assert.equal(load.fixture.sha256,old.fixture.sha256);
assert.equal(load.smoke,false);assert.equal(load.seconds,300);assert.equal(load.users,20);
assert.equal(load.totalRequests,1724);assert.equal(load.failures.length,0);assert.equal(load.consistencyErrors.length,0);
assert.ok(load.consistency.every(row=>row.responses===row.expectedResponses&&row.uniqueActivities===row.responses&&row.correct&&row.unassisted));
assert.equal(differential.status,'PASS');assert.equal(integrity.status,'PASS');
assert.equal(preservation.status,'PASS');assert.equal(cleanup.status,'PASS');assert.equal(services.status,'PASS');
for(const source of sources.filter(row=>row.path.startsWith('apps/web/'))) assert.equal(source.sha256,initial.productFiles.find(row=>row.path===source.path).sha256);
for(const name of ['create','response','complete']) assert.equal((await read(`authorized-operation-sql-operation-${name}.json`)).definitions,1);
const counts={broad:{passed:146,skipped:29,files:7},securityPostgres:{passed:30,skipped:7,files:1},latestDistinctUnion:{passed:168,skipped:7,total:175}};
assert.match(await readFile(new URL('authorized-regression-closure.txt',directory),'utf8'),/146 passed \| 29 skipped/);
assert.match(await readFile(new URL('authorized-security-postgres.txt',directory),'utf8'),/30 passed \| 7 skipped/);
const prefix='docs/aprendizaje-guiado/v2/evidencias/T038/';
const evidenceFiles=[...new Set([...(await readdir(directory)),'result.json'])].sort().map(file=>prefix+file);
const checks=[
  {result:'PASS',detail:'146 PASS / 29 inherited skips, seven affected suites serially',evidence:'authorized-regression-closure.txt'},
  {result:'PASS',detail:'30 PASS / 7 skips; restricted PostgreSQL security enabled; Next browser flag disabled',evidence:'authorized-security-postgres.txt'},
  {result:'PASS',detail:'72 exact differential histories against SHA256-verified prior implementations',evidence:['differential.json','reference-integrity.json']},
  {result:'PASS',detail:'Two new regressions: unaffected historical timestamps and revocation between transactions',evidence:'authorized-new-cases.txt'},
  {result:'PASS',detail:'One definition read per create/respond/complete HTTP operation',evidence:['authorized-operation-sql-operation-create.json','authorized-operation-sql-operation-response.json','authorized-operation-sql-operation-complete.json']},
  {result:'PASS',detail:'API final-tree typecheck',evidence:'authorized-typecheck-final-tree.txt'},
  {result:'PASS',detail:'All ten changed product files accounted for; 751 baseline files checked',evidence:['preservation.json','source-hashes.json']},
  {result:'PASS',detail:'API changed-file ESLint',evidence:'authorized-lint-final.txt'},
  {result:'FAIL',detail:'300s real HTTP/PostgreSQL; both original p95 limits exceeded',evidence:['authorized-final-load.json','authorized-final.txt']},
  {result:'PASS',detail:'Balanced validator measurement: 20 runs per scale after five warmups, no samples excluded',evidence:'validator-balanced.json'},
  {result:'PASS',detail:'Exact disposable database names absent; no other client connections',evidence:'database-cleanup-verification.json'},
  {result:'PASS',detail:'Owned disposable PostgreSQL stopped; test ports free',evidence:['authorized-postgres-stop.txt','services-cleanup.json']},
  {result:'PASS',detail:'git diff --check',evidence:'authorized-diff-check.txt'},
  {result:'PASS',detail:'Prior contracts build, web build/types/lint, 98 editor cases and isolated actual React browser evidence; four UI source hashes unchanged during this extension',evidence:['contracts-build.txt','web-build.txt','web-typecheck-closure.txt','web-lint-closure.txt','visual-regression-final.txt','component-results.json','initial-result.json']},
];
const result={taskId:'T038',status:'FAIL',closedAt:new Date().toISOString(),timezone:'America/Caracas',
  scope:'LOCAL synthetic fixtures; actual HTTP/Fastify; independent disposable PostgreSQL, including restricted runtime security; isolated actual React component',
  baseSha:initial.baseSha,request:'continua con t038',authorization:{...authorization,extensionsImplemented:true,nextProposal:'AMPLIACION-CACHE-PROPUESTA.md',nextProposalAuthorized:false,nextProposalImplemented:false},
  predecessors:initial.predecessors,productFiles:sources,changedFiles:[...sources.map(row=>row.path),...evidenceFiles],
  acceptance:{
    L01:{status:'PASS',...load.fixture,runs:20,cpuMaxMs:validator.scales.at(-1).cpu.max,wallP50Ms:validator.scales.at(-1).wall.p50,growth:validator.growth,
      orderedMeasurement:{cpuMaxMs:ordered.scales.at(-1).cpu.max,growth:ordered.growth},
      interpretation:'All full-fixture CPU runs below 2s; balanced repeat shows subquadratic observed scaling. Ordered-run variation retained; this is not an asymptotic complexity proof.',evidence:['validator-balanced.json','authorized-final-validator.json']},
    L02:{status:'FAIL',users:20,admissionSeconds:300,elapsedMs:load.elapsedMs,drainMs:load.elapsedMs-300000,totalRequests:load.totalRequests,
      newResponses:load.consistency.reduce((sum,row)=>sum+row.responses,0),idempotentReplays:load.latencyMs.replay.count,technicalErrors:0,technicalErrorRate:0,consistencyErrors:0,
      latencyMs:load.latencyMs,limits:{stateP95MsStrictlyBelow:500,responseP95MsStrictlyBelow:1000,technicalErrorRateStrictlyBelow:.01},
      sameFixtureSha256AsPriorRun:true,improvementPercent:{stateP95:100*(1-load.latencyMs.state.p95/old.latencyMs.state.p95),responseP95:100*(1-load.latencyMs.response.p95/old.latencyMs.response.p95)},
      samplesExcluded:0,hardwareSoleCauseEstablished:false,evidence:'authorized-final-load.json',productionCapacityVerified:false},
    L03:{status:'PASS',scope:'HTTP manifests and isolated production React component; full Next/BFF/shell not verified',payload,components:components.results,
      uiEvidenceSourceUnchangedDuringExtension:true,evidence:['payload-summary.json','component-results.json']},
  },counts,checks,preservation,cleanup,services,differential:{status:differential.status,cases:differential.cases,referenceIntegrity:integrity.status},
  history:{previousClosure:'initial-result.json',earlierApiTimeout:'authorized-api-regression.txt',serialRecheck:'authorized-routes-recheck.txt',initialDifferentialModuleFormatError:'differential.txt',initialCleanupReceiptKindError:'authorized-cleanup-verification.txt'},
  issues:[{code:'L02_LATENCY',status:'FAIL',detail:'Measured state p95 1985.32ms and response p95 4889.25ms exceed unchanged limits.',proposal:'AMPLIACION-CACHE-PROPUESTA.md'},
    {code:'UI_SERVER_AUTO_REVIEW_REJECTED',status:'NO VERIFICADO',detail:'Automatic review rejected local Next start with generic blocked by policy. Full Next/BFF/shell was not run.',evidence:'browser-server-rejected.json'}],
  notVerified:initial.notVerified,deploymentPerformed:false,commitCreated:false,dependenciesInstalled:false,dependenciesUpgraded:false,
  nextTaskStarted:false,nextTaskIds:[],nominalNextTask:'T039',blockedConsumer:'T040 requires accepted T038'};
await writeFile(new URL('result.json',directory),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({taskId:result.taskId,status:result.status,acceptance:Object.fromEntries(Object.entries(result.acceptance).map(([key,value])=>[key,value.status])),counts,productFiles:sources.length,nextTaskStarted:false}));
