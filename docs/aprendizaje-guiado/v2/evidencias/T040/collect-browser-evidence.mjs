import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('./', import.meta.url));
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const files = [];
function walk(path) { for (const item of readdirSync(path, { withFileTypes:true })) {
 const full=resolve(path,item.name); if(item.isDirectory()) walk(full); else files.push(full);
} }
for (const name of ['browser-artifacts','legacy-browser-artifacts','recheck-browser-artifacts','security-recheck-browser-artifacts','legacy-recheck-browser-artifacts','large-editor-browser-artifacts','legacy-policy-browser-artifacts','large-editor-final-browser-artifacts','legacy-production-browser-artifacts','large-editor-recheck-browser-artifacts','large-editor-confirmed-browser-artifacts']) {
 if(existsSync(resolve(here,name))) walk(resolve(here,name));
}
const axes=[], geometry=[], manifests=[];
const embedded = [];
function inspect(suite, report) {
 for(const spec of suite.specs ?? []) for(const test of spec.tests ?? []) for(const run of test.results ?? []) for(const a of run.attachments ?? []) {
  if(a.contentType==='application/json' && a.body && (/^axe-/.test(a.name) || a.name==='public-surfaces.json')) {
   try { embedded.push({file:`${report}#${test.projectName}/${a.name}`, value:JSON.parse(Buffer.from(a.body,'base64').toString('utf8'))}); } catch {}
  }
 }
 for(const child of suite.suites ?? []) inspect(child,report);
}
for(const report of ['playwright.json','playwright-legacy.json','playwright-security-recheck.json']) {
 if(existsSync(resolve(here,report))) for(const suite of json(resolve(here,report)).suites) inspect(suite,report);
}
for(const {file,value:r} of embedded) {
 if(Array.isArray(r.violations)) axes.push({file,violations:r.violations.map(v=>({id:v.id,impact:v.impact})),seriousCritical:r.violations.filter(v=>['serious','critical'].includes(v.impact)).length});
 if(Array.isArray(r.snapshots)) for(const s of r.snapshots) manifests.push({file,key:s.key,bytes:Buffer.byteLength(JSON.stringify(s.manifest),'utf8')});
}
for(const path of files.filter(p=>/(?:-axe|-geometry)\.json$/.test(p))) {
 let r; try { r=json(path); } catch { continue; }
 if(Array.isArray(r.violations) && r.testEngine?.name === 'axe-core') axes.push({file:relative(here,path), violations:r.violations.map(v=>({id:v.id,impact:v.impact})), seriousCritical:r.violations.filter(v=>['serious','critical'].includes(v.impact)).length});
 if(path.endsWith('-geometry.json')) geometry.push({file:relative(here,path),width:r.viewport?.width,pageWidth:r.pageWidth,overflow:r.pageWidth>r.viewport?.width+1});
 if(Array.isArray(r.snapshots)) for(const s of r.snapshots) manifests.push({file:relative(here,path),key:s.key,bytes:Buffer.byteLength(JSON.stringify(s.manifest),'utf8')});
}
const seriousCritical=axes.reduce((sum,r)=>sum+r.seriousCritical,0), overflows=geometry.filter(r=>r.overflow).length;
const largeEditors=files.filter(p=>p.includes('large-editor-confirmed-browser-artifacts') && p.endsWith('large-editor.json')).map(path=>({file:relative(here,path),...json(path)}));
writeFileSync(resolve(here,'accessibility-summary.json'),JSON.stringify({status:axes.length && seriousCritical===0 && overflows===0 ? 'PASS LOCAL' : 'FAIL',
 axeReports:axes.length,seriousCritical,geometries:geometry.length,overflows,screenshots:files.filter(p=>p.endsWith('.png')).length,
 axes,geometry,largeEditors,spokenScreenReader:'NO VERIFICADO',physicalDevices:'NO VERIFICADO',fullWcagCertification:false},null,2));
writeFileSync(resolve(here,'manifest-summary.json'),JSON.stringify({status:manifests.length && manifests.every(m=>m.bytes<=102400)?'PASS':'NO VERIFICADO',
 limitBytes:102400,maximumBytes:Math.max(0,...manifests.map(m=>m.bytes)),manifests},null,2));
console.log(JSON.stringify({axeReports:axes.length,seriousCritical,geometries:geometry.length,overflows,manifests:manifests.length}));
