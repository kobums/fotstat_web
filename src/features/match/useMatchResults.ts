import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { quarterApi, recordApi } from "../../core/api/endpoints";
import type { Match, Quarter } from "../../core/api/types";
import { resultOf, type Result } from "../../components/ResultPill/ResultPill";
import { qk } from "../../lib/queryKeys";
import { combineLists } from "../../lib/combineQueries";
import { useMatches } from "./useMatches";

export interface MatchResult {
  home: number;
  away: number;
  result: Result;
  played: boolean;
}

// Per-match home/away goals + W/D/L for the whole team. Fans out one
// quarters fetch per match — prefer useMatchResultsFor with just the
// rendered matches on list screens.
export function useMatchResults(teamId: number) {
  const matches = useMatches(teamId);
  const inner = useMatchResultsFor(matches.data ?? []);
  return {
    isLoading: matches.isLoading || inner.isLoading,
    results: inner.results,
  };
}

// Same aggregation, scoped to an explicit match list. Shares query keys with
// the stats and match-detail screens, so quarter/record fetches are cached.
export function useMatchResultsFor(matchList: Match[]) {
  // `combine` keeps `.data` referentially stable across renders (see
  // combineLists), so the results useMemo below memoizes correctly.
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

  const isLoading = quarters.isLoading || records.isLoading;

  const results = useMemo(() => {
    const quarterToMatch = new Map<number, number>();
    const home = new Map<number, number>();
    const away = new Map<number, number>();
    allQuarters.forEach((q) => {
      quarterToMatch.set(q.id, q.match);
      away.set(q.match, (away.get(q.match) ?? 0) + q.awaygoals);
    });
    records.data.forEach((r) => {
      const mId = quarterToMatch.get(r.quarter);
      if (mId !== undefined) home.set(mId, (home.get(mId) ?? 0) + r.goal);
    });
    const playedIds = new Set(allQuarters.map((q) => q.match));
    const map = new Map<number, MatchResult>();
    playedIds.forEach((mId) => {
      const h = home.get(mId) ?? 0;
      const a = away.get(mId) ?? 0;
      map.set(mId, { home: h, away: a, result: resultOf(h, a), played: true });
    });
    return map;
  }, [allQuarters, records.data]);

  return { isLoading, results };
}
