"use client";

import { useId, useState } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import styles from "./visual.module.css";

type Activity = Extract<V2PublicActivity, { kind: "match" }>;
export function completePairs(activity: Activity, pairs: Record<string, string>) {
  const values = activity.payload.prompts.map(prompt => pairs[prompt.key]);
  return values.length > 0 && values.every(value => activity.payload.choices.some(choice => choice.key === value))
    && (activity.payload.allowReuse || new Set(values).size === values.length);
}

/** Selections supply the same relations for keyboard, pointer and touch users. */
export function MatchRenderer({ activity, disabled, onSubmit }: { activity: Activity; disabled: boolean; onSubmit: (pairs: Record<string, string>) => void }) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const id = useId();
  const presentation = activity.payload.presentation;
  const selected = Object.values(pairs).filter(Boolean);
  const duplicate = !activity.payload.allowReuse && new Set(selected).size !== selected.length;
  function select(promptKey: string, value: string) {
    setPairs(current => ({ ...current, [promptKey]: value }));
  }
  function row(prompt: Activity["payload"]["prompts"][number], index: number) {
    return <label className={styles.relation} htmlFor={`${id}-${index}`}><span>{prompt.text}</span><span aria-hidden="true">→</span><select id={`${id}-${index}`} value={pairs[prompt.key] ?? ""} onChange={event => select(prompt.key, event.target.value)}><option value="">Elige una relación</option>{activity.payload.choices.map(choice => <option key={choice.key} value={choice.key}>{choice.text}</option>)}</select></label>;
  }
  return <form className={styles.form} onSubmit={event => { event.preventDefault(); if (!disabled && completePairs(activity, pairs)) onSubmit({ ...pairs }); }}>
    <fieldset disabled={disabled}><legend>{presentation === "comparison_table" ? "Completa la tabla de comparación" : presentation === "causal_map" ? "Completa las relaciones del mapa" : "Relaciona cada elemento"}</legend>
      <p>{activity.payload.allowReuse ? "Una opción puede relacionarse con varios elementos." : "Usa cada opción una vez."} Puedes completar todo con los selectores y el teclado.</p>
      {presentation === "comparison_table" ? <div className={styles.tableRegion} role="region" aria-label="Tabla de relaciones" tabIndex={0}><table><thead><tr><th scope="col">Elemento</th><th scope="col">Relación</th></tr></thead><tbody>{activity.payload.prompts.map((prompt, index) => <tr key={prompt.key}><th scope="row"><label htmlFor={`${id}-${index}`}>{prompt.text}</label></th><td><select id={`${id}-${index}`} value={pairs[prompt.key] ?? ""} onChange={event => select(prompt.key, event.target.value)}><option value="">Elige una relación</option>{activity.payload.choices.map(choice => <option key={choice.key} value={choice.key}>{choice.text}</option>)}</select></td></tr>)}</tbody></table></div>
        : <div className={presentation === "causal_map" ? styles.map : styles.pairs}>{activity.payload.prompts.map((prompt, index) => <div key={prompt.key}>{row(prompt, index)}</div>)}</div>}
    </fieldset><p role="status">{activity.payload.prompts.filter(prompt => pairs[prompt.key]).length} de {activity.payload.prompts.length} relaciones seleccionadas{duplicate ? ". Hay opciones repetidas; cambia una de esas relaciones antes de comprobar." : ""}</p>
    <button type="submit" className="learning-primary-button" disabled={disabled || !completePairs(activity, pairs)}>Comprobar relaciones</button>
  </form>;
}
