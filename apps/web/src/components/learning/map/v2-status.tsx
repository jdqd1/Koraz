import { CheckCircle, ShieldCheck, Clock } from "@phosphor-icons/react/dist/ssr";
import type { V2MapMeta } from "./v2-adapter";
import styles from "./learning-map.module.css";

export function V2MapStatus({ meta }: { meta: V2MapMeta }) {
  if (!meta.card.enrollmentId) return <span className={styles.mapStateBadge}>Por comenzar</span>;
  if (!meta.state) return <span className={styles.mapStateBadge}>Estado por cargar</span>;
  const learned = !!meta.state.masteredAt;
  const retained = !!meta.state.consolidatedAt;
  return <span className={styles.mapStateBadges}>
    <span className={styles.mapStateBadge} data-reached={learned} title={learned ? "Aprendizaje comprobado en las evaluaciones" : "Completa las evaluaciones para comprobar lo aprendido"}>{learned ? <CheckCircle size={12} aria-hidden weight="fill" /> : <ShieldCheck size={12} aria-hidden />}{learned ? "Comprobado" : "Por comprobar"}</span>
    <span className={styles.mapStateBadge} data-reached={retained} title={retained ? "Recordado en los repasos posteriores" : "Los repasos posteriores comprueban qué recuerdas con el tiempo"}><Clock size={12} aria-hidden />{retained ? "Repasado" : "Repaso"}</span>
    {meta.state.dueReviews > 0 ? <span className={styles.mapStateBadge} data-due="true">{meta.state.dueReviews} {meta.state.dueReviews === 1 ? "pendiente" : "pendientes"}</span> : null}
  </span>;
}
