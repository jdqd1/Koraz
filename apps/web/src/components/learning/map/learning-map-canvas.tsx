"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ReactFlow, Handle, Position, getBezierPath, useReactFlow, type EdgeProps, type Node, type NodeProps, type Viewport } from "@xyflow/react";
import { ArrowLeft, ArrowsOut, Minus, Plus, Stack } from "@phosphor-icons/react";
import type { LearningMapLevelResponse, MapItem } from "@cediah/contracts";
import { LearningNode, BlockNode, LessonNode, type FlowMapNode, type MapItemAction } from "./nodes/learning-map-item";
import { horizontalLevelLayout, visibleLevelRange } from "./map-horizontal-layout";
import { readSpatialSnapshot, writeSpatialSnapshot, spatialKey } from "./map-spatial-state";
import styles from "./learning-map.module.css";

type OriginNode = Node<{ title: string; root: boolean; onBack: () => void }, "origin">;
type DiagramNode = FlowMapNode | OriginNode;
const ORIGIN_ID = "level-origin";

const LevelOrigin = memo(function LevelOrigin({ data }: NodeProps<OriginNode>) {
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
});

const ConnectionEdge = memo(function ConnectionEdge(props: EdgeProps) {
  const [path] = getBezierPath({
    sourceX: props.sourceX, sourceY: props.sourceY, sourcePosition: Position.Right,
    targetX: props.targetX, targetY: props.targetY, targetPosition: Position.Left,
    curvature: 0.45,
  });
  return <path id={props.id} className={`react-flow__edge-path ${styles.connectionPath}`} d={path} pathLength={1} fill="none" style={props.style} />;
});
const nodeTypes = { node: LearningNode, block: BlockNode, lesson: LessonNode, origin: LevelOrigin };
const edgeTypes = { connection: ConnectionEdge };
const proOptions = { hideAttribution: true };

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
  const pendingFrame = useRef<{ key: string; zoom: number; top: number; left: number } | null>(null);
  const scrollFrame = useRef<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const compact = size.width > 0 && size.width < 768;
  const root = level.levelKey === "root";
  const layout = useMemo(() => horizontalLevelLayout(
    level.items.map((item) => item.occurrenceId), size.width, size.height, compact,
  ), [level.items, size.width, size.height, compact]);
  const key = spatialKey(account, level.mapId, `${level.levelKey}:horizontal-v2`, compact);
  const [zoom, setZoom] = useState(1);
  const [windowRange, setWindowRange] = useState({ key: "", start: 0, end: 0 });
  const rangeRef = useRef(windowRange);
  const virtualized = level.items.length >= 30;
  const fittedZoom = compact ? 1 : Math.max(0.65, Math.min(1, size.height / layout.contentHeight, size.width / layout.contentWidth));
  const viewportX = Math.max(0, (size.width - layout.contentWidth * zoom) / 2);
  const range = windowRange.key === key ? windowRange
    : visibleLevelRange(level.items.length, 0, size.height, zoom, layout.firstCardY, layout.rowStride);
  const syncVisibleRange = useCallback(() => {
    const next = { key, ...visibleLevelRange(level.items.length, scroller.current?.scrollTop ?? 0,
      size.height, zoom, layout.firstCardY, layout.rowStride) };
    const previous = rangeRef.current;
    if (previous.key === next.key && previous.start === next.start && previous.end === next.end) return;
    rangeRef.current = next;
    setWindowRange(next);
  }, [key, level.items.length, size.height, zoom, layout.firstCardY, layout.rowStride]);
  const saveFrame = useCallback(() => {
    const element = scroller.current;
    if (!element || !size.width || !size.height || pendingFrame.current) return;
    writeSpatialSnapshot(key, {
      schemaVersion: 1,
      // Scroll is native; React Flow's own viewport always keeps y = 0.
      viewport: { x: -element.scrollLeft, y: -element.scrollTop, zoom },
      selectedOccurrenceId: selected[0] ?? null, focusedOccurrenceId: selected[0] ?? null,
      navigationPath: level.ancestry.map((ancestor) => ancestor.route),
      containerWidth: size.width, containerHeight: size.height,
    });
  }, [key, zoom, selected, level.ancestry, size.width, size.height]);
  const onScroll = useCallback(() => {
    // Ordinary levels scroll without React updates. Large levels update at most once per frame,
    // and keep the same node objects until a row enters or leaves the overscan window.
    if (virtualized && scrollFrame.current === null) {
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = null;
        syncVisibleRange();
      });
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveFrame, 180);
  }, [virtualized, syncVisibleRange, saveFrame]);
  useEffect(() => {
    const frame = requestAnimationFrame(syncVisibleRange);
    return () => cancelAnimationFrame(frame);
  }, [syncVisibleRange]);
  useEffect(() => () => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveFrame();
  }, [saveFrame]);

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
    const initialZoom = saved?.viewport.zoom ?? zoom;
    pendingFrame.current = { key, zoom: initialZoom, top: saved ? -saved.viewport.y : 0, left: saved ? -saved.viewport.x : 0 };
    void flow.setViewport({ x: Math.max(0, (size.width - layout.contentWidth * initialZoom) / 2), y: 0, zoom: initialZoom });
  }, [key, flow, size.width, size.height, layout.contentWidth, zoom]);

  useEffect(() => {
    if (pendingFrame.current?.key !== key || Math.abs(pendingFrame.current.zoom - zoom) > 0.001) return;
    // Frame only after the restored zoom and new level have both reached the DOM.
    const frame = requestAnimationFrame(() => {
      const target = pendingFrame.current;
      if (!target) return;
      scroller.current?.scrollTo({ left: target.left, top: target.top });
      pendingFrame.current = null;
      syncVisibleRange();
    });
    return () => cancelAnimationFrame(frame);
  }, [key, zoom, layout.origin.y, layout.originHeight, size.width, size.height, syncVisibleRange]);

  const originNode = useMemo<OriginNode>(() => (
    {
      id: ORIGIN_ID, type: "origin", position: layout.origin,
      style: { width: layout.originWidth, height: layout.originHeight, pointerEvents: "all" },
      data: { title: root ? "Mis rutas" : level.containerSummary.title, root, onBack },
      draggable: false, selectable: false, focusable: false,
    }
  ), [layout.origin, layout.originWidth, layout.originHeight, root, level.containerSummary.title, onBack]);
  const itemNodes = useMemo(() => level.items.map((item, index): FlowMapNode => ({
      id: item.occurrenceId, type: item.kind, position: layout.positions[item.occurrenceId]!,
      className: styles.diagramChild,
      style: { width: layout.cardWidth, height: layout.cardHeight, pointerEvents: "all", "--appear-delay": `${Math.min(index, 3) * 16}ms` } as CSSProperties,
      draggable: false, selectable: false, focusable: false,
      data: { item, iconColor: iconColors[item.occurrenceId], mobile: compact,
        selected: selected.includes(item.occurrenceId), selecting, organizing: false,
        onOpen, onAction, onPrefetch },
    })), [layout, level.items, iconColors, compact, selected, selecting, onOpen, onAction, onPrefetch]);
  const nodes = useMemo<DiagramNode[]>(() => [originNode, ...itemNodes.slice(range.start, range.end)],
    [originNode, itemNodes, range.start, range.end]);

  const itemEdges = useMemo(() => level.items.map((item, index) => ({
    id: `origin:${item.occurrenceId}`, source: ORIGIN_ID, target: item.occurrenceId,
    type: "connection", focusable: false, selectable: false,
    style: { "--line-delay": `${Math.min(index, 3) * 10}ms` } as CSSProperties,
  })), [level.items]);
  const edges = useMemo(() => itemEdges.slice(range.start, range.end), [itemEdges, range.start, range.end]);
  const changeZoom = (next: number) => {
    const nextZoom = Math.min(1.35, Math.max(0.65, next));
    const element = scroller.current;
    pendingFrame.current = { key, zoom: nextZoom,
      top: Math.max(0, ((element?.scrollTop ?? 0) + size.height / 2) * nextZoom / zoom - size.height / 2),
      left: Math.max(0, ((element?.scrollLeft ?? 0) + size.width / 2) * nextZoom / zoom - size.width / 2) };
    void flow.setViewport({ x: Math.max(0, (size.width - layout.contentWidth * nextZoom) / 2), y: 0, zoom: nextZoom });
  };
  const fitLevel = () => {
    changeZoom(fittedZoom);
    pendingFrame.current = { key, zoom: fittedZoom, top: 0, left: 0 };
  };
  const onMoveEnd = useCallback((_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    setZoom(viewport.zoom);
  }, []);
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest(".react-flow__node, button, a, summary")) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "true";
    event.preventDefault();
  };
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={`${styles.canvas} ${styles.horizontalCanvas}`} data-mobile={compact} data-virtualized={virtualized} style={{
      "--level-card-width": `${layout.cardWidth}px`, "--level-card-height": `${layout.cardHeight}px`,
    } as CSSProperties}>
      <div className={styles.canvasScroll} ref={scroller} onScroll={onScroll}
        onPointerDown={startDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
        onPointerMove={(event) => {
          const start = drag.current;
          if (start?.id !== event.pointerId) return;
          event.currentTarget.scrollLeft = start.left + start.x - event.clientX;
          event.currentTarget.scrollTop = start.top + start.y - event.clientY;
        }}
        tabIndex={0} role="region" aria-label={`Mapa del nivel ${level.containerSummary.title}`}>
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
            onMoveEnd={onMoveEnd}
            panOnDrag={false} panOnScroll={false} zoomOnScroll={false} zoomOnPinch={false}
            preventScrolling={false}
            minZoom={0.65} maxZoom={1.35} zoomOnDoubleClick={false}
            nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null}
            nodesFocusable={false} edgesFocusable={false} selectionOnDrag={false}
            proOptions={proOptions}
          />
        </div>
      </div>
      <div className={styles.controls} aria-label="Controles del mapa">
        <button className={styles.iconButton} aria-label="Alejar" title="Alejar" disabled={zoom <= 0.65} onClick={() => changeZoom(zoom - 0.1)}><Minus size={18} /></button>
        <button className={styles.button} aria-label="Restablecer zoom al 100 %" title="Restablecer zoom" onClick={() => changeZoom(1)}>{Math.round(zoom * 100)} %</button>
        <button className={styles.iconButton} aria-label="Acercar" title="Acercar" disabled={zoom >= 1.35} onClick={() => changeZoom(zoom + 0.1)}><Plus size={18} /></button>
        <span className={styles.controlDivider} aria-hidden="true" />
        <button className={styles.iconButton} aria-label="Ajustar vista" title="Ajustar vista" onClick={fitLevel}><ArrowsOut size={18} /></button>
      </div>
    </div>
  );
}
