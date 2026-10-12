"use client";
import { useState, type ReactNode } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import ui from "../../activities/activity-ui.module.css";

export function ShortRenderer({ activity, disabled, tools, onSubmit }: { activity: Extract<V2PublicActivity, { kind: "short_answer" }>; disabled: boolean; tools?: ReactNode; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return <form className="learning-question-card" onSubmit={event => { event.preventDefault(); if (text.trim() && !disabled) onSubmit(text); }}>
    <label className="sr-only" htmlFor={`answer-${activity.key}`}>Tu respuesta</label><div className={ui.inputField}><textarea id={`answer-${activity.key}`} placeholder="Tu respuesta" rows={4} maxLength={activity.payload.maxChars} disabled={disabled} value={text} onChange={event => setText(event.target.value)} aria-describedby={`limit-${activity.key}`} />
    <p className={ui.characterCount} id={`limit-${activity.key}`}>{text.length} / {activity.payload.maxChars}<span className="sr-only"> caracteres</span></p></div>
    {tools}<div className={ui.action}><button className="learning-primary-button" type="submit" disabled={disabled || !text.trim()}>Comprobar respuesta</button></div>
  </form>;
}
