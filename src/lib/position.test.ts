import { describe, it, expect } from "vitest";
import { positionGroup, positionColorVar } from "./position";

describe("positionGroup", () => {
  it("maps GK", () => {
    expect(positionGroup("GK")).toBe("gk");
  });

  it("maps defensive positions", () => {
    for (const p of ["CB", "LB", "RB", "LWB", "RWB", "SW"]) {
      expect(positionGroup(p)).toBe("def");
    }
  });

  it("maps midfield positions", () => {
    for (const p of ["CDM", "CM", "CAM", "LM", "RM", "DM", "AM"]) {
      expect(positionGroup(p)).toBe("mid");
    }
  });

  it("maps attacking positions", () => {
    for (const p of ["LW", "RW", "ST", "CF", "SS"]) {
      expect(positionGroup(p)).toBe("att");
    }
  });

  it("is case-insensitive and trims", () => {
    expect(positionGroup(" st ")).toBe("att");
    expect(positionGroup("gk")).toBe("gk");
  });

  it("falls back to mid for unknown positions", () => {
    expect(positionGroup("XYZ")).toBe("mid");
    expect(positionGroup("")).toBe("mid");
  });
});

describe("positionColorVar", () => {
  it("wraps the group in a --role CSS variable", () => {
    expect(positionColorVar("ST")).toBe("var(--role-att)");
    expect(positionColorVar("GK")).toBe("var(--role-gk)");
  });
});
