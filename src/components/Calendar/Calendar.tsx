import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Calendar.module.css";

interface Props {
  /** Dates with a match, as "YYYY-MM-DD". */
  marked: Set<string>;
  selected: string;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function Calendar({ marked, selected, onSelect }: Props) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1).getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < first; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(d);
    return out;
  }, [view]);

  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <div className={styles.cal}>
      <div className={styles.header}>
        <button className={styles.nav} onClick={() => shift(-1)} aria-label="이전 달">
          <ChevronLeft size={18} />
        </button>
        <span className={styles.month}>
          {view.year}년 {view.month + 1}월
        </span>
        <button className={styles.nav} onClick={() => shift(1)} aria-label="다음 달">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <span key={w} className={styles.weekday}>
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />;
          const date = ymd(view.year, view.month, d);
          const has = marked.has(date);
          const cls = [
            styles.day,
            has ? styles.has : "",
            date === selected ? styles.selected : "",
            date === todayStr ? styles.today : "",
          ].join(" ");
          return (
            <button
              key={date}
              className={cls}
              onClick={() => onSelect(has && selected === date ? "" : date)}
              disabled={!has}
            >
              {d}
              {has && <span className={styles.dot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
