import { recordApi } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function useRecords(quarterId: number) {
  return useEntityQuery(qk.records(quarterId), recordApi.list, quarterId);
}

export function useCreateRecord(quarterId: number) {
  return useInvalidatingMutation(
    (input: {
      player: number;
      min: number;
      goal: number;
      assist: number;
      yellowcard: number;
      redcard: number;
    }) => recordApi.create({ quarter: quarterId, ...input }),
    { invalidate: () => [qk.records(quarterId)] },
  );
}

export function useUpdateRecord(quarterId: number) {
  return useInvalidatingMutation(
    (input: {
      id: number;
      min: number;
      goal: number;
      assist: number;
      yellowcard: number;
      redcard: number;
    }) => recordApi.updateStats(input),
    { invalidate: () => [qk.records(quarterId)] },
  );
}

export function useDeleteRecord(quarterId: number) {
  return useInvalidatingMutation((id: number) => recordApi.remove(id), {
    invalidate: () => [qk.records(quarterId)],
    errorMessage: "기록을 삭제하지 못했습니다.",
  });
}
