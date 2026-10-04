import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ImageTargetRenderer } from "../../../../../apps/web/src/components/learning/v2/renderers/image-target";
import { MatchRenderer } from "../../../../../apps/web/src/components/learning/v2/renderers/match";
import { V2Player } from "../../../../../apps/web/src/components/learning/v2/player";
import { studentFixture } from "../../../../../apps/web/src/components/learning/v2/fixtures";
import type { V2PublicActivity } from "@cediah/contracts";

const query = new URLSearchParams(location.search), mode = query.get("mode") ?? "hotspot";
const base = { key: "visual", objectiveKey: "objective-a", phase: "apply" as const, representation: "image" as const, prompt: "Figura sintética de geometría" };
const match: Extract<V2PublicActivity, {kind: "match"}> = { ...base, kind: "match", representation: "table", payload: { presentation: mode === "comparison_table" ? "comparison_table" : mode === "causal_map" ? "causal_map" : "pairs", prompts: [1,2,3,4].map(n => ({key:`p${n}`,text:`Elemento ${n}`})), choices: [1,2,3,4].map(n => ({key:`c${n}`,text:`Relación ${n}`})), allowReuse: query.has("reuse") } };
const image: Extract<V2PublicActivity, {kind: "image_target"}> = { ...base, kind: "image_target", payload: {assetKey: "figure", mode: mode === "labeling" ? "labeling" : "hotspot", targets: mode === "labeling" ? [{key:"t1",prompt:"Identifica",marker:{x:.25,y:.75}},{key:"t2",prompt:"Relaciona",marker:{x:.75,y:.25}}] : [], labels: [{key:"a",text:"Opción A"},{key:"b",text:"Opción B"}],masking:"no_labels"} };
function Fixture() {
  const [response,setResponse] = useState<unknown>(null), [disabled,setDisabled] = useState(false), [alternative,setAlternative] = useState(false);
  const fixture = studentFixture();
  return <main style={{maxWidth:1000,margin:"0 auto",padding:16}}><h1>Prueba local T030</h1><label><input type="checkbox" checked={disabled} onChange={event=>setDisabled(event.target.checked)}/>Bloquear controles</label>
    {mode === "player" ? <V2Player initialAttempt={{...fixture.attempt,activeActivity:match}} initialState={fixture.state}/>
      : ["pairs","comparison_table","causal_map"].includes(mode) ? <MatchRenderer activity={match} disabled={disabled} onSubmit={setResponse}/>
        : alternative ? <p role="status">Solicitud de alternativa registrada en fixture; aún no hay integración de servidor.</p>
          : <ImageTargetRenderer key={mode} activity={image} image={query.has("missing") ? null : {assetKey:"figure",src:query.has("fail") ? "/fail.svg" : query.has("portrait") ? "/portrait.svg" : "/figure.svg",alt:"Figura sintética sin etiquetas ni soluciones"}} hotspotTarget={{key:"target",prompt:"Elige un punto"}} disabled={disabled} onSubmit={setResponse} alternative={{label:"Usar variante de texto o tabla",onSelect:()=>setAlternative(true)}}/>}
    <output aria-label="Respuesta de prueba">{JSON.stringify(response)}</output>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture/>);
