"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ReactFlow, Handle, Position, getBezierPath, useReactFlow, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { ArrowLeft, ArrowsOut, Minus, Plus, Stack } from "@phosphor-icons/react";
import type { LearningMapLevelResponse, MapItem } from "@cediah/contracts";
import { LearningNode, BlockNode, LessonNode, type FlowMapNode, type MapItemAction } from "./nodes/learning-map-item";
import { horizontalLevelLayout } from "./map-horizontal-layout";
import { readSpatialSnapshot, writeSpatialSnapshot, spatialKey } from "./map-spatial-state";
import styles from "./learning-map.module.css";

type OriginNode = Node<{ title: string; root: boolean; onBack: () => void }, "origin">;
type DiagramNode = FlowMapNode | OriginNode;
const ORIGIN_ID = "level-origin";

function LevelOrigin({ data }: NodeProps<OriginNode>) {
  return (
    <div className={styles.levelOrigin} data-root={data.root} aria-label={`Origen del nivel: ${data.title}`}>
      {!data.root ? <Handle type="target" position={Position.Left} isConnectable={false} /> : null}
      {data.root ? (
        <span className={styles.originLabel}><Stack size={18} /><strong title={data.title}>{data.title}</strong></span>
      ) : (
        <button className={`${styles.originLabel} nodrag nopan`} onClick={data.onBack} aria-label={`Volver desde ${data.title}`} title="Volver al nivel anterior">
          <ArrowLeft size={16} /><strong title={data.title}>{data.title}</strong>
        </button>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

function ConnectionEdge(props: EdgeProps) {
  const [path] = getBezierPath({
    sourceX: props.sourceX, sourceY: props.sourceY, sourcePosition: Position.Right,
    targetX: props.targetX, targetY: props.targetY, targetPosition: Position.Left,
    curvature: 0.45,
  });
  return <path id={props.id} className={`react-flow__edge-path ${styles.connectionPath}`} d={path} pathLength={1} fill="none" style={props.style} />;
}
const nodeTypes = { node: LearningNode, block: BlockNode, lesson: LessonNode, origin: LevelOrigin };
const edgeTypes = { connection: ConnectionEdge };

export default function LearningMapCanvas({
  level, account, iconColors, onOpen, onAction, onPrefetch, onBack,
  selecting, selected, phase, direction,
}: {
  level: LearningMapLevelResponse;
  account: string;
  iconColors: Record<string, string>;
  onOpen: (item: MapItem) => void;
  onAction: (item: MapItem, action: MapItemAction) => void;
  onPrefetch: (item: MapItem) => () => void;
  onBack: () => void;
  selecting: boolean;
  selected: string[];
  phase: string;
  direction: "forward" | "back";
}) {
  const flow = useReactFlow<DiagramNode>();
  const scroller = useRef<HTMLDivElement>(null);
  const framedLevel = useRef("");
  const pendingFrame = useRef<{ key: string; zoom: number } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const compact = size.width > 0 && size.width < 768;
  const root = level.levelKey === "root";
  const layout = useMemo(() => horizontalLevelLayout(
    level.items.map((item) => item.occurrenceId), size.width, size.height, compact,
  ), [level.items, size.width, size.height, compact]);
  const key = spatialKey(account, level.mapId, `${level.levelKey}:horizontal-v1`, compact);
  const [zoom, setZoom] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const fittedZoom = compact ? 1 : Math.max(0.65, Math.min(1, size.height / layout.contentHeight, size.width / layout.contentWidth));
  const viewportX = Math.max(0, (size.width - layout.contentWidth * zoom) / 2);
  const visibleItems = useMemo(() => level.items.length < 60 ? level.items : level.items.filter((item) => {
    const y = layout.positions[item.occurrenceId]!.y * zoom;
    return y + layout.cardHeight * zoom >= scrollTop - 200 && y <= scrollTop + size.height + 200;
  }), [level.items, layout, zoom, scrollTop, size.height]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setSize((previous) => previous.width === element.clientWidth && previous.height === element.clientHeight
        ? previous : { width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frameKey = `${key}:${size.width}:${size.height}`;
    if (!size.width || framedLevel.current === frameKey) return;
    framedLevel.current = frameKey;
    const saved = readSpatialSnapshot(key);
    const initialZoom = saved?.viewport.zoom ?? 1;
    pendingFrame.current = { key, zoom: initialZoom };
    void flow.setViewport({ x: Math.max(0, (size.width - layout.contentWidth * initialZoom) / 2), y: 0, zoom: initialZoom });
  }, [key, flow, size.width, size.height, layout.contentWidth]);

  useEffect(() => {
    if (pendingFrame.current?.key !== key || Math.abs(pendingFrame.current.zoom - zoom) > 0.001) return;
    // Frame only after the restored zoom and new level have both reached the DOM.
    const frame = requestAnimationFrame(() => {
      scroller.current?.scrollTo({ left: 0, top: Math.max(0, (layout.origin.y + layout.originHeight / 2) * zoom - size.height / 2) });
      pendingFrame.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [key, zoom, layout.origin.y, layout.originHeight, size.width, size.height]);

  const nodes = useMemo<DiagramNode[]>(() => [
    {
      id: ORIGIN_ID, type: "origin", position: layout.origin,
      style: { width: layout.originWidth, height: layout.originHeight, pointerEvents: "all" },
      data: { title: root ? "Mis rutas" : level.containerSummary.title, root, onBack },
      draggable: false, selectable: false, focusable: false,
    },
    ...visibleItems.map((item, index): FlowMapNode => ({
      id: item.occurrenceId, type: item.kind, position: layout.positions[item.occurrenceId]!,
      className: styles.diagramChild,
      style: { pointerEvents: "all", "--appear-delay": `${Math.min(index, 4) * 24 + 150}ms` } as CSSProperties,
      draggable: false, selectable: false, focusable: false,
      data: { item, iconColor: iconColors[item.occurrenceId], mobile: compact,
        selected: selected.includes(item.occurrenceId), selecting, organizing: false,
        onOpen, onAction, onPrefetch },
    })),
  ], [layout, visibleItems, level.containerSummary.title, root, onBack, iconColors, compact, selected, selecting, onOpen, onAction, onPrefetch]);

  const edges = useMemo(() => visibleItems.map((item, index) => ({
    id: `origin:${item.occurrenceId}`, source: ORIGIN_ID, target: item.occurrenceId,
    type: "connection", focusable: false, selectable: false,
    style: { "--line-delay": `${Math.min(index, 5) * 45 + 60}ms` } as CSSProperties,
  })), [visibleItems]);
  const changeZoom = (next: number) => {
    const nextZoom = Math.min(1.35, Math.max(0.65, next));
    void flow.setViewport({ x: Math.max(0, (size.width - layout.contentWidth * nextZoom) / 2), y: 0, zoom: nextZoom });
  };
  const fitLevel = () => {
    changeZoom(fittedZoom);
    requestAnimationFrame(() => scroller.current?.scrollTo({ left: 0, top: Math.max(0, (layout.origin.y + layout.originHeight / 2) * fittedZoom - size.height / 2), behavior: "smooth" }));
  };

  return (
    <div className={`${styles.canvas} ${styles.horizontalCanvas}`} data-mobile={compact} style={{
      "--level-card-width": `${layout.cardWidth}px`, "--level-card-height": `${layout.cardHeight}px`,
    } as CSSProperties}>
      <div className={styles.canvasScroll} ref={scroller} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)} tabIndex={0} role="region" aria-label={`Mapa del nivel ${level.containerSummary.title}`}>
        <div className={styles.flow} data-phase={phase} data-direction={direction} style={{
          width: Math.max(size.width, layout.contentWidth * zoom),
          height: Math.max(size.height, layout.contentHeight * zoom),
        }}>
          {/* Only the incoming connection survives from the previous level. */}
          {!root ? <svg className={styles.incomingConnection} aria-label="Conexión con el nivel anterior" width={layout.origin.x * zoom + viewportX} height={2} style={{ top: (layout.origin.y + layout.originHeight / 2) * zoom }}>
            <line x1={0} y1={1} x2="100%" y2={1} />
          </svg> : null}
          <ReactFlow<DiagramNode>
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            onMoveEnd={(_event, viewport) => {
              setZoom(viewport.zoom);
              if (!size.width || !size.height) return;
              writeSpatialSnapshot(key, {
                schemaVersion: 1, viewport, selectedOccurrenceId: selected[0] ?? null,
                focusedOccurrenceId: selected[0] ?? null,
                navigationPath: level.ancestry.map((ancestor) => ancestor.route),
                containerWidth: size.width, containerHeight: size.height,
              });
            }}
            panOnDrag={false} panOnScroll={false} zoomOnScroll={false} zoomOnPinch={false}
            preventScrolling={false}
            minZoom={0.65} maxZoom={1.35} zoomOnDoubleClick={false}
            nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null}
            nodesFocusable={false} edgesFocusable={false} selectionOnDrag={false}
            proOptions={{ hideAttribution: true }}
          />
        </div>
      </div>
      <div className={styles.controls} aria-label="Controles del mapa">
        <button className={styles.iconButton} aria-label="Alejar" onClick={() => changeZoom(zoom - 0.1)}><Minus size={18} /></button>
        <button className={styles.button} aria-label="Restablecer zoom al 100 %" onClick={() => changeZoom(1)}>{Math.round(zoom * 100)} %</button>
        <button className={styles.iconButton} aria-label="Acercar" onClick={() => changeZoom(zoom + 0.1)}><Plus size={18} /></button>
        <button className={styles.iconButton} aria-label="Ajustar vista" onClick={fitLevel}><ArrowsOut size={18} /></button>
      </div>
    </div>
  );
}
