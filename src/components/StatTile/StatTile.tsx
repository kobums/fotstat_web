import styles from "./StatTile.module.css";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
}

/** Web equivalent of iOS FSStatTile. */
export default function StatTile({ label, value, sub }: Props) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  );
}
