import { RoutePackageSchema, validateRoutePackage, type RoutePackage, type RouteActivity } from "@cediah/contracts";
import { hashLearningSnapshot } from "../../src/guided-learning/snapshot-hash.js";
import { createHash } from "node:crypto";

export const guidedV2FixtureId = (n: number) => `77000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
export const guidedV2GuidePayload = { projection:"guide",content:{sections:[{heading:"Fixture",body:"Contenido sintético para comprobar el software."}]} };
export const guidedV2GuideHash = hashLearningSnapshot(guidedV2GuidePayload);
export const guidedV2Image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==","base64");
export const guidedV2ImageHash = createHash("sha256").update(guidedV2Image).digest("hex");
export const guidedV2FixtureBindings = { topicContentId:guidedV2FixtureId(20),sources:[{key:"guide",sourceContentId:guidedV2FixtureId(21),resourceRevisionId:guidedV2FixtureId(23)}],assets:[{key:"image",assetId:guidedV2FixtureId(24)}] };

export function guidedV2Fixture(count=1): RoutePackage {
  const activities: RouteActivity[] = [], objectives: RoutePackage["objectives"] = [];
  const diagnostic: string[] = [], gate: string[] = [], final: string[] = [], retention7: string[] = [], retention30: string[] = [];
  for(let i=1;i<=count;i++){
    const objectiveKey=`objective-${i}`, k=(value:string)=>`${value}-${i}`;
    const base=(key:string,phase:RouteActivity["phase"],use:RouteActivity["use"]="learning",representation:RouteActivity["representation"]="text")=>({
      key:k(key),objectiveKey,relatedObjectiveKeys:[],phase,kind:"single_choice" as const,required:true,
      sourceKeys:["guide"],representation,equivalenceKey:k("family-"+key),use,hints:["Recupera la relación del ejemplo."],
      prompt:`${key}-${i}: actividad sintética`,feedback:{explanation:"Explicación sintética confirmada.",commonError:"",sourceKeys:["guide"]},
      misconceptionMappings:[],alternativeActivityKey:null,
      payload:{options:[{key:"yes",text:"Respuesta A"},{key:"no",text:"Respuesta B"}],correctKey:"yes",distractorFeedback:{no:"Revisa la relación."}}
    });
    activities.push(
      {...base("study","learn"),kind:"study",payload:{body:"Contenido sintético para comprobar el software.",focusSpans:[],assetKey:null,scaffold:"explanation",videoRange:null}},
      {...base("constructed","elaborate"),kind:"constructed_response",payload:{rubric:[{key:"reason",criterion:"Relaciona los ejemplos",example:"Una relación sintética."}],modelAnswer:"Una relación sintética.",verificationActivityKey:k("short")}},
      {...base("choice","retrieve"),misconceptionMappings:[{responseKey:"no",misconceptionKey:k("confusion")}]},
      {...base("short","retrieve"),kind:"short_answer",payload:{acceptedAnswers:["respuesta"],maxChars:200,modelAnswer:"respuesta",normalization:"nfkc-lower-space"}},
      base("apply","apply","learning","case"),
      {...base("match","retrieve"),kind:"match",payload:{presentation:"causal_map",prompts:[{key:"p",text:"Origen"}],choices:[{key:"c",text:"Consecuencia"}],correctByPrompt:{p:"c"},allowReuse:false,edges:[]}},
      {...base("sequence","apply","learning","diagram"),kind:"sequence",payload:{items:[{key:"one",text:"Uno"},{key:"two",text:"Dos"},{key:"three",text:"Tres"}],acceptedOrders:[["one","two","three"]],whyActivityKey:null}},
      {...base("image","apply","learning","image"),kind:"image_target",payload:{assetKey:"image",mode:"hotspot",targets:[{key:"target",prompt:"Señala el ejemplo",polygon:[{x:0,y:0},{x:1,y:0},{x:0,y:1}],label:""}],labels:[],correctLabelByTarget:{},accessibleAlternativeKey:k("apply"),masking:"no_labels"}},
      {...base("case","apply","learning","case"),kind:"case",payload:{stages:[{key:"first",narrative:"Etapa 1: ejemplo sintético",childActivityKey:k("case-choice")},{key:"second",narrative:"Etapa 2: relación sintética",childActivityKey:k("case-short")}]}},
      base("case-choice","retrieve"),{...base("case-short","retrieve"),kind:"short_answer",payload:{acceptedAnswers:["respuesta"],maxChars:200,modelAnswer:"respuesta",normalization:"nfkc-lower-space"}},
      {...base("remediate","remediate"),kind:"study",required:false,payload:{body:"Refuerzo de la confusión sintética.",focusSpans:[],assetKey:null,scaffold:"explanation",videoRange:null}},
      base("final","retrieve","final"),base("retention7","retrieve","retention7"),base("retention30","retrieve","retention30")
    );
    if(count>1 && i>1){
      const excluded = new Set(["constructed","image","case","case-choice","case-short","remediate"].map(k));
      for(let a=activities.length-1;a>=0;a--) if(excluded.has(activities[a]!.key)) activities.splice(a,1);
    }
    if(count>1 && i>1) {
      activities.find(a=>a.key===k("choice"))!.misconceptionMappings=[];
      activities.find(a=>a.key===k("sequence"))!.phase="elaborate";
    }
    if(i<=8){activities.push(base("diagnostic","activate","diagnostic"));diagnostic.push(k("diagnostic"));}
    gate.push(k("choice"),k("short"),k("apply"),k("match"),k("sequence"));final.push(k("final"));retention7.push(k("retention7"));retention30.push(k("retention30"));
    objectives.push({key:objectiveKey,title:`Aplicar el ejemplo ${i}`,unitKey:"unit",verb:"apply",criticality:"core",required:true,prerequisiteKeys:[],sourceKeys:["guide"],comparisonGroup:null,
      misconceptions:count>1 && i>1?[]:[{key:k("confusion"),description:"Confusión CORE sintética",critical:true,remediationActivityKey:k("remediate"),verificationActivityKeys:[k("short")]}]});
  }
  const assessment=(key:string,kind:RoutePackage["assessments"][number]["kind"],candidateActivityKeys:string[])=>({
    key,kind,afterUnitKey:kind==="unit_gate"?"unit":null,objectiveKeys:(kind==="diagnostic"?objectives.slice(0,8):kind==="unit_gate"?objectives:objectives.filter(o=>o.required)).map(o=>o.key),
    candidateActivityKeys,thresholdPercent:80,thresholdRationale:"Umbral editorial sintético de producto para estas comprobaciones."
  });
  const pkg=RoutePackageSchema.parse({schemaVersion:"2.0",packageKey:count===1?"t035-small":"t035-large",revision:1,locale:"es",
    route:{slug:count===1?"t035-small":"t035-large",title:count===1?"Ruta T035 pequeña":"Ruta T035 de 200 objetivos",summary:"Fixture de software sin contenido clínico real.",topicLabel:"Tema T035",audience:"Alumno",discipline:"general",coverKey:"heart"},
    policyVersion:"guided-v2.0",
    sources:[{key:"guide",kind:"guide",title:"Guía T035",citation:"Fuente sintética (2026)",locator:{heading:"Fixture",sectionPath:["Fixture"],page:1},documentSha256:guidedV2GuideHash,excerpt:"Contenido sintético para comprobar el software.",url:null,verification:"verified",checkedAt:"2026-10-04"}],
    assets:[{key:"image",mediaType:"image",originalFileName:"fixture.png",sha256:null,alt:"Píxel sintético para comprobar coordenadas",caption:"Fixture",sourceKeys:["guide"],rightsStatus:"owned",credit:"Fixture del software",width:1,height:1}],
    objectives,units:[{key:"unit",title:"Unidad T035",objectiveKeys:objectives.map(o=>o.key),activityKeys:activities.map(a=>a.key),support:"full",estimatedMinutes:null}],
    activities,assessments:[assessment("diagnostic","diagnostic",diagnostic),assessment("gate","unit_gate",gate),assessment("final","final",final),assessment("retention7","retention7",retention7),assessment("retention30","retention30",retention30)],
    reviewPlan:{objectiveKeys:objectives.map(o=>o.key)},editorial:{notes:"Fixture sintético de integración.",unresolvedIssues:[]}});
  const validation=validateRoutePackage(pkg);
  if(!validation.publishable) throw new Error(JSON.stringify(validation.issues));
  return pkg;
}
