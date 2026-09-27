#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { validateRoutePackage } from "../dist/learning-route-validation.js";

const args = process.argv.slice(2);
const publish = args.includes("--publish");
const files = args.filter((arg) => arg !== "--publish");
const output = (valid, publishable, issues) => console.log(JSON.stringify({ scope: "portable", valid, publishable, issues }));
if (files.length !== 1) {
  output(false, false, [{ code: "IO_ERROR", severity: "error", path: "", message: "Indica un archivo .koraz-route.json.", suggestedFix: "Usa validate-learning-route.mjs [--publish] archivo.koraz-route.json." }]);
  process.exitCode = 2;
} else {
  try {
    if (!files[0].endsWith(".koraz-route.json")) throw new Error("El archivo debe terminar en .koraz-route.json.");
    const info = await stat(files[0]);
    if (info.size > 10 * 1024 * 1024) throw new Error("El paquete supera 10 MiB.");
    const bytes = await readFile(files[0]);
    let input;
    try { input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch {
      output(false, false, [{ code: "SCHEMA_INVALID", severity: "error", path: "", message: "JSON o UTF-8 inválido.", suggestedFix: "Corrige el archivo JSON UTF-8." }]);
      process.exitCode = 1;
      input = null;
    }
    if (input && input.schemaVersion !== "2.0") {
      output(false, false, [{ code: "SCHEMA_UNSUPPORTED", severity: "error", path: "/schemaVersion", message: "Versión de esquema no admitida.", suggestedFix: "Usa schemaVersion 2.0." }]);
      process.exitCode = 2;
    } else if (input) {
      const result = validateRoutePackage(input);
      output(result.valid, result.publishable, result.issues);
      process.exitCode = result.valid && (!publish || result.publishable) ? 0 : 1;
    }
  } catch (error) {
    output(false, false, [{ code: "IO_ERROR", severity: "error", path: "", message: error instanceof Error ? error.message : "No se pudo leer el archivo.", suggestedFix: "Comprueba ruta, UTF-8 y JSON." }]);
    process.exitCode = 2;
  }
}
