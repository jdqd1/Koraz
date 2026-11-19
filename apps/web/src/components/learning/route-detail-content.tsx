"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { contextFromQuery, learningAnchor, learningRouteHref, type LearningRouteContext } from "@/lib/learning-navigation";
import styles from "./v2/curriculum.module.css";

/** Both curricula use the same URL-backed tabs, disclosure and focus behavior. */
export function RouteDetailContent({ slug, context = {}, activities, resources }: { slug: string; context?: LearningRouteContext; activities: ReactNode; resources: ReactNode }) {
  const params = useSearchParams(), pathname = usePathname();
  const id = useId(), root = useRef<HTMLDivElement>(null);
  const tab = params.get("pestana") === "resources" ? "resources" : "activities";
  const query = params.toString();
  function navigate(patch: LearningRouteContext) {
    const current = contextFromQuery(Object.fromEntries(params));
    window.history.pushState(null, "", learningRouteHref(slug, { ...current, ...patch }));
  }
  useEffect(() => {
    const requested = contextFromQuery(Object.fromEntries(new URLSearchParams(query)));
    if (document.activeElement?.getAttribute("role") === "tab") return;
    if (tab === "resources") {
      const selected = root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      const frame = requestAnimationFrame(() => { selected?.focus({ preventScroll: true }); selected?.scrollIntoView({ block: "center" }); });
      return () => cancelAnimationFrame(frame);
    }
    const target = document.getElementById(learningAnchor(requested)) ?? document.getElementById(learningAnchor(context));
    if (!target || !root.current?.contains(target)) return;
    let parent: HTMLElement | null = target;
    while (parent && parent !== root.current) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    const focus = target instanceof HTMLDetailsElement ? target.querySelector("summary") : target;
    const frame = requestAnimationFrame(() => { (focus as HTMLElement | null)?.focus({ preventScroll: true }); target.scrollIntoView({ block: "start" }); });
    return () => cancelAnimationFrame(frame);
  }, [query, tab, context]);
  const tabs = [{ key: "activities" as const, title: "Actividades" }, { key: "resources" as const, title: "Recursos" }];
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + 2) % 2;
    navigate({ tab: tabs[next]!.key });
    const target = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next];
    target?.focus(); target?.scrollIntoView({ block: "center" });
  }
  return <div ref={root} className={styles.content} onClickCapture={event => {
    if (!pathname.startsWith("/aprendizaje/rutas/")) return;
    const summary = (event.target as HTMLElement).closest("summary"), unit = summary?.parentElement;
    if (unit instanceof HTMLDetailsElement && unit.dataset.unitKey && !unit.open) navigate({ unit: unit.dataset.unitKey, objective: undefined, activity: undefined });
  }}>
    <div role="tablist" aria-label="Contenido de la ruta" className={styles.tabs}>{tabs.map((item, index) => <button key={item.key} id={`${id}-${item.key}-tab`} type="button" role="tab" aria-selected={tab === item.key} aria-controls={`${id}-${item.key}`} tabIndex={tab === item.key ? 0 : -1} onClick={() => navigate({ tab: item.key })} onKeyDown={event => move(event, index)}>{item.title}</button>)}</div>
    <div role="tabpanel" id={`${id}-activities`} aria-labelledby={`${id}-activities-tab`} hidden={tab !== "activities"} className={styles.tabBody}>{activities}</div>
    <div role="tabpanel" id={`${id}-resources`} aria-labelledby={`${id}-resources-tab`} hidden={tab !== "resources"} className={styles.tabBody}>{resources}</div>
  </div>;
}
