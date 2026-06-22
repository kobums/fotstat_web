import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import StatTile from "../../components/StatTile/StatTile";
import type { PlayerStat } from "./useTeamStats";
import styles from "./PlayerStatDetail.module.css";

export interface SquadAverage {
  goalPerGame: number;
  assistPerGame: number;
}

interface Props {
  stat: PlayerStat;
  squadAvg: SquadAverage;
  onClose: () => void;
}

function CompareRow({
  label,
  value,
  avg,
}: {
  label: string;
  value: number;
  avg: number;
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
    </div>
  );
}

export default function PlayerStatDetail({ stat, squadAvg, onClose }: Props) {
  const goalPg = stat.games > 0 ? stat.goal / stat.games : 0;
  const assistPg = stat.games > 0 ? stat.assist / stat.games : 0;
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
      </div>

      <div className={styles.cmpCard}>
        <span className={styles.cmpTitle}>팀 평균 대비</span>
        <CompareRow label="경기당 골" value={goalPg} avg={squadAvg.goalPerGame} />
        <CompareRow
          label="경기당 도움"
          value={assistPg}
          avg={squadAvg.assistPerGame}
        />
      </div>
    </Modal>
  );
}
