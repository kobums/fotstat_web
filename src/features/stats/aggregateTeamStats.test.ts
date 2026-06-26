import { describe, it, expect } from "vitest";
import { aggregateTeamStats } from "./aggregateTeamStats";
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
