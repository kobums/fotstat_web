import { useEffect, useMemo, useRef, useState } from "react";
import { Goal, Handshake, Users, X } from "lucide-react";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import Stepper from "../../components/Stepper/Stepper";
import type { MatchRecord, Player, Quarter } from "../../core/api/types";
import { rebalanceAssists } from "../../lib/assistCap";
import { notifyError } from "../../lib/notifyError";
import { useDeleteQuarter, useUpdateAwaygoals } from "./useQuarters";
import { useDeleteRecord, useUpdateRecord } from "./useRecords";
import RecordFormModal from "./RecordFormModal";
import styles from "./QuarterSection.module.css";

interface Props {
  matchId: number;
  quarter: Quarter;
  records: MatchRecord[];
  players: Player[];
  /** Players injured on this match date — excluded from record creation. */
  injuredPlayerIds: Set<number>;
}

export default function QuarterSection({
  matchId,
  quarter,
  records,
  players,
  injuredPlayerIds,
}: Props) {
  const updateAway = useUpdateAwaygoals(matchId);
  const deleteQuarter = useDeleteQuarter(matchId);
  const deleteRecord = useDeleteRecord(quarter.id);
  const updateRecord = useUpdateRecord(quarter.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MatchRecord | null>(null);

  // Optimistic local away-goals value; debounce the PUT so rapid +/- clicks
  // don't fire one request each (and race on the final value).
  const [away, setAway] = useState(quarter.awaygoals);
  const awayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (awayTimer.current) clearTimeout(awayTimer.current);
  }, []);

  function handleAway(next: number) {
    setAway(next);
    if (awayTimer.current) clearTimeout(awayTimer.current);
    awayTimer.current = setTimeout(() => {
      updateAway.mutate({ id: quarter.id, awaygoals: next });
    }, 400);
  }

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );
  const homeGoals = records.reduce((s, r) => s + r.goal, 0);
  const assistTotal = records.reduce((s, r) => s + r.assist, 0);
  const takenPlayerIds = useMemo(
    () => new Set(records.map((r) => r.player)),
    [records],
  );

  // 골 기록 삭제로 팀 골 합이 줄면 남은 선수들의 초과 어시스트를 함께 차감
  // (iOS RecordViewModel.rebalanceAssists 미러 — 어시 합 ≤ 골 합 유지).
  function handleDeleteRecord(target: MatchRecord) {
    deleteRecord.mutate(target.id, {
      onSuccess: () => {
        const remaining = records.filter((r) => r.id !== target.id);
        for (const change of rebalanceAssists(
          remaining.map((r) => ({
            id: r.id,
            player: r.player,
            goal: r.goal,
            assist: r.assist,
          })),
          injuredPlayerIds,
        )) {
          const rec = remaining.find((r) => r.id === change.id);
          if (!rec) continue;
          updateRecord.mutate(
            {
              id: rec.id,
              min: rec.min,
              goal: rec.goal,
              assist: change.assist,
              yellowcard: rec.yellowcard,
              redcard: rec.redcard,
            },
            { onError: notifyError("어시스트를 다시 조정하지 못했습니다.") },
          );
        }
      },
    });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(r: MatchRecord) {
    setEditing(r);
    setFormOpen(true);
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <div className={styles.qLabel}>
          {quarter.number}쿼터
          <span className={styles.dur}>{quarter.duration}분</span>
        </div>
        <div className={styles.score}>
          <span className={styles.home}>{homeGoals}</span>
          <span className={styles.colon}>:</span>
          <Stepper value={away} onChange={handleAway} max={99} />
        </div>
        <button
          className={styles.delQuarter}
          onClick={() => {
            if (confirm(`${quarter.number}쿼터를 삭제할까요?`))
              deleteQuarter.mutate(quarter.id);
          }}
          aria-label="쿼터 삭제"
        >
          <X size={16} />
        </button>
      </header>

      <div className={styles.summary}>
        <span>
          <Goal size={15} /> {homeGoals}
        </span>
        <span>
          <Handshake size={15} /> {assistTotal}
        </span>
        <span>
          <Users size={15} /> {records.length}
        </span>
      </div>

      {records.length > 0 && (
        <ul className={styles.records}>
          {records.map((r) => {
            const p = playerMap.get(r.player);
            return (
              <li key={r.id} className={styles.record}>
                <PlayerAvatar
                  number={p?.number ?? 0}
                  position={p?.position}
                  size={34}
                />
                <span className={styles.rName}>{p?.name ?? "선수"}</span>
                <span className={styles.stats}>
                  <span title="출전">{r.min}′</span>
                  <span title="골">
                    <Goal size={14} /> {r.goal}
                  </span>
                  <span title="어시스트">
                    <Handshake size={14} /> {r.assist}
                  </span>
                  {r.yellowcard > 0 && (
                    <span title="옐로카드">
                      <span className={styles.yellowCard} aria-hidden />
                      {r.yellowcard}
                    </span>
                  )}
                  {r.redcard > 0 && (
                    <span title="레드카드">
                      <span className={styles.redCard} aria-hidden />
                      {r.redcard}
                    </span>
                  )}
                </span>
                <button
                  className={styles.rEdit}
                  onClick={() => openEdit(r)}
                  disabled={injuredPlayerIds.has(r.player)}
                  title={
                    injuredPlayerIds.has(r.player)
                      ? "부상 기간 중이라 수정할 수 없습니다"
                      : undefined
                  }
                >
                  수정
                </button>
                <button
                  className={styles.rDel}
                  onClick={() => handleDeleteRecord(r)}
                  disabled={deleteRecord.isPending || updateRecord.isPending}
                  aria-label="기록 삭제"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button className={styles.addRecord} onClick={openCreate}>
        + 선수 기록 추가
      </button>

      {formOpen && (
        <RecordFormModal
          quarterId={quarter.id}
          quarterDuration={quarter.duration}
          players={players}
          takenPlayerIds={takenPlayerIds}
          injuredPlayerIds={injuredPlayerIds}
          records={records}
          record={editing}
          onClose={() => setFormOpen(false)}
        />
      )}
    </section>
  );
}
