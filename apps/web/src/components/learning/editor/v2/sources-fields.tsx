"use client";

import { useId, useState, type ReactNode } from "react";
import { Tooltip } from "radix-ui";
import { Question } from "@phosphor-icons/react";
import type { EditorV2Draft } from "./editor-model";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

export type FormIssueV2 = { path: string; message: string };
export type FormPropsV2 = { draft: EditorV2Draft; disabled: boolean; onChange: (draft: EditorV2Draft) => void; issues?: FormIssueV2[] };
export function HelpV2({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Tooltip.Provider delayDuration={300}><Tooltip.Root open={open} onOpenChange={setOpen}><Tooltip.Trigger asChild><button type="button" className={local.helpButton} aria-label={`Ayuda sobre ${label.toLocaleLowerCase("es")}`} onClick={() => setOpen(value => !value)}><Question size={16} aria-hidden /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className={local.helpTooltip} sideOffset={6} collisionPadding={16}>{children}<Tooltip.Arrow className={local.helpArrow} /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>;
}
export function normalizeFieldPathV2(path: string) {
  return path.startsWith("/") ? `package.${path.slice(1).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~")).join(".")}`.replace("package.bindings.", "bindings.") : path;
}
export function FieldV2({ path, label, issues = [], children, hint, wide = false }: { path: string; label: string; issues?: FormIssueV2[]; children: (input: { id: string; "data-field-path": string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode; hint?: string; wide?: boolean }) {
  const id = useId();
  const invalid = issues.some((issue) => normalizeFieldPathV2(issue.path) === path || normalizeFieldPathV2(issue.path).startsWith(`${path}.`));
  return <div className={`${styles.field} ${wide ? styles.wideField : ""}`}>
    <div className={local.fieldLabel}><label htmlFor={id}>{label}</label>{hint ? <HelpV2 label={label}>{hint}</HelpV2> : null}</div>
    {children({ id, "data-field-path": path, "aria-invalid": invalid, "aria-describedby": hint || invalid ? `${id}-help` : undefined })}
    {invalid ? <small id={`${id}-help`} className={styles.fieldError}>Revisa {label.toLocaleLowerCase("es")}. {hint}</small> : hint ? <span id={`${id}-help`} className={local.visuallyHidden}>{hint}</span> : null}
  </div>;
}
export function focusFieldIssueV2(surface: HTMLElement | null, path: string) {
  if (!surface) return false;
  const normalized = normalizeFieldPathV2(path);
  const fields = [...surface.querySelectorAll<HTMLElement>("[data-field-path]")];
  // A guide fingerprint comes from its revision; take the editor to that selector.
  let field = fields.find((node) => node.dataset.fieldPath === normalized);
  const bindingPath = normalized.replace(/\.(documentSha256|citation|verification|checkedAt|url)$/, ".binding");
  field ??= bindingPath !== normalized ? fields.find((node) => node.dataset.fieldPath === bindingPath) : undefined;
  if (!field) field = fields.filter((node) => normalized.startsWith(`${node.dataset.fieldPath}.`)).sort((a, b) => (b.dataset.fieldPath?.length ?? 0) - (a.dataset.fieldPath?.length ?? 0))[0];
  if (!field) field = fields.find((node) => node.dataset.fieldPath?.startsWith(`${normalized}.`));
  if (!field) return false;
  // A closed activity mounts its form on demand, then restores this exact field.
  if (field.dataset.lazyActivity) field.dataset.pendingFieldPath = normalized;
  for (let parent = field.parentElement; parent && parent !== surface; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
  field.focus(); field.scrollIntoView({ block: "center" });
  return true;
}
