import { V2HttpContracts } from "@cediah/contracts";
import { z } from "zod";
import { V2RequestError, type Fetcher, type PlayerTransportStore } from "./client";

const PendingSchema = z.strictObject({ key: z.string().uuid(), body: V2HttpContracts.upgradeCommit.body });
export function createV2UpgradeClient(enrollmentId: string, fetcher: Fetcher = fetch, uuid = () => crypto.randomUUID(),
  getStore: () => PlayerTransportStore | null = () => { try { return typeof window === "undefined" ? null : window.sessionStorage; } catch { return null; } }) {
  const storageKey = `koraz:v2:upgrade:${enrollmentId}`;
  let pending: z.infer<typeof PendingSchema> | null = null, loaded = false;
  function readPending() {
    if (!loaded) {
      loaded = true;
      try { const raw = getStore()?.getItem(storageKey); if (raw) { const parsed = PendingSchema.safeParse(JSON.parse(raw)); if (parsed.success) pending = parsed.data; } } catch { /* Memory remains available. */ }
    }
    return pending;
  }
  function save() { try { if (pending) getStore()?.setItem(storageKey, JSON.stringify(pending)); else getStore()?.removeItem(storageKey); } catch { /* No offline success is inferred. */ } }
  const url = `/api/v2/guided-learning/enrollments/${encodeURIComponent(enrollmentId)}/upgrade`;
  async function commit(body?: z.infer<typeof V2HttpContracts.upgradeCommit.body>) {
    readPending();
    if (body) {
      const parsed = V2HttpContracts.upgradeCommit.body.parse(body);
      if (pending && JSON.stringify(pending.body) !== JSON.stringify(parsed)) throw new Error("Confirma primero la actualización pendiente.");
      if (!pending) { pending = { key: uuid(), body: parsed }; save(); }
    }
    if (!pending) throw new Error("No hay una actualización pendiente.");
    const response = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": pending.key }, body: JSON.stringify(pending.body) });
    if (!response.ok) { if (response.status >= 400 && response.status < 500) { pending = null; save(); } throw new V2RequestError(response.status); }
    const value = V2HttpContracts.upgradeCommit.response.parse(await response.json());
    pending = null; save(); return value;
  }
  return { hasPending: () => Boolean(readPending()), retry: () => commit(), commit,
    async preview() {
      const response = await fetcher(url, { cache: "no-store" });
      if (!response.ok) throw new V2RequestError(response.status);
      return V2HttpContracts.upgradePreview.response.parse(await response.json());
    } };
}
