import { describe, expect, it } from "vitest";
import { canEditDate, isPastDate, isValidDateKey, shiftDateKey } from "./careRules";

describe("care calendar date rules", () => {
  it("uses the user's local date when enforcing editability", () => {
    const now = new Date("2026-09-27T01:30:00.000Z");
    expect(canEditDate("2026-09-26", "America/Los_Angeles", now)).toBe(true);
    expect(canEditDate("2026-09-26", "Europe/London", now)).toBe(false);
    expect(isPastDate("2026-09-25", "America/Los_Angeles", now)).toBe(true);
  });

  it("allows today and future dates, but rejects malformed dates", () => {
    const now = new Date("2026-09-27T12:00:00.000Z");
    expect(canEditDate("2026-09-27", "UTC", now)).toBe(true);
    expect(canEditDate("2026-09-28", "UTC", now)).toBe(true);
    expect(canEditDate("2026-02-30", "UTC", now)).toBe(false);
    expect(isValidDateKey("2026-09-27")).toBe(true);
  });

  it("moves local calendar keys across month and year boundaries", () => {
    expect(shiftDateKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});
