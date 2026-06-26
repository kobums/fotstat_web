import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import Stepper from "../../components/Stepper/Stepper";
import Select from "../../components/Select/Select";
import { ApiError } from "../../core/api/client";
import type { MatchRecord, Player } from "../../core/api/types";
import { useCreateRecord, useUpdateRecord } from "./useRecords";
import styles from "./RecordFormModal.module.css";

interface Props {
  quarterId: number;
  quarterDuration: number;
  players: Player[];
  /** Players already recorded in this quarter (excluded when creating). */
  takenPlayerIds: Set<number>;
  record?: MatchRecord | null;
  onClose: () => void;
}

export default function RecordFormModal({
  quarterId,
  quarterDuration,
  players,
  takenPlayerIds,
  record,
  onClose,
}: Props) {
  const editing = !!record;
  const selectable = editing
    ? players
    : players.filter((p) => !takenPlayerIds.has(p.id));

  const [playerId, setPlayerId] = useState<number>(
    record?.player ?? selectable[0]?.id ?? 0,
  );
  const [min, setMin] = useState(record?.min ?? 0);
  const [goal, setGoal] = useState(record?.goal ?? 0);
  const [assist, setAssist] = useState(record?.assist ?? 0);
  const [yellowcard, setYellowcard] = useState(record?.yellowcard ?? 0);
  const [redcard, setRedcard] = useState(record?.redcard ?? 0);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateRecord(quarterId);
  const update = useUpdateRecord(quarterId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!playerId) return setError("선수를 선택해주세요.");
    setError(null);
    try {
      if (editing && record) {
        await update.mutateAsync({
          id: record.id,
          min,
          goal,
          assist,
          yellowcard,
          redcard,
        });
      } else {
        await create.mutateAsync({
          player: playerId,
          min,
          goal,
          assist,
          yellowcard,
          redcard,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    }
  }

  return (
    <Modal open title={editing ? "기록 수정" : "기록 추가"} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        {editing ? (
          <div className={styles.playerName}>
            {players.find((p) => p.id === record?.player)?.name ?? "선수"}
          </div>
        ) : selectable.length === 0 ? (
          <div className={styles.error}>
            이 쿼터에 기록할 수 있는 선수가 없습니다. 먼저 스쿼드에 선수를 추가하세요.
          </div>
        ) : (
          <Select
            label="선수"
            id="player"
            value={playerId}
            onChange={(v) => setPlayerId(Number(v))}
            options={selectable.map((p) => ({
              value: p.id,
              label: `${p.number}. ${p.name}`,
            }))}
          />
        )}

        <div className={styles.steppers}>
          <Stepper label="출전(분)" value={min} onChange={setMin} max={200} />
          <Stepper label="골" value={goal} onChange={setGoal} max={99} />
          <Stepper label="어시스트" value={assist} onChange={setAssist} max={99} />
          <Stepper
            label="옐로카드"
            value={yellowcard}
            onChange={setYellowcard}
            max={2}
          />
          <Stepper
            label="레드카드"
            value={redcard}
            onChange={setRedcard}
            max={1}
          />
        </div>
        <button
          type="button"
          className={styles.fullTime}
          onClick={() => setMin(quarterDuration)}
        >
          풀타임 채우기 ({quarterDuration}분)
        </button>

        {error && <div className={styles.error}>{error}</div>}
        <Button
          type="submit"
          loading={create.isPending || update.isPending}
          disabled={!editing && selectable.length === 0}
        >
          {editing ? "저장" : "추가"}
        </Button>
      </form>
    </Modal>
  );
}
