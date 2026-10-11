import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const here=new URL('./',import.meta.url),root=new URL('../../../../../',here);
const read=n=>JSON.parse(readFileSync(new URL(n,here),'utf8').replace(/^\uFEFF/,''));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const provenance=read('inputs/pilot-provenance.json');
assert.equal(sha(readFileSync(new URL(provenance.source,root))),provenance.sourceSha256);
assert.equal(sha(readFileSync(new URL('inputs/guia-piloto.md',here))),provenance.derivedDocumentSha256);
const cases=[];
for(const name of ['synthetic','pilot','adversarial']){
 const path=[3,2].map(round=>`cases/${name}/round-${round}/output/ruta.koraz-route.json`).find(p=>existsSync(new URL(p,here)))??`cases/${name}/output/ruta.koraz-route.json`;
 const bytes=readFileSync(new URL(path,here)),p=JSON.parse(bytes),guideBytes=readFileSync(new URL(`cases/${name}/guia.md`,here)),guide=guideBytes.toString('utf8'),hash=sha(guideBytes);
 const sources=p.sources.map(s=>{
  assert.equal(s.documentSha256,hash);assert(guide.includes(s.excerpt));assert.equal(s.locator.page,null);
  return{key:s.key,excerptStartCharacter:guide.indexOf(s.excerpt),excerptLength:s.excerpt.length,hashMatched:true,excerptMatchedLiterally:true,citation:s.citation,verification:s.verification};
 });
 const sourceKeys=new Set(p.sources.map(s=>s.key));
 const activityMatrix=p.activities.map(a=>{
  assert(a.sourceKeys.length);assert(a.sourceKeys.every(k=>sourceKeys.has(k)));assert(a.feedback.sourceKeys.length);assert(a.feedback.sourceKeys.every(k=>sourceKeys.has(k)));
  return{key:a.key,objectiveKey:a.objectiveKey,kind:a.kind,use:a.use,phase:a.phase,representation:a.representation,equivalenceKey:a.equivalenceKey,sourceKeys:a.sourceKeys,feedbackSourceKeys:a.feedback.sourceKeys};
 });
 if(name!=='adversarial')for(const o of p.objectives.filter(o=>o.required))for(const use of ['retention7','retention30']){
  const reserve=p.activities.filter(a=>a.objectiveKey===o.key&&a.use===use);
  assert(reserve.some(a=>a.phase==='retrieve'&&['single_choice','short_answer','match','sequence','image_target'].includes(a.kind)),`${name}: ${o.key} lacks delayed recall in ${use}`);
 }
 assert.equal(p.assets.length,0);
 cases.push({name,path,packageFileSha256:sha(bytes),originalGuideSha256:hash,units:p.units.length,objectives:p.objectives.length,activities:p.activities.length,assessments:p.assessments.length,sources,activityMatrix,issues:p.editorial.unresolvedIssues,
  fidelityScope:'Exact supplied passages and technical curricular correspondence; no independent medical/book review or human approval of generated route'});
}
writeFileSync(new URL('content-audit.json',here),JSON.stringify({status:'PASS',pilotProvenance:provenance,cases,humanApprovalOfNewPilot:false,clinicalReview:false},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',cases:cases.map(c=>({name:c.name,activities:c.activities,sources:c.sources.length}))}));
