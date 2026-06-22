import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import CalendarGrid from "../Calendar/CalendarGrid";
import styles from "./DatePicker.module.css";

interface Props {
  /** "YYYY-MM-DD" or "". */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  "aria-label"?: string;
}

const PANEL_W = 300;

function formatLabel(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : "";
}

interface Pos {
  left: number;
  offset: number;
  placement: "top" | "bottom";
}

/** Date-only field that opens our themed calendar in a portaled popover,
 *  replacing the browser's native <input type="date"> picker. */
export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  "aria-label": ariaLabel,
}: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const below = spaceBelow >= 340 || spaceBelow >= r.top;
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - PANEL_W - 8)),
        offset: below ? r.bottom + 4 : window.innerHeight - r.top + 4,
        placement: below ? "bottom" : "top",
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(date: string) {
    onChange(date);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const labelText = formatLabel(value);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={[styles.trigger, labelText ? "" : styles.placeholder].join(
          " ",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarIcon size={16} className={styles.icon} aria-hidden />
        <span className={styles.value}>{labelText || placeholder || "날짜"}</span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{
              left: pos.left,
              width: PANEL_W,
              ...(pos.placement === "bottom"
                ? { top: pos.offset }
                : { bottom: pos.offset }),
            }}
          >
            <CalendarGrid
              selected={value}
              onSelect={pick}
              min={min}
              max={max}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
