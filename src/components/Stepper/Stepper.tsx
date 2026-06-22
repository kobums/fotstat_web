import { Minus, Plus } from "lucide-react";
import styles from "./Stepper.module.css";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

/** Web equivalent of iOS FSStepper — −/value/+ control. */
export default function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.btn}
          onClick={dec}
          disabled={value <= min}
          aria-label={`${label ?? ""} 감소`}
        >
          <Minus size={16} />
        </button>
        <span className={styles.value}>{value}</span>
        <button
          type="button"
          className={styles.btn}
          onClick={inc}
          disabled={value >= max}
          aria-label={`${label ?? ""} 증가`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
