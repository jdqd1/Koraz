import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Stack } from "@phosphor-icons/react/dist/ssr";
import { covers, routeHref, stateMatches, type V2Card, type V2State } from "./model";
import { RouteSignals } from "./signals";
import styles from "./styles.module.css";

export function V2PathCard({ path, priority = false, state = null }: { path: V2Card; priority?: boolean; state?: V2State | null }) {
  const confirmed = stateMatches(path, state) ? state : null;
  return <article className="learning-path-card" data-engine-version="guided-v2"><Link className="learning-path-card-link" href={routeHref(path.slug)} aria-label={`Abrir ruta ${path.title}`}>
    <div className="learning-path-card-cover"><Image alt="" fill priority={priority} sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 360px" src={covers[path.coverKey]} />{path.enrollmentId ? <span className="learning-path-state">En curso</span> : null}</div>
    <div className="learning-path-card-copy"><span className="learning-topic-label">{path.topicLabel}</span><h2>{path.title}</h2><p>{path.summary}</p><div className="learning-path-facts"><span><Stack aria-hidden size={18} />{path.unitCount} unidades</span></div>
      {confirmed ? <RouteSignals state={confirmed} /> : path.enrollmentId ? <div className={styles.cardSignals}><span>{path.completed ? "Recorrido completado" : "Recorrido en curso"}</span><span>{path.mastered ? "Dominio alcanzado" : "Dominio por comprobar"}</span><span>{path.consolidated ? "Consolidación alcanzada" : "Consolidación pendiente"}</span><span>Consulta el repaso y los refuerzos en la ruta</span></div> : null}
      <span className="learning-card-action">Ver ruta <ArrowRight aria-hidden size={18} /></span></div>
  </Link></article>;
}
