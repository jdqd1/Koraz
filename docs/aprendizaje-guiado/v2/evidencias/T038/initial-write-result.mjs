import {readFile,readdir,writeFile} from 'node:fs/promises';
const directory=new URL('./',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,directory),'utf8'));
const load=await read('optimized-load.json');
const validator=await read('closure-validator.json');
const components=await read('component-results.json');
const preservation=await read('preservation.json');
const sources=await read('source-hashes.json');
const payload=await read('payload-summary.json');
const cleanup=await read('database-cleanup-verification.json');
const services=await read('services-cleanup.json');
const prefix='docs/aprendizaje-guiado/v2/evidencias/T038/';
const evidenceFiles=[...new Set([...(await readdir(directory)),'result.json'])].sort().map(file=>prefix+file);
const result={
  taskId:'T038',status:'FAIL',scope:'LOCAL synthetic fixtures; real HTTP/Fastify and independent disposable PostgreSQL; isolated actual React component/CSS',
  closedAt:new Date().toISOString(),timezone:'America/Caracas',baseSha:'11737fd84562ee5a65e9ef124442b82f9aa16785',request:'continua con t038',
  authorization:{ficha:'HANDOFF-EJECUTOR.md T038; section 11 L01-L03',extensionsImplemented:false,proposedExtension:'AMPLIACION-PROPUESTA.md',proposedExtensionAuthorized:false},
  predecessors:[{task:'T035',status:'PASS',evidence:'../T035/result.json'},{task:'T037',status:'PASS',evidence:'../T037/result.json',requiredByFicha:false}],
  productFiles:sources,changedFiles:[...sources.map(row=>row.path),...evidenceFiles],
  acceptance:{
    L01:{status:'PASS',units:30,objectives:200,activities:1600,runs:20,cpuMaxMs:validator.scales.at(-1).cpu.max,wallP50Ms:validator.scales.at(-1).wall.p50,growth:validator.growth,evidence:'closure-validator.json'},
    L02:{status:'FAIL',users:20,admissionSeconds:300,elapsedMs:load.elapsedMs,totalRequests:load.totalRequests,technicalErrors:load.failures.length,technicalErrorRate:0,consistencyErrors:load.consistencyErrors.length,latencyMs:load.latencyMs,limits:{stateP95MsStrictlyBelow:500,responseP95MsStrictlyBelow:1000,technicalErrorRateStrictlyBelow:.01},evidence:'optimized-load.json',samplesExcluded:0,productionCapacityVerified:false},
    L03:{status:'PASS',scope:'HTTP manifests and isolated production React component, not Next/BFF/shell',payload,components:components.results,evidence:['payload-summary.json','component-results.json']},
  },
  checks:[
    {command:'pnpm --filter @cediah/contracts build',exitCode:0,result:'PASS',evidence:'contracts-build.txt'},
    {command:'node --import ./apps/api/node_modules/tsx/dist/loader.mjs apps/api/test/performance/guided-v2-load.mjs --profile-only',exitCode:0,result:'PASS L01 and one upsert initializes 200 version-1 objective rows',evidence:['profile-closure.txt','closure-validator.json','closure-sql-initialization.json','closure-initialization.json']},
    {command:'node --import ./apps/api/node_modules/tsx/dist/loader.mjs apps/api/test/performance/guided-v2-load.mjs',exitCode:1,result:'FAIL L02 latency; no technical or consistency errors',evidence:['optimized-load.txt','optimized-load.json']},
    {command:'pnpm --filter @cediah/api exec vitest run test/guided-v2-attempts.test.ts test/guided-v2-routes.test.ts test/guided-v2-metrics.test.ts test/guided-v2-evidence.test.ts test/guided-v2-selection.test.ts test/guided-v2-security.test.ts test/guided-v2-upgrade.test.ts --maxWorkers=1',exitCode:0,result:'144 PASS; 29 inherited skips',evidence:'api-regression.txt'},
    {command:'pnpm --filter @cediah/web exec vitest run src/components/learning/editor/v2 --maxWorkers=1 --pool=threads',exitCode:1,result:'Initial 97 PASS and 1 static rendering expectation failure; retained',evidence:'editor-regression.txt'},
    {command:'pnpm --filter @cediah/web exec vitest run src/components/learning/editor/v2/visual-forms.test.tsx --maxWorkers=1 --pool=threads',exitCode:0,result:'19 PASS; latest per-file union gives 98 distinct editor cases PASS',evidence:'visual-regression-final.txt'},
    {command:'pnpm --filter @cediah/web build',exitCode:0,result:'PASS',evidence:'web-build.txt'},
    {command:'pnpm --filter @cediah/api exec tsc --noEmit',exitCode:0,result:'PASS',evidence:'api-typecheck.txt'},
    {command:'pnpm --filter @cediah/web exec tsc --noEmit',exitCode:0,result:'PASS final source tree after exact generated next-env restoration',evidence:'web-typecheck-closure.txt'},
    {command:'pnpm --filter @cediah/api exec eslint src/providers/postgres-guided-learning-v2.ts test/performance/guided-v2-load.mjs --max-warnings=0',exitCode:0,result:'PASS',evidence:'api-lint-closure.txt'},
    {command:'pnpm --filter @cediah/web exec eslint src/components/learning/editor/v2/activity-editor.tsx src/components/learning/editor/v2/sources-fields.tsx src/components/learning/editor/v2/activity-forms.test.tsx src/components/learning/editor/v2/visual-forms.test.tsx --max-warnings=0',exitCode:0,result:'PASS',evidence:'web-lint-closure.txt'},
    {command:'node docs/aprendizaje-guiado/v2/evidencias/T038/component-check.mjs',exitCode:0,result:'PASS isolated actual component at 1440 and 390px, eight kinds, focus and HTTP persistence',evidence:['component-check-eight-kinds.txt','component-results.json']},
    {command:'verify-preservation.ps1',exitCode:0,result:'PASS',evidence:'preservation.json'},
    {command:'node docs/aprendizaje-guiado/v2/evidencias/T038/verify-cleanup.mjs',exitCode:0,result:'PASS five exact disposable databases absent',evidence:'database-cleanup-verification.json'},
    {command:'pg_ctl -D <verified disposable cluster> -m fast -w stop; check owned test ports',exitCode:0,result:'PASS',evidence:['postgres-stop.txt','services-cleanup.json']},
    {command:'git diff --check',exitCode:0,result:'PASS',evidence:'diff-check-final.txt'},
  ],
  preservation,cleanup,services,
  reactReview:{status:'PASS',scope:'Stable keys, parent draft state, functional close updates, event-driven expansion, exact focus after mount, keyed lookup, no added dependencies or effect-driven derived state'},
  issues:[
    {code:'L02_LATENCY',status:'FAIL',detail:'Measured state and response p95 exceed the original acceptance limits; no cause is attributed solely to hardware.',proposal:'AMPLIACION-PROPUESTA.md'},
    {code:'UI_SERVER_AUTO_REVIEW_REJECTED',status:'NO VERIFICADO',detail:'Automatic review rejected two local Next start attempts with generic blocked by policy; full Next/BFF/shell verification was not run.',evidence:'browser-server-rejected.json'},
  ],
  notVerified:['Next/BFF/full-shell browser verification of these changes','Native 200% zoom and full WCAG certification for these changes','Better Auth issuance/signature','Clinical/editorial pilot','Hito S/system','Staging and production'],
  deploymentPerformed:false,commitCreated:false,dependenciesInstalled:false,dependenciesUpgraded:false,nextTaskStarted:false,nextTaskIds:[],nominalNextTask:'T039',blockedConsumer:'T040 requires accepted T038',
};
await writeFile(new URL('result.json',directory),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({taskId:result.taskId,status:result.status,acceptance:Object.fromEntries(Object.entries(result.acceptance).map(([key,value])=>[key,value.status])),productFiles:sources.length,evidenceFiles:evidenceFiles.length,nextTaskStarted:false}));
