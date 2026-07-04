import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import Stepper from "../../components/Stepper/Stepper";
import Select from "../../components/Select/Select";
import { ApiError } from "../../core/api/client";
import type { MatchRecord, Player } from "../../core/api/types";
import { assistCap, clampAssist, rebalanceAssists } from "../../lib/assistCap";
import { useCreateRecord, useUpdateRecord } from "./useRecords";
import styles from "./RecordFormModal.module.css";

interface Props {
  quarterId: number;
  quarterDuration: number;
  players: Player[];
  /** Players already recorded in this quarter (excluded when creating). */
  takenPlayerIds: Set<number>;
  /** Players injured on this match date (excluded when creating). */
  injuredPlayerIds?: Set<number>;
  /** All records of this quarter — 어시스트 캡(자기 골 제외·팀 골 합 초과 금지) 계산용. */
  records?: MatchRecord[];
  record?: MatchRecord | null;
  onClose: () => void;
}

export default function RecordFormModal({
  quarterId,
  quarterDuration,
  players,
  takenPlayerIds,
  injuredPlayerIds,
  records = [],
  record,
  onClose,
}: Props) {
  const editing = !!record;
  // 신규 기록 시: 이미 기록된 선수와 이 경기일에 부상 중인 선수는 제외한다.
  const selectable = editing
    ? players
    : players.filter(
        (p) => !takenPlayerIds.has(p.id) && !injuredPlayerIds?.has(p.id),
      );

  const [playerId, setPlayerId] = useState<number>(
    record?.player ?? selectable[0]?.id ?? 0,
  );
  const [min, setMin] = useState(record?.min ?? 0);
  const [goal, setGoal] = useState(record?.goal ?? 0);
  const [assist, setAssist] = useState(record?.assist ?? 0);
  const [yellowcard, setYellowcard] = useState(record?.yellowcard ?? 0);
  const [redcard, setRedcard] = useState(record?.redcard ?? 0);
  const [error, setError] = useState<string | null>(null);

  // 어시스트 무결성 (iOS RecordViewModel.assistCap 미러):
  // ① 자기 골에는 어시스트 불가 ② 쿼터의 어시스트 합 ≤ 골 합.
  // "남"은 현재 선택된 선수를 제외한 이 쿼터의 기존 기록.
  const others = records.filter((r) => r.player !== playerId);
  const othersGoals = others.reduce((s, r) => s + r.goal, 0);
  const othersAssists = others.reduce((s, r) => s + r.assist, 0);
  const cap = assistCap({ othersGoals, othersAssists, ownGoals: goal });

  // 골이 바뀌면 캡도 바뀌므로 어시스트를 즉시 캡 안으로 되돌린다.
  function handleGoal(next: number) {
    setGoal(next);
    setAssist((a) =>
      clampAssist(a, { othersGoals, othersAssists, ownGoals: next }),
    );
  }

  // 선수를 바꾸면 "남의 골/어시" 기준이 달라지므로 다시 클램프.
  function handlePlayer(id: number) {
    setPlayerId(id);
    const rest = records.filter((r) => r.player !== id);
    setAssist((a) =>
      clampAssist(a, {
        othersGoals: rest.reduce((s, r) => s + r.goal, 0),
        othersAssists: rest.reduce((s, r) => s + r.assist, 0),
        ownGoals: goal,
      }),
    );
  }

  const create = useCreateRecord(quarterId);
  const update = useUpdateRecord(quarterId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!playerId) return setError("선수를 선택해주세요.");
    setError(null);
    // 저장 직전 이중 방어 — 서버에 남아 있던 캡 초과 값도 여기서 정리된다
    // (iOS updateDraft의 값 클램프 미러).
    const finalAssist = clampAssist(assist, {
      othersGoals,
      othersAssists,
      ownGoals: goal,
    });
    try {
      if (editing && record) {
        await update.mutateAsync({
          id: record.id,
          min,
          goal,
          assist: finalAssist,
          yellowcard,
          redcard,
        });
        // 골 감소로 다른 선수의 어시스트가 팀 골 합을 초과하면 함께 차감
        // (iOS RecordViewModel.rebalanceAssists 미러).
        const entries = records.map((r) =>
          r.player === playerId
            ? { id: r.id, player: r.player, goal, assist: finalAssist }
            : { id: r.id, player: r.player, goal: r.goal, assist: r.assist },
        );
        for (const change of rebalanceAssists(entries, injuredPlayerIds)) {
          const sibling = records.find((r) => r.id === change.id);
          if (!sibling || sibling.player === playerId) continue;
          await update.mutateAsync({
            id: sibling.id,
            min: sibling.min,
            goal: sibling.goal,
            assist: change.assist,
            yellowcard: sibling.yellowcard,
            redcard: sibling.redcard,
          });
        }
      } else {
        await create.mutateAsync({
          player: playerId,
          min,
          goal,
          assist: finalAssist,
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
            onChange={(v) => handlePlayer(Number(v))}
            options={selectable.map((p) => ({
              value: p.id,
              label: `${p.number}. ${p.name}`,
            }))}
          />
        )}

        <div className={styles.steppers}>
          <Stepper
            row
            label="출전(분)"
            value={min}
            onChange={setMin}
            max={200}
          />
          <Stepper row label="골" value={goal} onChange={handleGoal} max={99} />
          <Stepper
            row
            label="어시스트"
            value={assist}
            onChange={setAssist}
            max={cap}
          />
          <Stepper
            row
            label="옐로카드"
            value={yellowcard}
            onChange={setYellowcard}
            max={2}
          />
          <Stepper
            row
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
