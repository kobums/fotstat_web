import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { teamApi } from "../../core/api/endpoints";
import { useAuth } from "../../core/auth/AuthContext";
import { qk } from "../../lib/queryKeys";
import { notifyError } from "../../lib/notifyError";

export function useTeams() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useQuery({
    queryKey: qk.teams(userId),
    queryFn: ({ signal }) => teamApi.list(userId, signal),
    enabled: userId > 0,
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: qk.team(id),
    queryFn: ({ signal }) => teamApi.read(id, signal),
    enabled: id > 0,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useMutation({
    mutationFn: (name: string) => teamApi.create(userId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teams(userId) }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useMutation({
    mutationFn: (vars: { id: number; name: string }) =>
      teamApi.update({ id: vars.id, user: userId, name: vars.name }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.teams(userId) });
      qc.invalidateQueries({ queryKey: qk.team(vars.id) });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useMutation({
    mutationFn: (id: number) => teamApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teams(userId) }),
    onError: notifyError("팀을 삭제하지 못했습니다."),
  });
}
