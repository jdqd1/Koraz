"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import { V2EditorSourceCatalogSchema, type RoutePackage } from "@cediah/contracts";
import type { z } from "zod";
import { nextLocalKeyV2, type EditorV2Draft } from "./editor-model";
import { FieldV2, focusFieldIssueV2, type FormPropsV2 } from "./sources-fields";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export type SourceCatalogV2 = z.infer<typeof V2EditorSourceCatalogSchema>;
export function useSourceCatalogV2() {
  const [catalog, setCatalog] = useState<SourceCatalogV2>({ items: [], topics: [], nextCursor: null });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [request, setRequest] = useState({ q: "", cursor: "", sequence: 0 });
  useEffect(() => {
    const abort = new AbortController();
    const search = new URLSearchParams({ limit: "24", q: request.q });
    if (request.cursor) search.set("cursor", request.cursor);
    // Reads stay separate from the saved draft; failures never clear existing bindings.
    void fetch(`/api/v2/editor/learning-paths/source-catalog?${search}`, { cache: "no-store", credentials: "same-origin", signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error("catalog");
      const parsed = V2EditorSourceCatalogSchema.parse(await response.json());
      if (!abort.signal.aborted) { setCatalog((current) => ({ ...parsed, items: request.cursor ? [...current.items, ...parsed.items.filter((item) => !current.items.some((entry) => entry.sourceContentId === item.sourceContentId))] : parsed.items })); setError(""); }
    }).catch(() => { if (!abort.signal.aborted) setError("No se pudo cargar el catálogo. Los vínculos guardados se conservan."); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [request]);
  function load(cursor = "") { setLoading(true); setError(""); setRequest((current) => ({ q: cursor ? current.q : query.trim(), cursor, sequence: current.sequence + 1 })); }
  return { catalog, query, setQuery, loading, error, search: () => load(), more: () => load(catalog.nextCursor ?? ""), retry: () => load() };
}
export function bindCatalogSourceV2(draft: EditorV2Draft, sourceKey: string, item: SourceCatalogV2["items"][number]): EditorV2Draft | null {
  if (!item.revision || !draft.package.sources.some((source) => source.key === sourceKey)) return null;
  const previous = draft.bindings.sources.find((binding) => binding.key === sourceKey);
  const changedDocument = previous?.resourceRevisionId !== item.revision.resourceRevisionId;
  return { ...draft, package: { ...draft.package, sources: draft.package.sources.map((source) => source.key !== sourceKey ? source : { ...source, title: source.title || item.title, documentSha256: item.revision!.documentSha256, ...(changedDocument ? { locator: { heading: "", sectionPath: [], page: null }, excerpt: "", verification: "provided" as const, checkedAt: null } : {}) }) }, bindings: { ...draft.bindings, sources: [...draft.bindings.sources.filter((binding) => binding.key !== sourceKey), { key: sourceKey, sourceContentId: item.sourceContentId, resourceRevisionId: item.revision.resourceRevisionId }] } };
}
export function sourceDeletionBlockV2(pkg: RoutePackage, key: string) {
  return pkg.objectives.some((item) => item.sourceKeys.includes(key)) || pkg.assets.some((item) => item.sourceKeys.includes(key)) || pkg.activities.some((item) => item.sourceKeys.includes(key) || item.feedback.sourceKeys.includes(key)) ? "Esta fuente está vinculada a objetivos, actividades o recursos visuales. Retira esos vínculos antes de eliminarla." : null;
}
export function sourceBindingIssuesV2(draft: EditorV2Draft) {
  return draft.package.sources.flatMap((source, index) => {
    const binding = draft.bindings.sources.find((item) => item.key === source.key);
    if (source.kind === "reference" && !binding) {
      if (!source.url) return [{ path: `package.sources.${index}.url`, message: "Aporta un enlace HTTPS de la referencia." }];
      if (source.verification !== "verified") return [{ path: `package.sources.${index}.verification`, message: "La referencia externa necesita verificación editorial." }];
      return [];
    }
    return source.kind === "guide" && (!binding?.sourceContentId || !binding.resourceRevisionId) ? [{ path: `package.sources.${index}.binding`, message: "Selecciona una guía con revisión vigente." }] : [];
  });
}
export function SourcesV2({ draft, disabled, onChange, issues = [], catalog, loading, error, search, more, retry, query, setQuery }: FormPropsV2 & ReturnType<typeof useSourceCatalogV2>) {
  const pkg = draft.package;
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const surface = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => { if (pendingFocus.current) { focusFieldIssueV2(surface.current, pendingFocus.current); pendingFocus.current = null; } });
  const latest = useRef(draft);
  useEffect(() => { latest.current = draft; }, [draft]);
  function patch(key: string, values: Partial<RoutePackage["sources"][number]>) { onChange({ ...draft, package: { ...pkg, sources: pkg.sources.map((source) => source.key === key ? { ...source, ...values } : source) } }); }
  function add() {
    if (disabled || pkg.sources.length >= 200) return;
    const key = nextLocalKeyV2("fuente", pkg.sources.map((source) => source.key));
    pendingFocus.current = `package.sources.${pkg.sources.length}.title`;
    onChange({ ...draft, package: { ...pkg, sources: [...pkg.sources, { key, kind: "guide", title: "", citation: "", locator: { heading: "", sectionPath: [], page: null }, documentSha256: "", excerpt: "", url: null, verification: "provided", checkedAt: null }] } });
  }
  async function fingerprint(key: string, file?: File) {
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { setFileError("El documento de referencia supera 16 MiB."); return; }
    try {
      const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      const current = latest.current;
      // The file stays on the device. A file hash never stands in for a catalogue revision hash.
      if (disabled || current.package.sources.find((source) => source.key === key)?.kind !== "reference") return;
      onChange({ ...current, package: { ...current.package, sources: current.package.sources.map((source) => source.key === key ? { ...source, documentSha256: digest } : source) } }); setFileError("");
    } catch { setFileError("No se pudo leer la huella del documento."); }
  }
  return <div ref={surface} className={local.stack}>
    <section className={styles.card}><div className={styles.sectionHeading}><div><h2>Fuentes</h2><p>Localiza cada fragmento por sección o página y conserva su procedencia.</p></div><button ref={addRef} className={styles.primaryAction} disabled={disabled || pkg.sources.length >= 200} onClick={add} type="button" data-field-path="package.sources">Añadir fuente</button></div>
      <div className={local.inlineForm}><FieldV2 label="Buscar guías del catálogo" path="catalog.search">{(input) => <input {...input} value={query} maxLength={120} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); search(); } }} />}</FieldV2><button className={styles.secondaryButton} disabled={loading} type="button" onClick={search}>Buscar guías</button></div>
      {loading ? <p role="status">Cargando fuentes…</p> : null}{error ? <p role="alert" className={styles.fieldError}>{error} <button className={styles.textButton} type="button" onClick={retry}>Reintentar catálogo</button></p> : null}
      {catalog.nextCursor ? <button className={styles.textButton} disabled={loading} type="button" onClick={more}>Mostrar más guías</button> : null}
      {!pkg.sources.length ? <p className={styles.emptyState}>Todavía no hay fuentes. Añade la primera para documentar tus objetivos.</p> : null}
      {!loading && !error && !catalog.items.length ? <p className={styles.fieldHint}>No hay guías disponibles con esta búsqueda.</p> : null}
      {fileError ? <p role="alert" className={styles.fieldError}>{fileError}</p> : null}
    </section>
    {pkg.sources.map((source, index) => { const path = `package.sources.${index}`; const binding = draft.bindings.sources.find((item) => item.key === source.key); const block = sourceDeletionBlockV2(pkg, source.key); const selected = catalog.items.find((item) => item.revision?.resourceRevisionId === binding?.resourceRevisionId); return <section className={styles.card} key={source.key} aria-label={`Fuente ${index + 1}`}><div className={styles.sectionHeading}><h3>{source.title || `Fuente ${index + 1}`}</h3><button className={styles.dangerButton} disabled={disabled || Boolean(block)} title={block ?? undefined} type="button" onClick={() => setDeleting(source.key)}>Eliminar fuente</button></div>{block ? <p className={styles.fieldHint}>{block}</p> : null}
      <fieldset className={styles.fieldset} disabled={disabled}><legend className={local.visuallyHidden}>Editar {source.title || `fuente ${index + 1}`}</legend><div className={styles.fieldGrid}>
        <FieldV2 label="Nombre de la fuente" path={`${path}.title`} issues={issues} wide>{(input) => <input {...input} maxLength={500} required value={source.title} onChange={(event) => patch(source.key, { title: event.target.value })} />}</FieldV2>
        <FieldV2 label="Tipo de fuente" path={`${path}.kind`} issues={issues}>{(input) => <select {...input} value={source.kind} onChange={(event) => { const kind = event.target.value as "guide" | "reference"; onChange({ ...draft, package: { ...pkg, sources: pkg.sources.map((item) => item.key === source.key ? { ...item, kind, documentSha256: "", verification: "provided", checkedAt: null, locator: { heading: "", sectionPath: [], page: null }, excerpt: "" } : item) }, bindings: { ...draft.bindings, sources: draft.bindings.sources.filter((item) => item.key !== source.key) } }); }}><option value="guide">Guía del catálogo</option><option value="reference">Referencia bibliográfica</option></select>}</FieldV2>
        {source.kind === "guide" ? <FieldV2 label="Guía y revisión" path={`${path}.binding`} issues={issues} hint="La revisión y su huella se toman del catálogo. Cambiarla requiere localizar de nuevo el fragmento.">{(input) => <select {...input} value={binding?.resourceRevisionId ?? ""} onChange={(event) => { if (!event.target.value) { onChange({ ...draft, package: { ...pkg, sources: pkg.sources.map((item) => item.key === source.key ? { ...item, documentSha256: "", locator: { heading: "", sectionPath: [], page: null }, excerpt: "", verification: "provided", checkedAt: null } : item) }, bindings: { ...draft.bindings, sources: draft.bindings.sources.filter((item) => item.key !== source.key) } }); return; } const item = catalog.items.find((entry) => entry.revision?.resourceRevisionId === event.target.value); if (item) { const next = bindCatalogSourceV2(draft, source.key, item); if (next) onChange(next); } }}><option value="">Selecciona una guía con revisión</option>{binding?.resourceRevisionId && !selected ? <option value={binding.resourceRevisionId}>Vínculo guardado · {source.title || "Guía"}</option> : null}{catalog.items.map((item) => <option key={item.sourceContentId} disabled={!item.revision} value={item.revision?.resourceRevisionId ?? `unavailable:${item.sourceContentId}`}>{item.title} · {item.revision ? `revisión ${item.revision.revisionNumber}` : "sin revisión vigente almacenada"}</option>)}</select>}</FieldV2> : <FieldV2 label="Documento de referencia" path={`${path}.documentSha256`} issues={issues} hint="Selecciona el documento para calcular su huella. El archivo permanece en tu dispositivo.">{(input) => <input {...input} type="file" onChange={(event) => void fingerprint(source.key, event.target.files?.[0])} />}</FieldV2>}
        <FieldV2 label="Cita bibliográfica" path={`${path}.citation`} issues={issues} wide>{(input) => <textarea {...input} rows={2} maxLength={2000} value={source.citation} onChange={(event) => patch(source.key, { citation: event.target.value })} />}</FieldV2>
        <FieldV2 label="Sección o encabezado" path={`${path}.locator.heading`} issues={issues}>{(input) => <input {...input} maxLength={500} value={source.locator.heading} onChange={(event) => patch(source.key, { locator: { ...source.locator, heading: event.target.value } })} />}</FieldV2>
        <FieldV2 label="Página" path={`${path}.locator.page`} issues={issues}>{(input) => <input {...input} type="number" min={1} step={1} value={source.locator.page ?? ""} onChange={(event) => patch(source.key, { locator: { ...source.locator, page: event.target.value === "" ? null : Number(event.target.value) } })} />}</FieldV2>
        <FieldV2 label="Ruta de secciones" path={`${path}.locator.sectionPath`} issues={issues} wide hint="Un encabezado por línea, desde la sección principal hasta el fragmento.">{(input) => <textarea {...input} rows={2} value={source.locator.sectionPath.join("\n")} onChange={(event) => patch(source.key, { locator: { ...source.locator, sectionPath: event.target.value ? event.target.value.split("\n") : [] } })} />}</FieldV2>
        <FieldV2 label="Fragmento de la fuente" path={`${path}.excerpt`} issues={issues} wide>{(input) => <textarea {...input} rows={4} maxLength={10000} value={source.excerpt} onChange={(event) => patch(source.key, { excerpt: event.target.value })} />}</FieldV2>
        <FieldV2 label="Enlace HTTPS" path={`${path}.url`} issues={issues} wide>{(input) => <input {...input} type="url" value={source.url ?? ""} onChange={(event) => patch(source.key, { url: event.target.value || null })} />}</FieldV2>
        <FieldV2 label="Estado bibliográfico" path={`${path}.verification`} issues={issues}>{(input) => <select {...input} value={source.verification} onChange={(event) => patch(source.key, { verification: event.target.value as typeof source.verification, checkedAt: null })}><option value="provided">Fuente aportada</option><option value="verified">Verificada editorialmente</option><option value="unverified">Pendiente de verificar</option></select>}</FieldV2>
        <FieldV2 label="Fecha de comprobación" path={`${path}.checkedAt`} issues={issues}>{(input) => <input {...input} type="date" value={source.checkedAt ?? ""} onChange={(event) => patch(source.key, { checkedAt: event.target.value || null })} />}</FieldV2>
      </div>{source.kind === "guide" && (!binding?.resourceRevisionId || !source.documentSha256) ? <p role="status" className={styles.fieldError}>Falta vincular esta fuente a una revisión vigente del catálogo.</p> : null}
      <details className={styles.disclosure}><summary>Detalles de trazabilidad</summary><FieldV2 label="Huella del documento" path={`${path}.documentSha256`} issues={issues}>{(input) => <input {...input} readOnly value={source.documentSha256} />}</FieldV2><p className={styles.fieldHint}>La huella identifica el documento. El estado bibliográfico lo declara el editor y no sustituye la revisión editorial.</p></details></fieldset>
    </section>; })}
    <AlertDialog.Root open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }}><AlertDialog.Portal><AlertDialog.Overlay className={styles.dialogOverlay} /><AlertDialog.Content className={styles.dialog} data-editor-surface><AlertDialog.Title className={styles.dialogTitle}>Eliminar fuente</AlertDialog.Title><AlertDialog.Description className={styles.dialogDescription}>Se retirará la fuente y su vínculo de este borrador. El documento original del catálogo se conserva.</AlertDialog.Description><div className={styles.dialogActions}><AlertDialog.Cancel asChild><button className={styles.secondaryButton} type="button">Cancelar</button></AlertDialog.Cancel><button className={styles.dangerButton} disabled={disabled || !deleting || Boolean(sourceDeletionBlockV2(pkg, deleting))} type="button" onClick={() => { onChange({ ...draft, package: { ...pkg, sources: pkg.sources.filter((source) => source.key !== deleting) }, bindings: { ...draft.bindings, sources: draft.bindings.sources.filter((binding) => binding.key !== deleting) } }); setDeleting(null); requestAnimationFrame(() => addRef.current?.focus()); }}>Confirmar eliminación</button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
