import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import styles from "./CalendarGrid.module.css";

interface Props {
  /** Selected day as "YYYY-MM-DD" (or "" for none). */
  selected: string;
  onSelect: (date: string) => void;
  /** Inclusive bounds as "YYYY-MM-DD"; days outside are disabled. */
  min?: string;
  max?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

/** Reusable month calendar: any day selectable (subject to min/max). The day
 *  keys are "YYYY-MM-DD" strings, which compare lexicographically by date. */
export default function CalendarGrid({ selected, onSelect, min, max }: Props) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(selected);
    return m
      ? { year: +m[1], month: +m[2] - 1 }
      : { year: today.getFullYear(), month: today.getMonth() };
  });

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1).getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < first; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(d);
    return out;
  }, [view]);

  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  function shiftMonth(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  function shiftYear(delta: number) {
    setView((v) => ({ ...v, year: v.year + delta }));
  }

  return (
    <div className={styles.cal}>
      <div className={styles.header}>
        <div className={styles.navGroup}>
          <button
            type="button"
            className={styles.nav}
            onClick={() => shiftYear(-1)}
            aria-label="이전 해"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            type="button"
            className={styles.nav}
            onClick={() => shiftMonth(-1)}
            aria-label="이전 달"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <span className={styles.month}>
          {view.year}년 {view.month + 1}월
        </span>
        <div className={styles.navGroup}>
          <button
            type="button"
            className={styles.nav}
            onClick={() => shiftMonth(1)}
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            className={styles.nav}
            onClick={() => shiftYear(1)}
            aria-label="다음 해"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
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
          const disabled = (!!min && date < min) || (!!max && date > max);
          return (
            <button
              key={date}
              type="button"
              className={[
                styles.day,
                date === selected ? styles.selected : "",
                date === todayStr ? styles.today : "",
              ].join(" ")}
              disabled={disabled}
              onClick={() => onSelect(date)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
