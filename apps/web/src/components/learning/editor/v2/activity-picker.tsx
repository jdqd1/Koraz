"use client";

import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { BookOpen, CheckCircle, TextT, ChatText, Cards, ArrowsLeftRight, Image, ListNumbers, Stethoscope, Table, Graph, FlowArrow, MagnifyingGlass, X } from "@phosphor-icons/react";
import { activityTypesV2, type ActivityPresetV2 } from "./activity-model";
import { activityCatalogV2, activityExampleV2, activityPresetGroupsV2 } from "./activity-catalog";
import { ActivityStudentPreviewV2 } from "./activity-student-preview";
import { FieldV2 } from "./sources-fields";
import type { RoutePackage } from "@cediah/contracts";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export const activityIconsV2 = { study: BookOpen, single_choice: CheckCircle, short_answer: TextT, constructed_response: ChatText, card: Cards, match: ArrowsLeftRight, image_target: Image, sequence: ListNumbers, case: Stethoscope, comparison: Table, causal_map: Graph, mechanism: FlowArrow, error: MagnifyingGlass };

export function ActivityPickerV2({ pkg, disabled, open, onOpenChange, onCreate, presets }: {
  pkg: RoutePackage; disabled: boolean; open: boolean; onOpenChange: (open: boolean) => void;
  onCreate: (preset: ActivityPresetV2, objectiveKey: string) => void; presets?: readonly ActivityPresetV2[];
}) {
  const [preset, setPreset] = useState<ActivityPresetV2>(presets?.[0] ?? "study");
  const creating = useRef(false);
  const [objectiveKey, setObjectiveKey] = useState("");
  const selectedObjective = pkg.objectives.some(item => item.key === objectiveKey) ? objectiveKey : pkg.objectives[0]?.key ?? "";
  const info = activityCatalogV2[preset];
  const examples = activityExampleV2(preset);
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = examples[Math.min(exampleIndex, examples.length - 1)]!;
  const cannotCreate = disabled || !selectedObjective || pkg.activities.length + info.count > 2000;
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className={`${styles.dialogOverlay} ${local.dialogOverlay}`} />
    <Dialog.Content className={local.pickerDialog} data-editor-surface aria-describedby={undefined} onCloseAutoFocus={event => { if (creating.current) { event.preventDefault(); creating.current = false; } }}>
      <header className={local.pickerHeader}><Dialog.Title>Elegir actividad</Dialog.Title><Dialog.Close asChild><button className={local.iconButton} type="button" aria-label="Cerrar selector de actividades"><X size={22} aria-hidden /></button></Dialog.Close></header>
      <div className={local.pickerBody}>
        <nav className={local.pickerTypes} aria-label="Tipos de actividad">{activityPresetGroupsV2.filter(group => group.presets.some(value => !presets || presets.includes(value))).map(group => <div key={group.label}><h3>{group.label}</h3>{group.presets.filter(value => !presets || presets.includes(value)).map(value => {
          const Icon = activityIconsV2[value];
          return <button type="button" key={value} aria-pressed={preset === value} onClick={() => { setPreset(value); setExampleIndex(0); }}><Icon size={20} aria-hidden /><span>{activityTypesV2[value]}</span></button>;
        })}</div>)}</nav>
        <div className={local.pickerPreview}>
          <div className={local.typeExplanation}><h2>{activityTypesV2[preset]}</h2><p>{info.purpose}</p><div><strong>Cuándo usarla</strong><p>{info.when}</p></div></div>
          {preset === "mechanism" ? <div className={local.caseTabs} aria-label="Partes de la actividad"><button type="button" aria-pressed={exampleIndex === 0} onClick={() => setExampleIndex(0)}>Ordenar el proceso</button><button type="button" aria-pressed={exampleIndex === 1} onClick={() => setExampleIndex(1)}>Explicar el mecanismo</button></div> : null}
          <ActivityStudentPreviewV2 key={`${preset}:${exampleIndex}`} activity={example} activities={examples} example />
        </div>
      </div>
      <footer className={local.pickerFooter}>
        <FieldV2 label="Objetivo de nueva actividad" path="activity.newObjective">{input => <select {...input} value={selectedObjective} disabled={disabled} onChange={event => setObjectiveKey(event.target.value)}>{!selectedObjective ? <option value="">Añade un objetivo primero</option> : null}{pkg.objectives.map(objective => <option key={objective.key} value={objective.key}>{objective.title || "Objetivo sin título"}</option>)}</select>}</FieldV2>
        <button className={styles.primaryAction} type="button" disabled={cannotCreate} onClick={() => { creating.current = true; onCreate(preset, selectedObjective); }}>{info.count === 1 ? "Crear actividad" : `Crear ${info.count} actividades`}</button>
      </footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
