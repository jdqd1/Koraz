"use client";
import Link from "next/link";
import { X } from "@phosphor-icons/react";
import type { V2MapMeta } from "../map/v2-adapter";
import { buildMapHref } from "../map/map-route";
import type { MapRoute } from "@cediah/contracts";
import { routeHref } from "./model";
import { RouteAction } from "./route-action";
import { ObjectiveList, RouteSignals } from "./signals";
import mapStyles from "../map/learning-map.module.css";
import styles from "./styles.module.css";

export function V2MapPanel({ meta, route, onClose }: { meta: V2MapMeta; route: MapRoute; onClose: () => void }) {
  const unit = meta.path?.units.find(unit => unit.key === meta.unitKey);
  const returnTo = buildMapHref(route);
  return <aside className={mapStyles.panel} aria-label="Detalle de práctica por objetivos" data-engine-version="guided-v2">
    <header className={mapStyles.panelHeader}><h2>{unit?.title ?? meta.card.title}</h2><button type="button" className={mapStyles.iconButton} aria-label="Cerrar detalle" onClick={onClose}><X size={18} /></button></header>
    <div className={mapStyles.panelScroll}><div className={styles.panel}>
      {meta.state ? <RouteSignals state={meta.state} /> : meta.card.enrollmentId ? <p role="alert">No pudimos cargar el estado confirmado.</p> : <p>Comienza la ruta para practicar sus objetivos.</p>}
      {unit ? <><h3>Al terminar podrás</h3><ObjectiveList objectives={unit.objectives} state={meta.state} /></> : null}
      {meta.path ? <><p>La siguiente acción corresponde al recorrido completo.</p><RouteAction path={meta.path} state={meta.state} returnTo={returnTo} /></> : null}
      <Link className="learning-secondary-button" href={routeHref(meta.card.slug, unit?.key, returnTo)}>Ver en la ruta</Link>
    </div></div>
  </aside>;
}
