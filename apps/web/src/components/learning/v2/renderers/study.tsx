"use client";
import { useState } from "react";
import type { V2PublicActivity } from "@cediah/contracts";

export function StudyRenderer({ activity, disabled, onSubmit }: { activity: Extract<V2PublicActivity, { kind: "study" }>; disabled: boolean; onSubmit: () => void }) {
  const [focus, setFocus] = useState(false);
  const { body, focusSpans } = activity.payload;
  const boundaries = [...new Set([0, body.length, ...focusSpans.flatMap(span => [span.start, span.end])])].filter(n => n >= 0 && n <= body.length).sort((a, b) => a - b);
  return <section className="learning-guide-activity">
    {focusSpans.length ? <label><input type="checkbox" checked={focus} onChange={event => setFocus(event.target.checked)} /> Resaltar ideas clave</label> : null}
    <article><p>{boundaries.slice(0, -1).map((start, index) => { const end = boundaries[index + 1]!; const text = body.slice(start, end); return focus && focusSpans.some(span => span.start <= start && span.end >= end) ? <mark key={start}>{text}</mark> : <span key={start}>{text}</span>; })}</p></article>
    {activity.payload.assetKey ? <p>Este paso incluye un recurso visual. Su visor se incorporará con las actividades visuales.</p> : null}
    <p>Leer cuenta para el recorrido. El dominio se comprueba al responder.</p>
    <button type="button" className="learning-primary-button" disabled={disabled} onClick={onSubmit}>Continuar a la práctica</button>
  </section>;
}
