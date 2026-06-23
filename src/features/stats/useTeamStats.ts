import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { quarterApi, recordApi } from "../../core/api/endpoints";
import type { Quarter } from "../../core/api/types";
import { qk } from "../../lib/queryKeys";
import { combineLists } from "../../lib/combineQueries";
import { parseMatchDate } from "../../lib/date";
import { usePlayers } from "../player/usePlayers";
import { useMatches } from "../match/useMatches";
import { aggregateTeamStats } from "./aggregateTeamStats";
import type { PlayerStat } from "./aggregateTeamStats";

export type { PlayerStat } from "./aggregateTeamStats";

export interface DateRange {
  /** "YYYY-MM-DD" inclusive start, or "" for open. */
  start?: string;
  /** "YYYY-MM-DD" inclusive end, or "" for open. */
  end?: string;
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

  const aggregate = useMemo(
    () => aggregateTeamStats(allQuarters, records.data, players.data ?? []),
    [allQuarters, records.data, players.data],
  );

  return { isLoading, isError, ...aggregate };
}
