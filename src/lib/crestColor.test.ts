import { describe, it, expect } from "vitest";
import { crestColor, initials } from "./crestColor";

describe("crestColor", () => {
  it("is deterministic for the same name", () => {
    expect(crestColor("FC Seoul")).toBe(crestColor("FC Seoul"));
  });

  it("always returns a palette hex color", () => {
    for (const name of ["A", "B", "한글팀", "Manchester United", "x".repeat(50)]) {
      expect(crestColor(name)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("handles the empty string without throwing", () => {
    expect(crestColor("")).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe("initials", () => {
  it("returns up to two uppercase letters from a single word", () => {
    expect(initials("seoul")).toBe("SE");
  });

  it("combines first letters of the first two words", () => {
    expect(initials("Manchester United")).toBe("MU");
    expect(initials("a b c")).toBe("AB");
  });

  it("returns '?' for blank input", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });

  it("trims surrounding whitespace", () => {
    expect(initials("  fc  ")).toBe("FC");
  });
});
