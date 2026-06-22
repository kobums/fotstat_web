import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import styles from "./CompareTile.module.css";

interface Props {
  label: string;
  value: number;
  /** current - previous */
  delta: number;
  /** When true, an increase is good (green up). 실점은 false. */
  goodWhenUp?: boolean;
}

export default function CompareTile({
  label,
  value,
  delta,
  goodWhenUp = true,
}: Props) {
  const up = delta > 0;
  const flat = delta === 0;
  const good = flat ? false : up === goodWhenUp;
  const color = flat ? "var(--text-ter)" : good ? "var(--pos)" : "var(--neg)";

  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.delta} style={{ color }}>
        {flat ? (
          <Minus size={13} />
        ) : up ? (
          <ArrowUp size={13} />
        ) : (
          <ArrowDown size={13} />
        )}
        {flat ? "변화 없음" : Math.abs(delta)}
      </span>
    </div>
  );
}
