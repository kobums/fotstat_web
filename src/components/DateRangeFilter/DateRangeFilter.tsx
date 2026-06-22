import styles from "./DateRangeFilter.module.css";

interface Props {
  start: string;
  end: string;
  onChange: (next: { start: string; end: string }) => void;
}

/** Inclusive start/end date filter with a clear action. */
export default function DateRangeFilter({ start, end, onChange }: Props) {
  const active = !!start || !!end;
  return (
    <div className={styles.bar}>
      <input
        type="date"
        className={styles.input}
        value={start}
        max={end || undefined}
        onChange={(e) => onChange({ start: e.target.value, end })}
        aria-label="시작일"
      />
      <span className={styles.tilde}>~</span>
      <input
        type="date"
        className={styles.input}
        value={end}
        min={start || undefined}
        onChange={(e) => onChange({ start, end: e.target.value })}
        aria-label="종료일"
      />
      {active && (
        <button
          className={styles.clear}
          onClick={() => onChange({ start: "", end: "" })}
        >
          초기화
        </button>
      )}
    </div>
  );
}
