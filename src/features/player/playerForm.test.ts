import { describe, it, expect } from "vitest";
import { validatePlayerForm } from "./playerForm";

describe("validatePlayerForm", () => {
  it("accepts a trimmed name and a 1–99 jersey number", () => {
    expect(validatePlayerForm("  손흥민  ", "7")).toEqual({
      ok: true,
      value: { name: "손흥민", number: 7 },
    });
  });

  it("accepts the boundaries 1 and 99", () => {
    expect(validatePlayerForm("A", "1")).toMatchObject({ ok: true });
    expect(validatePlayerForm("A", "99")).toMatchObject({ ok: true });
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(validatePlayerForm("", "7")).toEqual({
      ok: false,
      error: "선수 이름을 입력해주세요.",
    });
    expect(validatePlayerForm("   ", "7")).toMatchObject({ ok: false });
  });

  it("rejects an empty jersey number (no silent 0)", () => {
    expect(validatePlayerForm("A", "")).toEqual({
      ok: false,
      error: "등번호를 입력해주세요.",
    });
    expect(validatePlayerForm("A", "   ")).toMatchObject({
      ok: false,
      error: "등번호를 입력해주세요.",
    });
  });

  it("rejects 0 and negative numbers", () => {
    for (const n of ["0", "-1", "-5"]) {
      expect(validatePlayerForm("A", n)).toMatchObject({
        ok: false,
        error: "등번호는 1~99 사이로 입력해주세요.",
      });
    }
  });

  it("rejects numbers above 99 (more than two digits)", () => {
    for (const n of ["100", "1000"]) {
      expect(validatePlayerForm("A", n)).toMatchObject({
        ok: false,
        error: "등번호는 1~99 사이로 입력해주세요.",
      });
    }
  });

  it("rejects non-integers and exponent notation", () => {
    // "1e1" would coerce to 10 via Number(); the digits-only rule rejects it.
    for (const n of ["7.5", "abc", "3.14", "1e1"]) {
      expect(validatePlayerForm("A", n)).toMatchObject({ ok: false });
    }
  });
});
