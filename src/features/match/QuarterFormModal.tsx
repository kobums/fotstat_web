import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import { ApiError } from "../../core/api/client";
import { useCreateQuarter } from "./useQuarters";

interface Props {
  matchId: number;
  nextNumber: number;
  onClose: () => void;
}

export default function QuarterFormModal({
  matchId,
  nextNumber,
  onClose,
}: Props) {
  const [duration, setDuration] = useState("25");
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
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    }
  }

  return (
    <Modal open title={`${nextNumber}쿼터 추가`} onClose={onClose}>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
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
