import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import StatTile from "../../components/StatTile/StatTile";
import { topPercent } from "../../lib/percentile";
import type { PlayerStat } from "./useTeamStats";
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
      <span className={styles.cmpLabel}>{label}</span>
      <span className={styles.cmpValue}>{value.toFixed(2)}</span>
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
  );
}

export default function PlayerStatDetail({
  stat,
  squadAvg,
  allPlayers,
  onClose,
}: Props) {
  const perGame = (value: number, games: number) => (games > 0 ? value / games : 0);
  const goalPg = perGame(stat.goal, stat.games);
  const assistPg = perGame(stat.assist, stat.games);
  // 배지가 붙는 행(경기당 값)과 같은 지표로 순위를 매긴다 — 누적 총계 기준이면
  // 경기 수만 많은 선수가 경기당 평균이 높은 선수보다 좋은 배지를 받는다.
  const goalPct = topPercent(goalPg, allPlayers.map((p) => perGame(p.goal, p.games)));
  const assistPct = topPercent(assistPg, allPlayers.map((p) => perGame(p.assist, p.games)));
  return (
    <Modal open title="선수 통계" onClose={onClose}>
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
    </Modal>
  );
}
