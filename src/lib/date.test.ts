import { describe, it, expect } from "vitest";
import {
  parseMatchDate,
  toApiDate,
  toApiDateSeconds,
  toInputValue,
  fromInputValue,
  nowInputValue,
  isUpcoming,
  toDayKey,
  dayKey,
  monthStartKey,
} from "./date";

describe("parseMatchDate", () => {
  it("parses the API space-separated format", () => {
    const d = parseMatchDate("2026-06-23 19:00:00");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(5); // June
    expect(d!.getDate()).toBe(23);
    expect(d!.getHours()).toBe(19);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseMatchDate("")).toBeNull();
    expect(parseMatchDate("not-a-date")).toBeNull();
  });
});

describe("toApiDate", () => {
  it("formats with zero-padding and zeroed seconds", () => {
    const d = new Date(2026, 0, 5, 9, 7, 42);
    expect(toApiDate(d)).toBe("2026-01-05 09:07:00");
  });
});

describe("toApiDateSeconds", () => {
  it("keeps real seconds", () => {
    const d = new Date(2026, 0, 5, 9, 7, 42);
    expect(toApiDateSeconds(d)).toBe("2026-01-05 09:07:42");
  });
});

describe("toInputValue / fromInputValue", () => {
  it("converts API date to datetime-local input value", () => {
    expect(toInputValue("2026-06-23 19:05:00")).toBe("2026-06-23T19:05");
  });

  it("returns '' for an invalid API date", () => {
    expect(toInputValue("garbage")).toBe("");
  });

  it("round-trips API -> input -> API (seconds zeroed)", () => {
    const api = "2026-06-23 19:05:00";
    expect(fromInputValue(toInputValue(api))).toBe(api);
  });

  it("fromInputValue returns '' for invalid input", () => {
    expect(fromInputValue("")).toBe("");
  });
});

describe("nowInputValue", () => {
  it("has the datetime-local shape with minutes rounded to 10", () => {
    const v = nowInputValue();
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const minutes = Number(v.slice(-2));
    expect(minutes % 10).toBe(0);
  });
});

describe("isUpcoming", () => {
  const now = new Date(2026, 5, 23, 12, 0, 0);

  it("is true for a future match", () => {
    expect(isUpcoming("2026-06-23 18:00:00", now)).toBe(true);
  });

  it("is false for a past match", () => {
    expect(isUpcoming("2026-06-23 06:00:00", now)).toBe(false);
  });

  it("is false for an unparseable date", () => {
    expect(isUpcoming("garbage", now)).toBe(false);
  });
});

describe("day keys", () => {
  it("toDayKey extracts the local calendar day", () => {
    expect(toDayKey("2026-06-23 19:00:00")).toBe("2026-06-23");
    expect(toDayKey("garbage")).toBe("");
  });

  it("dayKey formats a Date", () => {
    expect(dayKey(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  it("monthStartKey returns the first of the month", () => {
    expect(monthStartKey(new Date(2026, 5, 23))).toBe("2026-06-01");
  });
});
