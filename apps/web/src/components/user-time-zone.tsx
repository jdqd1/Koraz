"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LearningPreferencesSchema, PLATFORM_TIME_ZONE, TimeZoneSchema } from "@cediah/contracts";

const zoneEvent = "koraz:timezone-changed";
const PlatformTimeZoneContext = createContext<string | null>(null);
export function PlatformTimeZone({ children }: { children: ReactNode }) {
  return <PlatformTimeZoneContext.Provider value={PLATFORM_TIME_ZONE}>{children}</PlatformTimeZoneContext.Provider>;
}
const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || PLATFORM_TIME_ZONE;
function subscribeZone(listener: () => void) {
  window.addEventListener("focus", listener);
  window.addEventListener(zoneEvent, listener);
  document.addEventListener("visibilitychange", listener);
  return () => {
    window.removeEventListener("focus", listener);
    window.removeEventListener(zoneEvent, listener);
    document.removeEventListener("visibilitychange", listener);
  };
}

export function useUserTimeZone(fallback = PLATFORM_TIME_ZONE) {
  const platformZone = useContext(PlatformTimeZoneContext);
  const detectedZone = useSyncExternalStore(subscribeZone, deviceZone, () => platformZone ?? fallback);
  return platformZone ?? detectedZone;
}

/** Saves a zone, never a device clock or a shifted timestamp. */
export async function syncUserTimeZone(timeZone: string, fetcher: typeof fetch = fetch, signal?: AbortSignal) {
  const timezone = TimeZoneSchema.parse(timeZone);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetcher("/api/guided-learning/preferences", { cache: "no-store", signal });
    if (!response.ok) throw new Error("No pudimos consultar tu horario.");
    const preferences = LearningPreferencesSchema.parse(await response.json());
    if (preferences.timezone === timezone) return false;
    signal?.throwIfAborted();
    const saved = await fetcher("/api/guided-learning/preferences", {
      method: "PATCH", signal, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ expectedVersion: preferences.rowVersion, timezone }),
    });
    if (saved.status === 409) continue;
    if (!saved.ok) throw new Error("No pudimos guardar tu horario.");
    const confirmed = LearningPreferencesSchema.parse(await saved.json());
    if (confirmed.timezone !== timezone) throw new Error("Tu horario aún no se ha actualizado.");
    return true;
  }
  throw new Error("Las preferencias cambiaron. Volveremos a comprobar tu horario.");
}

export function UserTimeZoneSync({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    let busy = false, disposed = false, lastZone: string | null = null;
    async function check(force = false) {
      const zone = deviceZone();
      if (busy || document.visibilityState === "hidden" || !force && lastZone === zone) return;
      busy = true;
      try {
        const changed = await syncUserTimeZone(zone, fetch, controller.signal);
        if (disposed) return;
        if (changed || lastZone !== null && lastZone !== zone) window.dispatchEvent(new Event(zoneEvent));
        lastZone = zone;
        if (changed) router.refresh();
      } catch { /* Retry on reconnect, focus or the next zone check. */ }
      finally { busy = false; }
    }
    const resume = () => { void check(true); };
    const timer = window.setInterval(() => { void check(); }, 60_000);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    void check();
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [router, userId]);
  return null;
}
