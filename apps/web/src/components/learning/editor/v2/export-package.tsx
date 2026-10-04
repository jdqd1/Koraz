"use client";

import { useState } from "react";
import { validateRoutePackage } from "@cediah/contracts";
import type { EditorV2Api } from "./editor-api";
import styles from "../route-editor.module.css";

export function downloadJsonV2(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ExportPackageV2({ pathId, api, disabled }: { pathId: string; api: EditorV2Api; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function download(report: boolean) {
    if (disabled || busy) return;
    setBusy(true); setNotice("");
    try {
      const result = await api.export(pathId);
      if (!result.ok) { setNotice("No se pudo descargar la versión guardada. Reintenta cuando la sesión y la conexión estén disponibles."); return; }
      const pkg = result.value.package;
      downloadJsonV2(report ? { packageKey: pkg.packageKey, revision: pkg.revision, ...validateRoutePackage(pkg) } : pkg, `${pkg.packageKey}.${report ? "cobertura" : "ruta"}.json`);
      setNotice(report ? "Reporte de cobertura descargado." : "Paquete portable descargado. No contiene progreso ni aprobaciones.");
    } finally { setBusy(false); }
  }
  return <section className={styles.card}><h3>Exportar</h3><p>Descarga el contenido confirmado. Guarda primero los cambios pendientes.</p><div className={styles.inlineActions}><button className={styles.secondaryButton} disabled={disabled || busy} type="button" onClick={() => void download(false)}>Exportar paquete</button><button className={styles.textButton} disabled={disabled || busy} type="button" onClick={() => void download(true)}>Descargar cobertura</button></div><p role="status">{busy ? "Preparando descarga…" : notice}</p></section>;
}
