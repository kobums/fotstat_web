import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { injuryApi, type InjuryInput } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { notifyError } from "../../lib/notifyError";

export function useInjuries(teamId: number) {
  return useQuery({
    queryKey: qk.injuries(teamId),
    queryFn: ({ signal }) => injuryApi.list(teamId, signal),
    enabled: teamId > 0,
  });
}

export function useCreateInjury(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InjuryInput) => injuryApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.injuries(teamId) }),
  });
}

export function useUpdateInjury(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InjuryInput & { id: number }) =>
      injuryApi.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.injuries(teamId) }),
  });
}

export function useDeleteInjury(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => injuryApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.injuries(teamId) }),
    onError: notifyError("부상 기록을 삭제하지 못했습니다."),
  });
}
