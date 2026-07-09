import { quarterApi } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function useQuarters(matchId: number) {
  return useEntityQuery(qk.quarters(matchId), quarterApi.list, matchId);
}

export function useCreateQuarter(matchId: number) {
  return useInvalidatingMutation(
    (input: { number: number; duration: number }) =>
      quarterApi.create({ match: matchId, ...input }),
    { invalidate: () => [qk.quarters(matchId)] },
  );
}

export function useUpdateAwaygoals(matchId: number) {
  return useInvalidatingMutation(
    (vars: { id: number; awaygoals: number }) =>
      quarterApi.updateAwaygoals(vars.id, vars.awaygoals),
    { invalidate: () => [qk.quarters(matchId)], errorMessage: "실점을 저장하지 못했습니다." },
  );
}

export function useDeleteQuarter(matchId: number) {
  return useInvalidatingMutation((id: number) => quarterApi.remove(id), {
    invalidate: () => [qk.quarters(matchId)],
    // Drop the deleted quarter's now-orphaned records so they can't leak
    // into aggregation if the id is reused.
    remove: (quarterId) => [qk.records(quarterId)],
    errorMessage: "쿼터를 삭제하지 못했습니다.",
  });
}
