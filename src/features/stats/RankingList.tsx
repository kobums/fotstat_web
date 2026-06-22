import { useMemo, useState } from "react";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import type { PlayerStat } from "./useTeamStats";
import styles from "./RankingList.module.css";

type Metric = "goal" | "assist" | "min";

interface Props {
  title: string;
  metric: Metric;
  unit?: string;
  players: PlayerStat[];
  onSelect: (p: PlayerStat) => void;
}

const TOP = 3;

export default function RankingList({
  title,
  metric,
  unit = "",
  players,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const ranked = useMemo(
    () =>
      [...players]
        .filter((p) => p[metric] > 0)
        .sort((a, b) => b[metric] - a[metric]),
    [players, metric],
  );

  if (ranked.length === 0) return null;
  const shown = expanded ? ranked : ranked.slice(0, TOP);

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {shown.map((p, i) => (
          <li key={p.id}>
            <button className={styles.row} onClick={() => onSelect(p)}>
              <span className={styles.rank}>{i + 1}</span>
              <PlayerAvatar number={p.number} position={p.position} size={30} />
              <span className={styles.name}>{p.name}</span>
              <span className={styles.value}>
                {p[metric]}
                {unit}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {ranked.length > TOP && (
        <button
          className={styles.more}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "접기" : `전체 보기 (${ranked.length})`}
        </button>
      )}
    </section>
  );
}
