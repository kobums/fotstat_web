import type { Injury } from "../../core/api/types";
import { shortDay } from "../../lib/date";
import { isActiveInjury } from "../../lib/injury";
import styles from "./PlayerInjuryList.module.css";

interface Props {
  /** 이미 선수별로 걸러 최근순 정렬된 목록 (lib/injury playerInjuriesSorted). */
  injuries: Injury[];
  emptyText?: string;
}

/** 선수 부상 이력 — 종류 · 기간 · 진행 중 배지. 통계 탭 모달과 선수 상세가 공유. */
export default function PlayerInjuryList({
  injuries,
  emptyText = "부상 이력이 없습니다",
}: Props) {
  if (injuries.length === 0) return <p className={styles.empty}>{emptyText}</p>;
  return (
    <ul className={styles.list}>
      {injuries.map((inj) => {
        const active = isActiveInjury(inj);
        return (
          <li key={inj.id} className={styles.item}>
            <span className={styles.type}>{inj.type || "부상"}</span>
            <span className={styles.period}>
              {shortDay(inj.startdate)} ~ {active ? "진행 중" : shortDay(inj.returndate)}
            </span>
            {active && <span className={styles.active}>부상 중</span>}
          </li>
        );
      })}
    </ul>
  );
}
