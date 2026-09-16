import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import ResultPill from "../../components/ResultPill/ResultPill";
import { shortDay } from "../../lib/date";
import { resultOf } from "../../lib/matchResult";
import { cardText, type PlayerMatchLog } from "./playerMatchLog";
import styles from "./PlayerMatchLogList.module.css";

interface Props {
  logs: PlayerMatchLog[];
  /** 경기 상세 링크 — 주면 펼친 행에 "경기 상세" 링크가 붙는다. */
  matchHref?: (matchId: number) => string;
  emptyText?: string;
}

/**
 * 선수의 경기별 기록 표 (fotmob "경기 통계" 표 미러) —
 * 날짜 · 상대 · 스코어/결과 · 출전분 · G · A · 카드. 행을 누르면 쿼터별 라인이 펼쳐진다.
 * 통계 탭 모달(PlayerStatDetail)과 선수 상세 페이지가 공유한다.
 */
export default function PlayerMatchLogList({
  logs,
  matchHref,
  emptyText = "이 기간에 출전한 경기가 없습니다",
}: Props) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  if (logs.length === 0) return <div className={styles.empty}>{emptyText}</div>;

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // 행 전체가 마우스로 눌리지만 접근성 시맨틱(aria-expanded·키보드)은 셰브런 칸의
  // 실제 버튼이 담당한다 — <tr role="button">은 셀 시맨틱을 깨뜨린다.
  const onButton = (e: MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation(); // 행 onClick과 이중 토글 방지
    toggle(id);
  };

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.left}>날짜</th>
            <th className={styles.left}>상대</th>
            <th>결과</th>
            <th title="출전 시간(분)">분</th>
            <th title="골">G</th>
            <th title="도움">A</th>
            <th title="카드" className={styles.cards}>
              카드
            </th>
            <th className={styles.chev} aria-hidden />
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const expanded = open.has(log.matchId);
            const cards = cardText(log.yellow, log.red);
            return [
              <tr
                key={log.matchId}
                className={styles.row}
                onClick={() => toggle(log.matchId)}
              >
                <td className={styles.date}>{shortDay(log.matchdate)}</td>
                <td className={styles.opp}>{log.opponent}</td>
                <td className={styles.result}>
                  <span className={styles.score}>
                    {log.home}:{log.away}
                  </span>
                  <ResultPill result={resultOf(log.home, log.away)} size={18} />
                </td>
                <td className={styles.num}>{log.min}′</td>
                <td className={styles.numStrong}>{log.goal}</td>
                <td className={styles.numStrong}>{log.assist}</td>
                <td className={styles.cards}>{cards}</td>
                <td className={styles.chev}>
                  <button
                    type="button"
                    className={styles.chevBtn}
                    aria-expanded={expanded}
                    aria-label={`${shortDay(log.matchdate)} ${log.opponent} 쿼터별 기록`}
                    onClick={(e) => onButton(e, log.matchId)}
                  >
                    <ChevronDown
                      size={14}
                      className={expanded ? styles.chevOpen : undefined}
                      aria-hidden
                    />
                  </button>
                </td>
              </tr>,
              expanded && (
                <tr key={`${log.matchId}-q`} className={styles.detail}>
                  <td colSpan={8}>
                    <div className={styles.qLines}>
                      {log.quarters.map((q) => (
                        <div key={q.quarterId} className={styles.qLine}>
                          <span className={styles.qNum}>Q{q.number}</span>
                          <span className={styles.qMin}>{q.min}′</span>
                          <span className={styles.qStat}>
                            {q.goal}G {q.assist}A
                          </span>
                          <span className={styles.qCards}>{cardText(q.yellow, q.red)}</span>
                        </div>
                      ))}
                    </div>
                    {matchHref && (
                      <Link className={styles.matchLink} to={matchHref(log.matchId)}>
                        경기 상세 →
                      </Link>
                    )}
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
