import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import { errorMessage } from "../../lib/notifyError";
import { useCreateQuarter } from "./useQuarters";
import styles from "./QuarterFormModal.module.css";

interface Props {
  matchId: number;
  nextNumber: number;
  /** 프리필 기본 시간(분): 이전 쿼터 > 팀 설정값 > 45 (호출부에서 결정) */
  defaultDuration?: number;
  onClose: () => void;
}

export default function QuarterFormModal({
  matchId,
  nextNumber,
  defaultDuration,
  onClose,
}: Props) {
  const [duration, setDuration] = useState(String(defaultDuration ?? 45));
  const [error, setError] = useState<string | null>(null);
  const create = useCreateQuarter(matchId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const dur = Number(duration);
    if (!Number.isInteger(dur) || dur <= 0) return setError("시간을 확인해주세요.");
    setError(null);
    try {
      await create.mutateAsync({ number: nextNumber, duration: dur });
      onClose();
    } catch (err) {
      setError(errorMessage(err, "저장에 실패했습니다."));
    }
  }

  return (
    <Modal open title={`${nextNumber}쿼터 추가`} onClose={onClose}>
      <form onSubmit={onSubmit} className={styles.form}>
        <TextField
          label="진행 시간 (분)"
          type="number"
          inputMode="numeric"
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          autoFocus
          error={error ?? undefined}
        />
        <Button type="submit" loading={create.isPending}>
          추가
        </Button>
      </form>
    </Modal>
  );
}
