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
  showLabel = false,
}: {
  result: Result;
  size?: number;
  showLabel?: boolean; // true면 W/D/L 대신 승/무/패로 표시
}) {
  return (
    <span
      className={styles.pill}
      style={{ width: size, height: size, background: COLOR[result], fontSize: size * 0.5 }}
      title={showLabel ? undefined : LABEL[result]}
    >
      {showLabel ? LABEL[result] : result}
    </span>
  );
}
