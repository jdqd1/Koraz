// Record the human report and its contradictory persisted journey without upgrading Q19.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const dir='docs/aprendizaje-guiado/v2/evidencias/T042/';
const load=path=>JSON.parse(readFileSync(root+path,'utf8'));
const save=(path,value)=>writeFileSync(root+path,JSON.stringify(value,null,2)+'\n');
const at=new Date().toISOString();
for(const [source,target] of [['result.json','result-before-human-reader.json'],['README.md','README-before-human-reader.md'],['closure-verification.json','closure-before-human-reader.json']]){
  if(!existsSync(root+dir+target))copyFileSync(root+dir+source,root+dir+target);
}
for(const [source,target] of [['docs/aprendizaje-guiado/v2/acta-HITO-S.md','acta-before-human-reader.md'],['docs/aprendizaje-guiado/v2/registro-ejecucion.json','registry-before-human-reader.json']]){
  if(!existsSync(root+dir+target))copyFileSync(root+source,root+dir+target);
}
const journey=load(dir+'reader-manual/persisted-manual-journey.json');
assert.equal(journey.tables.learning_v2_attempts.length,1);
assert.equal(journey.tables.learning_v2_attempts[0].status,'in_progress');
assert.equal(journey.tables.learning_v2_attempts[0].snapshot_json.target.key,'study-1');
assert.equal(journey.tables.learning_v2_responses.length,0);
const cleanup=load(dir+'reader-manual/cluster-cleanup.json');
assert.equal(cleanup.preexistingPreserved,true);
const observations={taskId:'T042',check:'Q19/V04',recordedUtc:at,clientDate:'2026-10-10',timezone:'America/Caracas',status:'NO VERIFICADO',source:'Human user in this chat, personally operating Windows Narrator and Edge; no agent desktop automation',routeUrl:'http://127.0.0.1:31035/aprendizaje/rutas/t035-small',reader:'Windows Narrator',browser:'Microsoft Edge',installedFileVersions:{edge:'154.0.4258.62',narrator:'10.0.26100.8972',source:'Executable metadata inspected; exact running-reader version not separately demonstrated'},speechReported:true,agentHeardSpeech:false,recordingAvailable:false,
  steps:[
    {id:'V04-1',status:'PASS',prompt:'Navigate with Tab to Comenzar, hear its name and role, activate with Enter',userMessage:'cuando hago TAB has ta el boton de comenzar me dice el narrador "comenzar, botón", luego hago enter y se me pone esta pantalla',literalSpeech:'comenzar, botón',corroboration:'Human-provided Edge screenshot shows the enrolled route, Continuar and separate states'},
    {id:'V04-2',status:'PASS',prompt:'Read Recorrido en curso, Dominio por comprobar and Consolidación pendiente; activate Continuar',userMessage:'si, todo',evidenceKind:'Explicit confirmation of the requested states; not a verbatim transcript'},
    {id:'V04-3',status:'NO VERIFICADO',humanReportedResult:'PASS',prompt:'Read study content, activate Continuar a la práctica, finalize and hear Sesión completada',userMessage:'si puede',reason:'Persisted attempt is still study-1 in_progress, with no response or submitted_at'},
    {id:'V04-4',status:'NO VERIFICADO',humanReportedResult:'PASS',prompt:'Write in Explica con tus palabras, save, compare model, self-assess and finalize',userMessage:'si',reason:'No constructed-response attempt or response was persisted in this manual database'},
    {id:'V04-5',status:'NO VERIFICADO',humanReportedResult:'PASS',prompt:'Read hint, choose Respuesta B, hear feedback and explanation, finalize, return and read remediation after reload; report any keyboard trap',userMessage:'funciona',reason:'No single-choice response or later attempt was persisted; feedback/remediation cannot be reconciled with this session'}
  ],
  clarification:{source:'Subsequent direct answer to the discrepancy question',question:'La base solo conserva la primera lectura abierta y cero respuestas. Durante la prueba, ¿llegaste a activar «Guardar mi respuesta» y «Comprobar respuesta» y a ver sus resultados, o confirmaste que Narrator leía los controles?',answer:'Activé ambos y vi sus resultados',interpretation:'User explicitly reports activating both controls and seeing results; no inference that they only read controls. Persisted data still differ; cause unverified.'},
  discrepancy:{status:'OPEN',persistedAttempts:1,persistedResponses:0,target:'study-1',attemptStatus:'in_progress',evidence:dir+'reader-manual/persisted-manual-journey.json',conclusion:'Initial name/role and route states supported; user explicitly reports activating both controls and seeing results. Need to reconcile this with the persisted session; do not infer user error or fabricate Narrator speech.'},
  cleanup:{status:'PASS',evidence:dir+'reader-manual/cluster-cleanup.json',initialFailure:'ECONNREFUSED after Ctrl+C stopped PostgreSQL before the baseline query; original screenshot supplied in chat',recovery:'Restarted only marked disposable cluster without replacing baseline; saved persisted journey, attributed and removed sole temporary manual database, verified preexisting names/OIDs, stopped cluster'},
  nextTaskStarted:false};
save(dir+'reader-manual/observations.json',observations);
writeFileSync(root+dir+'reader-manual/observations.md',`# V04 — inspección humana de Narrator, 2026-10-10

**NO VERIFICADO en conjunto.** El usuario operó Narrator y Edge en la ruta local sintética. Se confirmó nombre/rol de Comenzar y lectura de estados. Las confirmaciones posteriores no coinciden con el estado persistido: una única sesión study-1 in_progress y cero respuestas. La discrepancia impide acreditar lectura de modelo, pista, feedback y refuerzo en este recorrido.

| Paso | Declaración del usuario | Evaluación |
|---|---|---|
| Comenzar con Tab y Enter | Declaró literalmente que Narrator dijo «comenzar, botón»; adjuntó pantalla de la ruta matriculada | PASS |
| Estados separados de la ruta | «si, todo» al pedir lectura de recorrido, dominio y consolidación | PASS por confirmación humana |
| Lectura y cierre | «si puede» | NO VERIFICADO: sesión sin cerrar |
| Campo y modelo | «si» | NO VERIFICADO: ninguna respuesta construida persistida |
| Pista, error, feedback, refuerzo/recarga y teclado | «funciona» | NO VERIFICADO: ninguna respuesta de elección persistida |

Las frases cortas son confirmaciones del usuario, no transcripciones literales de Narrator. El agente no escuchó ni grabó el audio. No se reconstruye voz a partir del DOM. Las capturas fueron aportadas en el chat; no se inventan archivos locales de imagen.

Al preguntar por la discrepancia, el usuario aclaró expresamente: «Activé ambos y vi sus resultados», en referencia a Guardar mi respuesta y Comprobar respuesta. Se conserva esa declaración; no se concluye que solo leyera los controles ni se atribuye un error al usuario. La causa de la diferencia con los datos no está verificada.

[Observaciones estructuradas](observations.json), [estado persistido antes de limpiar](persisted-manual-journey.json), [primera comparación de bases](cleanup-first-comparison.json), [limpieza final](cluster-cleanup.json).

Ctrl+C detuvo PostgreSQL y dejó la base temporal sin eliminar; el posterior stop devolvió ECONNREFUSED. Se conservó el baseline original, se reinició únicamente el cluster marcado, se atribuyó la única base nueva al alumno sintético student-30 y cuatro rutas T035 creadas durante el arranque, y se eliminó esa base sin conexiones activas. Las bases preexistentes mantienen nombres/OIDs; cluster detenido y directorio preservado. La limpieza PASS no convierte V04 en PASS.

Siguiente comprobación: abrir la actividad, localizar y activar realmente Continuar a la práctica, comprobar el cierre en pantalla y su lectura. Recorrer después campo/modelo y elección/feedback con evidencia de la pantalla alcanzada y voz escuchada.
`);
const result=load(dir+'result.json');
assert.equal(result.summary.passLocal,23);assert.equal(result.contract.frozen,false);
result.at=at;
result.manualReaderSetup='Executed by the human user; partial speech inspection recorded; later confirmations contradicted by persisted state';
result.manualReaderEvidence=dir+'reader-manual/observations.json';
result.manualReaderCleanup=dir+'reader-manual/cluster-cleanup.json';
result.narratorClose='No Narrator process found at current cleanup inspection';
result.checks=result.checks.filter(c=>c.command!=='Human Windows Narrator inspection');
result.checks.push({command:'Human Windows Narrator inspection',result:'NO VERIFICADO: initial name/role and route states confirmed; later journey not persisted',evidence:result.manualReaderEvidence});
const issue=result.issues.find(i=>i.code==='R42-02_ACCESSIBILITY_AND_MOBILE');
issue.detail='Mobile E01–E07 and desktop E02/E07 PASS. Human Narrator name/role and route states confirmed. Later human confirmations conflict with the persisted manual journey (study-1 in_progress, zero responses); model, hint and feedback require reconciliation.';
result.limits=result.limits.filter(l=>l!=='No real screen-reader product speech observed');
result.limits.push('Real screen-reader inspection reported by the human; initial name/role and states confirmed, later feedback/model inspection unresolved');
for(const path of ['work/test/t042/reader-cleanup.mjs','work/test/t042/record-reader-review.mjs'])if(!result.changedFiles.includes(path))result.changedFiles.push(path);
save(dir+'result.json',result);
const registryPath='docs/aprendizaje-guiado/v2/registro-ejecucion.json';
const registry=load(registryPath),task=registry.tasks.find(t=>t.taskId==='T042');
Object.assign(task,{recordedUtc:at,checks:result.checks,issues:result.issues,changedFiles:result.changedFiles,manualReaderEvidence:result.manualReaderEvidence,manualReaderCleanup:result.manualReaderCleanup,scope:'Reparaciones autorizadas verificadas; inspección humana inicial de Narrator documentada. Q19 pendiente por discrepancia entre confirmaciones y estado persistido.'});
save(registryPath,registry);
const actaPath='docs/aprendizaje-guiado/v2/acta-HITO-S.md';
let acta=readFileSync(root+dir+'acta-before-human-reader.md','utf8');
acta=acta.replace(/^\| Q19 \|.*$/m,'| Q19 | **NO VERIFICADO** | [T037](evidencias/T037/README.md) conserva teclado/zoom/axe/árbol. [Móvil E01–E07](evidencias/T042/mobile.json): 7 PASS, cero omisiones. [Escritorio E02/E07](evidencias/T042/desktop.json): 2 PASS. [Inspección humana de Narrator](evidencias/T042/reader-manual/observations.md): nombre/rol de Comenzar y estados confirmados; las confirmaciones de modelo/pista/feedback contradicen el [estado persistido](evidencias/T042/reader-manual/persisted-manual-journey.json), solo study-1 abierto y cero respuestas. No se acredita V04 completo. |');
acta+=`\n## Revisión humana posterior — ${at}\n\nEl entorno manual sí se ejecutó. Se conservan los intentos de automatización bloqueados como historia; la prueba actual proviene del usuario. [Informe humano](evidencias/T042/reader-manual/observations.md): Comenzar y estados PASS; cierre/modelo/feedback NO VERIFICADO por discrepancia con la persistencia. Q19 permanece pendiente, accepted:false/frozen:false y T043 bloqueada. No se inventan frases del lector a partir de sus confirmaciones.\n\n[Limpieza manual](evidencias/T042/reader-manual/cluster-cleanup.json): se recuperó del ECONNREFUSED sin reemplazar el baseline; base sintética temporal atribuida y eliminada, nombres/OIDs previos intactos. Se guarda la sesión antes de eliminarla. El resultado anterior queda en [acta previa a esta inspección](evidencias/T042/acta-before-human-reader.md). Los párrafos sobre lector no ejecutado describen la revisión anterior, conservada; este apartado documenta el estado actual.\n`;
writeFileSync(root+actaPath,acta);
let readme=readFileSync(root+dir+'README-before-human-reader.md','utf8');
readme+='\n## Inspección humana posterior (2026-10-10)\n\nEl script manual sí se ejecutó. [Observaciones](reader-manual/observations.md): nombre/rol y estados confirmados por el usuario; posteriores confirmaciones no se corroboran con el [recorrido persistido](reader-manual/persisted-manual-journey.json), que conserva solo study-1 abierto y cero respuestas. Q19 sigue NO VERIFICADO; no se congela contrato ni se inicia T043.\n\n[Limpieza recuperada](reader-manual/cluster-cleanup.json): baseline intacto, base temporal eliminada tras atribución, PostgreSQL detenido. La invocación inicial de pnpm.cmd no estaba en PATH; usar la ruta completa del procedimiento actualizado. Los registros anteriores y las pruebas automáticas se conservan.\n';
writeFileSync(root+dir+'README.md',readme);
let manual=readFileSync(root+dir+'reader-manual.md','utf8');
if(!manual.includes('Actualización 2026-10-10:'))manual=manual.replace('# V04 pendiente: inspección real de Narrator','# V04 pendiente: inspección real de Narrator\n\nActualización 2026-10-10: el usuario ejecutó este entorno. [Informe humano](reader-manual/observations.md) y [persistencia](reader-manual/persisted-manual-journey.json): nombre/rol y estados confirmados; cierre, modelo y feedback pendientes por discrepancia. La limpieza está [verificada](reader-manual/cluster-cleanup.json). El texto inicial siguiente conserva el contexto de preparación.');
manual=manual.replace('pnpm.cmd --filter @cediah/api exec tsx ../../work/test/t042/reader-session.mts',"& 'C:\\Users\\josed\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\bin\\fallback\\pnpm.cmd' --filter @cediah/api exec tsx ../../work/test/t042/reader-session.mts");
writeFileSync(root+dir+'reader-manual.md',manual);
console.log('Recorded partial human reader evidence and contradictory persisted journey; Q19 remains NO VERIFICADO.');
