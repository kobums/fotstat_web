import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string | number;
  label: string;
}
export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}
type Item = SelectOption | SelectOptionGroup;

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Item[];
  label?: string;
  error?: string;
  placeholder?: string;
  /** Smaller height/font for tight inline contexts. */
  compact?: boolean;
  /** Class for the outer wrapper (e.g. to make it flex-grow in a row). */
  wrapClassName?: string;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

function isGroup(item: Item): item is SelectOptionGroup {
  return (item as SelectOptionGroup).options !== undefined;
}

interface Pos {
  left: number;
  width: number;
  /** Distance from the chosen viewport edge. */
  offset: number;
  maxHeight: number;
  placement: "top" | "bottom";
}

/**
 * Custom listbox replacing the native <select> so the open dropdown matches
 * our theme (the native option popup can't be styled with CSS). The panel is
 * portaled to <body> with fixed positioning so it floats above modals instead
 * of being clipped by their overflow.
 */
export default function Select({
  value,
  onChange,
  options,
  label,
  error,
  placeholder,
  compact,
  wrapClassName,
  id,
  disabled,
  "aria-label": ariaLabel,
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  // Flat option list + a render model that keeps group headers in place.
  const flat: SelectOption[] = options.flatMap((i) =>
    isGroup(i) ? i.options : [i],
  );
  const rows: (
    | { type: "group"; label: string }
    | { type: "option"; opt: SelectOption; index: number }
  )[] = [];
  let idx = 0;
  for (const item of options) {
    if (isGroup(item)) {
      rows.push({ type: "group", label: item.label });
      for (const o of item.options)
        rows.push({ type: "option", opt: o, index: idx++ });
    } else {
      rows.push({ type: "option", opt: item, index: idx++ });
    }
  }

  const selected = flat.find((o) => String(o.value) === String(value));
  const [activeIndex, setActiveIndex] = useState(0);

  // Position the portaled panel against the trigger; track scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const below = spaceBelow >= 220 || spaceBelow >= spaceAbove;
      setPos({
        left: r.left,
        width: r.width,
        offset: below ? r.bottom + 4 : window.innerHeight - r.top + 4,
        maxHeight: Math.min(280, (below ? spaceBelow : spaceAbove) - 12),
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

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function openMenu() {
    if (disabled) return;
    const i = flat.findIndex((o) => String(o.value) === String(value));
    setActiveIndex(i < 0 ? 0 : i);
    setOpen(true);
  }

  function choose(opt: SelectOption) {
    onChange(String(opt.value));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(flat.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = flat[activeIndex];
      if (opt) choose(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={[styles.wrap, wrapClassName ?? ""].join(" ")}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        className={[
          styles.trigger,
          compact ? styles.compact : "",
          error ? styles.invalid : "",
          !selected ? styles.placeholder : "",
        ].join(" ")}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value}>
          {selected?.label ?? placeholder ?? ""}
        </span>
        <ChevronDown
          className={[styles.icon, open ? styles.iconOpen : ""].join(" ")}
          size={compact ? 14 : 16}
          aria-hidden
        />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              ...(pos.placement === "bottom"
                ? { top: pos.offset }
                : { bottom: pos.offset }),
            }}
          >
            <ul className={styles.list} role="listbox">
              {rows.map((row, ri) =>
                row.type === "group" ? (
                  <li key={`g${ri}`} className={styles.group} role="presentation">
                    {row.label}
                  </li>
                ) : (
                  <li
                    key={String(row.opt.value)}
                    role="option"
                    aria-selected={String(row.opt.value) === String(value)}
                    data-index={row.index}
                    className={[
                      styles.option,
                      row.index === activeIndex ? styles.active : "",
                    ].join(" ")}
                    onMouseEnter={() => setActiveIndex(row.index)}
                    onClick={() => choose(row.opt)}
                  >
                    <span>{row.opt.label}</span>
                    {String(row.opt.value) === String(value) && (
                      <Check size={16} className={styles.check} />
                    )}
                  </li>
                ),
              )}
            </ul>
          </div>,
          document.body,
        )}

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
