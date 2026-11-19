"use client";
import Link from "next/link";
import { ArrowRight, CaretDown, CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import type { V2MapMeta } from "../map/v2-adapter";
import { buildMapHref } from "../map/map-route";
import type { MapRoute } from "@cediah/contracts";
import { routeHref, stateMatches } from "./model";
import { RouteAction } from "./route-action";
import { RouteSignals } from "./signals";
import { recommendationTitle, unitActivityProgress } from "./curriculum-model";
import { RouteReason } from "./route-reason";
import mapStyles from "../map/learning-map.module.css";
import styles from "./map-panel.module.css";

export function V2MapPanel({ meta, route, onClose, onSelectUnit }: { meta: V2MapMeta; route: MapRoute; onClose: () => void; onSelectUnit?: (key: string) => void }) {
  const path = meta.path;
  const unit = path?.units.find(unit => unit.key === meta.unitKey);
  const state = path && stateMatches(path, meta.state) ? meta.state : null;
  const returnTo = buildMapHref(route, true);
  const progress = unit ? unitActivityProgress(unit, state) : null;
  const suggested = path && state ? recommendationTitle(path, state, unit) : null;
  const recommendation = suggested && (!unit || suggested.unit?.key === unit.key) ? suggested : null;
  const paused = path?.availability === "maintenance" || state?.availability === "maintenance";
  const unitIndex = path?.units.findIndex(item => item.key === unit?.key) ?? -1;
  const previous = path?.units[unitIndex - 1], next = path?.units[unitIndex + 1];
  return <aside className={`${mapStyles.panel} ${styles.panel}`} aria-label="Detalle de práctica por objetivos" data-engine-version="guided-v2">
    <header className={`${mapStyles.panelHeader} ${styles.header}`}><div className={styles.identity}><h2>{unit?.title ?? meta.card.title}</h2><div className={styles.meta}>
      {!unit ? <span>{path?.units.length ?? meta.card.unitCount} unidades</span> : null}
      {unit?.activities ? <span>{unit.activities.length} actividades</span> : null}
      {!unit && state?.motivation ? <span>{state.motivation.totalXp} XP acumulados</span> : null}
      <span className={styles.metaDivider} aria-hidden />
      <Link className={styles.routeLink} href={routeHref(meta.card.slug, unit?.key, returnTo)}>Detalle de la ruta <ArrowRight size={13} aria-hidden /></Link>
    </div></div><button type="button" className={mapStyles.iconButton} aria-label="Cerrar detalle" onClick={onClose}><X size={18} aria-hidden /></button></header>
    <div className={`${mapStyles.panelScroll} ${styles.scroll}`} data-panel-scroll>
      {progress?.total ? <div className={styles.progress}><span>{progress.completed} de {progress.total} completadas{progress.covered ? ` · ${progress.covered} ya cubiertas` : ""}</span><progress aria-label="Actividades completadas de esta unidad" value={progress.completed} max={progress.total} /></div> : null}
      {state ? !unit ? <details className={styles.routeProgress}><summary>Progreso de la ruta <CaretDown size={14} aria-hidden /></summary><RouteSignals state={state} appearance="overview" /></details> : null : meta.card.enrollmentId ? <p className={styles.notice} role="alert">No pudimos cargar el estado confirmado.</p> : <p className={styles.notice}>Comienza la ruta para practicar sus objetivos.</p>}
      <p className={styles.notice}>Abre la ruta para consultar los objetivos, todas las actividades y sus recursos.</p>
    </div>
    <footer className={styles.footer}>
      <Link className="learning-primary-button" href={routeHref(meta.card.slug, unit?.key, returnTo)}>Abrir ruta <ArrowRight size={18} aria-hidden /></Link>
      {path ? <>{paused ? <p className={styles.notice}>Ruta en mantenimiento. Tu historial se conserva.</p> : recommendation ? <div className={styles.next}><strong>{recommendation.title}</strong>{recommendation.unit && recommendation.unit.key !== unit?.key ? <span>{recommendation.unit.title}{unit ? " · Otra unidad" : ""}</span> : null}</div> : state?.nextAction.kind === "none" ? <p className={styles.notice}><RouteReason reason={state.nextAction.reason} timeZone={state.maintenance?.timeZone} relativeTo={state.maintenance?.generatedAt} /></p> : null}
        <div className={styles.actionRow} data-navigation={!!unit && !!onSelectUnit}>
          {unit && onSelectUnit ? <button type="button" className={styles.unitArrow} disabled={!previous} aria-label="Unidad anterior" title={previous?.title} onClick={() => previous && onSelectUnit(previous.key)}><CaretLeft size={20} aria-hidden /></button> : null}
          {recommendation && !paused ? <RouteAction path={path} state={state} returnTo={returnTo} target={recommendation.target} label={recommendation.kind === "resume" ? "Retomar sesión" : recommendation.kind === "review" || recommendation.kind === "retention" ? "Repasar" : recommendation.kind === "gate" ? recommendation.diagnostic ? "Hacer diagnóstico para avanzar" : "Comprobar lo aprendido" : recommendation.kind === "remediate" ? "Reforzar" : "Continuar actividad"} showReason={false} appearance="secondary" /> : unit && onSelectUnit ? <span className={styles.unitPosition}>{unitIndex + 1} de {path.units.length} unidades</span> : null}
          {unit && onSelectUnit ? <button type="button" className={styles.unitArrow} disabled={!next} aria-label="Unidad siguiente" title={next?.title} onClick={() => next && onSelectUnit(next.key)}><CaretRight size={20} aria-hidden /></button> : null}
        </div>
      </> : null}
    </footer>
  </aside>;
}
