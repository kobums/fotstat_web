import { injuryApi, type InjuryInput } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function useInjuries(teamId: number) {
  return useEntityQuery(qk.injuries(teamId), injuryApi.list, teamId);
}

export function useCreateInjury(teamId: number) {
  return useInvalidatingMutation((input: InjuryInput) => injuryApi.create(input), {
    invalidate: () => [qk.injuries(teamId)],
  });
}

export function useUpdateInjury(teamId: number) {
  return useInvalidatingMutation(
    (input: InjuryInput & { id: number }) => injuryApi.update(input),
    { invalidate: () => [qk.injuries(teamId)] },
  );
}

export function useDeleteInjury(teamId: number) {
  return useInvalidatingMutation((id: number) => injuryApi.remove(id), {
    invalidate: () => [qk.injuries(teamId)],
    errorMessage: "부상 기록을 삭제하지 못했습니다.",
  });
}
