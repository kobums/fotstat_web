import { playerApi, type PlayerInput } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function usePlayers(teamId: number) {
  return useEntityQuery(qk.players(teamId), playerApi.list, teamId);
}

export function useCreatePlayer(teamId: number) {
  return useInvalidatingMutation((input: PlayerInput) => playerApi.create(input), {
    invalidate: () => [qk.players(teamId)],
  });
}

export function useUpdatePlayer(teamId: number) {
  return useInvalidatingMutation(
    (input: PlayerInput & { id: number }) => playerApi.update(input),
    { invalidate: () => [qk.players(teamId)] },
  );
}

export function useDeletePlayer(teamId: number) {
  return useInvalidatingMutation((id: number) => playerApi.remove(id), {
    invalidate: () => [qk.players(teamId)],
    errorMessage: "선수를 삭제하지 못했습니다.",
  });
}
