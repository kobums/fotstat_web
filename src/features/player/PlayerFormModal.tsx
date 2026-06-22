import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import Select from "../../components/Select/Select";
import { ApiError } from "../../core/api/client";
import type { Player } from "../../core/api/types";
import { POSITION_OPTIONS } from "../../lib/position";
import { useCreatePlayer, useUpdatePlayer } from "./usePlayers";
import styles from "./PlayerFormModal.module.css";

interface Props {
  teamId: number;
  player?: Player | null;
  onClose: () => void;
}

export default function PlayerFormModal({ teamId, player, onClose }: Props) {
  const [name, setName] = useState(player?.name ?? "");
  const [number, setNumber] = useState(
    player ? String(player.number) : "",
  );
  const [position, setPosition] = useState(player?.position ?? "ST");
  const [error, setError] = useState<string | null>(null);
  const create = useCreatePlayer(teamId);
  const update = useUpdatePlayer(teamId);
  const editing = !!player;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const num = Number(number);
    if (!trimmed) return setError("선수 이름을 입력해주세요.");
    if (!Number.isInteger(num) || num < 0) return setError("등번호를 확인해주세요.");
    setError(null);
    try {
      const input = { team: teamId, name: trimmed, number: num, position };
      if (editing && player) {
        await update.mutateAsync({ ...input, id: player.id });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    }
  }

  return (
    <Modal open title={editing ? "선수 수정" : "선수 추가"} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className={styles.row}>
          <TextField
            label="등번호"
            type="number"
            inputMode="numeric"
            min={0}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <Select
            label="포지션"
            id="pos"
            value={position}
            onChange={setPosition}
            options={POSITION_OPTIONS.map((g) => ({
              label: g.group,
              options: g.values.map((v) => ({ value: v, label: v })),
            }))}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <Button type="submit" loading={create.isPending || update.isPending}>
          {editing ? "저장" : "추가"}
        </Button>
      </form>
    </Modal>
  );
}
