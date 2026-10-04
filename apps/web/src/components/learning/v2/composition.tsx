"use client";

import type { V2AttemptManifest, V2PublicActivity } from "@cediah/contracts";
import type { PlayerAction } from "./client";
import { StudyRenderer } from "./renderers/study";
import { ChoiceRenderer } from "./renderers/choice";
import { ShortRenderer } from "./renderers/short";
import { ConstructedRenderer } from "./renderers/constructed";
import { MatchRenderer } from "./renderers/match";
import { AuthorizedImageTargetRenderer } from "./renderers/image-target";
import { SequenceRenderer } from "./renderers/sequence";
import { CaseRenderer } from "./renderers/case";
import styles from "./composition.module.css";

type Answer = Extract<PlayerAction, { operation: "response" }>["body"]["answer"];
type Props = { activity: V2PublicActivity; attemptId: string; rowVersion: number; disabled: boolean;
  comparison: V2AttemptManifest["constructedResponse"]; onSubmit: (answer: Answer) => void; onReveal: () => void; onAlternative: () => void };

/** Presets are compositions of existing kinds, never a separate scoring system. */
export function ActivityComposition({ activity, attemptId, rowVersion, disabled, comparison, onSubmit, onReveal, onAlternative }: Props) {
  let renderer;
  switch (activity.kind) {
    case "study": renderer = <><p className={styles.scaffold}>{activity.payload.scaffold === "worked_example" ? "Ejemplo resuelto" : activity.payload.scaffold === "partial_example" ? "Ejemplo con apoyo parcial" : "Estudio guiado"}. Este apoyo es lectura; la práctica independiente se responde en otro paso.</p><StudyRenderer activity={activity} disabled={disabled} onSubmit={() => onSubmit({ kind: "study", acknowledged: true })} /></>; break;
    case "single_choice": renderer = <ChoiceRenderer activity={activity} disabled={disabled} onSubmit={optionKey => onSubmit({ kind: "single_choice", optionKey })} />; break;
    case "short_answer": renderer = <ShortRenderer activity={activity} disabled={disabled} onSubmit={text => onSubmit({ kind: "short_answer", text })} />; break;
    case "constructed_response": renderer = <ConstructedRenderer activity={activity} disabled={disabled} submittedText={comparison?.text ?? null} model={comparison?.stage === "revealed" ? comparison.modelAnswer : null} rubric={comparison?.stage === "revealed" ? comparison.rubric : []} onSubmit={text => onSubmit({ kind: "constructed_response", text, selfRating: null })} onReveal={onReveal} onRate={selfRating => { if (comparison?.stage === "revealed") onSubmit({ kind: "constructed_response", text: comparison.text, selfRating }); }} />; break;
    case "match": renderer = <MatchRenderer activity={activity} disabled={disabled} onSubmit={pairs => onSubmit({ kind: "match", pairs })} />; break;
    case "image_target": renderer = <AuthorizedImageTargetRenderer key={`${activity.key}:${rowVersion}`} activity={activity} attemptId={attemptId} rowVersion={rowVersion} disabled={disabled} onSubmit={onSubmit} onAlternative={onAlternative} />; break;
    case "sequence": renderer = <SequenceRenderer activity={activity} disabled={disabled} onSubmit={orderedKeys => onSubmit({ kind: "sequence", orderedKeys })} />; break;
    case "case": return <CaseRenderer activity={activity} />;
  }
  return activity.representation === "case" ? <CaseRenderer activity={activity}>{renderer}</CaseRenderer> : renderer;
}

/** Shows the confirmed submitted order, not an invented correct order. */
export function SequenceRecap({ response, activity }: { response: V2AttemptManifest["acceptedResponses"][number]; activity?: V2PublicActivity | null }) {
  if (response.answer.kind !== "sequence") return null;
  const items = activity?.kind === "sequence" && activity.key === response.activityKey ? activity.payload.items : [];
  const labels = response.answer.orderedKeys.map(key => items.find(item => item.key === key)?.text);
  return <div className={styles.recap}><h3>Tu orden confirmado</h3>{labels.every(label => label !== undefined) ? <ol>{labels.map((label, index) => <li key={response.answer.kind === "sequence" ? response.answer.orderedKeys[index] : index}>{label}</li>)}</ol> : <p>Orden de {response.answer.orderedKeys.length} pasos guardado.</p>}</div>;
}
