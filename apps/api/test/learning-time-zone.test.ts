import { describe, expect, it } from "vitest";
import { PLATFORM_TIME_ZONE, TimeZoneSchema, localDateInTimeZone } from "@cediah/contracts";
import { scheduleReviewV2 } from "../src/guided-learning/v2/scheduler.js";

describe("learning instants and local calendar days", () => {
  it("defaults to Venezuela and validates geographic zones", () => {
    expect(PLATFORM_TIME_ZONE).toBe("America/Caracas");
    for (const zone of [PLATFORM_TIME_ZONE, "Europe/Madrid", "America/New_York", "Asia/Tokyo", "UTC"]) expect(TimeZoneSchema.safeParse(zone).success).toBe(true);
    expect(TimeZoneSchema.safeParse("invalid/country").success).toBe(false);
  });
  it("keeps the same instant while assigning the user's day across midnight and the international date line", () => {
    const instant = new Date("2026-10-14T02:30:00Z");
    expect(localDateInTimeZone(instant, "America/Caracas")).toBe("2026-10-13");
    expect(localDateInTimeZone(instant, "Europe/Madrid")).toBe("2026-10-14");
    expect(localDateInTimeZone(instant, "Pacific/Kiritimati")).toBe("2026-10-14");
    expect(instant.toISOString()).toBe("2026-10-14T02:30:00.000Z");
  });
  it("uses elapsed server time through a daylight-saving change rather than a local 23-hour day", () => {
    const acceptedAt = "2026-03-07T17:00:00.000Z";
    const state = scheduleReviewV2(null, { responseId: "receipt", sessionId: "session", acceptedAt, gradingSource: "server", score01: 1,
      assisted: false, selfRating: null, purpose: "learning", phase: "retrieve", valid: true });
    expect(Date.parse(state!.dueAt) - Date.parse(acceptedAt)).toBe(86_400_000);
    const hour = (value: string) => new Intl.DateTimeFormat("en", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date(value));
    expect(hour(acceptedAt)).toBe("12");
    expect(hour(state!.dueAt)).toBe("13");
  });
});
