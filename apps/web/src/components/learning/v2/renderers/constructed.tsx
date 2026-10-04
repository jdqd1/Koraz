"use client";
import { useEffect, useRef, useState } from "react";
import type { V2PublicActivity } from "@cediah/contracts";

export function ConstructedRenderer({ activity, disabled, submittedText, model, rubric, onSubmit, onReveal, onRate }: {
  activity: Extract<V2PublicActivity, { kind: "constructed_response" }>; disabled: boolean; submittedText: string | null; model: string | null;
  rubric: { key: string; criterion: string; example: string }[];
  onSubmit: (text: string) => void; onReveal: () => void; onRate: (rating: "again" | "hard" | "good") => void;
}) {
  const [text, setText] = useState("");
  const modelHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (model !== null) modelHeading.current?.focus(); }, [model]);
  return <section className="learning-question-card">
    {submittedText === null ? <form onSubmit={event => { event.preventDefault(); if (text.trim() && !disabled) onSubmit(text); }} style={{ display: "grid", gap: 12 }}>
      <label htmlFor={`answer-${activity.key}`}>Explica con tus palabras</label><textarea id={`answer-${activity.key}`} rows={6} maxLength={activity.payload.maxChars} value={text} disabled={disabled} onChange={event => setText(event.target.value)} style={{ width: "100%", minWidth: 0, font: "inherit", padding: 12, border: "1px solid var(--koraz-line-strong)", borderRadius: 12 }} />
      <p>La comparación es formativa; tu valoración no acredita dominio.</p><button type="submit" className="learning-primary-button" disabled={disabled || !text.trim()}>Guardar mi respuesta</button>
    </form> : <><h3>Tu respuesta guardada para comparar</h3><p style={{ whiteSpace: "pre-wrap" }}>{submittedText}</p>{model === null ? <button type="button" className="learning-primary-button" disabled={disabled} onClick={onReveal}>Comparar con el modelo</button> : <><h3 ref={modelHeading} tabIndex={-1}>Respuesta modelo</h3><p style={{ whiteSpace: "pre-wrap" }}>{model}</p><h3>Criterios para comparar</h3><ul>{rubric.map(item => <li key={item.key}><strong>{item.criterion}</strong><p>{item.example}</p></li>)}</ul><p>¿Qué necesitas practicar? Esta valoración no es una nota ni demuestra dominio.</p><fieldset disabled={disabled} style={{ border: 0, display: "flex", gap: 10, flexWrap: "wrap", padding: 0 }}><legend>Valora tu recuperación</legend>{([['again', 'Volver a practicar'], ['hard', 'Me costó'], ['good', 'Lo recuperé']] as const).map(([rating, label]) => <button key={rating} type="button" className="learning-secondary-button" onClick={() => onRate(rating)}>{label}</button>)}</fieldset></>}</>}
  </section>;
}
