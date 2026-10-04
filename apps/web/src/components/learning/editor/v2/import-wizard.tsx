"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ContentWorkspaceResponseSchema, RoutePackageSchema, V2BindingsSchema, V2HttpContracts, type ContentAsset, type RoutePackage } from "@cediah/contracts";
import type { z } from "zod";
import { createEditorV2Api, type EditorV2Api } from "./editor-api";
import type { EditorV2State } from "./editor-model";
import { useSourceCatalogV2 } from "./sources";
import { FieldV2, focusFieldIssueV2 } from "./sources-fields";
import { reviewFailureNoticeV2 } from "./review-workflow";
import { editorStatusLabels } from "../editor-workflow";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export const importLimitV2 = 10 * 1024 * 1024;
export function importIssueFieldV2(path: string) {
  const source = /^\/sources\/(\d+)/.exec(path);
  if (source) return `package.sources.${source[1]}.binding`;
  const asset = /^\/assets\/(\d+)/.exec(path);
  if (asset) return `bindings.assets.${asset[1]}.assetId`;
  if (path === "/bindings/topicContentId") return "bindings.topicContentId";
  return "import.file";
}
export function parseImportFileV2(text: string) {
  if (new TextEncoder().encode(text).byteLength > importLimitV2) throw new Error("El archivo supera 10 MiB.");
  const raw: unknown = JSON.parse(text);
  const wrapped = V2HttpContracts.editorExport.response.safeParse(raw);
  const pkg = RoutePackageSchema.safeParse(raw);
  if (wrapped.success) return wrapped.data;
  if (pkg.success) return { package: pkg.data, bindings: { topicContentId: "", sources: [], assets: [] } };
  throw new Error("El archivo no es un paquete de ruta válido. Revisa su estructura con el validador antes de importarlo.");
}
type ImportDraft = { package: RoutePackage; bindings: z.infer<typeof V2BindingsSchema> };
type Report = z.infer<typeof V2HttpContracts.importValidate.response>;
export function ImportWizardV2({ api: providedApi, state, onClose }: { api?: EditorV2Api; state?: EditorV2State; onClose?: () => void }) {
  const [api] = useState(() => providedApi ?? createEditorV2Api());
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [targetCurrent, setTarget] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [failureIssues, setFailureIssues] = useState<Report["issues"]>([]);
  const [imported, setImported] = useState<string | null>(null);
  const [importedAsDraft, setImportedAsDraft] = useState(true);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [assetNotice, setAssetNotice] = useState("");
  const [assetRetry, setAssetRetry] = useState(0);
  const catalog = useSourceCatalogV2();
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const [acceptedCommit, setAcceptedCommit] = useState<{ pathId: string; pathVersionId: string } | null>(null);
  const surface = useRef<HTMLElement>(null);
  const focus = useRef<string | null>(null);
  const fileSequence = useRef(0);
  const eligibleTarget = Boolean(state?.confirmed && !state.dirty && !state.conflict && state.operation === "idle" && ["draft", "changes_requested"].includes(state.confirmed.status));
  const expectedVersion = targetCurrent ? state?.confirmed?.editVersion ?? null : null;
  const targetPathId = targetCurrent ? state?.confirmed?.pathId ?? null : null;
  const [reportFingerprint, setReportFingerprint] = useState("");
  const fingerprint = JSON.stringify({ draft, targetPathId, expectedVersion });
  const reportCurrent = Boolean(report && reportFingerprint === fingerprint && (!targetCurrent || eligibleTarget));
  useLayoutEffect(() => { if (focus.current) { focusFieldIssueV2(surface.current, focus.current); focus.current = null; } });
  useEffect(() => {
    if (!draft?.package.assets.length) return;
    const abort = new AbortController();
    void fetch("/api/editor/content", { cache: "no-store", credentials: "same-origin", signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error("assets");
      const value = ContentWorkspaceResponseSchema.parse(await response.json());
      if (!abort.signal.aborted) { setAssets(value.items.flatMap((item) => item.asset?.status === "ready" ? [item.asset] : [])); setAssetNotice(""); }
    }).catch(() => { if (!abort.signal.aborted) setAssetNotice("No se pudo cargar el catálogo de archivos. Los vínculos importados se conservan."); });
    return () => abort.abort();
  }, [draft?.package.assets.length, assetRetry]);
  function edit(next: ImportDraft) { if (busy || imported || acceptedCommit) return; setDraft(next); setReport(null); setFailureIssues([]); setNotice(""); }
  async function read(file?: File) {
    if (!file || busy || imported || acceptedCommit) return;
    const sequence = ++fileSequence.current; setBusy(true); setNotice(""); setReport(null); setFailureIssues([]);
    try { if (file.size > importLimitV2) throw new Error("El archivo supera 10 MiB."); const next = parseImportFileV2(await file.text()); if (sequence === fileSequence.current) { setDraft(next); setReport(null); setTarget(false); request.current = null; focus.current = "bindings.topicContentId"; } }
    catch (error) { if (sequence === fileSequence.current) setNotice(error instanceof SyntaxError ? "El archivo no contiene JSON válido." : error instanceof Error ? error.message : "No se pudo leer el archivo."); }
    finally { if (sequence === fileSequence.current) setBusy(false); }
  }
  async function run(commit: boolean) {
    if (!draft || busy || imported || (targetCurrent && !eligibleTarget)) return;
    const body = { ...draft, targetPathId, expectedVersion };
    if (!commit && !V2HttpContracts.importValidate.body.safeParse(body).success) { setNotice("Selecciona el tema y completa los vínculos requeridos antes de validar."); return; }
    if (commit && !acceptedCommit && (!reportCurrent || !report?.readyToImport || Date.parse(report.expiresAt) <= Date.now())) { setNotice("Vuelve a validar el archivo antes de importar: la comprobación cambió o venció."); setReport(null); return; }
    const mutation = JSON.stringify(commit ? { importId: report!.importId, hash: report!.hash, expectedVersion } : body);
    if (request.current?.fingerprint !== mutation) request.current = { fingerprint: mutation, key: crypto.randomUUID() };
    setBusy(true); setNotice("");
    try {
      if (!commit) {
        const result = await api.validateImport(body, request.current.key);
        if (!result.ok) { setFailureIssues(result.issues ?? []); setNotice(reviewFailureNoticeV2(result.code, result.status)); return; }
        setReportFingerprint(fingerprint); setReport(result.value); request.current = null;
      } else {
        let receipt = acceptedCommit;
        if (!receipt) {
          const result = await api.commitImport(report!.importId, { hash: report!.hash, expectedVersion }, request.current.key);
          if (!result.ok) { setFailureIssues(result.issues ?? []); setNotice(result.status === 409 && !targetCurrent ? "Esta identidad y revisión ya existen con otro contenido. Conserva el archivo; para actualizar la ruta, abre su borrador y elige reemplazarlo con una revisión mayor antes de validar de nuevo." : reviewFailureNoticeV2(result.code, result.status)); if (result.code !== "network_error" && result.status !== 503) { setReport(null); request.current = null; } return; }
          setAcceptedCommit(result.value); receipt = result.value;
        }
        const loaded = await api.get(receipt.pathId);
        if (!loaded.ok || loaded.value.route.pathId !== receipt.pathId) { setNotice("La importación fue aceptada; falta confirmar la lectura. Reintenta para abrir la ruta, sin importarla otra vez."); return; }
        const stillDraft = loaded.value.route.pathVersionId === receipt.pathVersionId && ["draft", "changes_requested"].includes(loaded.value.route.status);
        setImportedAsDraft(stillDraft); setImported(loaded.value.route.pathId);
        setNotice(stillDraft ? "Borrador importado y confirmado. Requiere revisión editorial antes de publicarse." : `La importación ya estaba registrada. La ruta conserva su estado actual: ${editorStatusLabels[loaded.value.route.status]}.`); request.current = null;
      }
    } catch { setNotice("No se pudo confirmar la solicitud. Reintenta; se conserva su identidad."); }
    finally { setBusy(false); }
  }
  return <section ref={surface} className={`${local.stack} ${local.importWizard}`} aria-label="Importar ruta">
    <section className={styles.card}><div className={styles.sectionHeading}><div><h2>Importar ruta</h2><p>Archivo → vínculos → comprobación → diferencias → importar borrador.</p></div>{onClose ? <button className={styles.textButton} disabled={busy} type="button" onClick={onClose}>Cerrar importación</button> : null}</div>
      {state?.dirty ? <p>Los cambios del editor se conservan. Puedes importar una ruta nueva; guarda primero si quieres reemplazar este borrador.</p> : null}
      <FieldV2 label="Archivo de ruta (JSON, hasta 10 MiB)" path="import.file">{(input) => <input {...input} type="file" accept=".json,application/json" disabled={busy || Boolean(imported) || Boolean(acceptedCommit)} onChange={(event) => void read(event.target.files?.[0])} />}</FieldV2>
      {notice ? <p role="status">{notice}</p> : null}{busy ? <p role="status">Comprobando con el servidor…</p> : null}
      {failureIssues.length ? <ul className={local.issueList}>{failureIssues.map((issue, index) => <li key={index}>{issue.message}<p>{issue.suggestedFix}</p><button type="button" onClick={() => { focus.current = importIssueFieldV2(issue.path); setNotice(`${issue.suggestedFix} · ${index + 1}`); }}>Ir al campo</button></li>)}</ul> : null}
      {imported ? <a className={styles.primaryAction} href={`/panel/rutas/${encodeURIComponent(imported)}`}>{importedAsDraft ? "Abrir borrador importado" : "Abrir ruta existente"}</a> : null}
    </section>
    {draft && !imported ? <><section className={styles.card}><h3>{draft.package.route.title}</h3><fieldset className={styles.fieldset} disabled={busy || Boolean(acceptedCommit)}><legend>Resolver vínculos del catálogo</legend>
      <FieldV2 label="Destino" path="import.target">{(input) => <select {...input} value={targetCurrent ? "current" : "new"} onChange={(event) => { setTarget(event.target.value === "current"); setReport(null); }}><option value="new">Nueva ruta</option>{state?.confirmed ? <option value="current" disabled={!eligibleTarget}>Reemplazar este borrador guardado</option> : null}</select>}</FieldV2>
      <FieldV2 label="Tema del catálogo" path="bindings.topicContentId">{(input) => <select {...input} value={draft.bindings.topicContentId} onChange={(event) => edit({ ...draft, bindings: { ...draft.bindings, topicContentId: event.target.value } })}><option value="">Selecciona un tema</option>{draft.bindings.topicContentId && !catalog.catalog.topics.some((item) => item.id === draft.bindings.topicContentId) ? <option value={draft.bindings.topicContentId}>Vínculo importado · {draft.package.route.topicLabel}</option> : null}{catalog.catalog.topics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>}</FieldV2>
      <div className={local.inlineForm}><FieldV2 label="Buscar guías" path="catalog.search">{(input) => <input {...input} maxLength={120} value={catalog.query} onChange={(event) => catalog.setQuery(event.target.value)} />}</FieldV2><button className={styles.secondaryButton} disabled={catalog.loading} type="button" onClick={catalog.search}>Buscar</button></div>{catalog.error ? <p role="alert">{catalog.error} <button type="button" onClick={catalog.retry}>Reintentar catálogo</button></p> : null}{catalog.loading ? <p role="status">Cargando catálogo…</p> : null}{catalog.catalog.nextCursor ? <button type="button" onClick={catalog.more}>Mostrar más guías</button> : null}
      {draft.package.sources.map((source, index) => { const binding = draft.bindings.sources.find((entry) => entry.key === source.key); return <FieldV2 key={source.key} label={`Fuente: ${source.title}`} path={`package.sources.${index}.binding`} hint="La huella y el fragmento del archivo se conservan. El servidor comprueba que corresponden a la revisión seleccionada.">{(input) => <select {...input} value={binding?.resourceRevisionId ?? ""} onChange={(event) => { const item = catalog.catalog.items.find((entry) => entry.revision?.resourceRevisionId === event.target.value); edit({ ...draft, bindings: { ...draft.bindings, sources: [...draft.bindings.sources.filter((entry) => entry.key !== source.key), ...(item?.revision ? [{ key: source.key, sourceContentId: item.sourceContentId, resourceRevisionId: item.revision.resourceRevisionId }] : [])] } }); }}><option value="">{source.kind === "reference" ? "Referencia externa sin vínculo de catálogo" : "Selecciona la guía y revisión"}</option>{binding?.resourceRevisionId && !catalog.catalog.items.some((item) => item.revision?.resourceRevisionId === binding.resourceRevisionId) ? <option value={binding.resourceRevisionId}>Revisión importada · {source.title}</option> : null}{catalog.catalog.items.map((item) => <option disabled={!item.revision} key={item.sourceContentId} value={item.revision?.resourceRevisionId ?? `missing:${item.sourceContentId}`}>{item.title} · {item.revision ? `revisión ${item.revision.revisionNumber}` : "sin revisión"}</option>)}</select>}</FieldV2>; })}
      {draft.package.assets.map((asset, index) => { const binding = draft.bindings.assets.find((entry) => entry.key === asset.key); const matching = assets.filter((item) => item.kind === asset.mediaType); return <FieldV2 key={asset.key} label={`Archivo: ${asset.originalFileName}`} path={`bindings.assets.${index}.assetId`}>{(input) => <select {...input} value={binding?.assetId ?? ""} onChange={(event) => edit({ ...draft, bindings: { ...draft.bindings, assets: [...draft.bindings.assets.filter((entry) => entry.key !== asset.key), ...(event.target.value ? [{ key: asset.key, assetId: event.target.value }] : [])] } })}><option value="">Selecciona un archivo del catálogo</option>{binding && !matching.some((item) => item.id === binding.assetId) ? <option value={binding.assetId}>Archivo importado · {asset.originalFileName}</option> : null}{matching.map((item) => <option key={item.id} value={item.id}>{item.fileName}</option>)}</select>}</FieldV2>; })}{assetNotice ? <p role="alert">{assetNotice} <button type="button" onClick={() => setAssetRetry((value) => value + 1)}>Reintentar archivos</button></p> : null}
      <details><summary>Identidad y revisión del paquete</summary><p>Una revisión nueva debe tener un número mayor. Mantén la identidad al actualizar una ruta.</p><FieldV2 label="Revisión del paquete" path="package.revision">{(input) => <input {...input} type="number" min={1} step={1} value={draft.package.revision} onChange={(event) => edit({ ...draft, package: { ...draft.package, revision: event.target.valueAsNumber || 0 } })} />}</FieldV2></details>
    </fieldset><button className={styles.secondaryButton} disabled={busy || Boolean(acceptedCommit) || (targetCurrent && !eligibleTarget)} type="button" onClick={() => void run(false)}>Comprobar importación</button></section>
      {report ? <section className={styles.card}><h3>Diferencias e incidencias</h3><p>{report.readyToImport ? "Listo para importar como borrador. Esto no autoriza la publicación." : "Resuelve las incidencias antes de importar."}</p><p>Comprobación válida hasta {new Date(report.expiresAt).toLocaleString("es", { timeZone: "America/Caracas" })}.</p><ul className={local.issueList}>{report.issues.map((issue, index) => <li key={index}>{issue.message}<p>{issue.suggestedFix}</p><button type="button" className={styles.textButton} onClick={() => { focus.current = importIssueFieldV2(issue.path); setNotice(`${issue.suggestedFix} · ${index + 1}`); }}>Ir al campo</button></li>)}</ul><div className={local.diffRegion} role="region" aria-label="Diferencias del paquete" tabIndex={0}>{report.diff.length ? <table><thead><tr><th>Campo</th><th>Antes</th><th>Después</th></tr></thead><tbody>{report.diff.map((entry, index) => <tr key={index}><th>{entry.path}</th><td><pre>{JSON.stringify(entry.before, null, 2)}</pre></td><td><pre>{JSON.stringify(entry.after, null, 2)}</pre></td></tr>)}</tbody></table> : <p>Sin diferencias con el contenido comparado.</p>}</div><button className={styles.primaryAction} disabled={busy || !report.readyToImport || !reportCurrent} type="button" onClick={() => void run(true)}>{acceptedCommit ? "Confirmar borrador importado" : "Importar borrador"}</button></section> : null}
    </> : null}
  </section>;
}


