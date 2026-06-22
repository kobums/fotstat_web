import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { quarterApi, recordApi } from "../../core/api/endpoints";
import type { Player, Quarter } from "../../core/api/types";
import { qk } from "../../lib/queryKeys";
import { combineLists } from "../../lib/combineQueries";
import { parseMatchDate } from "../../lib/date";
import { usePlayers } from "../player/usePlayers";
import { useMatches } from "../match/useMatches";

export interface DateRange {
  /** "YYYY-MM-DD" inclusive start, or "" for open. */
  start?: string;
  /** "YYYY-MM-DD" inclusive end, or "" for open. */
  end?: string;
}

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

export interface TeamStatsResult {
  isLoading: boolean;
  isError: boolean;
  matchCount: number;
  totalGoal: number;
  totalConceded: number;
  totalAssist: number;
  wins: number;
  draws: number;
  losses: number;
  players: PlayerStat[];
}

// Client-side aggregation: the backend exposes no stats endpoint, so we walk
// matches -> quarters -> records and roll the numbers up here.
export function useTeamStats(
  teamId: number,
  range?: DateRange,
): TeamStatsResult {
  const players = usePlayers(teamId);
  const matches = useMatches(teamId);
  const start = range?.start ?? "";
  const end = range?.end ?? "";

  // Only aggregate matches whose date falls within the (inclusive) range.
  const matchList = useMemo(() => {
    let list = matches.data ?? [];
    if (start) {
      const s = new Date(`${start}T00:00:00`);
      list = list.filter((m) => {
        const d = parseMatchDate(m.matchdate);
        return d !== null && d >= s;
      });
    }
    if (end) {
      const e = new Date(`${end}T23:59:59`);
      list = list.filter((m) => {
        const d = parseMatchDate(m.matchdate);
        return d !== null && d <= e;
      });
    }
    return list;
  }, [matches.data, start, end]);

  // `combine` flattens the per-query results and applies react-query's
  // structural sharing, so `.data` stays referentially stable across renders
  // when the underlying data is unchanged — letting the aggregate useMemo below
  // actually memoize (a raw useQueries array is a new reference every render).
  const quarters = useQueries({
    queries: matchList.map((m) => ({
      queryKey: qk.quarters(m.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        quarterApi.list(m.id, signal),
      enabled: m.id > 0,
    })),
    combine: combineLists,
  });
  const allQuarters: Quarter[] = quarters.data;

  const records = useQueries({
    queries: allQuarters.map((q) => ({
      queryKey: qk.records(q.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        recordApi.list(q.id, signal),
      enabled: q.id > 0,
    })),
    combine: combineLists,
  });

  const isLoading =
    players.isLoading || matches.isLoading || quarters.isLoading || records.isLoading;
  const isError =
    players.isError || matches.isError || quarters.isError || records.isError;

  const aggregate = useMemo(() => {
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

    records.data.forEach((r) => {
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

    const playerStats: PlayerStat[] = (players.data ?? []).map((p: Player) => {
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
  }, [allQuarters, records.data, players.data]);

  return { isLoading, isError, ...aggregate };
}
