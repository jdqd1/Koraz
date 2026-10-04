"use client";
import { useState } from "react";
import type { V2PublicActivity } from "@cediah/contracts";

export function ShortRenderer({ activity, disabled, onSubmit }: { activity: Extract<V2PublicActivity, { kind: "short_answer" }>; disabled: boolean; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return <form className="learning-question-card" onSubmit={event => { event.preventDefault(); if (text.trim() && !disabled) onSubmit(text); }}>
    <label htmlFor={`answer-${activity.key}`}>Tu respuesta</label><textarea id={`answer-${activity.key}`} rows={4} maxLength={activity.payload.maxChars} disabled={disabled} value={text} onChange={event => setText(event.target.value)} aria-describedby={`limit-${activity.key}`} style={{ width: "100%", minWidth: 0, font: "inherit", padding: 12, border: "1px solid var(--koraz-line-strong)", borderRadius: 12 }} />
    <p id={`limit-${activity.key}`}>{text.length} / {activity.payload.maxChars} caracteres</p>
    <button className="learning-primary-button" type="submit" disabled={disabled || !text.trim()}>Comprobar respuesta</button>
  </form>;
}
