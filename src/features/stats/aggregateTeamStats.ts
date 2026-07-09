import type { Injury, Match, MatchRecord, Player, Quarter } from "../../core/api/types";
import { absentGamesFor } from "../../lib/injury";
import { perMatchGoals, resultOf } from "../../lib/matchResult";

export interface PlayerStat {
  id: number;
  name: string;
  number: number;
  position: string;
  games: number;
  min: number;
  goal: number;
  assist: number;
  /** 부상으로 결장한 경기 수 (집계 기간 내). */
  absentGames: number;
}

export interface SquadAverages {
  goalPerGame: number;
  assistPerGame: number;
}

/** 스쿼드 평균 — 출전 기록이 있는 선수들의 경기당 기여 평균 (PlayerStatDetail 기준선). */
export function squadAverages(players: PlayerStat[]): SquadAverages {
  const withGames = players.filter((p) => p.games > 0);
  if (withGames.length === 0) return { goalPerGame: 0, assistPerGame: 0 };
  const g =
    withGames.reduce((s, p) => s + p.goal / p.games, 0) / withGames.length;
  const a =
    withGames.reduce((s, p) => s + p.assist / p.games, 0) / withGames.length;
  return { goalPerGame: g, assistPerGame: a };
}

/** 선수별로 기록을 남긴 경기 id 집합. "경기 참여"의 단일 정의 —
 *  aggregateTeamStats(경기수)와 matchRecordSheet(총 경기시간)가 공유한다. */
export function playerMatchIds(
  allQuarters: Quarter[],
  records: MatchRecord[],
): Map<number, Set<number>> {
  const quarterToMatch = new Map(allQuarters.map((q) => [q.id, q.match]));
  const byPlayer = new Map<number, Set<number>>();
  records.forEach((r) => {
    const matchId = quarterToMatch.get(r.quarter);
    if (matchId === undefined) return;
    const set = byPlayer.get(r.player) ?? new Set<number>();
    set.add(matchId);
    byPlayer.set(r.player, set);
  });
  return byPlayer;
}

/** 경기별 총 시간(쿼터 duration 합). */
export function matchMinutes(allQuarters: Quarter[]): Map<number, number> {
  const byMatch = new Map<number, number>();
  allQuarters.forEach((q) => {
    byMatch.set(q.match, (byMatch.get(q.match) ?? 0) + q.duration);
  });
  return byMatch;
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
  injuries: Injury[] = [],
  matches: Match[] = [],
): TeamStatsAggregate {
  // Per-match home/away goals + W/D/L (shared "records.goal = home,
  // awaygoals = away" rule). A match counts as played once it has a quarter,
  // so the map keys are exactly the played matches.
  const goalsByMatch = perMatchGoals(allQuarters, records);

  const perPlayer = new Map<number, { min: number; goal: number; assist: number }>();
  const matchesByPlayer = playerMatchIds(allQuarters, records);
  let totalGoal = 0;
  let totalAssist = 0;

  records.forEach((r) => {
    totalGoal += r.goal;
    totalAssist += r.assist;
    const acc = perPlayer.get(r.player) ?? { min: 0, goal: 0, assist: 0 };
    acc.min += r.min;
    acc.goal += r.goal;
    acc.assist += r.assist;
    perPlayer.set(r.player, acc);
  });

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalConceded = 0;
  goalsByMatch.forEach(({ home, away }) => {
    totalConceded += away;
    switch (resultOf(home, away)) {
      case "W":
        wins++;
        break;
      case "L":
        losses++;
        break;
      default:
        draws++;
    }
  });

  const playerStats: PlayerStat[] = players.map((p) => {
    const acc = perPlayer.get(p.id);
    return {
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      games: matchesByPlayer.get(p.id)?.size ?? 0,
      min: acc?.min ?? 0,
      goal: acc?.goal ?? 0,
      assist: acc?.assist ?? 0,
      absentGames: absentGamesFor(p.id, injuries, matches),
    };
  });
  playerStats.sort(
    (a, b) => b.goal - a.goal || b.assist - a.assist || b.min - a.min,
  );

  return {
    matchCount: goalsByMatch.size,
    totalGoal,
    totalConceded,
    totalAssist,
    wins,
    draws,
    losses,
    players: playerStats,
  };
}
