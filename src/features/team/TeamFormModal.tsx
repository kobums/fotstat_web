import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import { ApiError } from "../../core/api/client";
import type { Team } from "../../core/api/types";
import { useCreateTeam, useUpdateTeam } from "./useTeams";
import styles from "./TeamFormModal.module.css";

interface Props {
  team?: Team | null;
  onClose: () => void;
}

// Mounted only while open (see parent), so useState initializes from props
// without needing an effect to sync.
export default function TeamFormModal({ team, onClose }: Props) {
  const [name, setName] = useState(team?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateTeam();
  const update = useUpdateTeam();
  const editing = !!team;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    setError(null);
    try {
      if (editing && team) {
        await update.mutateAsync({ id: team.id, name: trimmed });
      } else {
        await create.mutateAsync(trimmed);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    }
  }

  return (
    <Modal open title={editing ? "팀 수정" : "팀 추가"} onClose={onClose}>
      <form onSubmit={onSubmit} className={styles.form}>
        <TextField
          label="팀 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: FC 서울"
          autoFocus
          error={error ?? undefined}
        />
        <Button type="submit" loading={create.isPending || update.isPending}>
          {editing ? "저장" : "추가"}
        </Button>
      </form>
    </Modal>
  );
}
