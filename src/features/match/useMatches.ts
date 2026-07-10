import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { matchApi } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

const PAST_PAGE_SIZE = 20;

/** All matches (used by stats/home aggregation). */
export function useMatches(teamId: number) {
  return useQuery({
    queryKey: qk.matches(teamId),
    queryFn: ({ signal }) =>
      matchApi.list(teamId, { pagesize: 500 }, signal).then((r) => r.matches),
    enabled: teamId > 0,
  });
}

/** Upcoming matches (from `nowApi` onward), ascending — small set, no paging. */
export function useUpcomingMatches(teamId: number, nowApi: string) {
  return useQuery({
    queryKey: [...qk.matches(teamId), "upcoming"],
    queryFn: ({ signal }) =>
      matchApi
        .list(
          teamId,
          { startmatchdate: nowApi, orderby: "matchdate asc", pagesize: 100 },
          signal,
        )
        .then((r) => r.matches),
    enabled: teamId > 0,
  });
}

/** Past matches, descending, paginated 20-at-a-time (infinite scroll). */
export function usePastMatchesInfinite(teamId: number, nowApi: string) {
  return useInfiniteQuery({
    queryKey: [...qk.matches(teamId), "past"],
    enabled: teamId > 0,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      matchApi.list(
        teamId,
        {
          endmatchdate: nowApi,
          orderby: "matchdate desc",
          page: pageParam,
          pagesize: PAST_PAGE_SIZE,
        },
        signal,
      ),
    getNextPageParam: (_lastPage, allPages) => {
      const loaded = allPages.reduce((s, p) => s + p.matches.length, 0);
      // The backend only returns `total` on page 1; find it wherever it lives.
      const total = allPages.find((p) => p.total !== undefined)?.total ?? loaded;
      return loaded < total ? allPages.length + 1 : undefined;
    },
  });
}

export function useMatch(id: number) {
  return useEntityQuery(qk.match(id), matchApi.read, id);
}

interface MatchInput {
  team: number;
  awayname: string;
  matchdate: string;
}

export function useCreateMatch(teamId: number) {
  return useInvalidatingMutation((input: MatchInput) => matchApi.create(input), {
    invalidate: () => [qk.matches(teamId)],
  });
}

export function useUpdateMatch(teamId: number) {
  return useInvalidatingMutation(
    (input: MatchInput & { id: number }) => matchApi.update(input),
    { invalidate: (vars) => [qk.matches(teamId), qk.match(vars.id)] },
  );
}

export function useDeleteMatch(teamId: number) {
  return useInvalidatingMutation((id: number) => matchApi.remove(id), {
    invalidate: () => [qk.matches(teamId)],
    // Clear the deleted match's detail and quarters cache.
    remove: (matchId) => [qk.match(matchId), qk.quarters(matchId)],
    errorMessage: "경기를 삭제하지 못했습니다.",
  });
}
