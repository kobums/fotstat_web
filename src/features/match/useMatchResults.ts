import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { quarterApi, recordApi } from "../../core/api/endpoints";
import type { Quarter } from "../../core/api/types";
import { resultOf, type Result } from "../../components/ResultPill/ResultPill";
import { qk } from "../../lib/queryKeys";
import { useMatches } from "./useMatches";

export interface MatchResult {
  home: number;
  away: number;
  result: Result;
  played: boolean;
}

// Per-match home/away goals + W/D/L. Shares query keys with the stats and
// match-detail screens, so the underlying quarter/record fetches are cached.
export function useMatchResults(teamId: number) {
  const matches = useMatches(teamId);
  const matchList = matches.data ?? [];

  const quarterQueries = useQueries({
    queries: matchList.map((m) => ({
      queryKey: qk.quarters(m.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        quarterApi.list(m.id, signal),
      enabled: m.id > 0,
    })),
  });

  const allQuarters: Quarter[] = useMemo(
    () => quarterQueries.flatMap((q) => q.data ?? []),
    [quarterQueries],
  );

  const recordQueries = useQueries({
    queries: allQuarters.map((q) => ({
      queryKey: qk.records(q.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        recordApi.list(q.id, signal),
      enabled: q.id > 0,
    })),
  });

  const isLoading =
    matches.isLoading ||
    quarterQueries.some((q) => q.isLoading) ||
    recordQueries.some((q) => q.isLoading);

  const results = useMemo(() => {
    const quarterToMatch = new Map<number, number>();
    const home = new Map<number, number>();
    const away = new Map<number, number>();
    allQuarters.forEach((q) => {
      quarterToMatch.set(q.id, q.match);
      away.set(q.match, (away.get(q.match) ?? 0) + q.awaygoals);
    });
    recordQueries.forEach((rq) => {
      (rq.data ?? []).forEach((r) => {
        const mId = quarterToMatch.get(r.quarter);
        if (mId !== undefined) home.set(mId, (home.get(mId) ?? 0) + r.goal);
      });
    });
    const playedIds = new Set(allQuarters.map((q) => q.match));
    const map = new Map<number, MatchResult>();
    playedIds.forEach((mId) => {
      const h = home.get(mId) ?? 0;
      const a = away.get(mId) ?? 0;
      map.set(mId, { home: h, away: a, result: resultOf(h, a), played: true });
    });
    return map;
  }, [allQuarters, recordQueries]);

  return { isLoading, results };
}
