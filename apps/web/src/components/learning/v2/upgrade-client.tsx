import { V2HttpContracts } from "@cediah/contracts";
import { z } from "zod";
import { V2RequestError, type Fetcher, type PlayerTransportStore } from "./client";

const PendingSchema = z.strictObject({ key: z.string().uuid(), body: V2HttpContracts.upgradeCommit.body });
export function createV2UpgradeClient(enrollmentId: string, fetcher: Fetcher = fetch, uuid = () => crypto.randomUUID(),
  getStore: () => PlayerTransportStore | null = () => { try { return typeof window === "undefined" ? null : window.sessionStorage; } catch { return null; } }) {
  const storageKey = `koraz:v2:upgrade:${enrollmentId}`;
  let pending: z.infer<typeof PendingSchema> | null = null, loaded = false;
  const listeners = new Set<() => void>();
  function readPending() {
    if (!loaded) {
      loaded = true;
      try { const raw = getStore()?.getItem(storageKey); if (raw) { const parsed = PendingSchema.safeParse(JSON.parse(raw)); if (parsed.success) pending = parsed.data; } } catch { /* Memory remains available. */ }
    }
    return pending;
  }
  function save() {
    try {
      if (pending) getStore()?.setItem(storageKey, JSON.stringify(pending));
      else getStore()?.removeItem(storageKey);
    } catch { /* The same tab can still retry from memory. */ }
    for (const listener of listeners) listener();
  }
  const url = `/api/v2/guided-learning/enrollments/${encodeURIComponent(enrollmentId)}/upgrade`;
  async function commit(body?: z.infer<typeof V2HttpContracts.upgradeCommit.body>) {
    readPending();
    if (body) {
      const parsed = V2HttpContracts.upgradeCommit.body.parse(body);
      if (pending && JSON.stringify(pending.body) !== JSON.stringify(parsed)) throw new Error("Confirma primero la actualización pendiente.");
      if (!pending) { pending = { key: uuid(), body: parsed }; save(); }
    }
    const ticket = pending;
    if (!ticket) throw new Error("No hay una actualización pendiente.");
    const response = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": ticket.key }, body: JSON.stringify(ticket.body) });
    if (!response.ok) {
      if (pending === ticket && response.status >= 400 && response.status < 500 && ![401, 408, 429].includes(response.status)) {
        pending = null; save();
      }
      throw new V2RequestError(response.status);
    }
    const value = V2HttpContracts.upgradeCommit.response.parse(await response.json());
    if (value.state.enrollmentId !== enrollmentId || value.state.pathVersionId !== ticket.body.targetVersionId) {
      throw new Error("El recibo no confirma la versión elegida para esta matrícula.");
    }
    if (pending === ticket) { pending = null; save(); }
    return value;
  }
  return { hasPending: () => Boolean(readPending()), retry: () => commit(), commit,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async preview() {
      const response = await fetcher(url, { cache: "no-store" });
      if (!response.ok) throw new V2RequestError(response.status);
      return V2HttpContracts.upgradePreview.response.parse(await response.json());
    } };
}
