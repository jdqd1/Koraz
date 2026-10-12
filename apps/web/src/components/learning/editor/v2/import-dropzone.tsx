"use client";

import { UploadSimple } from "@phosphor-icons/react";
import { useRef, useState, type DragEvent } from "react";
import local from "./styles.module.css";

export function ImportDropzoneV2({ input, disabled, fileName, onFile, onReject }: {
  input: { id: string; "data-field-path": string; "aria-invalid": boolean; "aria-describedby"?: string };
  disabled: boolean; fileName: string; onFile: (file: File) => void; onReject: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  function enter(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  }
  function leave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (!dragDepth.current) setDragging(false);
  }
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files.length !== 1) { onReject("Selecciona un solo archivo de ruta."); return; }
    onFile(event.dataTransfer.files[0]!);
  }
  return <div className={local.dropZone} role="group" aria-label="Zona para cargar el archivo de ruta" tabIndex={-1}
    data-field-path={input["data-field-path"]} data-dragging={dragging && !disabled} data-disabled={disabled}
    onDragEnter={enter} onDragLeave={leave} onDragOver={(event) => {
      event.preventDefault(); event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    }} onDrop={drop}>
    <UploadSimple size={28} weight="regular" aria-hidden />
    <strong title={fileName || undefined}>{fileName || "Arrastra tu archivo aquí"}</strong>
    <button type="button" disabled={disabled} aria-controls={input.id} className={local.filePickerButton}
      onClick={() => fileInput.current?.click()}>{fileName ? "Cambiar archivo" : "Seleccionar archivo"}</button>
    <small id={`${input.id}-format`}>JSON · máx. 10 MiB</small>
    <input {...input} ref={fileInput} data-field-path={undefined} className={local.dropZoneInput} tabIndex={-1}
      type="file" accept=".json,application/json" disabled={disabled} aria-describedby={`${input.id}-format`}
      onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ""; }} />
  </div>;
}
