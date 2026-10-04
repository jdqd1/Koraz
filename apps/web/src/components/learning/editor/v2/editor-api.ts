import { V2ErrorResponseSchema, V2HttpContracts, V2IssueSchema } from "@cediah/contracts";
import type { z } from "zod";

export type V2EditorFailure = { ok: false; status: number; code: string; issues?: z.infer<typeof V2IssueSchema>[] };
export type V2EditorResult<T> = { ok: true; value: T } | V2EditorFailure;
export type V2CreateBody = z.infer<typeof V2HttpContracts.editorCreate.body>;
export type V2PatchBody = z.infer<typeof V2HttpContracts.editorPatch.body>;
export function createEditorV2Api(fetcher: typeof fetch = fetch) {
  async function request<T>(path: string, schema: z.ZodType<T>, method: "GET" | "POST" | "PATCH" = "GET", body?: unknown, idempotencyKey?: string): Promise<V2EditorResult<T>> {
    try {
      const response = await fetcher(path, {
        method, cache: "no-store", credentials: "same-origin",
        ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey! } }),
      });
      const value: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = V2ErrorResponseSchema.safeParse(value);
        const raw = value as { error?: unknown; issues?: unknown } | null;
        const issues = V2IssueSchema.array().safeParse(raw?.issues);
        return { ok: false, status: response.status, code: error.success ? error.data.error.code : typeof raw?.error === "string" ? raw.error : "request_failed", ...(issues.success ? { issues: issues.data } : {}) };
      }
      const parsed = schema.safeParse(value);
      return parsed.success ? { ok: true, value: parsed.data } : { ok: false, status: 503, code: "invalid_response" };
    } catch { return { ok: false, status: 503, code: "network_error" }; }
  }
  const root = "/api/v2/editor/learning-paths";
  return {
    get(pathId: string) { return request(`${root}/${encodeURIComponent(pathId)}`, V2HttpContracts.editorGet.response); },
    create(body: V2CreateBody, key: string) { return request(root, V2HttpContracts.editorCreate.response, "POST", body, key); },
    save(pathId: string, body: V2PatchBody, key: string) { return request(`${root}/${encodeURIComponent(pathId)}`, V2HttpContracts.editorPatch.response, "PATCH", body, key); },
    validateImport(body: z.infer<typeof V2HttpContracts.importValidate.body>, key: string) { return request(`${root}/imports/validate`, V2HttpContracts.importValidate.response, "POST", body, key); },
    commitImport(importId: string, body: z.infer<typeof V2HttpContracts.importCommit.body>, key: string) { return request(`${root}/imports/${encodeURIComponent(importId)}/commit`, V2HttpContracts.importCommit.response, "POST", body, key); },
    validate(pathId: string, expectedVersion: number, key: string) { return request(`${root}/${encodeURIComponent(pathId)}/validate`, V2HttpContracts.editorValidate.response, "POST", { expectedVersion }, key); },
    transition(pathId: string, body: z.infer<typeof V2HttpContracts.editorTransition.body>, key: string) { return request(`${root}/${encodeURIComponent(pathId)}/transition`, V2HttpContracts.editorTransition.response, "POST", body, key); },
    version(pathId: string, body: z.infer<typeof V2HttpContracts.editorVersion.body>, key: string) { return request(`${root}/${encodeURIComponent(pathId)}/versions`, V2HttpContracts.editorVersion.response, "POST", body, key); },
    export(pathId: string) { return request(`${root}/${encodeURIComponent(pathId)}/export`, V2HttpContracts.editorExport.response); },
  };
}
export type EditorV2Api = ReturnType<typeof createEditorV2Api>;
export function v2FailureNotice(failure: V2EditorFailure) {
  if (failure.status === 409) return "La ruta cambió en otra sesión. Tus cambios locales están conservados; descarga una copia antes de abrir la versión guardada.";
  if (failure.status === 401) return "La sesión venció. Tus cambios siguen aquí; inicia sesión y vuelve a guardar.";
  if (failure.status === 403) return "Esta cuenta no tiene permiso para guardar la ruta.";
  if (failure.status === 404) return "La ruta no está disponible para esta cuenta.";
  if (failure.status === 429) return "Espera un momento antes de volver a guardar. Tus cambios están conservados.";
  return "No se pudo confirmar el guardado. Tus cambios están conservados; puedes reintentar la misma solicitud.";
}
