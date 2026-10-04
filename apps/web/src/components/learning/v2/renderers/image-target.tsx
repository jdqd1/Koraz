"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { V2PublicActivity, V2AttemptManifest } from "@cediah/contracts";
import styles from "./visual.module.css";
import { readV2AttemptImage } from "../client";

type Activity = Extract<V2PublicActivity, { kind: "image_target" }>;
type Answer = Extract<V2AttemptManifest["acceptedResponses"][number]["answer"], { kind: "image_target" }>;
type Point = { x: number; y: number };
type Box = { left: number; top: number; width: number; height: number };
/** Values supplied by an authorized media resolver, never inferred from assetKey. */
export type AuthorizedImage = { assetKey: string; src: string; alt: string };
export function containedImageRect(box: Box, natural: { width: number; height: number }): Box | null {
  if (![box.left, box.top, box.width, box.height, natural.width, natural.height].every(Number.isFinite)
    || box.width <= 0 || box.height <= 0 || natural.width <= 0 || natural.height <= 0) return null;
  const scale = Math.min(box.width / natural.width, box.height / natural.height);
  const width = natural.width * scale, height = natural.height * scale;
  return { left: box.left + (box.width - width) / 2, top: box.top + (box.height - height) / 2, width, height };
}
export function normalizedImagePoint(point: Point, box: Box, natural: { width: number; height: number }): Point | null {
  const rect = containedImageRect(box, natural);
  if (!rect) return null;
  const x = (point.x - rect.left) / rect.width, y = (point.y - rect.top) / rect.height;
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
}

export function ImageTargetRenderer({ activity, image, hotspotTarget = null, alternative = null, disabled, onSubmit, onRetryImage }: {
  activity: Activity; image: AuthorizedImage | null;
  hotspotTarget?: { key: string; prompt: string } | null;
  alternative?: { label: string; onSelect: () => void } | null;
  disabled: boolean; onSubmit: (answer: Answer) => void;
  onRetryImage?: () => void;
}) {
  const id = useId(), surface = useRef<HTMLDivElement>(null), img = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState("");
  const [zoom, setZoom] = useState(1), [point, setPoint] = useState<Point | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [targetKey, setTargetKey] = useState(activity.payload.targets[0]?.key ?? hotspotTarget?.key ?? "");
  const target = activity.payload.targets.find(item => item.key === targetKey) ?? hotspotTarget;
  useEffect(() => {
    if (!surface.current) return;
    const observer = new ResizeObserver(entries => { const box = entries[0]?.contentRect; if (box) setSize({ width: box.width, height: box.height }); });
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, [image]);
  const safeImage = image?.assetKey === activity.payload.assetKey ? image : null;
  const ready = Boolean(safeImage && loadedSrc === safeImage.src && natural.width && natural.height && !failed);
  const locked = disabled || !ready;
  const rect = containedImageRect({ left: 0, top: 0, ...size }, natural);
  const complete = activity.payload.mode === "hotspot" ? Boolean(point && target)
    : activity.payload.targets.length > 0 && activity.payload.targets.every(target => activity.payload.labels.some(label => label.key === labels[target.key]));
  function marker(position: Point, label: string, key: string) {
    return rect ? <span key={key} className={styles.marker} aria-hidden="true" style={{ left: rect.left + position.x * rect.width, top: rect.top + position.y * rect.height }}>{label}</span> : null;
  }
  function move(x: number, y: number) { if (!locked) setPoint({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }); }
  return <form className={styles.form} onSubmit={event => {
    event.preventDefault();
    if (locked || !complete) return;
    if (activity.payload.mode === "hotspot" && target && point) onSubmit({ kind: "image_target", mode: "hotspot", targetKey: target.key, point: { ...point } });
    else if (activity.payload.mode === "labeling") onSubmit({ kind: "image_target", mode: "labeling", labelsByTarget: { ...labels } });
  }}>
    <p id={`${id}-instructions`}>{activity.payload.mode === "hotspot" ? "Señala un punto de la imagen. También puedes enfocar la imagen y usar las flechas, o ajustar las coordenadas." : "Relaciona cada número de la imagen con una etiqueta usando los selectores."}</p>
    {activity.payload.mode === "hotspot" && activity.payload.targets.length > 1 ? <label>Consigna de selección<select disabled={disabled} value={targetKey} onChange={event => { setTargetKey(event.target.value); setPoint(null); }}>{activity.payload.targets.map(item => <option key={item.key} value={item.key}>{item.prompt}</option>)}</select></label> : null}
    {activity.payload.mode === "hotspot" && target ? <p>{target.prompt}</p> : null}
    {!safeImage ? <p role="alert">La imagen autorizada no está disponible. Tu respuesta aún no se ha enviado.</p> : <>
      <div className={styles.tools}><label htmlFor={`${id}-zoom`}>Ampliación de imagen</label><select id={`${id}-zoom`} value={zoom} disabled={locked} onChange={event => setZoom(Number(event.target.value))}>{[1, 1.5, 2, 3].map(value => <option key={value} value={value}>{value * 100} %</option>)}</select></div>
      <div className={styles.viewport} role="region" aria-label="Área ampliada de imagen" tabIndex={0}><div ref={surface} className={styles.surface} style={{ width: `${zoom * 100}%`, height: `${300 * zoom}px` }} role="group" aria-label="Imagen para responder" aria-describedby={`${id}-instructions`} aria-disabled={locked} tabIndex={activity.payload.mode === "hotspot" ? 0 : undefined}
        onClick={event => { if (locked || activity.payload.mode !== "hotspot" || !img.current) return; const box = img.current.getBoundingClientRect(); const chosen = normalizedImagePoint({ x: event.clientX, y: event.clientY }, box, natural); if (chosen) setPoint(chosen); }}
        onKeyDown={event => { if (locked || activity.payload.mode !== "hotspot") return; const delta = event.shiftKey ? .1 : .01, start = point ?? { x: .5, y: .5 }; if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); move(start.x + (event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0), start.y + (event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0)); } }}>
        {/* Signed media is resolved externally; Next optimization must not cache private media. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={retry} ref={img} src={safeImage.src} alt={safeImage.alt} draggable={false} onLoad={event => { setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); setLoadedSrc(safeImage.src); setFailed(false); }} onError={() => { setFailed(true); setLoadedSrc(""); setNatural({ width: 0, height: 0 }); }} />
        {ready && point && activity.payload.mode === "hotspot" ? marker(point, "+", "selection") : null}
        {ready && activity.payload.mode === "labeling" ? activity.payload.targets.map((target, index) => target.marker ? marker(target.marker, String(index + 1), target.key) : null) : null}
      </div></div>
      {failed ? <div role="alert"><p>No pudimos cargar la imagen. Tu selección se conserva sin enviar.</p><button type="button" disabled={disabled} onClick={() => { setFailed(false); setRetry(value => value + 1); onRetryImage?.(); }}>Reintentar imagen</button></div> : !ready ? <p role="status">Cargando imagen…</p> : null}
    </>}
    {activity.payload.mode === "hotspot" ? <>
      {!target ? <p role="alert">Falta la consigna autorizada para esta selección. Tu sesión se conserva.</p> : null}
      <fieldset disabled={locked}><legend>Ajustar el punto seleccionado</legend><div className={styles.coordinates}>{(["x", "y"] as const).map(axis => <label key={axis}>{axis === "x" ? "Horizontal (%)" : "Vertical (%)"}<input type="number" min={0} max={100} step="any" value={point ? Number((point[axis] * 100).toFixed(4)) : ""} onChange={event => { if (event.target.value === "") { setPoint(null); return; } const value = Number(event.target.value); if (Number.isFinite(value)) move(axis === "x" ? value / 100 : point?.x ?? .5, axis === "y" ? value / 100 : point?.y ?? .5); }} /></label>)}</div></fieldset>
      <p role="status">{point ? `Punto seleccionado: horizontal ${(point.x * 100).toFixed(1)} %, vertical ${(point.y * 100).toFixed(1)} %.` : "Aún no has seleccionado un punto."}</p>
    </> : <fieldset disabled={locked}><legend>Etiquetas de los puntos numerados</legend><div className={styles.labels}>{activity.payload.targets.map((target, index) => <label key={target.key}>{`Punto ${index + 1}: ${target.prompt}`}<select value={labels[target.key] ?? ""} onChange={event => setLabels(current => ({ ...current, [target.key]: event.target.value }))}><option value="">Elige una etiqueta</option>{activity.payload.labels.map(label => <option key={label.key} value={label.key}>{label.text}</option>)}</select></label>)}</div></fieldset>}
    {alternative ? <button type="button" className="learning-secondary-button" disabled={disabled} onClick={alternative.onSelect}>{alternative.label}</button> : null}
    <button type="submit" className="learning-primary-button" disabled={locked || !complete}>Comprobar respuesta visual</button>
  </form>;
}

/** Mounted with an activity/version key by the player; stale resource reads are aborted. */
export function AuthorizedImageTargetRenderer({ activity, attemptId, rowVersion, disabled, onSubmit, onAlternative }: {
  activity: Activity; attemptId: string; rowVersion: number; disabled: boolean; onSubmit: (answer: Answer) => void; onAlternative: () => void;
}) {
  const [image, setImage] = useState<AuthorizedImage | null>(null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    readV2AttemptImage(attemptId, activity.key, activity.payload.assetKey, rowVersion, controller.signal)
      .then(value => { if (!controller.signal.aborted) setImage({ assetKey: value.assetKey, src: value.url, alt: value.alt }); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attemptId, activity.key, activity.payload.assetKey, rowVersion, retry]);
  return <>{!image ? <div role={error ? "alert" : "status"}><p>{error ? "No pudimos obtener la imagen autorizada. Tu respuesta no se ha enviado." : "Solicitando imagen autorizada…"}</p>{error ? <button type="button" disabled={disabled} onClick={() => { setImage(null); setError(false); setRetry(value => value + 1); }}>Reintentar acceso a la imagen</button> : null}</div> : null}
    <ImageTargetRenderer activity={activity} image={image} disabled={disabled} onSubmit={onSubmit}
      onRetryImage={() => { setImage(null); setError(false); setRetry(value => value + 1); }}
      alternative={activity.payload.accessibleAlternativeKey ? { label: "Practicar con variante de texto o tabla", onSelect: onAlternative } : null} />
  </>;
}
