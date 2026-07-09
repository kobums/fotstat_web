import { teamApi } from "../../core/api/endpoints";
import { useAuth } from "../../core/auth/AuthContext";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function useTeams() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useEntityQuery(qk.teams(userId), teamApi.list, userId);
}

export function useTeam(id: number) {
  return useEntityQuery(qk.team(id), teamApi.read, id);
}

export function useCreateTeam() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useInvalidatingMutation(
    (vars: { name: string; duration?: number }) =>
      teamApi.create(userId, vars.name, vars.duration),
    { invalidate: () => [qk.teams(userId)] },
  );
}

export function useUpdateTeam() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useInvalidatingMutation(
    (vars: { id: number; name: string; duration?: number }) =>
      teamApi.update({ id: vars.id, user: userId, name: vars.name, duration: vars.duration }),
    { invalidate: (vars) => [qk.teams(userId), qk.team(vars.id)] },
  );
}

export function useDeleteTeam() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;
  return useInvalidatingMutation((id: number) => teamApi.remove(id), {
    invalidate: () => [qk.teams(userId)],
    errorMessage: "팀을 삭제하지 못했습니다.",
  });
}
