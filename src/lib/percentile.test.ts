import { describe, it, expect } from "vitest";
import { topPercent } from "./percentile";

describe("topPercent", () => {
  it("1위는 (1/전체)를 올림한 값", () => {
    // ceil(1/3 × 100) = 34 — iOS와 동일
    expect(topPercent(5, [5, 3, 1])).toBe(34);
  });

  it("중간 순위", () => {
    // 나보다 큰 선수 1명 → ceil(2/3 × 100) = 67
    expect(topPercent(3, [5, 3, 1])).toBe(67);
  });

  it("꼴찌는 100", () => {
    expect(topPercent(1, [5, 3, 1])).toBe(100);
  });

  it("동률은 같은 퍼센타일을 받는다 (나보다 '큰' 값만 센다)", () => {
    expect(topPercent(3, [3, 3, 1])).toBe(34);
  });

  it("전원 0이어도 상위 100%가 아닌 1위 취급", () => {
    // better = 0 → ceil(1/4 × 100) = 25
    expect(topPercent(0, [0, 0, 0, 0])).toBe(25);
  });

  it("빈 스쿼드는 100", () => {
    expect(topPercent(3, [])).toBe(100);
  });

  it("최소값은 1", () => {
    const all = Array.from({ length: 200 }, (_, i) => i);
    expect(topPercent(199, all)).toBe(1);
  });
});
