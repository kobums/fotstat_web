import styles from "./ResultPill.module.css";

export type Result = "W" | "D" | "L";

export function resultOf(homeGoals: number, awayGoals: number): Result {
  if (homeGoals > awayGoals) return "W";
  if (homeGoals < awayGoals) return "L";
  return "D";
}

const COLOR: Record<Result, string> = {
  W: "var(--pos)",
  D: "var(--neu)",
  L: "var(--neg)",
};

const LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };

export default function ResultPill({
  result,
  size = 20,
}: {
  result: Result;
  size?: number;
}) {
  return (
    <span
      className={styles.pill}
      style={{ width: size, height: size, background: COLOR[result], fontSize: size * 0.5 }}
      title={LABEL[result]}
    >
      {result}
    </span>
  );
}
