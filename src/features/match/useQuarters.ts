import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { quarterApi } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";

export function useQuarters(matchId: number) {
  return useQuery({
    queryKey: qk.quarters(matchId),
    queryFn: ({ signal }) => quarterApi.list(matchId, signal),
    enabled: matchId > 0,
  });
}

export function useCreateQuarter(matchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { number: number; duration: number }) =>
      quarterApi.create({ match: matchId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quarters(matchId) }),
  });
}

export function useUpdateAwaygoals(matchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; awaygoals: number }) =>
      quarterApi.updateAwaygoals(vars.id, vars.awaygoals),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quarters(matchId) }),
  });
}

export function useDeleteQuarter(matchId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quarterApi.remove(id),
    onSuccess: (_data, quarterId) => {
      qc.invalidateQueries({ queryKey: qk.quarters(matchId) });
      // Drop the deleted quarter's now-orphaned records so they can't leak
      // into aggregation if the id is reused.
      qc.removeQueries({ queryKey: qk.records(quarterId) });
    },
  });
}
