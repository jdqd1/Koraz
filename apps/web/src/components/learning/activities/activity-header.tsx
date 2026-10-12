import Link from "next/link";
import { ArrowLeft, DotsThree } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import styles from "./activity-ui.module.css";

export function ActivityHeader({ title, eyebrow, returnHref, returnLabel = "Volver a mi mapa", onExit, details, completed, total, progressLabel = "Avance de la ruta" }: {
  title: string; eyebrow: string; returnHref?: string; returnLabel?: string; onExit?: () => void; details: ReactNode;
  completed?: number; total?: number; progressLabel?: string;
}) {
  return <header className={styles.header}>
    <div className={styles.headerRow}>
      {onExit ? <button type="button" className={styles.iconButton} onClick={onExit} aria-label="Cerrar vista previa"><ArrowLeft aria-hidden size={22} /></button>
        : <Link className={styles.iconButton} href={returnHref ?? "/aprendizaje/mapa"} aria-label={returnLabel} title={returnLabel}><ArrowLeft aria-hidden size={22} /></Link>}
      <div className={styles.headerTitle}><span>{eyebrow}</span><h1>{title}</h1></div>
      <details className={styles.sessionDetails}>
        <summary className={styles.iconButton} role="button" aria-label="Detalles de la sesión" title="Detalles de la sesión"><DotsThree aria-hidden size={26} weight="bold" /></summary>
        <div className={styles.detailsPanel}><strong>Detalles de la sesión</strong>{details}</div>
      </details>
    </div>
    {total !== undefined && total > 0 && completed !== undefined ? <div className={styles.progress}>
      <progress aria-label={progressLabel} value={Math.min(completed, total)} max={total} />
      <span>{completed} de {total}</span>
    </div> : null}
  </header>;
}
