import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { playerApi, type PlayerInput } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { notifyError } from "../../lib/notifyError";

export function usePlayers(teamId: number) {
  return useQuery({
    queryKey: qk.players(teamId),
    queryFn: ({ signal }) => playerApi.list(teamId, signal),
    enabled: teamId > 0,
  });
}

export function useCreatePlayer(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlayerInput) => playerApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.players(teamId) }),
  });
}

export function useUpdatePlayer(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlayerInput & { id: number }) =>
      playerApi.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.players(teamId) }),
  });
}

export function useDeletePlayer(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => playerApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.players(teamId) }),
    onError: notifyError("선수를 삭제하지 못했습니다."),
  });
}
