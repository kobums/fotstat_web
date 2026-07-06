import { describe, it, expect } from "vitest";
import { buildMatchReports } from "./buildMatchReports";
import type { Match, MatchRecord, Quarter } from "../../core/api/types";

function match(p: Partial<Match> & Pick<Match, "id" | "matchdate">): Match {
  return { team: 1, awayname: "상대", ...p };
}
function quarter(p: Partial<Quarter> & Pick<Quarter, "id" | "match">): Quarter {
  return { number: 1, duration: 25, awaygoals: 0, ...p };
}
function record(
  p: Partial<MatchRecord> & Pick<MatchRecord, "id" | "quarter" | "player">,
): MatchRecord {
  return { min: 0, goal: 0, assist: 0, yellowcard: 0, redcard: 0, ...p };
}

describe("buildMatchReports", () => {
  it("returns empty for no data", () => {
    expect(buildMatchReports([], [], [])).toEqual([]);
  });

  const matches: Match[] = [
    match({ id: 100, matchdate: "2026-06-01 10:00:00", awayname: "A팀" }),
    match({ id: 200, matchdate: "2026-06-15 10:00:00", awayname: "B팀" }),
    match({ id: 300, matchdate: "2026-07-01 10:00:00", awayname: "C팀" }), // 쿼터 없음
  ];
  const quarters: Quarter[] = [
    // match 100: Q2를 먼저 넣어 정렬 검증
    quarter({ id: 12, match: 100, number: 2, awaygoals: 0, duration: 20 }),
    quarter({ id: 11, match: 100, number: 1, awaygoals: 1, duration: 20 }),
    quarter({ id: 21, match: 200, number: 1, awaygoals: 2, duration: 25 }),
  ];
  const records: MatchRecord[] = [
    record({ id: 1, quarter: 11, player: 1, goal: 1 }),
    record({ id: 2, quarter: 11, player: 2, goal: 1 }),
    record({ id: 3, quarter: 12, player: 1, goal: 1 }),
    // match 200: 무득점
  ];

  const reports = buildMatchReports(matches, quarters, records);

  it("excludes matches without quarters", () => {
    expect(reports.map((r) => r.match.id)).not.toContain(300);
  });

  it("sorts matches newest first", () => {
    expect(reports.map((r) => r.match.id)).toEqual([200, 100]);
  });

  it("sorts quarters by number and sums per-quarter goals", () => {
    const m100 = reports.find((r) => r.match.id === 100)!;
    expect(m100.quarters.map((q) => q.number)).toEqual([1, 2]);
    expect(m100.quarters.map((q) => q.home)).toEqual([2, 1]);
    expect(m100.quarters.map((q) => q.away)).toEqual([1, 0]);
    expect(m100.quarters.map((q) => q.duration)).toEqual([20, 20]);
  });

  it("totals home/away goals per match (same rule as aggregateTeamStats)", () => {
    const m100 = reports.find((r) => r.match.id === 100)!;
    expect(m100.home).toBe(3);
    expect(m100.away).toBe(1);
    const m200 = reports.find((r) => r.match.id === 200)!;
    expect(m200.home).toBe(0);
    expect(m200.away).toBe(2);
  });
});
