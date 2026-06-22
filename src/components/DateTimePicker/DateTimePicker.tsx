import { useMemo } from "react";
import CalendarGrid from "../Calendar/CalendarGrid";
import Select from "../Select/Select";
import styles from "./DateTimePicker.module.css";

interface Props {
  /** Controlled value as "YYYY-MM-DDTHH:mm" (same shape as datetime-local). */
  value: string;
  onChange: (value: string) => void;
  /** Minute granularity for the time selector. */
  minuteStep?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

interface Parts {
  year: number;
  month: number; // 0-indexed
  day: number;
  hour: number;
  minute: number;
}

function parse(value: string): Parts {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (m) {
    return {
      year: +m[1],
      month: +m[2] - 1,
      day: +m[3],
      hour: +m[4],
      minute: +m[5],
    };
  }
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

function compose(p: Parts): string {
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export default function DateTimePicker({
  value,
  onChange,
  minuteStep = 10,
}: Props) {
  const parts = parse(value);
  const selectedDate = `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`;

  function handleDate(date: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return;
    onChange(compose({ ...parts, year: +m[1], month: +m[2] - 1, day: +m[3] }));
  }

  const minutes = useMemo(() => {
    const out: number[] = [];
    for (let m = 0; m < 60; m += minuteStep) out.push(m);
    return out;
  }, [minuteStep]);

  // Snap a misaligned stored minute to the nearest option so the select can
  // render it (older data may not sit on a step boundary).
  const minuteValue = minutes.includes(parts.minute)
    ? parts.minute
    : (Math.round(parts.minute / minuteStep) * minuteStep) % 60;

  return (
    <div className={styles.picker}>
      <CalendarGrid selected={selectedDate} onSelect={handleDate} />

      <div className={styles.time}>
        <Select
          compact
          aria-label="시"
          value={parts.hour}
          onChange={(v) => onChange(compose({ ...parts, hour: +v }))}
          options={Array.from({ length: 24 }, (_, h) => ({
            value: h,
            label: `${pad(h)}시`,
          }))}
        />
        <span className={styles.colon}>:</span>
        <Select
          compact
          aria-label="분"
          value={minuteValue}
          onChange={(v) => onChange(compose({ ...parts, minute: +v }))}
          options={minutes.map((m) => ({ value: m, label: `${pad(m)}분` }))}
        />
      </div>
    </div>
  );
}
