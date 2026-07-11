import { useMemo, useState } from "react";
import Button from "../../components/Button/Button";
import DatePicker from "../../components/DatePicker/DatePicker";
import Modal from "../../components/Modal/Modal";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import type { InbodyInput } from "../../core/api/endpoints";
import type { Player } from "../../core/api/types";
import { today } from "../../lib/date";
import {
  parseInbodyRow,
  rowFromInbody,
  rowHasValue,
  EMPTY_ROW,
  type InbodyRowDraft,
} from "../../lib/inbody";
import { errorMessage } from "../../lib/notifyError";
import { useInbodies, useSaveInbodies } from "./useInbodies";
import styles from "./InbodySheetModal.module.css";

interface Props {
  teamId: number;
  players: Player[];
  onClose: () => void;
}

const COLUMNS: { key: keyof InbodyRowDraft; label: string }[] = [
  { key: "height", label: "신장" },
  { key: "weight", label: "체중" },
  { key: "muscle", label: "골격근량" },
  { key: "fat", label: "체지방률" },
  { key: "rightleg", label: "오른다리" },
  { key: "leftleg", label: "왼다리" },
  { key: "score", label: "점수" },
];

/** 엑셀 시트를 대체하는 팀 일괄 입력 — 공통 검사일 1개 + 선수 행별 측정값.
 *  (player, testdate) upsert라 같은 날짜로 재저장해도 값만 갱신된다. */
export default function InbodySheetModal({ teamId, players, onClose }: Props) {
  // isLoading 동안 저장을 막는다 — 기존 측정 프리필이 로드되기 전에 저장하면
  // 미입력 필드가 전부 0(미측정)으로 upsert 되어 기존 값을 덮어쓸 수 있다
  const { data: inbodies, isLoading } = useInbodies(teamId);
  const save = useSaveInbodies(teamId);
  const [testdate, setTestdate] = useState(today());
  // 사용자가 입력한 값만 보관 — 표시는 (입력값 ?? 해당 검사일 기존 측정)으로 파생한다.
  // 검사일이 바뀌면 렌더 중 리셋(React 권장 파생 상태 패턴)으로 입력을 비운다.
  const [edits, setEdits] = useState<{ date: string; rows: Map<number, InbodyRowDraft> }>(
    () => ({ date: today(), rows: new Map() }),
  );
  const [error, setError] = useState<string | null>(null);
  if (edits.date !== testdate) {
    setEdits({ date: testdate, rows: new Map() });
  }

  // 선택한 검사일에 이미 저장된 측정 — 행 프리필용
  const existing = useMemo(() => {
    const map = new Map<number, InbodyRowDraft>();
    for (const e of inbodies ?? []) {
      if (e.testdate === testdate) map.set(e.player, rowFromInbody(e));
    }
    return map;
  }, [inbodies, testdate]);

  const rows = useMemo(() => {
    const map = new Map<number, InbodyRowDraft>(existing);
    for (const [playerId, row] of edits.rows) map.set(playerId, row);
    return map;
  }, [existing, edits.rows]);

  function setCell(playerId: number, key: keyof InbodyRowDraft, value: string) {
    setEdits((prev) => {
      const next = new Map(prev.rows);
      const row = next.get(playerId) ?? rows.get(playerId) ?? EMPTY_ROW;
      next.set(playerId, { ...row, [key]: value });
      return { date: prev.date, rows: next };
    });
  }

  async function onSave() {
    setError(null);
    if (!testdate) return setError("검사일을 선택해주세요.");

    const inputs: InbodyInput[] = [];
    for (const p of players) {
      const row = rows.get(p.id);
      if (!row || !rowHasValue(row)) continue; // 빈 행은 저장하지 않는다 (삭제 아님)
      const values = parseInbodyRow(row);
      if (!values) {
        return setError(`'${p.name}' 행의 측정값은 0 이상의 숫자여야 합니다.`);
      }
      inputs.push({ player: p.id, testdate, ...values });
    }
    if (inputs.length === 0) return setError("입력된 측정값이 없습니다.");

    try {
      await save.mutateAsync(inputs);
      onClose();
    } catch (err) {
      setError(errorMessage(err, "측정을 저장하지 못했습니다."));
    }
  }

  const filledCount = players.filter((p) => {
    const row = rows.get(p.id);
    return row && rowHasValue(row);
  }).length;

  return (
    <Modal open wide title="인바디 입력" onClose={onClose}>
      <div className={styles.toolbar}>
        <div className={styles.dateField}>
          <span className={styles.label}>검사일</span>
          <DatePicker
            value={testdate}
            onChange={(next) => {
              // 입력 중이던 값이 있으면 날짜 변경으로 전부 사라지므로 한 번 확인한다
              if (
                edits.rows.size > 0 &&
                !confirm("검사일을 바꾸면 입력 중인 값이 사라집니다. 계속할까요?")
              ) {
                return;
              }
              setTestdate(next);
            }}
            max={today()}
            aria-label="검사일"
          />
        </div>
        <span className={styles.count}>입력 {filledCount}/{players.length}명</span>
      </div>

      <div className={styles.sheetWrap}>
        <table className={styles.sheet}>
          <thead>
            <tr>
              <th className={styles.playerCol}>선수</th>
              {COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const row = rows.get(p.id) ?? EMPTY_ROW;
              return (
                <tr key={p.id}>
                  <td className={styles.playerCol}>
                    <div className={styles.player}>
                      <PlayerAvatar number={p.number} position={p.position} size={26} />
                      <span className={styles.name}>{p.name}</span>
                    </div>
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key}>
                      {/* 시트 셀은 라벨 래퍼가 없는 컴팩트 입력이 필요해
                          디자인 시스템 TextField 대신 네이티브 input을 예외적으로 사용 */}
                      <input
                        className={styles.cell}
                        type="number"
                        step="0.01"
                        min={0}
                        inputMode="decimal"
                        value={row[c.key]}
                        onChange={(e) => setCell(p.id, c.key, e.target.value)}
                        aria-label={`${p.name} ${c.label}`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.hint}>
        값이 입력된 행만 저장됩니다. 같은 검사일에 다시 저장하면 값이 갱신되고, 빈칸(또는 0)은 미측정으로 처리됩니다.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <Button onClick={onSave} loading={save.isPending} disabled={isLoading}>
          저장
        </Button>
      </div>
    </Modal>
  );
}
