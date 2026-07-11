import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attendanceApi,
  trainingApi,
  type AttendanceInput,
  type TrainingInput,
} from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";
import { useEntityQuery, useInvalidatingMutation } from "../../lib/queryFactory";

export function useTrainings(teamId: number) {
  return useEntityQuery(qk.trainings(teamId), trainingApi.list, teamId);
}

export function useCreateTraining(teamId: number) {
  return useInvalidatingMutation(
    (input: TrainingInput) => trainingApi.create(input),
    { invalidate: () => [qk.trainings(teamId)] },
  );
}

export function useUpdateTraining(teamId: number) {
  return useInvalidatingMutation(
    (input: TrainingInput & { id: number }) => trainingApi.update(input),
    { invalidate: () => [qk.trainings(teamId)] },
  );
}

export function useDeleteTraining(teamId: number) {
  return useInvalidatingMutation((id: number) => trainingApi.remove(id), {
    // 참석은 ON DELETE CASCADE로 함께 지워지므로 attendances도 무효화한다
    invalidate: () => [qk.trainings(teamId), qk.attendances(teamId)],
    errorMessage: "훈련을 삭제하지 못했습니다.",
  });
}

export function useAttendances(teamId: number) {
  return useEntityQuery(qk.attendances(teamId), attendanceApi.listByTeam, teamId);
}

export interface AttendanceSave {
  /** 체크된 선수 — (training, player) upsert라 min 변경도 여기로 보낸다. */
  creates: AttendanceInput[];
  /** 체크 해제된 기존 참석의 id. */
  deletes: number[];
}

/** 참석 체크 저장 — 두 요청이 원자적이지 않으므로 upsert를 먼저 보내
 *  중간 실패가 '기록 유실'이 아니라 '해제 미반영'으로 남게 하고,
 *  부분 실패 시에도 캐시를 서버 상태와 동기화하도록 onSettled에서 무효화한다. */
export function useSaveAttendances(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ creates, deletes }: AttendanceSave) => {
      if (creates.length > 0) await attendanceApi.createBatch(creates);
      if (deletes.length > 0) await attendanceApi.removeBatch(deletes);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.attendances(teamId) }),
  });
}
