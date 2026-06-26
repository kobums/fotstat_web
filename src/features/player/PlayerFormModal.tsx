import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import Select from "../../components/Select/Select";
import DatePicker from "../../components/DatePicker/DatePicker";
import { ApiError } from "../../core/api/client";
import type { Player } from "../../core/api/types";
import { POSITION_OPTIONS } from "../../lib/position";
import { useCreatePlayer, useUpdatePlayer } from "./usePlayers";
import { validatePlayerForm, MIN_NUMBER, MAX_NUMBER } from "./playerForm";
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
  const [birthdate, setBirthdate] = useState(player?.birthdate ?? "");
  const [error, setError] = useState<string | null>(null);
  // Births can't be in the future; cap the calendar at today.
  const today = new Date().toISOString().slice(0, 10);
  const create = useCreatePlayer(teamId);
  const update = useUpdatePlayer(teamId);
  const editing = !!player;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validatePlayerForm(name, number);
    if (!result.ok) return setError(result.error);
    setError(null);
    try {
      const input = {
        team: teamId,
        name: result.value.name,
        number: result.value.number,
        birthdate,
        position,
      };
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
            min={MIN_NUMBER}
            max={MAX_NUMBER}
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
        <div className={styles.field}>
          <span className={styles.label}>생년월일</span>
          <DatePicker
            value={birthdate}
            onChange={setBirthdate}
            max={today}
            placeholder="생년월일 (선택)"
            aria-label="생년월일"
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
