import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { guidedV2Fixture } from '../../../../../apps/api/test/helpers/guided-v2-fixtures.ts';
import { rebuildGuidedV2Evidence as beforeEvidence } from './before-evidence.mts';
import { selectGuidedV2NextAction as beforeSelection } from './before-selection.mts';
import { rebuildGuidedV2Evidence as afterEvidence } from '../../../../../apps/api/src/guided-learning/v2/evidence.ts';
import { selectGuidedV2NextAction as afterSelection } from '../../../../../apps/api/src/guided-learning/v2/selection.ts';

let seed=38107;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const pick=values=>values[Math.floor(random()*values.length)];
const epoch=Date.parse('2026-08-01T12:00:00Z');
const results=[];
for(let run=0;run<72;run++) {
  const definition=guidedV2Fixture(run<64?[1,3,12][run%3]:200);
  if(run%2===0) {
    const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}};
    freeze(definition);
  }
  const events=[];
  for(let index=0;index<100;index++) {
    const activity=pick(definition.activities);
    const at=new Date(epoch+Math.floor(index/2)*86400000).toISOString();
    const base={id:`event-${String(index).padStart(4,'0')}`,semanticKey:`fact-${index}`,at};
    const kind=pick(['response','response','response','interaction','reveal','dispense','final']);
    let event;
    if(kind==='final') event={...base,kind,assessmentKey:'final',attemptId:`attempt-${index}`,valid:random()>.1,
      answers:definition.objectives.map(item=>({objectiveKey:item.key,score01:pick([0,1,null]),gradingSource:pick(['server','self','none']),assisted:random()<.1}))};
    else if(kind==='response') event={...base,kind,attemptId:`attempt-${Math.floor(index/2)}`,activityKey:activity.key,
      objectiveKey:activity.objectiveKey,equivalenceKey:activity.equivalenceKey,phase:activity.phase,modality:activity.representation,
      purpose:pick(['learning','diagnostic','gate','final','retention7','retention30','review','preview']),
      gradingSource:activity.kind==='study'?'none':pick(['server','server','self','none']),score01:pick([0,1,1,.75,null]),
      responseKey:pick(['yes','no',null]),assisted:random()<.1,valid:random()>.1};
    else event={...base,kind,activityKey:activity.key,...(kind==='interaction'?{assisted:random()<.1}:kind==='dispense'?{reason:pick(['test','  '])}:{})};
    events.push(event);
    if(index%17===0) events.push({...event,id:`duplicate-${index}`});
  }
  // Reverse input tests canonical chronological replay and same-time tie order.
  events.reverse();
  const options={dueObjectiveKeys:definition.objectives.filter(()=>random()<.2).map(item=>item.key)};
  const started=performance.now();
  const expected=beforeEvidence(definition,events,options);
  const beforeMs=performance.now()-started;
  const next=performance.now();
  const actual=afterEvidence(definition,events,options);
  const afterMs=performance.now()-next;
  assert.deepEqual(actual,expected,`evidence run ${run}`);
  const snapshot={definition,evidence:actual,events,sessionAttemptIds:events.filter(item=>item.kind==='response').map(item=>item.attemptId),
    selectedObjectiveKey:pick(definition.objectives).key,diagnosticStatus:pick(['pending','omitted','completed']),
    completedActivityKeys:definition.activities.filter(()=>random()<.3).map(item=>item.key),dispensedActivityKeys:[],
    completedAssessmentKeys:definition.assessments.filter(()=>random()<.3).map(item=>item.key),
    openAttempts:run%5===0?[{key:'open',openedAt:new Date(epoch).toISOString()}]:[],
    retentionDue:definition.assessments.filter(item=>item.kind.startsWith('retention')).map(item=>({key:item.key,dueAt:new Date(epoch).toISOString()})),
    reviewDue:definition.objectives.filter(()=>random()<.2).map(item=>({key:`review-${item.key}`,objectiveKey:item.key,dueAt:new Date(epoch).toISOString()}))};
  assert.deepEqual(afterSelection(snapshot,'2026-10-01T12:00:00Z'),beforeSelection(snapshot,'2026-10-01T12:00:00Z'),`selection run ${run}`);
  results.push({run,objectives:definition.objectives.length,activities:definition.activities.length,events:events.length,beforeMs,afterMs});
}
await writeFile(new URL('./differential.json',import.meta.url),JSON.stringify({status:'PASS',seed:38107,cases:results.length,
  comparison:'deepStrictEqual against frozen pre-authorization implementations; same-time events, deduplication, all event kinds, retention dates, assistance, invalid responses, critical errors, branch selection, due reviews',results},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',cases:results.length,large:results.filter(item=>item.objectives===200)}));
