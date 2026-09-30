"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  CaretRight,
  ListBullets,
  MapTrifold,
  X,
} from "@phosphor-icons/react";
import type {
  MapItem,
  MapRoute,
} from "@cediah/contracts";
import { MapWorkspaceProvider, useMapWorkspace } from "./map-provider";
import type { MapClient } from "./map-client";
import { buildMapHref, ROOT_MAP_ROUTE } from "./map-route";
import { LearningMapItem, type MapItemAction } from "./nodes/learning-map-item";
import { MedicalMapIcon } from "./medical-map-icon";
import { LessonDetailPanel } from "./lesson-detail-panel";
import { MapMobileSheet } from "./map-mobile-sheet";
import { MapIconColorDialog } from "./map-icon-color-dialog";
import styles from "./learning-map.module.css";
const Canvas = dynamic(() => import("./learning-map-canvas"), {
  ssr: false,
  loading: () => <p className={styles.empty}>Preparando mapa…</p>,
});
function Workspace() {
  const {
    account,
    client,
    level,
    loading,
    error,
    phase,
    direction,
    queue,
    navigate,
    back,
    refresh,
    prefetch,
    detail,
  } = useMapWorkspace();
  const root = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const [wide, setWide] = useState(false),
    [list, setList] = useState(false);
  const selecting = false;
  const
    [info, setInfo] = useState<MapItem | "container" | null>(null),
    [colorItem, setColorItem] = useState<MapItem | null>(null),
    [iconColors, setIconColors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const backToParent = useCallback(() => { setInfo(null); back(); }, [back]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const size = () => {
      const parent = el.parentElement;
      const padding = parent
        ? parseFloat(getComputedStyle(parent).paddingBottom)
        : 0;
      el.style.setProperty(
        "--map-height",
        `${Math.max(400, window.innerHeight - el.getBoundingClientRect().top - padding)}px`,
      );
    };
    const observer = new ResizeObserver((entries) => {
      setWide(entries[0]!.contentRect.width >= 768);
      size();
    });
    observer.observe(el);
    window.addEventListener("resize", size);
    size();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", size);
    };
  }, []);
  const currentLevelKey = level?.levelKey;
  const mapId = level?.mapId;
  useEffect(() => {
    if (!mapId) return;
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(`map-icon-colors:${account}:${mapId}`);
        setIconColors(saved ? JSON.parse(saved) as Record<string, string> : {});
      } catch { setIconColors({}); }
    }, 0);
    return () => clearTimeout(timer);
  }, [account, mapId]);
  useEffect(() => {
    if (currentLevelKey) heading.current?.focus({ preventScroll: true });
  }, [currentLevelKey]);
  const routeFor = useCallback(
    (item: MapItem): MapRoute => {
      if (!level) return ROOT_MAP_ROUTE;
      return level.levelKey === "root" && item.kind === "block" && item.pathId
        ? { nodeId: item.pathId, entryId: item.pathId, unitStableKey: null }
        : item.kind === "node"
        ? { nodeId: item.occurrenceId, entryId: null, unitStableKey: null }
        : level.levelKey.startsWith("block:")
          ? { ...level.route, unitStableKey: item.unitStableKey }
          : {
              nodeId: level.route.nodeId,
              entryId: item.occurrenceId,
              unitStableKey: null,
            };
    },
    [level],
  );
  const open = useCallback(
    (item: MapItem) => {
      setInfo(null);
      navigate(routeFor(item));
    },
    [navigate, routeFor],
  );
  const action = useCallback((item: MapItem, action: MapItemAction) => {
    if (action === "info") {
      setInfo(item);
    }
    if (action === "color") {
      setColorItem(item);
    }
  }, []);
  const intention = useCallback(
    (item: MapItem) => prefetch(routeFor(item)),
    [prefetch, routeFor],
  );
  const closePanel = useCallback(() => {
    setInfo(null);
    if (level?.selectedLesson) back();
    else if (detail && level)
      window.history.replaceState(null, "", buildMapHref(level.route));
  }, [back, detail, level]);
  const saveIconColor = (item: MapItem, color: string | null) => {
    if (!level) return;
    const next = { ...iconColors };
    if (color) next[item.occurrenceId] = color;
    else delete next[item.occurrenceId];
    setIconColors(next);
    try { localStorage.setItem(`map-icon-colors:${account}:${level.mapId}`, JSON.stringify(next)); } catch { /* Keep this session's choice. */ }
    setColorItem(null);
  };
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !(e.target instanceof HTMLInputElement)
      )
        closePanel();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [closePanel]);
  async function resolveConflict(mine: boolean) {
    try {
      for (const [key, q] of queue.levels)
        if (q.state === "conflict") {
          const r =
            queue.routes.get(key) ??
            (key === "root"
              ? ROOT_MAP_ROUTE
              : key.startsWith("node:")
                ? { nodeId: key.slice(5), entryId: null, unitStableKey: null }
                : level?.levelKey === key
                  ? level.route
                  : null);
          if (!r)
            throw new Error(
              "Vuelve al bloque con cambios pendientes para resolver su conflicto.",
            );
          const saved = await client.level(r);
          queue.resolve(key, saved.layout.rowVersion, mine);
        }
      await refresh();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "No pudimos recuperar las posiciones.",
      );
    }
  }
  const selected = level?.selectedLesson
      ? [
          level.route.unitStableKey
            ? `lesson:${level.route.unitStableKey}`
            : level.route.entryId!,
        ]
      : [];
  const unavailableSelection =
    level?.route.entryId &&
    !level.selectedLesson &&
    level.items.find(
      (item) =>
        item.occurrenceId === level.route.entryId &&
        item.kind === "lesson" &&
        item.availability !== "available",
    );
  const panel = unavailableSelection ? (
    <aside className={styles.panel} aria-label="Lección no disponible">
      <header className={styles.panelHeader}>
        <h2>Lección no disponible</h2>
        <button
          className={styles.iconButton}
          aria-label="Cerrar lección"
          onClick={back}
        >
          <X size={18} />
        </button>
      </header>
      <div className={styles.panelScroll}>
        <p>
          La lección fue retirada o no existe en tu versión actual de la ruta.
          Tu organización y el progreso registrado se conservan.
        </p>
        <button
          className={styles.button}
          onClick={() => void refresh().catch((e) => setMessage(e.message))}
        >
          Actualizar contenido
        </button>
      </div>
    </aside>
  ) : level?.selectedLesson ? (
    <LessonDetailPanel
      key={`${level.selectedLesson.pathId}:${level.selectedLesson.unitStableKey}`}
      lesson={level.selectedLesson}
      onClose={closePanel}
    />
  ) : info || detail ? (
    <aside className={styles.panel} aria-label="Información del contenido">
      <header className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <h2>
            {info && info !== "container"
              ? info.title
              : level?.containerSummary.title}
          </h2>
          <p>{level?.containerSummary.description}</p>
        </div>
        <button
          className={styles.iconButton}
          aria-label="Cerrar información"
          onClick={closePanel}
        >
          <X size={18} />
        </button>
      </header>
      <div className={styles.panelScroll}>
        {info && info !== "container" ? (
          <>
            <p>
              {info.progress.percentage ?? "—"} % · {info.childCountLabel}
            </p>
            <button className={styles.primary} onClick={() => open(info)}>
              Abrir contenido
            </button>
          </>
        ) : (
          level?.items.map((item) => (
            <div className={styles.suggestion} key={item.occurrenceId}>
              <div>
                <strong>{item.title}</strong>
                <small>{item.progress.percentage ?? "—"} %</small>
              </div>
              <button
                className={styles.iconButton}
                aria-label={`Abrir ${item.title}`}
                onClick={() => open(item)}
              >
                <CaretRight size={18} />
              </button>
            </div>
          ))
        )}
        {level?.edges.length ? (
          <details>
            <summary>Relaciones del nivel</summary>
            <ul>
              {level.edges.map((e, i) => (
                <li key={i}>
                  {
                    level.items.find(
                      (x) => x.occurrenceId === e.sourceOccurrenceId,
                    )?.title
                  }{" "}
                  →{" "}
                  {
                    level.items.find(
                      (x) => x.occurrenceId === e.targetOccurrenceId,
                    )?.title
                  }
                  : {e.label}
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <p>No hay relaciones declaradas en este nivel.</p>
        )}
      </div>
    </aside>
  ) : null;
  return (
    <main className={styles.workspace} ref={root}>
      <div
        data-map-background
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <header className={styles.header}>
          <div className={styles.headerIdentity}>
            {level?.route.nodeId ? (
              <button
                className={`${styles.iconButton} ${styles.backButton}`}
                aria-label="Atrás en el mapa"
                onClick={backToParent}
              >
                <ArrowLeft size={20} />
              </button>
            ) : null}
            <div className={styles.headerText}>
              {level?.route.nodeId ? (
                <nav className={styles.breadcrumbs} aria-label="Ruta del mapa">
                  {level.ancestry.slice(0, -1).map((ancestor, index) => (
                    <span key={index}>
                      <button onClick={() => { setInfo(null); navigate(ancestor.route); }}>
                        {ancestor.title}
                      </button>
                      <CaretRight size={12} />
                    </span>
                  ))}
                </nav>
              ) : null}
              <h1 ref={heading} tabIndex={-1}>
                {level?.containerSummary.title ?? "Mi mapa de aprendizaje"}
              </h1>
              {level?.containerSummary.progress.percentage !== null && level ? (
                <span className={styles.status}>
                  {`${level.containerSummary.progress.percentage} % · ${level.containerSummary.progress.completedEssentialSteps}/${level.containerSummary.progress.totalEssentialSteps} esenciales`}
                </span>
              ) : null}
            </div>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.status} role="status">
              {loading ? "Abriendo…" : queue.state === "saving" ? "Guardando…" : queue.state === "saved" ? "" : "Posiciones pendientes"}
            </span>
            <button className={`${styles.button} ${styles.viewToggle}`} aria-label={list ? "Vista de mapa" : "Vista de lista"} title={list ? "Mapa" : "Lista"} onClick={() => setList(!list)}>
              {list ? <MapTrifold size={19} /> : <ListBullets size={19} />}
            </button>
          </div>
        </header>
        {error ? (
          <div className={styles.notice} role="alert">
            {error}
            <button
              className={styles.button}
              onClick={() => void refresh().catch((e) => setMessage(e.message))}
            >
              Reintentar
            </button>
            <button
              className={styles.button}
              onClick={() => navigate(ROOT_MAP_ROUTE)}
            >
              Ir a mi mapa
            </button>
          </div>
        ) : null}
        {queue.state === "conflict" ? (
          <div className={styles.notice} role="alert">
            Hay otras posiciones guardadas. Tu borrador se conserva.
            <button
              className={styles.button}
              onClick={() => void resolveConflict(true)}
            >
              Aplicar mis posiciones
            </button>
            <button
              className={styles.button}
              onClick={() => void resolveConflict(false)}
            >
              Usar las guardadas
            </button>
          </div>
        ) : queue.state === "failed" ? (
          <div className={styles.notice} role="alert">
            No se confirmaron las posiciones.
            <button
              className={styles.button}
              onClick={() => {
                for (const [key, q] of queue.levels)
                  if (q.state === "failed") void queue.flush(key);
              }}
            >
              Reintentar guardado
            </button>
          </div>
        ) : null}
        {message ? (
          <div className={styles.notice} role="status">
            {message}
          </div>
        ) : null}
        <div className={styles.body}>
          {!level ? (
            <div className={styles.empty}>
              <h2>
                {loading ? "Preparando tu mapa" : "No pudimos abrir el mapa"}
              </h2>
              <p>La información se confirma desde tu cuenta.</p>
            </div>
          ) : !level.items.length ? (
            <div className={styles.empty}>
              <MedicalMapIcon iconKey="folder" size={56} />
              <h2>No hay rutas disponibles</h2>
              <p>Las rutas publicadas aparecerán aquí cuando estén disponibles.</p>
            </div>
          ) : list ? (
            <div className={styles.list}>
              {level.items.map((item) => (
                <LearningMapItem
                  key={item.occurrenceId}
                  data={{
                    item,
                    iconColor: iconColors[item.occurrenceId],
                    selected: selected.includes(item.occurrenceId),
                    selecting,
                    organizing: false,
                    onOpen: open,
                    onAction: action,
                    onPrefetch: intention,
                  }}
                />
              ))}
            </div>
          ) : (
            <Canvas
              level={level}
              account={account}
              iconColors={iconColors}
              onOpen={open}
              onAction={action}
              onPrefetch={intention}
              onBack={backToParent}
              selecting={selecting}
              selected={selected}
              phase={phase}
              direction={direction}
            />
          )}
          {wide ? panel : null}
        </div>
        <span className={styles.hidden} aria-live="polite">
          {level
            ? `${level.containerSummary.title}, ${level.items.length} contenidos`
            : ""}
        </span>
      </div>
      {!wide && panel ? (
        <MapMobileSheet onClose={closePanel}>{panel}</MapMobileSheet>
      ) : null}
      {colorItem ? (
        <MapIconColorDialog
          item={colorItem}
          color={iconColors[colorItem.occurrenceId] ?? null}
          onChoose={(color) => saveIconColor(colorItem, color)}
          onClose={() => setColorItem(null)}
        />
      ) : null}
    </main>
  );
}
export function LearningMapWorkspace({
  account,
  client,
}: {
  account: string;
  client?: MapClient;
}) {
  return (
    <MapWorkspaceProvider key={account} account={account} client={client}>
      <ReactFlowProvider>
        <Workspace />
      </ReactFlowProvider>
    </MapWorkspaceProvider>
  );
}
