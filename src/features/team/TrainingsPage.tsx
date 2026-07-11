import { useMemo, useState } from "react";
import Button from "../../components/Button/Button";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import { EmptyView, StatusView } from "../../components/StateView/StateView";
import type { Training } from "../../core/api/types";
import { dayOf, formatMatchDate, today } from "../../lib/date";
import {
  attendancesByTraining,
  byTrainingdateDesc,
  playerTrainingStats,
} from "../../lib/training";
import { usePlayers } from "../player/usePlayers";
import { useFormModalState } from "../shared/useFormModalState";
import { useTeamContext } from "./teamContext";
import { useInjuries } from "./useInjuries";
import { useAttendances, useTrainings } from "./useTrainings";
import AttendanceModal from "./AttendanceModal";
import TrainingFormModal from "./TrainingFormModal";
import styles from "./TrainingsPage.module.css";

/** 훈련 관리 페이지 — 세션 등록·참석 체크와 선수별 참석 집계를 한곳에서 다룬다. */
export default function TrainingsPage() {
  const { team } = useTeamContext();
  const playersQ = usePlayers(team.id);
  const injuriesQ = useInjuries(team.id);
  const trainingsQ = useTrainings(team.id);
  const attendancesQ = useAttendances(team.id);
  // 상태 표시는 훈련 목록 기준 — 나머지는 도착하는 대로 채워진다(InjuriesPage와 동일 방식)
  const { isLoading, isError, refetch } = trainingsQ;

  const form = useFormModalState<Training>();
  const [checking, setChecking] = useState<Training | null>(null);

  const players = useMemo(() => playersQ.data ?? [], [playersQ.data]);
  const injuries = useMemo(() => injuriesQ.data ?? [], [injuriesQ.data]);
  const attendances = useMemo(
    () => attendancesQ.data ?? [],
    [attendancesQ.data],
  );
  const trainings = useMemo(
    () => [...(trainingsQ.data ?? [])].sort(byTrainingdateDesc),
    [trainingsQ.data],
  );
  const byTraining = useMemo(
    () => attendancesByTraining(attendances),
    [attendances],
  );
  // 참석 많은 순 → 이름 순. 미래 훈련은 분모에서 빠진다(lib/training.ts).
  const playerStats = useMemo(
    () =>
      players
        .map((p) => ({
          player: p,
          stats: playerTrainingStats(p.id, trainings, attendances),
        }))
        .sort(
          (a, b) =>
            b.stats.attended - a.stats.attended ||
            a.player.name.localeCompare(b.player.name),
        ),
    [players, trainings, attendances],
  );
  const hasHeld = playerStats.some((s) => s.stats.held > 0);

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {trainingsQ.data ? `훈련 ${trainings.length}회` : " "}
        </span>
        <Button size="sm" fullWidth={false} onClick={form.openCreate}>
          훈련 등록
        </Button>
      </div>

      <StatusView
        isLoading={isLoading}
        isError={isError}
        errorMessage="훈련 기록을 불러오지 못했습니다."
        onRetry={refetch}
        isEmpty={!!trainingsQ.data && trainings.length === 0}
        empty={
          <EmptyView
            title="훈련이 없습니다"
            description="훈련을 등록하고 참석과 훈련 시간을 기록하세요."
          />
        }
      />

      {trainings.length > 0 && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>훈련 일정</h3>
          <div className={styles.list}>
            {trainings.map((training) => {
              const attended = byTraining.get(training.id)?.length ?? 0;
              const upcoming = dayOf(training.trainingdate) > today();
              return (
                <div key={training.id} className={styles.row}>
                  <button
                    className={styles.rowMain}
                    onClick={() => setChecking(training)}
                  >
                    <div className={styles.main}>
                      <span className={styles.name}>
                        {formatMatchDate(training.trainingdate)}
                      </span>
                      {upcoming && <span className={styles.upcoming}>예정</span>}
                    </div>
                    <span className={styles.attended}>
                      참석 {attended}/{players.length}명
                    </span>
                  </button>
                  <button
                    className={styles.edit}
                    onClick={() => form.openEdit(training)}
                    aria-label={`${formatMatchDate(training.trainingdate)} 훈련 수정`}
                  >
                    수정
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasHeld && players.length > 0 && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>선수별 참석</h3>
          <div className={styles.list}>
            {playerStats.map(({ player, stats }) => (
              <div key={player.id} className={styles.statRow}>
                <PlayerAvatar
                  number={player.number}
                  position={player.position}
                  size={30}
                />
                <span className={styles.statName}>{player.name}</span>
                <div className={styles.statRight}>
                  <span className={styles.statMain}>
                    {stats.attended}/{stats.held}회 ({stats.rate}%)
                  </span>
                  <span className={styles.statSub}>총 {stats.totalMin}분</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {form.open && (
        <TrainingFormModal
          teamId={team.id}
          training={form.editing}
          onClose={form.close}
        />
      )}

      {checking && (
        <AttendanceModal
          teamId={team.id}
          training={checking}
          players={players}
          injuries={injuries}
          attendances={byTraining.get(checking.id) ?? []}
          onClose={() => setChecking(null)}
        />
      )}
    </div>
  );
}
