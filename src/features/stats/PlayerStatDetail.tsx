import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import StatTile from "../../components/StatTile/StatTile";
import { topPercent } from "../../lib/percentile";
import { playerInjuriesSorted } from "../../lib/injury";
import type { Injury, Match, MatchRecord, Quarter } from "../../core/api/types";
import type { PlayerStat } from "./useTeamStats";
import { playerMatchLogs } from "./playerMatchLog";
import PlayerMatchLogList from "./PlayerMatchLogList";
import PlayerInjuryList from "./PlayerInjuryList";
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
        {/* 값이 0이면 순위를 매기지 않는다 — 전원 0일 때의 공동 1위 배지 방지(playerRank.rankLabel 과 같은 규칙) */}
        <span className={styles.pct}>{value > 0 ? `상위 ${pct}%` : "-"}</span>
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
  const playerInjuries = playerInjuriesSorted(injuries, stat.id);
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
              <PlayerInjuryList injuries={playerInjuries} />
            </div>
          )}
        </div>

        {/* 오른쪽: 경기별 기록 */}
        <div className={styles.right}>
          <span className={styles.cmpTitle}>경기별 기록</span>
          <PlayerMatchLogList logs={logs} />
        </div>
      </div>
    </Modal>
  );
}
