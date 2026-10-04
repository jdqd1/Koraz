"use client";

import { useId, type ReactNode } from "react";
import type { EditorV2Draft } from "./editor-model";
import styles from "../route-editor.module.css";

export type FormIssueV2 = { path: string; message: string };
export type FormPropsV2 = { draft: EditorV2Draft; disabled: boolean; onChange: (draft: EditorV2Draft) => void; issues?: FormIssueV2[] };
export function normalizeFieldPathV2(path: string) {
  return path.startsWith("/") ? `package.${path.slice(1).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~")).join(".")}`.replace("package.bindings.", "bindings.") : path;
}
export function FieldV2({ path, label, issues = [], children, hint, wide = false }: { path: string; label: string; issues?: FormIssueV2[]; children: (input: { id: string; "data-field-path": string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode; hint?: string; wide?: boolean }) {
  const id = useId();
  const invalid = issues.some((issue) => normalizeFieldPathV2(issue.path) === path || normalizeFieldPathV2(issue.path).startsWith(`${path}.`));
  return <div className={`${styles.field} ${wide ? styles.wideField : ""}`}>
    <label htmlFor={id}>{label}</label>
    {children({ id, "data-field-path": path, "aria-invalid": invalid, "aria-describedby": hint || invalid ? `${id}-help` : undefined })}
    {hint || invalid ? <small id={`${id}-help`} className={invalid ? styles.fieldError : styles.fieldHint}>{invalid ? `Revisa ${label.toLocaleLowerCase("es")}. ${hint ?? ""}` : hint}</small> : null}
  </div>;
}
export function focusFieldIssueV2(surface: HTMLElement | null, path: string) {
  if (!surface) return false;
  const normalized = normalizeFieldPathV2(path);
  const fields = [...surface.querySelectorAll<HTMLElement>("[data-field-path]")];
  // A guide fingerprint comes from its revision; take the editor to that selector.
  const bindingPath = normalized.replace(/\.documentSha256$/, ".binding");
  let field = normalized.endsWith(".documentSha256") ? fields.find((node) => node.dataset.fieldPath === bindingPath) : undefined;
  field ??= fields.find((node) => node.dataset.fieldPath === normalized);
  if (!field) field = fields.filter((node) => normalized.startsWith(`${node.dataset.fieldPath}.`)).sort((a, b) => (b.dataset.fieldPath?.length ?? 0) - (a.dataset.fieldPath?.length ?? 0))[0];
  if (!field) field = fields.find((node) => node.dataset.fieldPath?.startsWith(`${normalized}.`));
  if (!field) return false;
  for (let parent = field.parentElement; parent && parent !== surface; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
  field.focus(); field.scrollIntoView({ block: "center" });
  return true;
}
