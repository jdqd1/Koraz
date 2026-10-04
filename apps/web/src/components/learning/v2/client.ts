import { V2HttpContracts, V2CatalogResponseSchema, V2RouteStateSchema } from "@cediah/contracts";
import { z } from "zod";
import type { V2Card, V2Path, V2State } from "./model";

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
export class V2RequestError extends Error { constructor(readonly status: number) { super(status === 409 ? "El estado cambió. Actualiza la ruta antes de continuar." : status === 403 || status === 404 ? "Esta ruta no está disponible ahora para tu cuenta." : "No pudimos confirmar la solicitud. Reintenta con conexión."); } }
export function createV2Reader(fetcher: Fetcher = fetch) {
  async function read<T>(url: string, schema: { parse(value: unknown): T }, signal?: AbortSignal) {
    const response = await fetcher(`/api/v2/guided-learning/${url}`, { cache: "no-store", signal });
    if (!response.ok) throw new V2RequestError(response.status);
    return schema.parse(await response.json());
  }
  return {
    async cards(signal?: AbortSignal): Promise<V2Card[]> {
      const cards: V2Card[] = [], visited = new Set<string>();
      let cursor: string | null = null;
      do {
        const query = new URLSearchParams({ limit: "20" });
        if (cursor) query.set("cursor", cursor);
        const page = await read(`paths?${query}`, V2CatalogResponseSchema, signal);
        cards.push(...page.items); cursor = page.nextCursor;
        if (cursor && visited.has(cursor)) throw new Error("No pudimos completar el catálogo de rutas.");
        if (cursor) visited.add(cursor);
      } while (cursor);
      return cards;
    },
    async path(slug: string, signal?: AbortSignal): Promise<V2Path> { return (await read(`paths/${encodeURIComponent(slug)}`, V2HttpContracts.publicPath.response, signal)).path; },
    async state(enrollmentId: string, signal?: AbortSignal): Promise<V2State> { return (await read(`enrollments/${encodeURIComponent(enrollmentId)}/state`, V2HttpContracts.enrollmentState.response, signal)).state; },
  };
}

const PlayerActionSchema = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("response"), body: V2HttpContracts.attemptResponse.body }),
  z.strictObject({ operation: z.literal("help"), body: V2HttpContracts.attemptHelp.body }),
  z.strictObject({ operation: z.literal("complete"), body: V2HttpContracts.attemptComplete.body }),
  z.strictObject({ operation: z.literal("alternative"), body: V2HttpContracts.attemptAlternative.body }),
]);
export type PlayerAction = z.infer<typeof PlayerActionSchema>;
export type PlayerResult =
  | { operation: "response"; body: z.infer<typeof V2HttpContracts.attemptResponse.body>; value: z.infer<typeof V2HttpContracts.attemptResponse.response> }
  | { operation: "help"; body: z.infer<typeof V2HttpContracts.attemptHelp.body>; value: z.infer<typeof V2HttpContracts.attemptHelp.response> }
  | { operation: "alternative"; body: z.infer<typeof V2HttpContracts.attemptAlternative.body>; value: z.infer<typeof V2HttpContracts.attemptAlternative.response> }
  | { operation: "complete"; body: z.infer<typeof V2HttpContracts.attemptComplete.body>; value: z.infer<typeof V2HttpContracts.attemptComplete.response> };
const PendingPlayerSchema = z.strictObject({ key: z.string().uuid(), action: PlayerActionSchema });
type PendingPlayer = z.infer<typeof PendingPlayerSchema>;
export type PlayerTransportStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** sessionStorage stores only the outgoing request, never progress, scores or solutions.
 * A refresh must read the server manifest; uncertain writes retry the exact body/key. */
export function createV2PlayerClient(attemptId: string, fetcher: Fetcher = fetch,
  uuid = () => crypto.randomUUID(), getStore: () => PlayerTransportStore | null = () => {
    try { return typeof window === "undefined" ? null : window.sessionStorage; } catch { return null; }
  }) {
  const storageKey = `koraz:v2:pending:${attemptId}`;
  let pending: PendingPlayer | null = null;
  let loaded = false;
  const listeners = new Set<() => void>();
  function readPending() {
    if (!loaded) {
      loaded = true;
      try { const raw = getStore()?.getItem(storageKey); const parsed = raw ? PendingPlayerSchema.safeParse(JSON.parse(raw)) : null; if (parsed?.success) pending = parsed.data; } catch { /* In-memory retry remains available. */ }
    }
    return pending?.action ?? null;
  }
  function save() { try { if (pending) getStore()?.setItem(storageKey, JSON.stringify(pending)); else getStore()?.removeItem(storageKey); } catch { /* Never claim offline persistence. */ } for (const listener of listeners) listener(); }
  async function execute(action: PlayerAction): Promise<PlayerResult> {
    readPending();
    const parsed = PlayerActionSchema.parse(action);
    if (pending && JSON.stringify(pending.action) !== JSON.stringify(parsed)) throw new Error("Confirma primero la solicitud pendiente.");
    if (!pending) { pending = { key: uuid(), action: parsed }; save(); }
    const suffix = parsed.operation === "response" ? "responses" : parsed.operation;
    const response = await fetcher(`/api/v2/guided-learning/attempts/${encodeURIComponent(attemptId)}/${suffix}`, {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": pending.key }, body: JSON.stringify(parsed.body),
    });
    if (!response.ok) {
      // Definite 4xx rejections permit a fresh server read; 5xx/transport failures remain uncertain.
      if (response.status >= 400 && response.status < 500) { pending = null; save(); }
      throw new V2RequestError(response.status);
    }
    const raw: unknown = await response.json();
    let result: PlayerResult;
    if (parsed.operation === "response") result = { ...parsed, value: V2HttpContracts.attemptResponse.response.parse(raw) };
    else if (parsed.operation === "help") result = { ...parsed, value: V2HttpContracts.attemptHelp.response.parse(raw) };
    else if (parsed.operation === "alternative") result = { ...parsed, value: V2HttpContracts.attemptAlternative.response.parse(raw) };
    else result = { ...parsed, value: V2HttpContracts.attemptComplete.response.parse(raw) };
    if (result.value.attempt.attemptId !== attemptId) throw new Error("La confirmación no pertenece a esta sesión.");
    if (result.operation === "help" && (result.value.help.kind !== result.body.kind
      || result.value.attempt.activeActivity?.key !== result.body.activityKey)) throw new Error("La ayuda recibida no corresponde a esta actividad.");
    if (result.operation === "help" && result.body.kind === "reveal" && result.value.attempt.activeActivity?.kind === "constructed_response"
      && result.value.attempt.constructedResponse?.stage !== "revealed") throw new Error("La comparación aún no está autorizada.");
    if (result.operation === "response") {
      if (JSON.stringify(result.value.nextStep) !== JSON.stringify(result.value.attempt.activeActivity)) throw new Error("La siguiente actividad no está confirmada.");
      if (result.value.accepted && !result.value.attempt.acceptedResponses.some(item => item.activityKey === result.body.activityKey
        && JSON.stringify(item.answer) === JSON.stringify(result.body.answer))) throw new Error("No recibimos la respuesta guardada por el servidor.");
      if (!result.value.accepted && result.body.answer.kind === "constructed_response"
        && result.value.attempt.constructedResponse?.text !== result.body.answer.text) throw new Error("El texto pendiente no está confirmado por el servidor.");
    }
    if (result.operation === "complete" && result.value.attempt.status !== "completed") throw new Error("El cierre no está confirmado.");
    if (result.operation === "alternative" && (result.value.attempt.accessiblePractice?.sourceActivityKey !== result.body.activityKey
      || !result.value.attempt.activeActivity || !["text", "table"].includes(result.value.attempt.activeActivity.representation))) throw new Error("La variante accesible no está confirmada.");
    if (result.operation !== "help" && (result.value.state.enrollmentId !== result.value.attempt.enrollmentId
      || result.value.state.pathVersionId !== result.value.attempt.pathVersionId)) throw new Error("El progreso recibido no corresponde a esta sesión.");
    pending = null; save();
    return result;
  }
  return { execute, pending: readPending, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }, async retry() { const action = readPending(); if (!action) throw new Error("No hay una solicitud pendiente."); return execute(action); } };
}

export async function readV2AttemptImage(attemptId: string, activityKey: string, assetKey: string, expectedVersion: number, signal?: AbortSignal, fetcher: Fetcher = fetch) {
  const query = new URLSearchParams({ activityKey, expectedVersion: String(expectedVersion) });
  const response = await fetcher(`/api/v2/guided-learning/attempts/${encodeURIComponent(attemptId)}/image?${query}`, { cache: "no-store", signal });
  if (!response.ok) throw new V2RequestError(response.status);
  const value = V2HttpContracts.attemptImage.response.parse(await response.json());
  if (value.activityKey !== activityKey || value.attemptVersion !== expectedVersion || value.image.assetKey !== assetKey
    || Date.parse(value.image.expiresAt) <= Date.now()) throw new Error("El recurso recibido no corresponde a la actividad vigente.");
  return value.image;
}
/** Retry identity lives for one input, including a lost response after a successful commit. */
export function createV2Launcher(fetcher: Fetcher = fetch, uuid = () => crypto.randomUUID()) {
  const receipts = new Map<string, { key: string; clientAttemptId: string }>();
  async function mutate<T>(url: string, body: unknown, schema: { parse(value: unknown): T }) {
    const identity = `${url}:${JSON.stringify(body)}`;
    let receipt = receipts.get(identity);
    if (!receipt) { receipt = { key: uuid(), clientAttemptId: uuid() }; receipts.set(identity, receipt); }
    const response = await fetcher(`/api/v2/guided-learning/${url}`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": receipt.key }, body: JSON.stringify(url === "attempts" ? { ...body as object, clientAttemptId: receipt.clientAttemptId } : body) });
    if (!response.ok) throw new V2RequestError(response.status);
    return schema.parse(await response.json());
  }
  return {
    enroll: (pathId: V2Path["pathId"]) => mutate("enrollments", { pathId }, V2HttpContracts.enrollmentCreate.response),
    start: (state: V2State, target: { kind: "activity" | "assessment" | "review"; key: string }) => mutate("attempts", { enrollmentId: state.enrollmentId, expectedEnrollmentVersion: state.rowVersion, target }, V2HttpContracts.attemptCreate.response),
    async resume(id: string) {
      const response = await fetcher(`/api/v2/guided-learning/attempts/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new V2RequestError(response.status);
      return V2HttpContracts.attemptGet.response.parse(await response.json());
    },
    validateState: (value: unknown) => V2RouteStateSchema.parse(value),
  };
}
