import { describe, expect, it, vi } from "vitest";
import { syncUserTimeZone } from "./user-time-zone";

const preferences = (timezone = "UTC", rowVersion = 2) => ({ timezone, rowVersion, sessionMinutes: 10, weeklyGoalDays: null,
  examDate: null, pinnedEnrollmentId: null, pendingConstancy: { effectiveOn: "2026-10-19", timezone, weeklyGoalDays: 3 } });
const response = (timezone?: string, rowVersion?: number) => Response.json(preferences(timezone, rowVersion));

describe("automatic user timezone", () => {
  it("saves only the device zone with the confirmed version, preserving the weekly goal and server clock", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response()).mockResolvedValueOnce(response("America/Caracas", 3));
    expect(await syncUserTimeZone("America/Caracas", fetcher)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const init = fetcher.mock.calls[1]![1]!;
    expect(JSON.parse(init.body as string)).toEqual({ expectedVersion: 2, timezone: "America/Caracas" });
    expect(init.method).toBe("PATCH");
    expect(new Headers(init.headers).get("Idempotency-Key")).toMatch(/^[a-f0-9-]{36}$/);
  });
  it("avoids writes for the existing zone and retries a concurrent preference change once", async () => {
    const unchanged = vi.fn<typeof fetch>().mockResolvedValue(response("Europe/Madrid"));
    expect(await syncUserTimeZone("Europe/Madrid", unchanged)).toBe(false);
    expect(unchanged).toHaveBeenCalledTimes(1);
    const concurrent = vi.fn<typeof fetch>().mockResolvedValueOnce(response())
      .mockResolvedValueOnce(new Response(null, { status: 409 })).mockResolvedValueOnce(response("UTC", 3))
      .mockResolvedValueOnce(response("Europe/Madrid", 4));
    expect(await syncUserTimeZone("Europe/Madrid", concurrent)).toBe(true);
    expect(JSON.parse(concurrent.mock.calls[3]![1]!.body as string).expectedVersion).toBe(3);
  });
  it("rejects invalid zones, failed reads and unconfirmed writes", async () => {
    const invalid = vi.fn<typeof fetch>();
    await expect(syncUserTimeZone("invented/zone", invalid)).rejects.toThrow();
    expect(invalid).not.toHaveBeenCalled();
    const unavailable = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));
    await expect(syncUserTimeZone("America/Caracas", unavailable)).rejects.toThrow("consultar");
    expect(unavailable).toHaveBeenCalledTimes(1);
    const unconfirmed = vi.fn<typeof fetch>().mockImplementation(async () => response());
    await expect(syncUserTimeZone("America/Caracas", unconfirmed)).rejects.toThrow("actualizado");
  });
});
