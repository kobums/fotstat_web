import ResultPill from "../../components/ResultPill/ResultPill";
import type { Match } from "../../core/api/types";
import { formatMatchDate } from "../../lib/date";
import type { MatchResult } from "./useMatchResults";
import styles from "./MatchRowList.module.css";

interface Props {
  matches: Match[];
  /** 경기별 결과 — 있으면 행 오른쪽에 "3:0 승" 형태로 표시 (지난 경기용). */
  results?: Map<number, MatchResult>;
  onSelect: (id: number) => void;
}

/** 경기 행 리스트 — 경기 탭과 홈 화면 최근 경기가 공유하는 UI. */
export default function MatchRowList({ matches, results, onSelect }: Props) {
  return (
    <ul className={styles.list}>
      {matches.map((m) => {
        const r = results?.get(m.id);
        return (
          <li key={m.id} className={styles.row}>
            <button className={styles.rowMain} onClick={() => onSelect(m.id)}>
              <div className={styles.rowText}>
                <span className={styles.away}>vs {m.awayname}</span>
                <span className={styles.date}>
                  {formatMatchDate(m.matchdate)}
                </span>
              </div>
              {r?.played && (
                <span className={styles.result}>
                  <span className={styles.score}>
                    {r.home}:{r.away}
                  </span>
                  <ResultPill result={r.result} showLabel />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
