import { describe, expect, it } from "vitest";
import { formatPlatformDateTime } from "./date-time";

describe("administrative timestamps", () => {
  it("uses Venezuela time for both server ISO dates and editor timestamps", () => {
    const instant = "2026-10-14T02:30:00Z";
    expect(formatPlatformDateTime(instant)).toBe("13 de octubre de 2026, 10:30 p. m.");
    expect(formatPlatformDateTime(Date.parse(instant))).toBe(formatPlatformDateTime(instant));
  });
  it("formats midnight and noon consistently without shifting the stored instant", () => {
    expect(formatPlatformDateTime("2026-10-14T04:00:00Z")).toBe("14 de octubre de 2026, 12:00 a. m.");
    expect(formatPlatformDateTime("2026-10-14T16:00:00Z")).toBe("14 de octubre de 2026, 12:00 p. m.");
  });
});
