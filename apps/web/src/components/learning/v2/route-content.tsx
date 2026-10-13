"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { V2Path, V2State } from "./model";
import { RouteCurriculum, CurriculumResources } from "./curriculum";
import styles from "./curriculum.module.css";

export function RouteContent({ path, state, focusUnit, unitOnly = false, returnTo }: { path: V2Path; state: V2State | null; focusUnit?: string; unitOnly?: boolean; returnTo?: string | null }) {
  const [tab, setTab] = useState("activities");
  const id = useId();
  const tabs = [{ key: "activities", title: "Actividades" }, { key: "resources", title: "Recursos" }];
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + direction + tabs.length) % tabs.length;
    setTab(tabs[next]!.key);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
  return <div className={styles.content}>
    <div role="tablist" aria-label={unitOnly ? "Contenido de la unidad" : "Contenido de la ruta"} className={styles.tabs}>{tabs.map((item, index) => <button key={item.key} id={`${id}-${item.key}-tab`} type="button" role="tab" aria-selected={tab === item.key} aria-controls={`${id}-${item.key}`} tabIndex={tab === item.key ? 0 : -1} onClick={() => setTab(item.key)} onKeyDown={event => move(event, index)}>{item.title}</button>)}</div>
    <div role="tabpanel" id={`${id}-activities`} aria-labelledby={`${id}-activities-tab`} hidden={tab !== "activities"} className={styles.tabBody}><RouteCurriculum path={path} state={state} focusUnit={focusUnit} unitOnly={unitOnly} returnTo={returnTo} /></div>
    <div role="tabpanel" id={`${id}-resources`} aria-labelledby={`${id}-resources-tab`} hidden={tab !== "resources"} className={styles.tabBody}><CurriculumResources path={path} focusUnit={focusUnit} unitOnly={unitOnly} /></div>
  </div>;
}
