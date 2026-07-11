import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import DatePicker from "../../components/DatePicker/DatePicker";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import type { Inbody } from "../../core/api/types";
import { today } from "../../lib/date";
import {
  parseInbodyRow,
  rowFromInbody,
  EMPTY_ROW,
  type InbodyRowDraft,
} from "../../lib/inbody";
import { useEntityForm } from "../shared/useEntityForm";
import {
  useCreateInbody,
  useDeleteInbody,
  useUpdateInbody,
} from "./useInbodies";
import styles from "./InbodyFormModal.module.css";

interface Props {
  teamId: number;
  playerId: number;
  inbody?: Inbody | null;
  onClose: () => void;
}

const FIELDS: { key: keyof InbodyRowDraft; label: string; unit: string }[] = [
  { key: "height", label: "신장", unit: "cm" },
  { key: "weight", label: "체중", unit: "kg" },
  { key: "muscle", label: "골격근량", unit: "kg" },
  { key: "fat", label: "체지방률", unit: "%" },
  { key: "rightleg", label: "오른다리 근육", unit: "kg" },
  { key: "leftleg", label: "왼다리 근육", unit: "kg" },
  { key: "score", label: "인바디 점수", unit: "점" },
];

/** 측정 1건 등록/수정 — 검사일만 필수, 나머지는 빈칸 = 미측정. */
export default function InbodyFormModal({ teamId, playerId, inbody, onClose }: Props) {
  const [testdate, setTestdate] = useState(() => inbody?.testdate ?? today());
  const [row, setRow] = useState<InbodyRowDraft>(() =>
    inbody ? rowFromInbody(inbody) : EMPTY_ROW,
  );

  const create = useCreateInbody(teamId);
  const update = useUpdateInbody(teamId);
  const del = useDeleteInbody(teamId);
  const { editing, pending, error, setError, submit } = useEntityForm({
    entity: inbody,
    create,
    update,
    onClose,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!testdate) return setError("검사일을 선택해주세요.");
    const values = parseInbodyRow(row);
    if (!values) return setError("측정값은 0 이상의 숫자여야 합니다.");
    await submit({ player: playerId, testdate, ...values });
  }

  async function onDelete() {
    if (!inbody) return;
    if (!confirm("이 측정 기록을 삭제할까요?")) return;
    await del.mutateAsync(inbody.id);
    onClose();
  }

  return (
    <Modal open title={editing ? "측정 수정" : "측정 추가"} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <span className={styles.label}>검사일</span>
          <DatePicker
            value={testdate}
            onChange={setTestdate}
            max={today()}
            aria-label="검사일"
          />
        </div>

        <div className={styles.grid}>
          {FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={`${f.label} (${f.unit})`}
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              value={row[f.key]}
              onChange={(e) => setRow((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button type="submit" loading={pending}>
            {editing ? "저장" : "등록"}
          </Button>
          {editing && (
            <button
              type="button"
              className={styles.delete}
              onClick={onDelete}
              disabled={del.isPending}
            >
              측정 기록 삭제
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
