import { useQueries } from "@tanstack/react-query";
import { quarterApi, recordApi } from "../../core/api/endpoints";
import type { Match, MatchRecord, Quarter } from "../../core/api/types";
import { qk } from "../../lib/queryKeys";
import { combineLists } from "../../lib/combineQueries";

export interface QuarterRecords {
  quarters: Quarter[];
  records: MatchRecord[];
  isLoading: boolean;
  isError: boolean;
}

// Fans out one quarters fetch per match, then one records fetch per quarter,
// sharing query keys with the match-detail and stats screens so the fetches
// stay cached. `combineLists` keeps `.data` referentially stable across
// renders, letting downstream useMemo aggregations memoize.
export function useQuarterRecords(matchList: Match[]): QuarterRecords {
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

  return {
    quarters: allQuarters,
    records: records.data,
    isLoading: quarters.isLoading || records.isLoading,
    isError: quarters.isError || records.isError,
  };
}
