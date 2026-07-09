import { useMemo } from "react";
import type { Match } from "../../core/api/types";
import { perMatchGoals, resultOf, type Result } from "../../lib/matchResult";
import { useMatches } from "./useMatches";
import { useQuarterRecords } from "./useQuarterRecords";

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
  const { quarters, records, isLoading } = useQuarterRecords(matchList);

  const results = useMemo(() => {
    const goals = perMatchGoals(quarters, records);
    const map = new Map<number, MatchResult>();
    goals.forEach(({ home, away }, mId) => {
      map.set(mId, { home, away, result: resultOf(home, away), played: true });
    });
    return map;
  }, [quarters, records]);

  return { isLoading, results };
}
