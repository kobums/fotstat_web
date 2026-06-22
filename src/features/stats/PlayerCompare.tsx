import { useState } from "react";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import Select from "../../components/Select/Select";
import type { PlayerStat } from "./useTeamStats";
import styles from "./PlayerCompare.module.css";

const perGame = (p: PlayerStat | undefined, key: "goal" | "assist") =>
  p && p.games > 0 ? p[key] / p.games : 0;

export default function PlayerCompare({ players }: { players: PlayerStat[] }) {
  const [idA, setIdA] = useState(players[0]?.id ?? 0);
  const [idB, setIdB] = useState(players[1]?.id ?? players[0]?.id ?? 0);
  if (players.length < 2) return null;

  const a = players.find((p) => p.id === idA);
  const b = players.find((p) => p.id === idB);

  const rows: { label: string; a: number; b: number; fmt?: (n: number) => string }[] =
    [
      { label: "경기", a: a?.games ?? 0, b: b?.games ?? 0 },
      { label: "골", a: a?.goal ?? 0, b: b?.goal ?? 0 },
      { label: "도움", a: a?.assist ?? 0, b: b?.assist ?? 0 },
      { label: "출전(분)", a: a?.min ?? 0, b: b?.min ?? 0 },
      {
        label: "경기당 골",
        a: perGame(a, "goal"),
        b: perGame(b, "goal"),
        fmt: (n) => n.toFixed(2),
      },
    ];

  const renderSelect = (value: number, onChange: (v: number) => void) => (
    <Select
      compact
      wrapClassName={styles.cmpField}
      aria-label="비교할 선수"
      value={value}
      onChange={(v) => onChange(Number(v))}
      options={players.map((p) => ({
        value: p.id,
        label: `${p.number}. ${p.name}`,
      }))}
    />
  );

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>선수 비교</h3>
      <div className={styles.heads}>
        <div className={styles.head}>
          {a && <PlayerAvatar number={a.number} position={a.position} size={36} />}
          {renderSelect(idA, setIdA)}
        </div>
        <span className={styles.vs}>vs</span>
        <div className={styles.head}>
          {b && <PlayerAvatar number={b.number} position={b.position} size={36} />}
          {renderSelect(idB, setIdB)}
        </div>
      </div>

      <div className={styles.rows}>
        {rows.map((r) => {
          const fmt = r.fmt ?? ((n: number) => String(n));
          return (
            <div key={r.label} className={styles.row}>
              <span
                className={`${styles.cell} ${r.a > r.b ? styles.win : ""}`}
              >
                {fmt(r.a)}
              </span>
              <span className={styles.rowLabel}>{r.label}</span>
              <span
                className={`${styles.cell} ${r.b > r.a ? styles.win : ""}`}
              >
                {fmt(r.b)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
