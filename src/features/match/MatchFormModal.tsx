import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import { ApiError } from "../../core/api/client";
import type { Match } from "../../core/api/types";
import { fromInputValue, toInputValue } from "../../lib/date";
import { useCreateMatch, useUpdateMatch } from "./useMatches";
import styles from "./MatchFormModal.module.css";

interface Props {
  teamId: number;
  match?: Match | null;
  onClose: () => void;
}

export default function MatchFormModal({ teamId, match, onClose }: Props) {
  const [awayname, setAwayname] = useState(match?.awayname ?? "");
  const [when, setWhen] = useState(
    match ? toInputValue(match.matchdate) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const create = useCreateMatch(teamId);
  const update = useUpdateMatch(teamId);
  const editing = !!match;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const away = awayname.trim();
    if (!away) return setError("상대팀 이름을 입력해주세요.");
    const matchdate = fromInputValue(when);
    if (!matchdate) return setError("경기 일시를 선택해주세요.");
    setError(null);
    try {
      const input = { team: teamId, awayname: away, matchdate };
      if (editing && match) {
        await update.mutateAsync({ ...input, id: match.id });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    }
  }

  return (
    <Modal open title={editing ? "경기 수정" : "경기 추가"} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          label="상대팀"
          value={awayname}
          onChange={(e) => setAwayname(e.target.value)}
          placeholder="예: 강남 유나이티드"
          autoFocus
        />
        <div className={styles.field}>
          <label className={styles.label} htmlFor="when">
            경기 일시
          </label>
          <input
            id="when"
            type="datetime-local"
            className={styles.datetime}
            value={when}
            onChange={(e) => setWhen(e.target.value)}
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
