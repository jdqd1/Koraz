"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { BookOpen, X } from "@phosphor-icons/react";
import { V2EditorSourceSectionsSchema, type RoutePackage } from "@cediah/contracts";
import type { z } from "zod";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

type Sections = z.infer<typeof V2EditorSourceSectionsSchema>;
type Source = RoutePackage["sources"][number];
export function selectSourceSectionV2(source: Source, guide: Sections, index: number, selection?: string): Source | null {
  const section = guide.sections[index];
  const excerpt = selection || section?.body;
  if (!section || guide.documentSha256 !== source.documentSha256 || !excerpt || excerpt.length > 10000 || !section.body.includes(excerpt)) return null;
  return { ...source, title: `${guide.title} · ${section.heading || "Contenido"}`.slice(0, 500),
    citation: source.citation || guide.title, excerpt, locator: { heading: section.heading, sectionPath: [section.heading].filter(Boolean), page: null } };
}
export function SourceSectionsV2({ source, resourceRevisionId, disabled, onChange }: { source: Source; resourceRevisionId: string; disabled: boolean; onChange: (source: Source) => void }) {
  const [open, setOpen] = useState(false);
  const [loadedGuide, setGuide] = useState<Sections | null>(null);
  const guide = loadedGuide?.resourceRevisionId === resourceRevisionId && loadedGuide.documentSha256 === source.documentSha256 ? loadedGuide : null;
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("");
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    void fetch(`/api/v2/editor/learning-paths/source-sections/${encodeURIComponent(resourceRevisionId)}`, { cache: "no-store", credentials: "same-origin", signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error("read");
      const next = V2EditorSourceSectionsSchema.parse(await response.json());
      if (next.resourceRevisionId !== resourceRevisionId || next.documentSha256 !== source.documentSha256) throw new Error("version");
      if (!abort.signal.aborted) { setGuide(next); setError(""); }
    }).catch(() => { if (!abort.signal.aborted) setError("No se pudieron cargar las secciones de esta versión. El fragmento guardado se conserva."); });
    return () => abort.abort();
  }, [open, resourceRevisionId, source.documentSha256, request]);
  const section = guide?.sections[index];
  const selectedSource = guide ? selectSourceSectionV2(source, guide, index, selection) : null;
  return <Dialog.Root open={open} onOpenChange={next => { if (next) { setGuide(null); setError(""); setSelection(""); setQuery(""); setIndex(0); } setOpen(next); }}><Dialog.Trigger asChild><button type="button" className={styles.secondaryButton} disabled={disabled}><BookOpen size={17} aria-hidden /> Elegir sección de la guía</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={`${styles.dialogOverlay} ${local.dialogOverlay}`} /><Dialog.Content className={`${styles.dialog} ${local.sectionsDialog}`} data-editor-surface>
    <div className={local.sectionsDialogHeading}><Dialog.Title className={styles.dialogTitle}>Secciones de la guía</Dialog.Title><Dialog.Close asChild><button className={local.iconButton} type="button" aria-label="Cerrar secciones"><X size={19} aria-hidden /></button></Dialog.Close></div>
    <Dialog.Description className={styles.dialogDescription}>{guide?.title || source.title || "Elige una sección y revisa su contenido antes de usarla."}</Dialog.Description>
    {!guide && !error ? <p role="status">Cargando secciones…</p> : null}
    {error ? <p role="alert">{error} <button type="button" className={styles.textButton} onClick={() => { setGuide(null); setError(""); setRequest(value => value + 1); }}>Reintentar secciones</button></p> : null}
    {guide ? <><label className={local.sectionSearch}>Buscar sección<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nombre o contenido…" /></label>
      <div className={local.sectionTags} aria-label="Secciones disponibles">{guide.sections.map((entry, i) => <button type="button" key={i} hidden={Boolean(query && !`${entry.heading} ${entry.body}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")))} aria-pressed={index === i} onClick={() => { setIndex(i); setSelection(""); }}>{entry.heading || `Sección ${i + 1}`}</button>)}</div>
      {!guide.sections.length ? <p>Esta versión no contiene secciones de texto. Puedes indicar un fragmento en la fuente.</p> : section ? <div className={local.sectionPreview}><h3>{section.heading || "Contenido"}</h3><label><span className={local.visuallyHidden}>Vista previa de la sección</span><textarea key={index} readOnly rows={10} value={section.body} onSelect={event => { const node = event.currentTarget; setSelection(node.value.slice(node.selectionStart, node.selectionEnd)); }} /></label>{section.body.length > 10000 ? <p>Esta sección es extensa. Selecciona en la vista previa un fragmento de hasta 10 000 caracteres.</p> : null}</div> : null}
      <div className={local.sectionDialogFooter}><span>{selection ? `${selection.length} caracteres seleccionados` : "El nombre y la ubicación se completan al elegir."}</span><button type="button" className={styles.primaryAction} disabled={disabled || !selectedSource} onClick={() => { if (selectedSource) { onChange(selectedSource); setOpen(false); } }}>{selection ? "Usar fragmento seleccionado" : "Usar esta sección"}</button></div>
    </> : null}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
