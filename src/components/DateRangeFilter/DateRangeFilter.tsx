import DatePicker from "../DatePicker/DatePicker";
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
      <DatePicker
        value={start}
        max={end || undefined}
        onChange={(v) => onChange({ start: v, end })}
        placeholder="시작일"
        aria-label="시작일"
      />
      <span className={styles.tilde}>~</span>
      <DatePicker
        value={end}
        min={start || undefined}
        onChange={(v) => onChange({ start, end: v })}
        placeholder="종료일"
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
