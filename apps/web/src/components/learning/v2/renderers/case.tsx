"use client";

import type { ReactNode } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import styles from "../composition.module.css";

/** Runtime manifests contain the authorized child, with its current narrative in prompt. */
export function CaseRenderer({ activity, children }: { activity: V2PublicActivity; children?: ReactNode }) {
  return <section className={styles.caseStage} aria-label="Paso del caso progresivo">
    <p>La siguiente parte del caso se mostrará cuando tu respuesta esté confirmada.</p>
    {activity.kind === "case" ? <><p className={styles.narrative}>{activity.payload.activeStage.narrative}</p><p role="status">La pregunta de este paso debe cargarse desde la sesión confirmada. Recarga para continuar.</p></> : children}
  </section>;
}
