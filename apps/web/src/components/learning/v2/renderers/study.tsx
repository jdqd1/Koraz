"use client";
import { useEffect, useState } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import { readV2AttemptImage } from "../client";
import ui from "../../activities/activity-ui.module.css";

export function StudyRenderer({ activity, attemptId, rowVersion, readImage = readV2AttemptImage, disabled, onSubmit }: { activity: Extract<V2PublicActivity, { kind: "study" }>; attemptId?: string; rowVersion?: number; readImage?: typeof readV2AttemptImage; disabled: boolean; onSubmit: () => void }) {
  const [focus, setFocus] = useState(false);
  const [image, setImage] = useState<Awaited<ReturnType<typeof readV2AttemptImage>> | null>(null), [loaded, setLoaded] = useState(false), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  const assetKey = activity.payload.assetKey;
  useEffect(() => {
    if (!assetKey || !attemptId || !rowVersion) return;
    const controller = new AbortController();
    readImage(attemptId, activity.key, assetKey, rowVersion, controller.signal).then(value => { if (!controller.signal.aborted) setImage(value); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [assetKey, attemptId, activity.key, rowVersion, retry, readImage]);
  const { body, focusSpans } = activity.payload;
  const boundaries = [...new Set([0, body.length, ...focusSpans.flatMap(span => [span.start, span.end])])].filter(n => n >= 0 && n <= body.length).sort((a, b) => a - b);
  return <section className="learning-guide-activity">
    {focusSpans.length ? <label className={ui.eyebrow}><input type="checkbox" checked={focus} onChange={event => setFocus(event.target.checked)} /> Resaltar ideas clave</label> : null}
    <article><p>{boundaries.slice(0, -1).map((start, index) => { const end = boundaries[index + 1]!; const text = body.slice(start, end); return focus && focusSpans.some(span => span.start <= start && span.end >= end) ? <mark key={start}>{text}</mark> : <span key={start}>{text}</span>; })}</p></article>
    {assetKey ? <figure>{image && !error ? <>
      {/* eslint-disable-next-line @next/next/no-img-element -- Short-lived authorized URL, with load confirmation before acknowledgement. */}
      <img src={image.url} alt={image.alt} style={{ maxWidth: "100%", height: "auto" }} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setError(true); }} />
    </> : null}{!loaded ? <p role={error ? "alert" : "status"}>{error || !attemptId ? "Imagen no disponible. No se registrará esta lectura hasta poder abrirla." : "Solicitando imagen autorizada…"}</p> : null}{error ? <button type="button" disabled={disabled} onClick={() => { setImage(null); setLoaded(false); setError(false); setRetry(value => value + 1); }}>Reintentar imagen</button> : null}</figure> : null}
    <div className={ui.action}><button type="button" className="learning-primary-button" disabled={disabled || !!assetKey && !loaded} onClick={onSubmit}>Guardar lectura</button></div>
  </section>;
}
