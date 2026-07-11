import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inbodyApi, type InbodyInput } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function useInbodies(teamId: number) {
  return useEntityQuery(qk.inbodies(teamId), inbodyApi.list, teamId);
}

export function useCreateInbody(teamId: number) {
  return useInvalidatingMutation((input: InbodyInput) => inbodyApi.create(input), {
    invalidate: () => [qk.inbodies(teamId)],
  });
}

export function useUpdateInbody(teamId: number) {
  return useInvalidatingMutation(
    (input: InbodyInput & { id: number }) => inbodyApi.update(input),
    { invalidate: () => [qk.inbodies(teamId)] },
  );
}

export function useDeleteInbody(teamId: number) {
  return useInvalidatingMutation((id: number) => inbodyApi.remove(id), {
    invalidate: () => [qk.inbodies(teamId)],
    errorMessage: "측정 기록을 삭제하지 못했습니다.",
  });
}

/** 시트 일괄 저장 — 서버가 행 단위 upsert. 부분 실패 시에도 캐시를 서버
 *  상태와 동기화해야 하므로 onSettled에서 무효화한다. */
export function useSaveInbodies(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: InbodyInput[]) => inbodyApi.createBatch(inputs),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.inbodies(teamId) }),
  });
}
