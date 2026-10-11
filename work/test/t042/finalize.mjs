import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const evidence='docs/aprendizaje-guiado/v2/evidencias/T042/';
const read=path=>readFileSync(root+path,'utf8').replace(/^\uFEFF/,'');
const json=path=>JSON.parse(read(path));
const sha=path=>createHash('sha256').update(readFileSync(root+path)).digest('hex');
const write=(path,value)=>writeFileSync(root+path,value);
const save=(name,value)=>write(evidence+name,JSON.stringify(value,null,2)+'\n');
const old=json(evidence+'registry-before-repair.json').tasks.find(t=>t.taskId==='T042');
const registry=json('docs/aprendizaje-guiado/v2/registro-ejecucion.json');
const task=registry.tasks.find(t=>t.taskId==='T042');
assert.equal(json(evidence+'validator-tests.json').numPassedTests,23);
assert.equal(json(evidence+'validator-tests.json').numFailedTests,0);
assert.equal(json(evidence+'auth-api.json').success,true);
for(const [name,count] of [['mobile',7],['desktop',2],['auth-bff',1]]){
  const stats=json(evidence+name+'.json').stats;assert.equal(stats.expected,count);assert.equal(stats.unexpected,0);assert.equal(stats.skipped,0);
}
function specs(suites){return suites.flatMap(suite=>[...(suite.specs??[]),...specs(suite.suites??[])]);}
const journeys={};
for(const name of ['mobile','desktop']){
  const spec=specs(json(evidence+name+'.json').suites).find(spec=>spec.title.startsWith('E07'));
  const attachment=spec.tests[0].results[0].attachments.find(item=>item.name==='complete-published-journey.json');
  const journey=JSON.parse(Buffer.from(attachment.body,'base64').toString('utf8'));
  assert.ok(journey.sessions.some(s=>s.purpose==='assessment'&&s.status==='completed'&&s.acceptedKeys.includes('final-1')));
  assert.ok(journey.sessions.some(s=>s.acceptedKeys.includes('diagnostic-1')));
  assert.ok(journey.sessions.some(s=>s.acceptedKeys.includes('retention7-1')));
  assert.equal(typeof journey.completed.masteredAt,'string');
  assert.equal(journey.after.maintenance.agenda[0].retention7.elapsedDays,7);
  journeys[name]=journey;
}
save('complete-published-journeys.json',journeys);
assert.equal(json(evidence+'cluster-cleanup.json').preexistingPreserved,true);
assert.equal(json(evidence+'services-cleanup.json').testServicesStopped,true);
assert.equal(json(evidence+'reader-status.json').productSpeechObserved,false);
assert.equal(sha('docs/aprendizaje-guiado/v2/piloto/vascularizacion-abdomen.koraz-route.json'),'a548d133de45686de4766a2d980a672cc7fe827a7a651cc9935761d62c0e4b75');
const previousActa=read(evidence+'acta-before-repair.md');
const hashes=[...previousActa.matchAll(/\| `([^`]+)` \| `([a-f0-9]{64})` \|/g)].map(m=>({path:m[1],sha256:sha(m[1])}));assert.equal(hashes.length,14);
const at=new Date().toISOString();
const checks=[
  {command:'pnpm --filter @cediah/contracts build; bundle:route',exitCode:0,result:'PASS',evidence:evidence+'bundle-build.txt'},
  {command:'vitest guided-v2-package / graph / validation --maxWorkers=1',exitCode:0,result:'23 PASS / 0 FAIL / 0 skipped',evidence:evidence+'validator-tests.json'},
  {command:'vitest guided-v2-real-auth --maxWorkers=1 (marked PostgreSQL)',exitCode:0,result:'1 PASS',evidence:evidence+'auth-api.json'},
  {command:'playwright real Better Auth / Next BFF',exitCode:0,result:'1 PASS / 0 skipped',evidence:evidence+'auth-bff.json'},
  {command:'playwright mobile E01–E07',exitCode:0,result:'7 PASS / 0 skipped',evidence:evidence+'mobile.json'},
  {command:'playwright desktop E02/E07',exitCode:0,result:'2 PASS / 0 skipped',evidence:evidence+'desktop.json'},
  {command:'API and web typecheck; focused API and web ESLint --max-warnings=0',exitCode:0,result:'PASS',evidence:evidence+'README.md'},
  {command:'Native Narrator inspection',result:'NO VERIFICADO: Computer Use stopped before product speech observation',evidence:evidence+'reader-status.json'},
  {command:'Disposable cluster DB names/OIDs and test ports cleanup',exitCode:0,result:'PASS',evidence:evidence+'cluster-cleanup.json'},
];
const issues=[
  {code:'R42-01_BUNDLE_STALE',status:'RESUELTO',blockingSystemAcceptance:false,detail:'Bundle regenerated; backend, ordinary CLI and autonomous bundle agree on approved pilot and four negative mutations.'},
  {code:'R42-02_ACCESSIBILITY_AND_MOBILE',status:'NO VERIFICADO',blockingSystemAcceptance:true,detail:'Mobile E01–E07 and desktop E02/E07 PASS. Real Narrator speech inspection remains pending because Computer Use could not verify the browser URL; no alternative Windows automation retry.'},
  {code:'R42-03_REAL_SESSION_EXPIRY',status:'RESUELTO',blockingSystemAcceptance:false,detail:'Actual Better Auth signed session accepted/replayed before expiry; actual persisted expiry rejects exact replay by API and Next BFF with 401 and unchanged learning-table fingerprints.'},
];
const workFiles=readdirSync(root+'work/test/t042').map(name=>'work/test/t042/'+name);
const changedFiles=['packages/contracts/bin/validate-learning-route.bundle.mjs','apps/api/test/guided-v2-package.test.ts','apps/api/test/guided-v2-real-auth.test.ts','apps/web/tests/e2e/guided-v2-journeys.spec.ts',...workFiles,evidence,'docs/aprendizaje-guiado/v2/acta-HITO-S.md','docs/aprendizaje-guiado/v2/registro-ejecucion.json'];
const result={taskId:'T042',status:'NO VERIFICADO',decision:'reject',systemAcceptance:false,at,baseSha:old.baseSha,
  authorization:evidence+'repair-authorization.json',summary:{passLocal:23,fail:0,notVerified:1},checks,issues,changedFiles,
  contract:{...old.contract,bundleSha256:sha('packages/contracts/bin/validate-learning-route.bundle.mjs'),accepted:false,frozen:false,hashesEvidence:evidence+'candidate-hashes.json'},
  humanEditorialApprovalPreserved:true,runtimeSourceChanged:false,dependenciesChanged:false,productionTouched:false,deployed:false,committed:false,nextTaskStarted:false,
  manualReaderSetup:'Prepared and syntax-checked only; not executed',narratorClose:'Initial close attempt denied; process no longer running at closure',
  initialFailuresPreserved:[evidence+'mobile-initial.json',evidence+'mobile-initial-artifacts/',evidence+'auth-bff-initial.json',evidence+'cluster-initial-attempt.json'],
  priorReviewEvidence:evidence+'acta-before-repair.md',limits:['Local synthetic/emulated browser journey','Actual Better Auth test session; persisted TTL shortened only in disposable PostgreSQL','No production/staging, physical-device or clinical verification','No real screen-reader product speech observed'],
};
save('candidate-hashes.json',{at,accepted:false,frozen:false,hashes});save('result.json',result);
Object.assign(task,{status:result.status,decision:result.decision,scope:'Reparaciones expresamente autorizadas R42-01/R42-02/R42-03; bundle, móvil y autenticación comprobados. Aceptación pendiente de lector real.',recordedUtc:at,evidence:['docs/aprendizaje-guiado/v2/acta-HITO-S.md',evidence+'result.json'],changedFiles,
  checklist:old.checklist.map(check=>({...check,status:check.id==='Q19'?'NO VERIFICADO':'PASS'})),summary:result.summary,checks,issues,contract:result.contract,
  priorReview:{status:old.status,decision:old.decision,recordedUtc:old.recordedUtc,evidence:evidence+'acta-before-repair.md'},
  systemAcceptance:false,productCodeChanged:true,runtimeSourceChanged:false,productionTouched:false,successorBlocked:true,nextTaskStarted:false,nextTaskIds:[],remediationProposalIds:['R42-02'],repairAuthorization:result.authorization});
write('docs/aprendizaje-guiado/v2/registro-ejecucion.json',JSON.stringify(registry,null,2)+'\n');
const replacements={
  Q02:'PASS | [23 pruebas focalizadas](evidencias/T042/validator-tests.json): backend/CLI/bundle autónomo equivalentes sobre piloto y mutaciones de ciclo, referencia, cobertura y reserva. Bundle regenerado con tooling existente; sin cambios de reglas.',
  Q03:'PASS | [T005](evidencias/T005/result.json) y [T042](evidencias/T042/validator-tests.json): DAG, referencias y cobertura también comprobados en el bundle autónomo actualizado.',
  Q13:'PASS | [API Better Auth real](evidencias/T042/auth-api.json), [BFF Next real](evidencias/T042/auth-bff.json): cookie firmada emitida por createBetterAuthService, firma alterada rechazada, aceptación/replay antes de expirar; expiración persistida con TTL de 2 s y espera temporal, replay API/BFF 401 sin efectos. Solo entorno de prueba, sin credenciales registradas.',
  Q18:'PASS | [T036 I04](evidencias/T036/README.md), [E05 móvil](evidencias/T042/mobile.json): desconexión antes/después de commit, recarga y dos pestañas mantienen un solo efecto. No se rebajaron timeouts ni aserciones.',
  Q19:'**NO VERIFICADO** | [T037](evidencias/T037/README.md) conserva teclado/zoom/axe/árbol. [Móvil E01–E07](evidencias/T042/mobile.json): 7 PASS, cero omisiones, recorrido publicado completo y estado persistido. [Escritorio E02/E07](evidencias/T042/desktop.json): 2 PASS. [Narrator](evidencias/T042/reader-status.json): iniciado pero Computer Use bloqueó la inspección; no se observó salida real del producto. [Procedimiento manual](evidencias/T042/reader-manual.md) preparado.',
  Q23:'PASS | [T040](evidencias/T040/counts-and-omissions.json) conserva regresión/build de la aplicación. [T042](evidencias/T042/result.json) añade build de contratos, tipos API/web, lint focalizado, validador 23, API auth 1, BFF auth 1, móvil 7 y escritorio 2 PASS. Son suites separadas; no se suman a la regresión histórica ni se cuentan reruns dos veces. Fallos iniciales preservados.',
};
const rows=previousActa.split('\n').filter(line=>/^\| Q\d\d \|/.test(line)).map(line=>{
  const id=line.match(/^\| (Q\d\d) \|/)[1];return replacements[id]?`| ${id} | ${replacements[id]} |`:line;
});assert.equal(rows.length,24);
const acta=`# Acta de Hito S — T042

**Decisión actual: aceptación pendiente (NO VERIFICADO). Q01–Q24: 23 PASS locales, 0 FAIL, 1 NO VERIFICADO (Q19).** El contrato permanece sin congelar y T043 sigue bloqueada.

La revisión inicial rechazó el sistema por bundle desactualizado y evidencia ausente. Se conserva íntegra en [acta anterior](evidencias/T042/acta-before-repair.md) y [registro anterior](evidencias/T042/registry-before-repair.json). La petición posterior «puedes hacer lo que hace falta hacer?» autorizó las tres reparaciones concretas; se guardó la [autorización y alcance](evidencias/T042/repair-authorization.json). Las instrucciones del handoff se usan como especificación; no reemplazan la solicitud del usuario ni autorizan iniciar T043 o desplegar.

Base: ${old.baseSha}. Runtimes: Node 24.19.0 y pnpm 11.25.0. Revisión actual: ${at}. Se conserva el trabajo previo de T041. No cambiaron fuentes runtime de API/web, políticas, migraciones, dependencias ni contenido editorial; se regeneró el bundle y se ampliaron tests/harnesses dentro del alcance autorizado.

## Q01–Q24

PASS se limita a la evidencia local señalada. Las filas heredadas conservan su evidencia anterior, releída durante la revisión inicial; las reparaciones añaden pruebas focalizadas. No se simula un lector real a partir de axe o del árbol accesible.

| ID | Estado | Evidencia y conclusión |
|---|---|---|
${rows.join('\n')}

## Reparaciones verificadas

R42-01: el bundle se regeneró con build y bundle:route existentes. Una copia en carpeta temporal ajena al repositorio, con Node24 y sin NODE_PATH ni proxy configurado, produce exactamente el resultado del validador del backend y CLI ordinaria para piloto válido y cuatro paquetes negativos. No hay dependencias externas requeridas por esa copia; no se afirma aislamiento de red mediante firewall. Esquema y reglas permanecen idénticos. La suite focalizada tuvo 23 PASS/0 FAIL.

R42-03: sesión emitida por Better Auth existente, con su verificación real de firma y expiración, contra PostgreSQL desechable. La expiración solo modifica expires_at del usuario creado por el harness: 2 segundos de TTL y espera en la prueba BFF; expiración inmediata en la prueba API. Antes: aceptación y replay 200 idénticos. Después: 401 por API y BFF, fingerprint completo sin cambios en nueve tablas de aprendizaje/recibos. Una cookie falsificada también fue rechazada. No se probaron correo, MFA, proveedor externo o configuración productiva; no se desactivó la verificación de sesión para pasar.

R42-02: los cinco E01/E02/E03/E05/E06 móvil antes omitidos pasaron; E07 recorre la versión corregida y publicada por E02, diagnóstico, práctica, evaluación final, repaso +7 y recarga con estado idéntico. [Manifiestos de sesiones](evidencias/T042/complete-published-journeys.json) confirman diagnostic-1, final-1 y retention7-1 realmente aceptados y evaluación final cerrada. El fixture de una unidad no tiene checkpoint separado. Móvil: 7 PASS/0 omitidos. Escritorio afectado E02/E07: 2 PASS/0 omitidos. El primer E07 leyó un manifiesto antes del commit y quiso responder otra vez; se corrigió la sincronización del test para esperar un nuevo acceptedResponse. También se corrigió el nombre del campo retention7.acceptedAt según el contrato. No cambió código de aprendizaje ni se rebajó una política. El primer BFF interpretó un ISO textual como JSON; se corrigió la lectura del test. Todos los reportes iniciales y el trace móvil se conservan.

Una inspección limitada al selector sugirió incorrectamente que faltaba ofrecer el final; el adaptador HTTP ya lo ofrece en routes.ts. La ampliación solicitada fue autorizada por el usuario, pero no se utilizó: [registro](evidencias/T042/unused-scope-extension.json). Se fortaleció la prueba E07 para comprobar directamente la respuesta reservada del final, sin editar selector ni su test unitario.

La inspección real de Narrator **no pasó**: se inició el lector, pero Computer Use detuvo la inspección por no verificar con suficiente confianza la URL de Edge. No se reintentó por otra automatización de Windows ni se elevaron permisos. Se cerró Edge de prueba; el primer intento de cerrar Narrator devolvió acceso denegado, pero al cierre su proceso ya no estaba en ejecución. El [procedimiento V04](evidencias/T042/reader-manual.md) y un entorno manual están preparados; no se ejecutaron ni constituyen evidencia PASS.

## Identidad, preservación y limpieza

El piloto aprobado conserva SHA de bytes a548d133de45686de4766a2d980a672cc7fe827a7a651cc9935761d62c0e4b75 y hash canónico previamente aprobado d9f35d39a769027998be0eeb17113e89f0e637af0b353c5bd1378ee77a59cf12. No se requiere otra aprobación editorial para ese contenido intacto.

La [comparación de preservación](evidencias/T042/preservation.json) parte de 7522 archivos y registra cambios autorizados; las otras tareas y campos superiores del registro permanecen iguales, sin cambio de HEAD. [Limpieza PostgreSQL](evidencias/T042/cluster-cleanup.json): mismos nombres/OIDs de bases preexistentes, cero bases T042 restantes; cluster iniciado por T042 detenido, directorio preservado. [Puertos](evidencias/T042/services-cleanup.json): servicios de prueba cerrados. Nada de producción fue consultado o modificado.

## Hashes candidatos actuales

accepted:false, frozen:false. Se registra identidad reproducible del candidato actualizado; no hay contrato aprobado para skill. [JSON de hashes](evidencias/T042/candidate-hashes.json).

| Artefacto | SHA-256 de bytes |
|---|---|
${hashes.map(h=>'| `'+h.path+'` | `'+h.sha256+'` |').join('\n')}

## Cierre

Tipos API/web y lint focalizado: exit 0. Build de contratos/bundle: exit 0. Tests focalizados: validador 23 PASS, auth API 1 PASS, auth BFF 1 PASS, móvil 7 PASS y escritorio afectado 2 PASS; no se agregan repeticiones a los conteos históricos. La regresión de T040 y recuperación de T041 se conservan; no se repiten globalmente fuentes runtime sin cambios. [Dossier y comandos](evidencias/T042/README.md), [resultado estructurado](evidencias/T042/result.json).

Solo queda V04/Q19: inspección documentada de nombres, estados, foco y feedback con un lector real. Después se repite T042 y se recalculan hashes antes de congelar. Sin ese paso, Hito S no se acepta. No se inició T043, no hubo commit ni despliegue. No se afirma eficacia educativa, competencia clínica, certificación WCAG completa, staging, producción ni dispositivo físico.
`;
write('docs/aprendizaje-guiado/v2/acta-HITO-S.md',acta);
write(evidence+'README.md',`# T042 — reparaciones autorizadas y nueva revisión

**NO VERIFICADO: 23 PASS / 0 FAIL / 1 NO VERIFICADO (Q19).** Hito S pendiente de lector real; no se inició T043.

Bundle corregido sin cambiar reglas; equivalencia backend/CLI/bundle (23 tests). Expiración real Better Auth por API (1) y BFF Next (1). Móvil E01–E07 (7) y escritorio E02/E07 (2), cero omisiones en estas ejecuciones. Tipos API/web y ESLint focalizado exit 0. PostgreSQL 55435 desechable limpiado; bases anteriores preservadas y puertos cerrados.

Resultados: [result.json](result.json), [acta actual](../../acta-HITO-S.md), [autorización](repair-authorization.json), [preservación](preservation.json), [hashes candidatos](candidate-hashes.json).

Lector: [estado preciso](reader-status.json), [procedimiento manual preparado](reader-manual.md). Narrator se inició pero no se observó voz del producto: Computer Use bloqueó la inspección por incertidumbre sobre URL. No hubo reintento mediante otra automatización. Si el lector sigue abierto, cerrar manualmente con Narrator+Esc.

Fallos iniciales conservados: [móvil](mobile-initial.json), [BFF](auth-bff-initial.json), [arranque](cluster-initial-attempt.json); revisión anterior en acta-before-repair.md y registry-before-repair.json. Los fallos de sincronización y formato fueron corregidos en los tests; sin ampliar timeouts ni relajar aserciones.

Reproducción en raíz con PATH Node24, KORAZ_TEST_DATABASE=true y KORAZ_GUIDED_V2_TEST_DATABASE_URL=postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test. Iniciar cluster.mjs start, ejecutar serialmente los tres configs work/test/t042/playwright.{mobile,desktop,auth}.config.mts con pnpm --filter @cediah/web exec playwright test --config ../../work/test/t042/<config>. Para auth establecer T042_AUTH_RUN=true; quitarla para móvil/escritorio. Finalizar con cluster.mjs stop. No usar .env productivo. Los logs .txt conservan la salida exacta; los JSON conservan resultados y adjuntos.

Entorno manual de lector: preparado y comprobado sintácticamente, **no ejecutado**. Una inspección humana debe guardar observaciones reales; después se reevalúa T042. Los PASS locales no acreditan producción ni validación clínica.
`);
console.log('T042 updated: 23 PASS, 0 FAIL, Q19 NO VERIFICADO; no contract freeze or successor.');
