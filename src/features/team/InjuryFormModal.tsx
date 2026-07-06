import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import Select from "../../components/Select/Select";
import TextField from "../../components/TextField/TextField";
import DatePicker from "../../components/DatePicker/DatePicker";
import { ApiError } from "../../core/api/client";
import type { Injury, Player } from "../../core/api/types";
import { today } from "../../lib/date";
import {
  useCreateInjury,
  useDeleteInjury,
  useUpdateInjury,
} from "./useInjuries";
import styles from "./InjuryFormModal.module.css";

interface Props {
  teamId: number;
  players: Player[];
  /** 현재 부상 중인 선수 id — 실수 중복 등록을 줄이기 위해 표시하고 기본 선택에서 제외 */
  injuredPlayerIds: Set<number>;
  injury?: Injury | null;
  /** 신규 등록 시 발생일 프리필 (YYYY-MM-DD, 예: 경기 화면에서 경기일). 미래 날짜는 오늘로 clamp */
  defaultStartdate?: string;
  onClose: () => void;
}

export default function InjuryFormModal({
  teamId,
  players,
  injuredPlayerIds,
  injury,
  defaultStartdate,
  onClose,
}: Props) {
  const editing = !!injury;
  const [player, setPlayer] = useState<number>(
    injury?.player ??
      players.find((p) => !injuredPlayerIds.has(p.id))?.id ??
      players[0]?.id ??
      0,
  );
  const [type, setType] = useState(injury?.type ?? "");
  const [startdate, setStartdate] = useState(() => {
    const preset = (injury?.startdate ?? "").slice(0, 10) || defaultStartdate || today();
    return preset > today() ? today() : preset;
  });
  const [hasReturned, setHasReturned] = useState(
    !!(injury?.returndate ?? "").trim(),
  );
  const [returndate, setReturndate] = useState(
    (injury?.returndate ?? "").slice(0, 10),
  );
  const [memo, setMemo] = useState(injury?.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateInjury(teamId);
  const update = useUpdateInjury(teamId);
  const del = useDeleteInjury(teamId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!player) return setError("선수를 선택해주세요.");
    if (!startdate) return setError("발생일을 선택해주세요.");
    if (hasReturned && !returndate) return setError("복귀일을 선택해주세요.");
    if (hasReturned && returndate < startdate)
      return setError("복귀일은 발생일 이후여야 합니다.");
    setError(null);
    const input = {
      player,
      type,
      startdate,
      returndate: hasReturned ? returndate : "",
      memo,
    };
    try {
      if (editing && injury) {
        await update.mutateAsync({ ...input, id: injury.id });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    }
  }

  async function onDelete() {
    if (!injury) return;
    if (!confirm("이 부상 기록을 삭제할까요?")) return;
    await del.mutateAsync(injury.id);
    onClose();
  }

  return (
    <Modal open title={editing ? "부상 수정" : "부상 등록"} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        {editing ? (
          <div className={styles.field}>
            <span className={styles.label}>선수</span>
            <div>{players.find((p) => p.id === injury?.player)?.name ?? "선수"}</div>
          </div>
        ) : (
          <Select
            label="선수"
            id="injury-player"
            value={player}
            onChange={(v) => setPlayer(Number(v))}
            options={players.map((p) => ({
              value: p.id,
              label: `${p.number}. ${p.name}${injuredPlayerIds.has(p.id) ? " · 부상 중" : ""}`,
            }))}
          />
        )}

        <TextField
          label="부상 부위/종류"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="예: 발목 염좌"
        />

        <div className={styles.field}>
          <span className={styles.label}>발생일</span>
          <DatePicker
            value={startdate}
            onChange={setStartdate}
            max={today()}
            aria-label="발생일"
          />
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={hasReturned}
            onChange={(e) => setHasReturned(e.target.checked)}
          />
          복귀 완료
        </label>

        {hasReturned && (
          <div className={styles.field}>
            <span className={styles.label}>복귀일</span>
            <DatePicker
              value={returndate}
              onChange={setReturndate}
              min={startdate}
              aria-label="복귀일"
            />
          </div>
        )}

        <TextField
          label="메모 (선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button
            type="submit"
            loading={create.isPending || update.isPending}
          >
            {editing ? "저장" : "등록"}
          </Button>
          {editing && (
            <button
              type="button"
              className={styles.delete}
              onClick={onDelete}
              disabled={del.isPending}
            >
              부상 기록 삭제
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
