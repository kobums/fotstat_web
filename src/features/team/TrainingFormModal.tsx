import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import DateTimePicker from "../../components/DateTimePicker/DateTimePicker";
import type { Training } from "../../core/api/types";
import { fromInputValue, nowInputValue, toInputValue } from "../../lib/date";
import { useEntityForm } from "../shared/useEntityForm";
import {
  useCreateTraining,
  useDeleteTraining,
  useUpdateTraining,
} from "./useTrainings";
import styles from "./TrainingFormModal.module.css";

interface Props {
  teamId: number;
  training?: Training | null;
  onClose: () => void;
}

/** 훈련 등록/수정 — 입력 필드는 일시 하나뿐(의도적 최소 설계). 참석 체크는 목록에서 한다. */
export default function TrainingFormModal({ teamId, training, onClose }: Props) {
  const [datetime, setDatetime] = useState(() =>
    training ? toInputValue(training.trainingdate) : nowInputValue(),
  );

  const create = useCreateTraining(teamId);
  const update = useUpdateTraining(teamId);
  const del = useDeleteTraining(teamId);
  const { editing, pending, error, setError, submit } = useEntityForm({
    entity: training,
    create,
    update,
    onClose,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trainingdate = fromInputValue(datetime);
    if (!trainingdate) return setError("훈련 일시를 선택해주세요.");
    await submit({ team: teamId, trainingdate });
  }

  async function onDelete() {
    if (!training) return;
    if (!confirm("이 훈련을 삭제할까요? 참석 기록도 함께 삭제됩니다.")) return;
    await del.mutateAsync(training.id);
    onClose();
  }

  return (
    <Modal open title={editing ? "훈련 수정" : "훈련 등록"} onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <span className={styles.label}>훈련 일시</span>
          <DateTimePicker value={datetime} onChange={setDatetime} />
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
              훈련 삭제
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
