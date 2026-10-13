"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { toV2PublicActivity, type RouteActivity, type RoutePackage } from "@cediah/contracts";
import { StudyRenderer } from "../../v2/renderers/study";
import { ChoiceRenderer } from "../../v2/renderers/choice";
import { ShortRenderer } from "../../v2/renderers/short";
import { ConstructedRenderer } from "../../v2/renderers/constructed";
import { MatchRenderer } from "../../v2/renderers/match";
import { SequenceRenderer } from "../../v2/renderers/sequence";
import { ImageTargetRenderer } from "../../v2/renderers/image-target";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export function ActivityStudentPreviewV2({ activity, activities = [], assets = [], example = false, interactive = true }: {
  activity: RouteActivity; activities?: RouteActivity[]; assets?: RoutePackage["assets"]; example?: boolean; interactive?: boolean;
}) {
  const [restart, setRestart] = useState(0);
  return <section className={local.studentPreview} aria-label="Vista de estudiante" data-student-preview>
    <div className={local.previewTools}><span>{example ? "Ejemplo interactivo" : "Vista previa"}</span>{interactive ? <button className={styles.textButton} type="button" onClick={() => setRestart(value => value + 1)}><ArrowClockwise size={15} aria-hidden /> Reiniciar</button> : <span className={local.previewLive}>En directo</span>}</div>
    <StudentActivity key={`${activity.key}:${restart}`} activity={activity} activities={activities} assets={assets} example={example} disabled={!interactive} />
  </section>;
}

function StudentActivity({ activity, activities, assets, example, disabled }: {
  activity: RouteActivity; activities: RouteActivity[]; assets: RoutePackage["assets"]; example: boolean; disabled: boolean;
}) {
  const [stageIndex, setStageIndex] = useState(0);
  if (activity.kind === "case") {
    const stage = activity.payload.stages[stageIndex];
    const child = activities.find(item => item.key === stage?.childActivityKey && item.kind !== "case");
    return <div className={local.studentCard}>
      <h3>{activity.prompt || "Escribe la consigna del caso"}</h3>
      <div className={local.caseTabs} aria-label="Etapas del caso">{activity.payload.stages.map((item, index) => <button type="button" key={item.key} aria-pressed={index === stageIndex} onClick={() => setStageIndex(index)}>Etapa {index + 1}</button>)}</div>
      <p className={local.caseNarrative}>{stage?.narrative || "Escribe la narrativa de esta etapa."}</p>
      {child ? <StudentResponse key={`${stage?.key}:${child.key}`} activity={child} assets={assets} example={example} disabled={disabled} /> : <p className={local.previewEmpty}>Vincula una pregunta a esta etapa para probarla aquí.</p>}
    </div>;
  }
  return <div className={local.studentCard}><StudentResponse activity={activity} assets={assets} example={example} disabled={disabled} /></div>;
}

// Reuses student controls, with responses held only in this component.
// Full route correction remains in the existing server-backed editorial preview.
function StudentResponse({ activity, assets, example, disabled }: { activity: RouteActivity; assets: RoutePackage["assets"]; example: boolean; disabled: boolean }) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<{ assetKey: string; src: string; alt: string } | null>(null);
  const imageUrl = useRef<string | null>(null);
  useEffect(() => () => { if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); }, []);
  const dto = toV2PublicActivity(activity);
  const submit = () => setMessage(activity.kind === "study" ? "Lectura completada en la vista previa." : "Respuesta de prueba enviada.");
  let body;
  switch (dto.kind) {
    case "study": body = <StudyRenderer activity={dto} disabled={disabled} onSubmit={submit} />; break;
    case "single_choice": body = <ChoiceRenderer activity={dto} disabled={disabled} onSubmit={submit} />; break;
    case "short_answer": body = <ShortRenderer activity={dto} disabled={disabled} onSubmit={submit} />; break;
    case "constructed_response": {
      const privatePayload = activity.kind === "constructed_response" ? activity.payload : null;
      body = <ConstructedRenderer activity={dto} disabled={disabled} submittedText={submitted} model={revealed ? privatePayload?.modelAnswer ?? "" : null} rubric={revealed ? privatePayload?.rubric ?? [] : []} onSubmit={setSubmitted} onReveal={() => setRevealed(true)} onRate={submit} />; break;
    }
    case "match": body = <MatchRenderer activity={dto} disabled={disabled} onSubmit={submit} />; break;
    case "sequence": body = <SequenceRenderer activity={dto} disabled={disabled} onSubmit={submit} />; break;
    case "image_target": {
      const asset = assets.find(item => item.key === dto.payload.assetKey);
      const displayed = example ? { assetKey: dto.payload.assetKey, src: "/anatomy/heart.png", alt: "Imagen de ejemplo para probar la selección de una zona" } : image?.assetKey === dto.payload.assetKey ? image : null;
      const invalidZones = dto.payload.mode === "labeling" && dto.payload.targets.some(target => !target.marker || !Number.isFinite(target.marker.x) || !Number.isFinite(target.marker.y));
      body = <>
        {!example ? <label className={local.previewImagePicker}>Abrir imagen para probar<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) { setMessage("Usa PNG, JPEG o WebP de hasta 10 MiB."); return; }
          if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
          imageUrl.current = URL.createObjectURL(file);
          setImage({ assetKey: dto.payload.assetKey, src: imageUrl.current, alt: asset?.alt || "Imagen para probar la actividad" });
        }} /><small>{asset ? `Usa una copia de ${asset.originalFileName}. Se abre solo en tu navegador.` : "Selecciona la imagen vinculada en la configuración de la actividad."}</small></label> : null}
        {invalidZones ? <p className={local.previewEmpty}>Define las zonas antes de probar el etiquetado.</p> : <ImageTargetRenderer key={`${dto.payload.assetKey}:${dto.payload.mode}`} activity={dto} image={displayed} disabled={disabled} onSubmit={submit} />}
      </>; break;
    }
    case "case": body = null; break;
  }
  return <div className={local.studentResponse}>
    <h3>{activity.prompt || "Escribe aquí la pregunta o consigna"}</h3>
    {body}
    {message ? <div className={local.previewResult} role="status"><strong>{message}</strong>{activity.kind !== "study" && activity.feedback.explanation ? <p>{activity.feedback.explanation}</p> : null}<small>Esta prueba no guarda progreso ni acredita resultados.</small></div> : null}
  </div>;
}
