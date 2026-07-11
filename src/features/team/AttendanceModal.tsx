import { useMemo, useState } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import Stepper from "../../components/Stepper/Stepper";
import type { Attendance, Injury, Player, Training } from "../../core/api/types";
import { formatMatchDate } from "../../lib/date";
import { errorMessage } from "../../lib/notifyError";
import { injuredPlayerIdsOnTraining } from "../../lib/training";
import { useSaveAttendances } from "./useTrainings";
import styles from "./AttendanceModal.module.css";

const DEFAULT_MIN = 60;

interface Props {
  teamId: number;
  training: Training;
  players: Player[];
  injuries: Injury[];
  /** 이 훈련의 기존 참석 목록. */
  attendances: Attendance[];
  onClose: () => void;
}

interface Draft {
  checked: boolean;
  min: number;
}

/** 참석 체크 시트 — 선수별 체크 + 훈련 시간(분)을 배치로 저장한다. */
export default function AttendanceModal({
  teamId,
  training,
  players,
  injuries,
  attendances,
  onClose,
}: Props) {
  const existing = useMemo(
    () => new Map(attendances.map((a) => [a.player, a])),
    [attendances],
  );
  const injuredIds = useMemo(
    () => injuredPlayerIdsOnTraining(injuries, training.trainingdate),
    [injuries, training.trainingdate],
  );

  const [drafts, setDrafts] = useState<Map<number, Draft>>(
    () =>
      new Map(
        players.map((p) => {
          const a = existing.get(p.id);
          return [p.id, { checked: !!a, min: a?.min ?? DEFAULT_MIN }];
        }),
      ),
  );
  const [error, setError] = useState<string | null>(null);

  const save = useSaveAttendances(teamId);
  const checkedCount = [...drafts.values()].filter((d) => d.checked).length;

  function setDraft(playerId: number, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const next = new Map(prev);
      const cur = next.get(playerId) ?? { checked: false, min: DEFAULT_MIN };
      next.set(playerId, { ...cur, ...patch });
      return next;
    });
  }

  async function onSave() {
    setError(null);
    const creates = [];
    const deletes = [];
    for (const p of players) {
      const draft = drafts.get(p.id);
      const before = existing.get(p.id);
      if (draft?.checked) {
        // upsert — 신규 체크와 min 변경 모두 batch insert 한 번으로 처리된다
        if (!before || before.min !== draft.min) {
          creates.push({ training: training.id, player: p.id, min: draft.min });
        }
      } else if (before) {
        deletes.push(before.id);
      }
    }
    try {
      await save.mutateAsync({ creates, deletes });
      onClose();
    } catch (err) {
      setError(errorMessage(err, "참석을 저장하지 못했습니다."));
    }
  }

  return (
    <Modal open title="참석 체크" onClose={onClose}>
      <div className={styles.meta}>
        <span className={styles.date}>{formatMatchDate(training.trainingdate)}</span>
        <span className={styles.count}>
          참석 {checkedCount}/{players.length}명
        </span>
      </div>

      <div className={styles.list}>
        {players.map((p) => {
          const draft = drafts.get(p.id) ?? { checked: false, min: DEFAULT_MIN };
          const injured = injuredIds.has(p.id);
          // 부상 중이라도 기존 참석(부상 등록 전 입력)은 해제할 수 있어야 한다
          const disabled = injured && !draft.checked;
          return (
            <div key={p.id} className={styles.row}>
              <label
                className={disabled ? `${styles.player} ${styles.disabled}` : styles.player}
              >
                <input
                  type="checkbox"
                  checked={draft.checked}
                  disabled={disabled}
                  onChange={(e) => setDraft(p.id, { checked: e.target.checked })}
                />
                <PlayerAvatar number={p.number} position={p.position} size={30} />
                <span className={styles.name}>{p.name}</span>
                {injured && <span className={styles.injured}>부상 중</span>}
              </label>
              {draft.checked && (
                <Stepper
                  value={draft.min}
                  onChange={(min) => setDraft(p.id, { min })}
                  min={0}
                  max={300}
                  label="분"
                  row
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <Button onClick={onSave} loading={save.isPending}>
          저장
        </Button>
      </div>
    </Modal>
  );
}
