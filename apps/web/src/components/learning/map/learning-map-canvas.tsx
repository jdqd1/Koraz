"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ReactFlow,
  MiniMap,
  applyNodeChanges,
  getStraightPath,
  useReactFlow,
  PanOnScrollMode,
  type EdgeProps,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import { ArrowsOut, Minus, Plus, MapTrifold } from "@phosphor-icons/react";
import type { LearningMapLevelResponse, MapItem } from "@cediah/contracts";
import {
  LearningNode,
  BlockNode,
  LessonNode,
  type FlowMapNode,
  type MapItemAction,
} from "./nodes/learning-map-item";
import {
  initialLayout,
  resolveDropOverlap,
  type Positions,
} from "./map-layout";
import {
  readSpatialSnapshot,
  writeSpatialSnapshot,
  spatialKey,
} from "./map-spatial-state";
import type { MapLayoutQueue } from "./use-map-layout-save";
import styles from "./learning-map.module.css";
type DiagramNode = FlowMapNode;
const nodeTypes = { node: LearningNode, block: BlockNode, lesson: LessonNode };
function ConnectionEdge(props: EdgeProps) {
  const [path] = getStraightPath(props);
  return <path id={props.id} className={`react-flow__edge-path ${styles.connectionPath}`} d={path} pathLength={1} fill="none" style={props.style} />;
}
const edgeTypes = { connection: ConnectionEdge };
export default function LearningMapCanvas({
  level,
  account,
  iconColors,
  queue,
  onOpen,
  onAction,
  onPrefetch,
  selecting,
  selected,
  organizing,
  phase,
  direction,
  movingId,
  onMoveFinished,
}: {
  level: LearningMapLevelResponse;
  account: string;
  iconColors: Record<string, string>;
  queue: MapLayoutQueue;
  onOpen: (item: MapItem) => void;
  onAction: (item: MapItem, action: MapItemAction) => void;
  onPrefetch: (item: MapItem) => () => void;
  selecting: boolean;
  selected: string[];
  organizing: boolean;
  phase: string;
  direction: "forward" | "back";
  movingId: string | null;
  onMoveFinished: () => void;
}) {
  const flow = useReactFlow<DiagramNode>();
  const longTitles = level.items.some((item) => item.title.length > 20);
  const wrapper = useRef<HTMLDivElement>(null),
    levelKey = useRef("");
  const lastMobile = useRef<boolean | null>(null);
  const [nodes, setNodes] = useState<DiagramNode[]>([]),
    [zoom, setZoom] = useState(1),
    [mini, setMini] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const cardHeight = mobile ? 118 : longTitles ? 210 : level.levelKey === "root" ? 184 : 172;
  const diagramOffset = 0;
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const box = wrapper.current;
    if (!box) return;
    const measure = () => {
      setMobile(window.matchMedia("(max-width: 767px)").matches);
      setCanvasSize((size) => size.width === box.clientWidth && size.height === box.clientHeight
        ? size
        : { width: box.clientWidth, height: box.clientHeight });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    measure();
    return () => observer.disconnect();
  }, []);
  const [outside, setOutside] = useState(false);
  const points = useRef<Positions>({});
  const fitLevel = useCallback(
    (maxZoom = 1) => {
      const box = wrapper.current?.querySelector(".react-flow");
      const positions = Object.values(points.current).map((point) => ({ ...point, y: point.y + diagramOffset }));
      if (!box || !positions.length) return;
      if (mobile) {
        wrapper.current?.scrollTo({ top: 0, behavior: "smooth" });
        return flow.setViewport({ x: 0, y: 0, zoom: 1 });
      }
      const width = level.levelKey === "root" ? 208 : 200;
      const height = Math.max(220, cardHeight);
      const extentX =
        Math.max(...positions.map((p) => p.x)) -
        Math.min(...positions.map((p) => p.x)) +
        width;
      const extentY =
        Math.max(...positions.map((p) => p.y)) -
        Math.min(...positions.map((p) => p.y)) +
        height;
      if (
        extentX * 0.65 > box.clientWidth ||
        extentY * 0.65 > box.clientHeight
      ) {
        const next = level.items[0];
        const point = next && points.current[next.occurrenceId];
        if (point)
          return flow.setCenter(point.x + width / 2, point.y + diagramOffset + height / 2, {
            zoom: 1,
          });
      }
      return flow.fitView({ padding: 0.18, minZoom: 0.65, maxZoom });
    },
    [cardHeight, diagramOffset, flow, level.items, level.levelKey, mobile],
  );
  const movingOriginal = useRef<Positions | null>(null);
  const snapshotKey = useCallback(
    () =>
      spatialKey(
        account,
        level.mapId,
        `${level.levelKey}:vertical-v2`,
        window.matchMedia("(max-width: 767px)").matches,
      ),
    [account, level.mapId, level.levelKey],
  );
  const saveViewport = useCallback(
    (v: Viewport) => {
      const box = wrapper.current;
      if (!box || !box.clientWidth || !box.clientHeight) return;
      writeSpatialSnapshot(snapshotKey(), {
        schemaVersion: 1,
        viewport: { ...v, zoom: Math.min(1.35, Math.max(0.65, v.zoom)) },
        selectedOccurrenceId: selected[0] ?? null,
        focusedOccurrenceId: selected[0] ?? null,
        navigationPath: level.ancestry.map((a) => a.route),
        containerWidth: box.clientWidth,
        containerHeight: box.clientHeight,
      });
      setZoom(v.zoom);
      setOutside(
        Object.values(points.current).some(
          (p) =>
            p.x * v.zoom + v.x < 0 ||
            (p.y + diagramOffset) * v.zoom + v.y < 0 ||
            (p.x + (level.levelKey === "root" ? 208 : 200)) * v.zoom + v.x > box.clientWidth ||
            (p.y + diagramOffset + 220) * v.zoom + v.y > box.clientHeight,
        ),
      );
    },
    [diagramOffset, level.ancestry, level.levelKey, selected, snapshotKey],
  );
  useEffect(() => {
    const changed = levelKey.current !== level.levelKey;
    const changedViewport = lastMobile.current !== null && lastMobile.current !== mobile;
    lastMobile.current = mobile;
    const root = level.levelKey === "root",
      width = wrapper.current?.clientWidth ?? 900;
    const positions = initialLayout(
      level.items.map((i) => i.occurrenceId),
      width,
      root,
      cardHeight,
    );
    points.current = positions;
    levelKey.current = level.levelKey;
    const childNodes: FlowMapNode[] = level.items.map((item, index) => ({
        id: item.occurrenceId,
        type: item.kind,
        position: { ...positions[item.occurrenceId]!, y: positions[item.occurrenceId]!.y + diagramOffset },
        className: styles.diagramChild,
        style: { pointerEvents: "all", "--appear-delay": `${Math.min(index, 4) * 24 + 150}ms` } as CSSProperties,
        draggable: organizing,
        dragHandle: ".map-drag-handle",
        selectable: false,
        focusable: false,
        data: {
          item,
          iconColor: iconColors[item.occurrenceId],
          mobile,
          selected: selected.includes(item.occurrenceId),
          selecting,
          organizing,
          onOpen,
          onAction,
          onPrefetch,
        },
      }));
    setNodes(childNodes);
    if (changed || changedViewport) {
      if (mobile) wrapper.current?.scrollTo(0, 0);
      const snapshot = changedViewport ? null : readSpatialSnapshot(snapshotKey());
      requestAnimationFrame(() => {
        if (mobile) void flow.setViewport({ x: 0, y: 0, zoom: 1 });
        else if (snapshot && Math.abs(width / snapshot.containerWidth - 1) <= 0.2)
          void flow.setViewport(snapshot.viewport);
        else if (snapshot) {
          const p =
            positions[snapshot.selectedOccurrenceId ?? ""] ??
            Object.values(positions)[0];
          if (p)
            void flow.setCenter(p.x + (level.levelKey === "root" ? 104 : 100), p.y + diagramOffset + 95, {
              zoom: snapshot.viewport.zoom,
            });
        } else void fitLevel();
      });
    }
  }, [
    level,
    queue,
    organizing,
    selected,
    selecting,
    onOpen,
    onAction,
    onPrefetch,
    iconColors,
    flow,
    snapshotKey,
    cardHeight,
    diagramOffset,
    fitLevel,
    mobile,
    canvasSize.width,
  ]);
  useEffect(() => {
    if (!mobile) return;
    const frame = requestAnimationFrame(() => {
      wrapper.current?.scrollTo(0, 0);
      void flow.setViewport({ x: 0, y: 0, zoom: 1 });
    });
    return () => cancelAnimationFrame(frame);
  }, [flow, level.levelKey, mobile]);
  const updatePoints = useCallback((next: Positions) => {
    points.current = { ...points.current, ...next };
    setNodes((current) => current.map((node) => {
      const point = points.current[node.id];
      return point ? { ...node, position: { x: point.x, y: point.y + diagramOffset } } : node;
    }));
  }, [diagramOffset]);
  useEffect(() => {
    if (!movingId) {
      movingOriginal.current = null;
      return;
    }
    movingOriginal.current = { ...points.current };
    const keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      const p = points.current[movingId];
      if (!p) return;
      const delta = {
        ArrowLeft: [-16, 0],
        ArrowRight: [16, 0],
        ArrowUp: [0, -16],
        ArrowDown: [0, 16],
      }[event.key];
      if (delta) {
        event.preventDefault();
        updatePoints({
          [movingId]: { x: p.x + delta[0]!, y: p.y + delta[1]! },
        });
      }
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Escape") updatePoints(movingOriginal.current!);
        else {
          const point = resolveDropOverlap(
            movingId,
            p,
            points.current,
            level.levelKey === "root",
            cardHeight,
          );
          updatePoints({ [movingId]: point });
          if (level.levelKey !== "root" && level.route.nodeId !== level.route.entryId)
            queue.enqueue(level.levelKey, { [movingId]: point });
        }
        onMoveFinished();
      }
    };
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
  }, [
    movingId,
    level.levelKey,
    level.route.nodeId,
    level.route.entryId,
    queue,
    updatePoints,
    onMoveFinished,
    cardHeight,
  ]);
  const changes = useCallback(
    (changes: NodeChange<DiagramNode>[]) =>
      setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );
  const edges = useMemo(
    () => {
      const sequence = level.items.slice(0, -1).map((item, index) => {
        const next = level.items[index + 1]!;
        return { sourceOccurrenceId: item.occurrenceId, targetOccurrenceId: next.occurrenceId };
      });
      const siblingEdges = (level.levelKey.startsWith("block:") ? sequence : []).map((e, index) => ({
        id: `${index}:${e.sourceOccurrenceId}:${e.targetOccurrenceId}`,
        source: e.sourceOccurrenceId,
        target: e.targetOccurrenceId,
        type: "connection",
        style: {
          stroke: "#8faee0",
          strokeWidth: 2,
          "--line-delay": `${Math.min(index, 5) * 65 + 90}ms`,
        } as CSSProperties,
        focusable: false,
        selectable: false,
      }));
      return siblingEdges;
    },
    [level.items, level.levelKey],
  );
  const contentHeight = mobile
    ? Math.max(canvasSize.height, ...nodes.map((n) => n.position.y + cardHeight + 60))
    : undefined;
  return (
    <div className={styles.canvas} ref={wrapper} data-long-titles={longTitles} data-mobile={mobile}>
      <div className={styles.flow} data-phase={phase} data-direction={direction} style={contentHeight ? { height: contentHeight } : undefined}>
        <ReactFlow<DiagramNode>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={changes}
          onNodeDragStop={(_e, n) => {
            const p = resolveDropOverlap(
              n.id,
              { x: n.position.x, y: n.position.y - diagramOffset },
              points.current,
              level.levelKey === "root",
              cardHeight,
            );
            updatePoints({ [n.id]: p });
            if (level.levelKey !== "root" && level.route.nodeId !== level.route.entryId)
              queue.enqueue(level.levelKey, { [n.id]: p });
          }}
          onMoveEnd={(_e, v) => saveViewport(v)}
          panOnDrag={!mobile}
          panOnScroll={!mobile}
          panOnScrollMode={PanOnScrollMode.Vertical}
          zoomOnScroll={false}
          zoomOnPinch={!mobile}
          minZoom={0.65}
          maxZoom={1.35}
          zoomOnDoubleClick={false}
          nodeDragThreshold={6}
          nodesConnectable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          nodesFocusable={false}
          edgesFocusable={false}
          onlyRenderVisibleElements={level.items.length >= 60}
          selectionOnDrag={false}
          ariaLabelConfig={{
            "controls.zoomIn.ariaLabel": "Acercar",
            "controls.zoomOut.ariaLabel": "Alejar",
            "controls.fitView.ariaLabel": "Ajustar vista",
          }}
          proOptions={{ hideAttribution: true }}
        >
          {level.items.length > 24 && outside && mini ? (
            <MiniMap pannable zoomable nodeColor="#d5e3da" />
          ) : null}
        </ReactFlow>
      </div>
      <div className={styles.controls} aria-label="Controles del mapa">
        <button
          className={styles.iconButton}
          aria-label="Alejar"
          onClick={() => void flow.zoomTo(Math.max(0.65, zoom - 0.1))}
        >
          <Minus size={18} />
        </button>
        <button
          className={styles.button}
          aria-label="Restablecer zoom al 100 %"
          onClick={() => void flow.zoomTo(1)}
        >
          {Math.round(zoom * 100)} %
        </button>
        <button
          className={styles.iconButton}
          aria-label="Acercar"
          onClick={() => void flow.zoomTo(Math.min(1.35, zoom + 0.1))}
        >
          <Plus size={18} />
        </button>
        <button
          className={styles.iconButton}
          aria-label="Ajustar vista"
          onClick={() => void fitLevel(1.35)}
        >
          <ArrowsOut size={18} />
        </button>
        {level.items.length > 24 && outside ? (
          <button
            className={styles.iconButton}
            aria-label="Alternar minimapa"
            aria-pressed={mini}
            onClick={() => setMini(!mini)}
          >
            <MapTrifold size={18} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
