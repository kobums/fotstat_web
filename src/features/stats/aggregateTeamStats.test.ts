import { describe, it, expect } from "vitest";
import {
  aggregateTeamStats,
  matchMinutes,
  playerMatchIds,
} from "./aggregateTeamStats";
import type { MatchRecord, Player, Quarter } from "../../core/api/types";

function quarter(p: Partial<Quarter> & Pick<Quarter, "id" | "match">): Quarter {
  return { number: 1, duration: 25, awaygoals: 0, ...p };
}
function record(
  p: Partial<MatchRecord> & Pick<MatchRecord, "id" | "quarter" | "player">,
): MatchRecord {
  return { min: 0, goal: 0, assist: 0, yellowcard: 0, redcard: 0, ...p };
}
function player(p: Partial<Player> & Pick<Player, "id" | "name">): Player {
  return { team: 1, number: 0, position: "CM", ...p };
}

describe("aggregateTeamStats", () => {
  it("returns zeros for empty inputs", () => {
    const r = aggregateTeamStats([], [], []);
    expect(r).toEqual({
      matchCount: 0,
      totalGoal: 0,
      totalConceded: 0,
      totalAssist: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      players: [],
    });
  });

  // Match 100: two quarters, home scores 2 (p1 x2) vs away 1 -> win
  // Match 200: one quarter, home scores 1 (p2) vs away 2 -> loss
  const quarters: Quarter[] = [
    quarter({ id: 11, match: 100, awaygoals: 1 }),
    quarter({ id: 12, match: 100, awaygoals: 0 }),
    quarter({ id: 13, match: 200, awaygoals: 2 }),
  ];
  const records: MatchRecord[] = [
    record({ id: 1, quarter: 11, player: 1, goal: 1, assist: 0, min: 20 }),
    record({ id: 2, quarter: 11, player: 2, goal: 0, assist: 1, min: 20 }),
    record({ id: 3, quarter: 12, player: 1, goal: 1, assist: 0, min: 20 }),
    record({ id: 4, quarter: 13, player: 2, goal: 1, assist: 0, min: 30 }),
    record({ id: 5, quarter: 13, player: 1, goal: 0, assist: 0, min: 30 }),
  ];
  const players: Player[] = [
    player({ id: 1, name: "A", number: 10, position: "ST" }),
    player({ id: 2, name: "B", number: 7, position: "CM" }),
    player({ id: 3, name: "C", number: 1, position: "GK" }), // never plays
  ];

  it("rolls up team totals and W/D/L", () => {
    const r = aggregateTeamStats(quarters, records, players);
    expect(r.matchCount).toBe(2);
    expect(r.totalGoal).toBe(3);
    expect(r.totalAssist).toBe(1);
    expect(r.totalConceded).toBe(3); // away 1 + 2
    expect(r.wins).toBe(1);
    expect(r.draws).toBe(0);
    expect(r.losses).toBe(1);
  });

  it("computes per-player lines and sorts by goal/assist/min", () => {
    const r = aggregateTeamStats(quarters, records, players);
    expect(r.players.map((p) => p.id)).toEqual([1, 2, 3]);

    const [a, b, c] = r.players;
    expect(a).toMatchObject({ id: 1, games: 2, min: 70, goal: 2, assist: 0 });
    expect(b).toMatchObject({ id: 2, games: 2, min: 50, goal: 1, assist: 1 });
    expect(c).toMatchObject({ id: 3, games: 0, min: 0, goal: 0, assist: 0 });
  });

  it("counts a tie as a draw", () => {
    const r = aggregateTeamStats(
      [quarter({ id: 1, match: 1, awaygoals: 1 })],
      [record({ id: 1, quarter: 1, player: 1, goal: 1 })],
      [player({ id: 1, name: "A" })],
    );
    expect(r.draws).toBe(1);
    expect(r.wins).toBe(0);
    expect(r.losses).toBe(0);
  });

  it("still totals goals from records whose quarter is unknown", () => {
    // Record points at a quarter not in the list: goal counts toward the team
    // total but cannot be attributed to a match (no W/D/L, no games credit).
    const r = aggregateTeamStats(
      [quarter({ id: 1, match: 1, awaygoals: 0 })],
      [record({ id: 9, quarter: 999, player: 1, goal: 1 })],
      [player({ id: 1, name: "A" })],
    );
    expect(r.totalGoal).toBe(1);
    expect(r.players[0].goal).toBe(1);
    expect(r.players[0].games).toBe(0);
    // The one real quarter (match 1) has home 0 vs away 0 -> draw.
    expect(r.draws).toBe(1);
  });
});

// 경기기록표(matchRecordSheet)의 '총 경기수'·'총 경기시간'이 공유하는 헬퍼.
describe("playerMatchIds / matchMinutes", () => {
  const quarters: Quarter[] = [
    quarter({ id: 11, match: 100, duration: 45 }),
    quarter({ id: 12, match: 100, duration: 45 }),
    quarter({ id: 21, match: 200, duration: 30 }),
  ];
  const records: MatchRecord[] = [
    // p1: 경기 100의 두 쿼터 모두 출전 → 경기 1개로 집계
    record({ id: 1, quarter: 11, player: 1 }),
    record({ id: 2, quarter: 12, player: 1 }),
    // p2: 경기 100·200 모두 출전
    record({ id: 3, quarter: 11, player: 2 }),
    record({ id: 4, quarter: 21, player: 2 }),
    // 알 수 없는 쿼터의 기록은 어느 경기에도 귀속되지 않는다
    record({ id: 5, quarter: 999, player: 3 }),
  ];

  it("collects distinct match ids per player", () => {
    const m = playerMatchIds(quarters, records);
    expect([...(m.get(1) ?? [])]).toEqual([100]);
    expect([...(m.get(2) ?? [])].sort()).toEqual([100, 200]);
    expect(m.get(3)).toBeUndefined(); // unknown quarter -> no credit
  });

  it("sums quarter durations per match", () => {
    const mm = matchMinutes(quarters);
    expect(mm.get(100)).toBe(90);
    expect(mm.get(200)).toBe(30);
  });

  it("combines into per-player total match minutes (경기기록표 '총 경기시간')", () => {
    const ids = playerMatchIds(quarters, records);
    const mm = matchMinutes(quarters);
    const total = (pid: number) =>
      [...(ids.get(pid) ?? [])].reduce((s, m) => s + (mm.get(m) ?? 0), 0);
    expect(total(1)).toBe(90); // 경기 100만
    expect(total(2)).toBe(120); // 90 + 30
    expect(total(3)).toBe(0);
  });

  it("stays consistent with aggregateTeamStats games count", () => {
    const r = aggregateTeamStats(quarters, records, [
      player({ id: 1, name: "A" }),
      player({ id: 2, name: "B" }),
      player({ id: 3, name: "C" }),
    ]);
    const ids = playerMatchIds(quarters, records);
    r.players.forEach((p) => {
      expect(p.games).toBe(ids.get(p.id)?.size ?? 0);
    });
  });
});
