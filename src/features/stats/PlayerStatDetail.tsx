import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import StatTile from "../../components/StatTile/StatTile";
import ResultPill from "../../components/ResultPill/ResultPill";
import { resultOf } from "../../lib/matchResult";
import { topPercent } from "../../lib/percentile";
import { dayOf, formatMatchDate } from "../../lib/date";
import { isActiveInjury } from "../../lib/injury";
import type { Injury, Match, MatchRecord, Quarter } from "../../core/api/types";
import type { PlayerStat } from "./useTeamStats";
import { playerMatchLogs } from "./playerMatchLog";
import styles from "./PlayerStatDetail.module.css";

export interface SquadAverage {
  goalPerGame: number;
  assistPerGame: number;
}

interface Props {
  stat: PlayerStat;
  squadAvg: SquadAverage;
  /** 상위 X% 계산용 스쿼드 전원 (iOS PlayerStatDetailView.allPlayers 미러). */
  allPlayers: PlayerStat[];
  /** 경기별 기록·부상 섹션용 원본 데이터. */
  matches: Match[];
  quarters: Quarter[];
  records: MatchRecord[];
  injuries: Injury[];
  onClose: () => void;
}

/** "YYYY-MM-DD" → "MM.DD" (부상 기간 표기용). */
function shortDay(date?: string): string {
  const d = dayOf(date);
  return d.length === 10 ? `${d.slice(5, 7)}.${d.slice(8, 10)}` : d;
}

/** 카드 표기: 0이면 빈칸, 1이면 아이콘만, 2+면 아이콘+개수. */
function cardText(yellow: number, red: number): string {
  const parts: string[] = [];
  if (yellow > 0) parts.push(yellow > 1 ? `🟨${yellow}` : "🟨");
  if (red > 0) parts.push(red > 1 ? `🟥${red}` : "🟥");
  return parts.join(" ");
}

function CompareRow({
  label,
  value,
  avg,
  pct,
}: {
  label: string;
  value: number;
  avg: number;
  /** 스쿼드 내 상위 X% — 표시 지표(경기당 값)와 같은 기준으로 계산. */
  pct: number;
}) {
  const diff = value - avg;
  const flat = Math.abs(diff) < 0.005;
  const color = flat ? "var(--text-ter)" : diff > 0 ? "var(--pos)" : "var(--neg)";
  return (
    <div className={styles.cmpRow}>
      <div className={styles.cmpTop}>
        <span className={styles.cmpLabel}>{label}</span>
        <span className={styles.cmpValue}>{value.toFixed(2)}</span>
      </div>
      <div className={styles.cmpBottom}>
        <span className={styles.cmpAvg}>팀 평균 {avg.toFixed(2)}</span>
        <span className={styles.cmpDiff} style={{ color }}>
          {flat ? (
            <Minus size={13} />
          ) : diff > 0 ? (
            <ArrowUp size={13} />
          ) : (
            <ArrowDown size={13} />
          )}
          {flat ? "" : `${diff > 0 ? "+" : ""}${diff.toFixed(2)}`}
        </span>
        <span className={styles.pct}>상위 {pct}%</span>
      </div>
    </div>
  );
}

export default function PlayerStatDetail({
  stat,
  squadAvg,
  allPlayers,
  matches,
  quarters,
  records,
  injuries,
  onClose,
}: Props) {
  const logs = playerMatchLogs(stat.id, matches, quarters, records);
  const playerInjuries = injuries
    .filter((i) => i.player === stat.id)
    .sort((a, b) => {
      const sa = a.startdate ?? "";
      const sb = b.startdate ?? "";
      return sa < sb ? 1 : sa > sb ? -1 : 0; // 최신 발생순
    });
  const perGame = (value: number, games: number) => (games > 0 ? value / games : 0);
  const goalPg = perGame(stat.goal, stat.games);
  const assistPg = perGame(stat.assist, stat.games);
  // 배지가 붙는 행(경기당 값)과 같은 지표로 순위를 매긴다 — 누적 총계 기준이면
  // 경기 수만 많은 선수가 경기당 평균이 높은 선수보다 좋은 배지를 받는다.
  const goalPct = topPercent(goalPg, allPlayers.map((p) => perGame(p.goal, p.games)));
  const assistPct = topPercent(assistPg, allPlayers.map((p) => perGame(p.assist, p.games)));
  return (
    <Modal open title="선수 통계" onClose={onClose} wide>
      <div className={styles.split}>
        {/* 왼쪽: 선수 정보 (요약·팀 평균 대비·부상 이력) */}
        <div className={styles.left}>
          <div className={styles.head}>
            <PlayerAvatar number={stat.number} position={stat.position} size={56} />
            <div>
              <div className={styles.name}>{stat.name}</div>
              <PosChip position={stat.position} />
            </div>
          </div>
          <div className={styles.grid}>
            <StatTile label="경기" value={stat.games} />
            <StatTile label="골" value={stat.goal} />
            <StatTile label="도움" value={stat.assist} />
            <StatTile label="출전(분)" value={stat.min} />
            <StatTile label="공격P" value={stat.goal + stat.assist} sub="골+도움" />
            <StatTile label="경기당 골" value={goalPg.toFixed(2)} />
            {stat.absentGames > 0 && (
              <StatTile label="결장" value={stat.absentGames} sub="부상" />
            )}
          </div>

          <div className={styles.cmpCard}>
            <span className={styles.cmpTitle}>팀 평균 대비</span>
            <div className={styles.cmpRows}>
              <CompareRow
                label="경기당 골"
                value={goalPg}
                avg={squadAvg.goalPerGame}
                pct={goalPct}
              />
              <CompareRow
                label="경기당 도움"
                value={assistPg}
                avg={squadAvg.assistPerGame}
                pct={assistPct}
              />
            </div>
          </div>

          {playerInjuries.length > 0 && (
            <div className={styles.logCard}>
              <span className={styles.cmpTitle}>부상 이력</span>
              <div className={styles.injList}>
                {playerInjuries.map((inj) => {
                  const active = isActiveInjury(inj);
                  return (
                    <div key={inj.id} className={styles.injItem}>
                      <span className={styles.injType}>{inj.type || "부상"}</span>
                      <span className={styles.injPeriod}>
                        {shortDay(inj.startdate)} ~{" "}
                        {active ? "진행 중" : shortDay(inj.returndate)}
                      </span>
                      {active && <span className={styles.injActive}>부상 중</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 경기별 기록 */}
        <div className={styles.right}>
          <span className={styles.cmpTitle}>경기별 기록</span>
          {logs.length > 0 ? (
            <div className={styles.logList}>
              {logs.map((log) => {
                const totalCards = cardText(log.yellow, log.red);
                return (
                  <div key={log.matchId} className={styles.logItem}>
                    <div className={styles.logHead}>
                      <span className={styles.logDate}>
                        {formatMatchDate(log.matchdate)}
                      </span>
                      <span className={styles.logOpp}>vs {log.opponent}</span>
                      <span className={styles.logScore}>
                        {log.home}:{log.away}
                      </span>
                      <ResultPill
                        result={resultOf(log.home, log.away)}
                        size={18}
                      />
                    </div>
                    <div className={styles.qLines}>
                      {log.quarters.map((q) => {
                        const cards = cardText(q.yellow, q.red);
                        return (
                          <div key={q.quarterId} className={styles.qLine}>
                            <span className={styles.qNum}>Q{q.number}</span>
                            <span className={styles.qMin}>{q.min}′</span>
                            <span className={styles.qStat}>
                              {q.goal}G {q.assist}A
                            </span>
                            <span className={styles.qCards}>{cards}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.logTotal}>
                      합계 {log.min}′ · {log.goal}G {log.assist}A
                      {totalCards && ` · ${totalCards}`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.logEmpty}>이 기간에 출전한 경기가 없습니다</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
