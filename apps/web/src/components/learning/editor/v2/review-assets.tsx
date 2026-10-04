"use client";

import { useEffect, useState } from "react";
import { ContentWorkspaceResponseSchema, type ContentAsset } from "@cediah/contracts";
import { FieldV2, type FormPropsV2 } from "./sources-fields";
import styles from "../route-editor.module.css";

export function ReviewAssetsV2({ draft, disabled, onChange }: FormPropsV2) {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!draft.package.assets.length) return;
    const abort = new AbortController();
    void fetch("/api/editor/content", { cache: "no-store", credentials: "same-origin", signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error("catalog");
      const value = ContentWorkspaceResponseSchema.parse(await response.json());
      if (!abort.signal.aborted) { setAssets(value.items.flatMap((item) => item.asset?.status === "ready" ? [item.asset] : [])); setNotice(""); }
    }).catch(() => { if (!abort.signal.aborted) setNotice("No se pudo leer el catálogo de archivos. Los vínculos guardados se conservan."); });
    return () => abort.abort();
  }, [draft.package.assets.length, retry]);
  if (!draft.package.assets.length) return null;
  return <section className={styles.card}><h3>Archivos y procedencia</h3><p>Verifica el archivo y sus derechos en el catálogo antes de aprobar. Cambiar estos datos invalida la revisión de la copia local.</p>{notice ? <p role="alert">{notice} <button type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar archivos</button></p> : null}
    <fieldset className={styles.fieldset} disabled={disabled}><legend>Revisar los archivos de la ruta</legend>{draft.package.assets.map((asset, index) => { const binding = draft.bindings.assets.find((entry) => entry.key === asset.key); const matching = assets.filter((item) => item.kind === asset.mediaType); const path = `package.assets.${index}`;
      function patch(values: Partial<typeof asset>) { onChange({ ...draft, package: { ...draft.package, assets: draft.package.assets.map((item) => item.key === asset.key ? { ...item, ...values } : item) } }); }
      return <div className={styles.fieldGrid} key={asset.key}>
        <FieldV2 label={`Archivo: ${asset.originalFileName}`} path={path}>{(input) => <select {...input} value={binding?.assetId ?? ""} onChange={(event) => onChange({ ...draft, bindings: { ...draft.bindings, assets: [...draft.bindings.assets.filter((entry) => entry.key !== asset.key), ...(event.target.value ? [{ key: asset.key, assetId: event.target.value }] : [])] } })}><option value="">Selecciona un archivo revisado</option>{binding && !matching.some((item) => item.id === binding.assetId) ? <option value={binding.assetId}>Vínculo guardado · {asset.originalFileName}</option> : null}{matching.map((item) => <option key={item.id} value={item.id}>{item.fileName}</option>)}</select>}</FieldV2>
        <FieldV2 label={`Derechos de ${asset.originalFileName}`} path={`${path}.rightsStatus`}>{(input) => <select {...input} value={asset.rightsStatus} onChange={(event) => patch({ rightsStatus: event.target.value as typeof asset.rightsStatus })}><option value="unverified">Sin verificar</option><option value="owned">Propios</option><option value="licensed">Con licencia</option><option value="public_domain">Dominio público</option></select>}</FieldV2>
        <FieldV2 label={`Crédito de ${asset.originalFileName}`} path={`${path}.credit`}>{(input) => <input {...input} maxLength={2000} value={asset.credit} onChange={(event) => patch({ credit: event.target.value })} />}</FieldV2>
        <FieldV2 label={`Texto alternativo de ${asset.originalFileName}`} path={`${path}.alt`}>{(input) => <input {...input} maxLength={1000} value={asset.alt} onChange={(event) => patch({ alt: event.target.value })} />}</FieldV2>
        <FieldV2 label={`Huella del archivo ${asset.originalFileName}`} path={`${path}.sha256`} hint="Copia la huella SHA-256 verificada del archivo. El servidor comprueba el catálogo.">{(input) => <input {...input} maxLength={64} value={asset.sha256 ?? ""} onChange={(event) => patch({ sha256: event.target.value || null })} />}</FieldV2>
      </div>;
    })}</fieldset>
  </section>;
}
