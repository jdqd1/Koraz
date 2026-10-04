import { V2EditorPreviewHttpContracts, V2EditorPreviewActionSchema, V2EditorPreviewSnapshotSchema, type V2BindingsSchema, type RoutePackage } from "@cediah/contracts";
import type { z } from "zod";
import { createV2PlayerClient, V2RequestError, type Fetcher, type readV2AttemptImage } from "../../v2/client";

export type PreviewSnapshot = z.infer<typeof V2EditorPreviewSnapshotSchema>;
type Profile = PreviewSnapshot["profile"];
export async function openPreviewV2(pathId: string, pkg: RoutePackage, bindings: z.infer<typeof V2BindingsSchema>, profile: Profile, now: string, fetcher: Fetcher = fetch, key = crypto.randomUUID()) {
  const root = `/api/v2/editor/learning-paths/${encodeURIComponent(pathId)}/preview-sessions`;
  const headers = { "Content-Type": "application/json", "Idempotency-Key": key };
  const response = await fetcher(root, { method: "POST", cache: "no-store", credentials: "same-origin", headers, body: JSON.stringify({ package: pkg, bindings, profile, now }) });
  if (!response.ok) throw new V2RequestError(response.status);
  const session = V2EditorPreviewHttpContracts.create.response.parse(await response.json());
  let snapshot: PreviewSnapshot = { state: session.state, attempt: session.attempt, now: session.now, profile: session.profile, targets: session.targets, profileWarning: session.profileWarning };
  const listeners = new Set<() => void>();
  const sessionRoot = `${root}/${encodeURIComponent(session.previewId)}`;
  function update(value: z.infer<typeof V2EditorPreviewHttpContracts.action.response>) {
    if ("targets" in value) snapshot = value;
    else snapshot = { ...snapshot, attempt: value.attempt, state: "state" in value ? value.state : { ...snapshot.state, rowVersion: value.attempt.rowVersion } };
    for (const listener of listeners) listener();
  }
  async function send(action: z.infer<typeof V2EditorPreviewActionSchema>, idempotencyKey: string) {
    const response = await fetcher(`${sessionRoot}/actions`, { method: "POST", cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(V2EditorPreviewActionSchema.parse(action)) });
    if (!response.ok) throw new V2RequestError(response.status);
    const value = V2EditorPreviewHttpContracts.action.response.parse(await response.json());
    update(value); return value;
  }
  return {
    expiresAt: session.expiresAt,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    action: (action: z.infer<typeof V2EditorPreviewActionSchema>, key = crypto.randomUUID()) => send(action, key),
    player(attemptId: string) {
      // Reuse the learner's validation/retry logic with a closed memory store and
      // a transport that cannot reach a learner URL, including on retries.
      const fetcher: Fetcher = async (url, init) => {
        const prefix = `/api/v2/guided-learning/attempts/${encodeURIComponent(attemptId)}/`;
        const suffix = url.startsWith(prefix) ? url.slice(prefix.length) : "";
        const operation = suffix === "responses" ? "response" : suffix;
        if (!["response", "help", "alternative", "complete"].includes(operation) || init?.method !== "POST") throw new Error("Solicitud fuera del simulador editorial.");
        try { const value = await send(V2EditorPreviewActionSchema.parse({ operation, body: JSON.parse(String(init.body)) }), new Headers(init.headers).get("Idempotency-Key")!); return Response.json(value); }
        catch (error) { if (error instanceof V2RequestError) return Response.json({ error: "preview_failed" }, { status: error.status }); throw error; }
      };
      return createV2PlayerClient(attemptId, fetcher, () => crypto.randomUUID(), () => null);
    },
    readImage: (async (attemptId, activityKey, assetKey, expectedVersion, signal) => {
      if (snapshot.attempt?.attemptId !== attemptId) throw new Error("La imagen no pertenece a esta vista previa.");
      const response = await fetcher(`${sessionRoot}/image`, { method: "POST", cache: "no-store", credentials: "same-origin", signal, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ activityKey, expectedVersion }) });
      if (!response.ok) throw new V2RequestError(response.status);
      const value = V2EditorPreviewHttpContracts.image.response.parse(await response.json());
      if (value.activityKey !== activityKey || value.attemptVersion !== expectedVersion || value.image.assetKey !== assetKey || Date.parse(value.image.expiresAt) <= Date.now()) throw new Error("La imagen no corresponde al estado vigente.");
      return value.image;
    }) as typeof readV2AttemptImage,
  };
}
export type PreviewConnection = Awaited<ReturnType<typeof openPreviewV2>>;
