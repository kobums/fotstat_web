import { describe, expect, it } from "vitest";
import type { Inbody } from "../core/api/types";
import {
  chartSeries,
  parseInbodyRow,
  parseRowValue,
  playerInbodiesSorted,
  rowFromInbody,
  rowHasValue,
  EMPTY_ROW,
} from "./inbody";

function inbody(partial: Partial<Inbody> & { id: number }): Inbody {
  return {
    player: 1,
    testdate: "2026-06-01",
    height: 0,
    weight: 0,
    muscle: 0,
    fat: 0,
    rightleg: 0,
    leftleg: 0,
    score: 0,
    ...partial,
  };
}

describe("playerInbodiesSorted", () => {
  const entries = [
    inbody({ id: 1, player: 1, testdate: "2026-06-01", weight: 40 }),
    inbody({ id: 2, player: 1, testdate: "2026-06-08", weight: 41.5 }),
    inbody({ id: 3, player: 2, testdate: "2026-06-05", weight: 33 }),
  ];

  it("해당 선수의 이력만 최근순으로 반환한다", () => {
    expect(playerInbodiesSorted(entries, 1).map((e) => e.id)).toEqual([2, 1]);
    expect(playerInbodiesSorted(entries, 9)).toEqual([]);
  });
});

describe("chartSeries", () => {
  it("값이 있는 측정만 검사일 오름차순으로 반환한다", () => {
    const entries = [
      inbody({ id: 1, testdate: "2026-06-08", weight: 41.5 }),
      inbody({ id: 2, testdate: "2026-06-01", weight: 40 }),
      inbody({ id: 3, testdate: "2026-06-05", weight: 0 }), // 미측정 — 제외
    ];
    expect(chartSeries(entries, "weight")).toEqual([
      { date: "2026-06-01", value: 40 },
      { date: "2026-06-08", value: 41.5 },
    ]);
  });
});

describe("시트 행 파싱", () => {
  it("rowHasValue — 전부 빈칸이면 false", () => {
    expect(rowHasValue(EMPTY_ROW)).toBe(false);
    expect(rowHasValue({ ...EMPTY_ROW, weight: "41.5" })).toBe(true);
    expect(rowHasValue({ ...EMPTY_ROW, weight: "  " })).toBe(false);
  });

  it("parseRowValue — 빈값은 0(미측정), 소수점 유지, 음수/비수치는 null", () => {
    expect(parseRowValue("")).toBe(0);
    expect(parseRowValue("41.5")).toBe(41.5);
    expect(parseRowValue("4.03")).toBe(4.03);
    expect(parseRowValue("-1")).toBeNull();
    expect(parseRowValue("abc")).toBeNull();
  });

  it("parseInbodyRow — 한 필드라도 잘못되면 null", () => {
    expect(parseInbodyRow({ ...EMPTY_ROW, weight: "41.5", score: "93" })).toEqual({
      height: 0,
      weight: 41.5,
      muscle: 0,
      fat: 0,
      rightleg: 0,
      leftleg: 0,
      score: 93,
    });
    expect(parseInbodyRow({ ...EMPTY_ROW, weight: "x" })).toBeNull();
  });

  it("rowFromInbody — 0(미측정)은 빈칸으로 프리필한다", () => {
    const row = rowFromInbody(
      inbody({ id: 1, weight: 41.5, rightleg: 4.03, score: 0 }),
    );
    expect(row.weight).toBe("41.5");
    expect(row.rightleg).toBe("4.03");
    expect(row.score).toBe("");
  });
});
