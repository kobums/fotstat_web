// Single source of truth for the "records.goal = home, quarter.awaygoals =
// away" scoring rule and the resulting W/D/L classification, shared by the
// team-stats aggregation and the per-match results hook. Pure (no React) so it
// can be unit-tested and imported by React-free modules.

import type { MatchRecord, Quarter } from "../core/api/types";

export type Result = "W" | "D" | "L";

export function resultOf(homeGoals: number, awayGoals: number): Result {
  if (homeGoals > awayGoals) return "W";
  if (homeGoals < awayGoals) return "L";
  return "D";
}

export interface MatchGoals {
  home: number;
  away: number;
}

/**
 * Per-match home/away goals for every match that has at least one quarter.
 * home = sum of record goals across the match's quarters, away = sum of the
 * quarters' awaygoals. Matches without a quarter are absent from the map (the
 * "played" set), mirroring the backend's per-quarter scoring.
 */
export function perMatchGoals(
  quarters: Quarter[],
  records: MatchRecord[],
): Map<number, MatchGoals> {
  const quarterToMatch = new Map(quarters.map((q) => [q.id, q.match]));
  const byMatch = new Map<number, MatchGoals>();
  const ensure = (matchId: number): MatchGoals => {
    let g = byMatch.get(matchId);
    if (!g) {
      g = { home: 0, away: 0 };
      byMatch.set(matchId, g);
    }
    return g;
  };
  quarters.forEach((q) => {
    ensure(q.match).away += q.awaygoals;
  });
  records.forEach((r) => {
    const matchId = quarterToMatch.get(r.quarter);
    if (matchId !== undefined) ensure(matchId).home += r.goal;
  });
  return byMatch;
}
