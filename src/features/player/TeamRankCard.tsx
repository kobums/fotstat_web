import { useMemo, useState } from "react";
import type { PlayerTrainingStats } from "../../lib/training";
import type { PlayerStat } from "../stats/aggregateTeamStats";
import { playerRankMetrics, rankLabel, type RankMode } from "../stats/playerRank";
import styles from "./TeamRankCard.module.css";

interface Props {
  playerId: number;
  players: PlayerStat[];
  /** 선수 id → 훈련 참석 통계. 주면 참석률 행이 붙는다. */
  training?: Map<number, PlayerTrainingStats>;
}

const MODES: { key: RankMode; label: string }[] = [
  { key: "total", label: "합계" },
  { key: "perGame", label: "경기당" },
];

/**
 * 팀 내 위치 — fotmob "시즌 성적"의 순위 바를 팀 단위로. 지표마다 선수 값과
 * 스쿼드 1위 대비 비례 바, 팀 평균, 상위 %(작은 스쿼드는 순위)를 보여준다.
 */
export default function TeamRankCard({ playerId, players, training }: Props) {
  const [mode, setMode] = useState<RankMode>("total");
  const metrics = useMemo(
    () => playerRankMetrics(playerId, players, mode, training),
    [playerId, players, mode, training],
  );
  if (metrics.length === 0) return null;

  return (
    <section className={styles.card} aria-label="팀 내 위치">
      <div className={styles.head}>
        <h3 className={styles.title}>팀 내 위치</h3>
        <div className={styles.modes} role="group" aria-label="집계 기준">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={mode === m.key}
              className={mode === m.key ? `${styles.mode} ${styles.modeActive}` : styles.mode}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ul className={styles.rows}>
        {metrics.map((m) => {
          const ratio = Math.max(0, Math.min(1, m.value / m.max));
          const top = m.rank === 1 && m.value > 0;
          return (
            <li key={m.key} className={styles.row}>
              <div className={styles.line}>
                <span className={styles.label}>{m.label}</span>
                <span className={styles.value}>
                  {m.value.toFixed(m.decimals)}
                  {m.unit}
                </span>
              </div>
              <span className={styles.track} aria-hidden>
                <span
                  className={top ? styles.fillTop : styles.fill}
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
              <div className={styles.meta}>
                <span className={styles.avg}>
                  팀 평균 {m.avg.toFixed(m.decimals)}
                  {m.unit}
                </span>
                <span className={styles.badge}>{rankLabel(m)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
