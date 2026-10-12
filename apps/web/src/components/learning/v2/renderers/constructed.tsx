"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import ui from "../../activities/activity-ui.module.css";

export function ConstructedRenderer({ activity, disabled, tools, submittedText, model, rubric, onSubmit, onReveal, onRate }: {
  activity: Extract<V2PublicActivity, { kind: "constructed_response" }>; disabled: boolean; submittedText: string | null; model: string | null;
  rubric: { key: string; criterion: string; example: string }[];
  tools?: ReactNode;
  onSubmit: (text: string) => void; onReveal: () => void; onRate: (rating: "again" | "hard" | "good") => void;
}) {
  const [text, setText] = useState("");
  const modelHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (model !== null) modelHeading.current?.focus({ preventScroll: true }); }, [model]);
  return <section className="learning-question-card">
    {submittedText === null ? <form className="learning-question-card" onSubmit={event => { event.preventDefault(); if (text.trim() && !disabled) onSubmit(text); }}>
      <label className="sr-only" htmlFor={`answer-${activity.key}`}>Explica con tus palabras</label><div className={ui.inputField}><textarea id={`answer-${activity.key}`} placeholder="Explica con tus palabras…" rows={6} maxLength={activity.payload.maxChars} value={text} disabled={disabled} onChange={event => setText(event.target.value)} aria-describedby={`limit-${activity.key}`} /><p className={ui.characterCount} id={`limit-${activity.key}`}>{text.length} / {activity.payload.maxChars}<span className="sr-only"> caracteres</span></p></div>
      {tools}<div className={ui.action}><button type="submit" className="learning-primary-button" disabled={disabled || !text.trim()}>Guardar mi respuesta</button></div>
    </form> : <><div className={ui.comparison}><article><h3>Tu respuesta</h3><p>{submittedText}</p></article>{model !== null ? <article><h3 ref={modelHeading} tabIndex={-1}>Respuesta modelo</h3><p>{model}</p></article> : null}</div>{model === null ? <div className={ui.action}><button type="button" className="learning-primary-button" disabled={disabled} onClick={onReveal}>Comparar con el modelo</button></div> : <>
      <details className={ui.disclosure}><summary>Criterios para comparar</summary><ul>{rubric.map(item => <li key={item.key}><strong>{item.criterion}</strong><p>{item.example}</p></li>)}</ul></details>
      <fieldset className={ui.ratings} disabled={disabled}><legend>Valora tu recuperación</legend>{([['again', 'Volver a practicar'], ['hard', 'Me costó'], ['good', 'Lo recuperé']] as const).map(([rating, label]) => <button key={rating} type="button" className="learning-secondary-button" onClick={() => onRate(rating)}>{label}</button>)}</fieldset>
    </>}</>}
  </section>;
}
