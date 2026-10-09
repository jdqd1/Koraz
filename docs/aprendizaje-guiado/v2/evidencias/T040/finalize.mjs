import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here=fileURLToPath(new URL('./',import.meta.url)), root=resolve(here,'../../../../..');
process.chdir(root);
const read=name=>JSON.parse(readFileSync(resolve(here,name),'utf8'));
const save=(name,value)=>writeFileSync(resolve(here,name),JSON.stringify(value,null,2));
const counts=read('counts-and-omissions.json'), performance=read('regression-final-load.json');
const baseline=read('baseline.json'), preservation=read('preservation.json'), cleanup=read('database-cleanup-verification.json'), services=read('services-final.json');
const checks=readdirSync(here).filter(n=>n.endsWith('-exit.json')).map(read).sort((a,b)=>a.startedUtc.localeCompare(b.startedUtc));
const api=counts['api-effective'], web=counts['web-test'], guided=counts['guided-v2-effective'], legacy=counts['legacy-effective'];
const relevantStatic=['contracts-build','build','typecheck','lint','api-typecheck-final','api-lint-final','web-typecheck-final','web-lint-final'];
const staticPass=relevantStatic.every(id=>checks.some(c=>c.id===id && c.result==='PASS'));
const knownLegacy=legacy.failures.every(c=>/mantiene material fijado|contenido heredado conserva/.test(c.title)) && read('baseline-compatibility.json').compared.every(c=>c.unchangedSinceT001);
const newRegressions=api.failed+web.failed+guided.failed+(knownLegacy?0:legacy.failed);
const large=counts['large-editor-effective'];
const technicalPass=newRegressions===0 && staticPass && performance.status==='PASS' && large?.stats.unexpected===0 && large?.stats.expected===2;
const status=technicalPass && legacy.failed===0 ? 'PASS LOCAL' : technicalPass ? 'PARCIAL LOCAL' : 'FAIL LOCAL';
const finalSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const headMovement={baseSha:baseline.baseSha,finalSha,changedDuringExecution:baseline.baseSha!==finalSha,
 finalCommitSubject:execFileSync('git',['log','-1','--format=%s'],{encoding:'utf8'}).trim(),commitCreatedByT040:false,
 contentComparison:'preservation.json compares the 6668 initial filesystem contents regardless of concurrent commits; only the eight authorized paths changed.',
 includesIntermediateT040Work:true};
save('head-movement.json',headMovement);
const issues=[
 ...(legacy.failed ? [{code:'PREEXISTING_LEGACY_VIDEO_TESTS',status:'FAIL PREEXISTENTE',count:legacy.failed,evidence:'baseline-compatibility.json',proposal:'REPARACION-LEGADO-PROPUESTA.md',approval:'PENDIENTE; no aplicada'}] : []),
 {code:'SCREEN_READER',status:'NO VERIFICADO',detail:'Árbol de accesibilidad y axe verificados; salida hablada no inspeccionada.'},
 {code:'M04_BACKUP_RESTORE',status:'NO VERIFICADO EN T040',owner:'T041',detail:'Se conserva el límite del plan: T041 ensaya restauración en una segunda DB; no iniciada.'},
];
const matrix={
 'P01-P15':{status:'PASS LOCAL',evidence:['api-test.json','api-images-final.json'],scope:'Contratos, DAG, grading, evidencia, diagnóstico, agenda, selección, reservas; suites ejecutadas, no eficacia clínica.'},
 'I01-I04':{status:'PASS LOCAL',evidence:['api-test.json'],scope:'Importación/exportación, recibos, conflictos e idempotencia; PostgreSQL independiente habilitado para carreras.'},
 'S01-S08':{status:'PASS LOCAL',evidence:['api-test.json','playwright.json','playwright-security-recheck.json'],scope:'API/BFF/SSR/DOM/RSC y grants; identidad sintética, no emisión real de cookies Better Auth.'},
 M01:{status:'PASS LOCAL ACOTADO',evidence:['../M01/result.json','api-test.json','preservation.json'],scope:'Instalación vacía de la dependencia y pruebas actuales; SQL anterior preservado. Restauración histórica no reensayada.'},
 'M02-M03':{status:'PASS LOCAL',evidence:['api-test.json'],scope:'Inmutabilidad, aprobaciones, conversión y adopción explícita.'},
 M04:{status:'PARCIAL',flagOff:'PASS LOCAL en suites API',backupRestore:'NO VERIFICADO; T041 no iniciada'},
 'E01-E06':{status:guided.failed===0?'PASS LOCAL':'FAIL',evidence:['playwright.json','playwright-guided-recheck.json'],scope:'Resultados finales por caso; seis omisiones explícitas, ninguna contabilizada como PASS.'},
 'V01-V03/V05':{status:read('accessibility-summary.json').status,evidence:['accessibility-summary.json','playwright.json','playwright-large-editor-confirmed.json'],scope:'Axe, teclado, geometría, zoom, alternativa visual y editor grande; dispositivos emulados.'},
 V04:{accessibilityTree:'PASS LOCAL',spokenScreenReader:'NO VERIFICADO'},
 'L01-L02':{status:performance.status,evidence:['regression-final-validator.json','regression-final-load.json'],scope:'20 corridas por escala; 20 usuarios/300 segundos, pool20, umbrales originales.'},
 L03:{status:large?.stats.unexpected===0 && large?.stats.expected===2?'PASS LOCAL':'FAIL',evidence:['manifest-summary.json','large-editor-fixture-check.json','playwright-large-editor.json','playwright-large-editor-final.json','playwright-large-editor-recheck.json','playwright-large-editor-confirmed.json'],scope:'Manifiesto activo ≤100KiB; 1600 resúmenes y como máximo un formulario, edición cerrada conservada y guardado real.'},
};
const result={taskId:'T040',status,recordedUtc:new Date().toISOString(),clientDate:'2026-10-08',timezone:'America/Caracas',
 scope:'Regresión local de Koraz v2 y compatibilidad v1; sin aceptación de sistema ni despliegue.',
 baseSha:baseline.baseSha,finalSha,workingTree:'Cambios previos preservados por hashes. HEAD avanzó e incluyó trabajo intermedio; ningún commit fue creado por T040. El dossier incluye también cambios aún sin confirmar.',headMovement,
 regressionStatus:technicalPass?'PASS LOCAL SIN REGRESIONES NUEVAS DETECTADAS':'FAIL LOCAL',acceptanceComplete:false,
 changedFiles:preservation.changed.map(c=>c.path),evidenceDirectory:'docs/aprendizaje-guiado/v2/evidencias/T040/',
 summary:{api:{passed:api.passed,failed:api.failed,skipped:api.skipped,files:api.files},web:{passed:web.passed,failed:web.failed,files:web.files},
 guidedV2:{passed:guided.passed,failed:guided.failed,skipped:guided.skipped},legacy:{passed:legacy.passed,failed:legacy.failed,skipped:legacy.skipped},
 largeEditor:large?.stats,newRegressionsDetected:newRegressions,performance:{stateP95Ms:performance.latencyMs.state.p95,responseP95Ms:performance.latencyMs.response.p95,failures:performance.failures.length,consistencyErrors:performance.consistencyErrors.length}},
 checks,matrix,issues,preservation,cleanup,services,
 history:{allOriginalFailuresRetained:true,counting:'Reemplazo por archivo en Vitest y por archivo/título/proyecto en Playwright; nunca suma de repeticiones.',
 initialApiFailure:'Dos deep-equality afectados solo por generatedAt; reloj controlado conserva assertions y nuevo test verifica refresco temporal sin duplicar respuesta/evento.',
 newTestFailure:'Primer test adicional usó versión de matrícula obsoleta al crear por HTTP; corregida preparación con el servicio real, conservando POST/retry por HTTP y asserts de un efecto.',
 initialPerformanceFailure:'ENOENT del input source-hashes antes de medir; se aportó hash actual y se ejecutó la carga completa.',
 browserFixes:'Selectores acotados a regiones accesibles; cardinalidad exacta del mapa según publicación real; ningún umbral relajado.',
 securityTimeout:'Repetición móvil sin cambio pasó; causa transitoria no demostrada, primer fallo conservado.',
 legacyHarness:'Proveedor v2 y esquema actuales inyectados al harness v1; catálogo real vacío 200, sin stub ni ocultar 503.',
 legacyDevTiming:'Se conserva recheck dev fallido; persistencia repetida sobre el Next de producción ya construido, mismo presupuesto por caso.',
 duplicateServerConfig:'Primer intento de producción abortó antes de ejecutar tests: defineConfig concatenó webServer e intentó iniciar dos API en 4100; corregido con una única configuración que sobrescribe el array.',
 largeEditorFixture:'Primer intento L03 detectó que el fixture T035 large tenía una unidad. Se conservó la assertion de 30 unidades y se aportó el fixture exacto de la carga actual (hash idéntico), con bindings de la DB actual.',
 largeEditorModule:'El siguiente intento abortó al cargar import.meta en un spec TS compilado como CommonJS fuera de apps/web. Se corrigió la resolución local del archivo con __dirname; sin cambiar assertions.',
 largeEditorConfirmation:'En móvil se recargó tras las cabeceras HTTP, antes de confirmar y limpiar recovery en el cliente. El test ahora exige Borrador al día y ausencia de la copia local antes de recargar, además de input habilitado y sin banner al volver. No descarta recovery ni modifica producto.'},
 notVerified:['Salida hablada de lector de pantalla','Restauración de backup en T041','Emisión/firma real de Better Auth','Dispositivos físicos','Certificación WCAG integral','Hito S/aceptación T042','Staging y producción'],
 deploymentPerformed:false,commitCreated:false,dependenciesInstalled:false,nextTaskStarted:false,nextTaskIds:legacy.failed?['T040']:['T041'],nominalNextTask:'T041'};
if(preservation.status!=='PASS'||cleanup.status!=='PASS'||services.status!=='PASS') throw new Error('Preservation/cleanup/services must pass before closure');
save('result.json',result);
const failureRows=legacy.failures.map(c=>`- ${c.project}: ${c.title}`).join('\n');
writeFileSync(resolve(here,'README.md'),`# T040 — regresión funcional y compatibilidad\n\n**Estado: ${status}.** Regresión técnica verificada: ${result.regressionStatus}. La aceptación integral no se acredita: lector de pantalla hablado no inspeccionado y restauración de backup reservada a T041. T041 no se inició.\n\nSHA base: \`${result.baseSha}\`. SHA final: \`${result.finalSha}\`. HEAD avanzó durante la ejecución e incluyó parte del trabajo intermedio. T040 no creó ese commit; el dossier también registra cambios aún sin confirmar. La preservación compara contenido, independientemente del movimiento de Git. No hubo despliegue.\n\n| Comprobación | Resultado final |\n|---|---|\n| Contratos, build completo, typecheck, lint | ${staticPass?'PASS':'FAIL'} |\n| API, 60 archivos | ${api.passed} PASS, ${api.failed} FAIL, ${api.skipped} omitidos |\n| Web, ${web.files} archivos | ${web.passed} PASS, ${web.failed} FAIL |\n| E2E guided-v2, escritorio/móvil | ${guided.passed} PASS, ${guided.failed} FAIL, ${guided.skipped} omitidos |\n| Legacy mapa/editor | ${legacy.passed} PASS, ${legacy.failed} FAIL, ${legacy.skipped} omitido |\n| Editor 200 objetivos/1600 actividades | ${large?.stats.expected} PASS, ${large?.stats.unexpected} FAIL |\n| L01/L02 | ${performance.status}; p95 estado ${performance.latencyMs.state.p95.toFixed(2)} ms, respuesta ${performance.latencyMs.response.p95.toFixed(2)} ms |\n\nLos conteos finales combinan una pasada global con repeticiones de los archivos/casos afectados; no suman ejecuciones duplicadas. Los logs iniciales FAIL se conservan en \`*-exit.json\`, \`api-test.json\`, \`playwright.json\` y \`playwright-legacy.json\`. Las omisiones y cada resultado individual figuran en [counts-and-omissions.json](counts-and-omissions.json).\n\n## Compatibilidad heredada\n\n${legacy.failed?`Persisten ${legacy.failed} fallos preexistentes. Los dos tests, los campos del fixture y el código relevante coinciden con T001 (CRLF/LF normalizado), anterior al desarrollo v2. Exigen mostrar videos que la política del commit 1f9f434 ocultó antes de T001. No se modificó esa política ni se convirtió FAIL en PASS. Véanse [comparación](baseline-compatibility.json) y [propuesta pendiente](REPARACION-LEGADO-PROPUESTA.md).\n\n${failureRows}`:'Las repeticiones afectadas pasan; los fallos iniciales permanecen en sus reportes originales.'}\n\nEl harness antiguo carecía de proveedor v2: la consulta complementaria del mapa retornaba 503. Se inyectaron el esquema y proveedor reales, con v2 apagada. La consulta real pasa a catálogo vacío 200. El primer recheck dev registra además esperas de compilación; la persistencia final utiliza el Next ya construido y conserva 45 s por caso y 10 s por expectation. No se cambiaron criterios, timeouts ni retries.\n\n## Reparaciones y pruebas\n\n- Reloj controlado solo en el harness de imágenes: conserva las comparaciones completas de recibos. Un caso adicional avanza un segundo y exige recomendación actualizada con una sola respuesta y un solo evento.\n- Selectores de recorridos limitados a su región accesible y cardinalidad exacta del mapa calculada desde publicación real. No se sustituyeron por asserts permisivos.\n- Script de carga permite evidencia T040 además de T038; escenario y umbrales originales intactos. Carga real PostgreSQL/HTTP: 20 usuarios, 300 s, pool20; ${performance.totalRequests} peticiones, cero errores técnicos/consistencia.\n- Editor grande: cero formularios iniciales y máximo uno abierto; edición conservada al cerrar, guardar y recargar por BFF real; foco de error y anchos 320/360/390/768/1024/1440.\n\nLa API inicial tuvo 590 PASS/2 FAIL/3 omitidos y la web 482 PASS. Tras reparar solo tests/harness, se reejecutaron sus suites afectadas. T001 registró API 230 PASS/1 timeout (repetición focal PASS) y web 236 PASS; ese timeout no reapareció. Auth, roles, catálogo, contenidos, rutas y storage legacy están incluidos en la API global actual. PostgreSQL opt-in habilitó las suites independientes T015/T018/T022/T036; las tres omisiones API son explícitas, no éxitos. La emisión real de cookies Better Auth sigue fuera de la evidencia sintética.\n\n## Evidencia y límites\n\n[Resultado estructurado](result.json), [conteos y omisiones](counts-and-omissions.json), [accesibilidad](accessibility-summary.json), [manifiestos](manifest-summary.json), [carga](regression-final-load.json), [preservación](preservation.json), [limpieza SQL](database-cleanup-verification.json), [servicios detenidos](services-final.json).\n\nLa matriz P/I/S/M/E/V/L detallada está en \`result.json\`. M04-restauración corresponde al ensayo T041 y no se ejecutó anticipadamente. V04 acredita árbol de accesibilidad, sin salida hablada. No se acredita eficacia educativa, certificación WCAG, Hito S, staging o producción.\n\nSe conservaron las bases preexistentes por nombre y OID, se eliminaron únicamente las tres bases legacy creadas por T040 y los harness cerraron sus DB temporales. Los clusters iniciados por T040 se detuvieron; los directorios se conservaron. El lockfile, SQL aplicado y archivos ajenos mantienen sus hashes iniciales.\n`);
const readmePath=resolve(here,'README.md');
writeFileSync(readmePath,readFileSync(readmePath,'utf8').replace('## Evidencia y límites',
 'El navegador legacy usa Fastify y SQL PGlite; no acredita locks de PostgreSQL. Los E2E v2 y la carga usan PostgreSQL desechable real, y las suites API independientes quedan identificadas por separado. T040 modificó siete archivos de tests/harness y solo su entrada del registro; no modificó código de producción.\n\n## Evidencia y límites'));
console.log(`${status}; new regressions=${newRegressions}; legacy=${legacy.failed}`);

