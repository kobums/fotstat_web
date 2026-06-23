import type { MatchRecord, Player, Quarter } from "../../core/api/types";

export interface PlayerStat {
  id: number;
  name: string;
  number: number;
  position: string;
  games: number;
  min: number;
  goal: number;
  assist: number;
}

export interface TeamStatsAggregate {
  matchCount: number;
  totalGoal: number;
  totalConceded: number;
  totalAssist: number;
  wins: number;
  draws: number;
  losses: number;
  players: PlayerStat[];
}

// Pure client-side aggregation: the backend exposes no stats endpoint, so we
// walk quarters -> records and roll the numbers up here. Kept free of React so
// it can be unit-tested in isolation (see aggregateTeamStats.test.ts).
export function aggregateTeamStats(
  allQuarters: Quarter[],
  records: MatchRecord[],
  players: Player[],
): TeamStatsAggregate {
  const quarterToMatch = new Map<number, number>();
  allQuarters.forEach((q) => quarterToMatch.set(q.id, q.match));

  // Per-match home/away goals for W/D/L.
  const homeByMatch = new Map<number, number>();
  const awayByMatch = new Map<number, number>();
  allQuarters.forEach((q) => {
    awayByMatch.set(q.match, (awayByMatch.get(q.match) ?? 0) + q.awaygoals);
  });

  const perPlayer = new Map<
    number,
    { min: number; goal: number; assist: number; matches: Set<number> }
  >();
  let totalGoal = 0;
  let totalAssist = 0;

  records.forEach((r) => {
    const matchId = quarterToMatch.get(r.quarter);
    totalGoal += r.goal;
    totalAssist += r.assist;
    if (matchId !== undefined) {
      homeByMatch.set(matchId, (homeByMatch.get(matchId) ?? 0) + r.goal);
    }
    const acc = perPlayer.get(r.player) ?? {
      min: 0,
      goal: 0,
      assist: 0,
      matches: new Set<number>(),
    };
    acc.min += r.min;
    acc.goal += r.goal;
    acc.assist += r.assist;
    if (matchId !== undefined) acc.matches.add(matchId);
    perPlayer.set(r.player, acc);
  });

  // A match counts as played once it has at least one quarter.
  const playedMatchIds = new Set(allQuarters.map((q) => q.match));
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalConceded = 0;
  playedMatchIds.forEach((mId) => {
    const home = homeByMatch.get(mId) ?? 0;
    const away = awayByMatch.get(mId) ?? 0;
    totalConceded += away;
    if (home > away) wins++;
    else if (home < away) losses++;
    else draws++;
  });

  const playerStats: PlayerStat[] = players.map((p) => {
    const acc = perPlayer.get(p.id);
    return {
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      games: acc?.matches.size ?? 0,
      min: acc?.min ?? 0,
      goal: acc?.goal ?? 0,
      assist: acc?.assist ?? 0,
    };
  });
  playerStats.sort(
    (a, b) => b.goal - a.goal || b.assist - a.assist || b.min - a.min,
  );

  return {
    matchCount: playedMatchIds.size,
    totalGoal,
    totalConceded,
    totalAssist,
    wins,
    draws,
    losses,
    players: playerStats,
  };
}
