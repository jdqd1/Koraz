"use client";
import { memo, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { CaretRight, DotsThree, DotsSixVertical } from "@phosphor-icons/react";
import type { MapItem } from "@cediah/contracts";
import { MedicalMapIcon } from "../medical-map-icon";
import styles from "../learning-map.module.css";
import { v2MapItem, v2MapGroup, v2MapSummary } from "../v2-adapter";
import { V2MapStatus } from "../v2-status";
export type MapItemAction = "info" | "color";
export type ItemData = {
  item: MapItem;
  iconColor?: string;
  mobile?: boolean;
  selected: boolean;
  selecting: boolean;
  organizing: boolean;
  onOpen: (item: MapItem) => void;
  onAction: (item: MapItem, action: MapItemAction) => void;
  onPrefetch: (item: MapItem) => () => void;
};
export type FlowMapNode = Node<ItemData>;
export const statusLabels = {
  not_started: "No iniciado",
  in_progress: "En progreso",
  completed: "✓ Completado",
  empty: "Sin actividades",
  unavailable: "Progreso no disponible",
};
export const LearningMapItem = memo(function LearningMapItem({
  data,
  handles = false,
}: {
  data: ItemData;
  handles?: boolean;
}) {
  const { item } = data;
  const v2 = v2MapItem(item), group = v2MapGroup(item);
  const stateLabel = v2 ? v2.unitKey ? "Unidad" : "Ruta" : group ? "Rutas" : statusLabels[item.progress.status];
  const v2Summary = v2 ? v2MapSummary(v2) : group ? `${group.length} ${group.length === 1 ? "ruta por unidades" : "rutas por unidades"}` : null;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    cancel = useRef<(() => void) | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    cancel.current?.();
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      cancel.current?.();
    },
    [],
  );
  const prefetch = () => {
    clear();
    timer.current = setTimeout(() => {
      cancel.current = data.onPrefetch(item);
    }, 120);
  };
  return (
    <article
      className={styles.card}
      data-kind={item.kind}
      data-selected={data.selected}
      data-status={item.progress.status}
      aria-label={`${item.title}, ${v2Summary ?? statusLabels[item.progress.status]}, ${item.childCountLabel}`}
    >
      {handles ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            isConnectable={false}
            style={{ opacity: 0 }}
          />
          <Handle
            type="source"
            position={Position.Right}
            isConnectable={false}
            style={{ opacity: 0 }}
          />
        </>
      ) : null}
      {data.organizing ? (
        <span className={`${styles.drag} map-drag-handle`} aria-hidden="true">
          <DotsSixVertical size={18} />
        </span>
      ) : null}
      <details
        className={`${styles.menu} nodrag nopan`}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.currentTarget.open = false;
            e.stopPropagation();
            e.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary aria-label={`Opciones de ${item.title}`}>
          <DotsThree size={22} />
        </summary>
        <div className={styles.menuItems}>
          {(
            [
              "info",
              "color",
            ] as MapItemAction[]
          ).map((action) => (
            <button
              type="button"
              key={action}
              onClick={(e) => {
                e.currentTarget.closest("details")!.open = false;
                data.onAction(item, action);
              }}
            >
              {{ info: "Ver información", color: "Cambiar color del icono" }[action]}
            </button>
          ))}
        </div>
      </details>
      <button
        type="button"
        className={`${styles.openButton} nodrag nopan`}
        data-map-open={item.occurrenceId}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        onMouseLeave={clear}
        onBlur={clear}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") {
            clear();
            cancel.current = data.onPrefetch(item);
          }
        }}
        onClick={() => data.onOpen(item)}
        aria-pressed={data.selecting ? data.selected : undefined}
        aria-label={`${data.selecting ? "Seleccionar" : "Abrir"} ${item.title}`}
      >
        {data.selecting ? (
          <span aria-hidden="true">{data.selected ? "☑" : "☐"}</span>
        ) : null}
        <span className={styles.cardTop}>
          <span className={styles.iconWell} style={data.iconColor ? { color: data.iconColor } : undefined}>
            <MedicalMapIcon iconKey={item.iconKey} />
          </span>
          <span className={styles.badge} data-status={item.progress.status} title={stateLabel}>
            {stateLabel}
          </span>
        </span>
        <span className={styles.cardContent}>
          <span className={styles.cardHeading}>
            <strong title={item.title}>{item.title}</strong>
          </span>
          <span className={styles.cardMetric}>
            <span className={styles.percentage}>
              {v2?.unitKey || group ? item.childCountLabel : item.progress.percentage === null ? "—" : `${item.progress.percentage} %${v2 ? " de avance" : ""}`}
            </span>
            {item.kind !== "lesson" && !v2?.unitKey && !group ? <small>{item.childCountLabel}</small> : null}
            <CaretRight className={styles.cardChevron} size={14} aria-hidden="true" />
          </span>
          {v2 && !v2.unitKey ? <V2MapStatus meta={v2} /> : v2Summary ? <span className={styles.cardSignals} title={v2Summary}>{v2Summary}</span> : null}
          <span className={styles.progressTrack} aria-hidden="true">
            <span data-status={item.progress.status} style={{ width: `${item.progress.percentage ?? 0}%` }} />
          </span>
        </span>
      </button>
    </article>
  );
});
export const LearningNode = memo(function LearningNode({
  data,
}: NodeProps<FlowMapNode>) {
  return <LearningMapItem data={data} handles />;
});
export const BlockNode = LearningNode;
export const LessonNode = LearningNode;
