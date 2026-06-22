import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { recordApi } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";

export function useRecords(quarterId: number) {
  return useQuery({
    queryKey: qk.records(quarterId),
    queryFn: ({ signal }) => recordApi.list(quarterId, signal),
    enabled: quarterId > 0,
  });
}

export function useCreateRecord(quarterId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      player: number;
      min: number;
      goal: number;
      assist: number;
    }) => recordApi.create({ quarter: quarterId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.records(quarterId) }),
  });
}

export function useUpdateRecord(quarterId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: number;
      min: number;
      goal: number;
      assist: number;
    }) => recordApi.updateStats(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.records(quarterId) }),
  });
}

export function useDeleteRecord(quarterId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recordApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.records(quarterId) }),
  });
}
