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

  // 전체 보기는 0인 선수까지 스쿼드 전원 순위를 보여준다
  const ranked = useMemo(
    () => [...players].sort((a, b) => b[metric] - a[metric]),
    [players, metric],
  );
  // 접힌 상태는 실제 기록이 있는 상위 3명만. 아무도 기록이 없으면 섹션 숨김
  const top = useMemo(
    () => ranked.filter((p) => p[metric] > 0).slice(0, TOP),
    [ranked, metric],
  );

  if (top.length === 0) return null;
  const shown = expanded ? ranked : top;

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {shown.map((p, i) => (
          <li key={p.id}>
            <button className={styles.row} onClick={() => onSelect(p)}>
              {/* 기록이 없는 선수는 순위가 아니라 동률 0이므로 번호 대신 - */}
              <span className={styles.rank}>{p[metric] > 0 ? i + 1 : "-"}</span>
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
      {ranked.length > top.length && (
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
