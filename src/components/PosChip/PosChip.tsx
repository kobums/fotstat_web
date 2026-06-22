import { positionColorVar } from "../../lib/position";
import styles from "./PosChip.module.css";

/** Web equivalent of iOS FSPosChip — small colored position badge. */
export default function PosChip({ position }: { position: string }) {
  if (!position) return null;
  const color = positionColorVar(position);
  return (
    <span
      className={styles.chip}
      style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {position.toUpperCase()}
    </span>
  );
}
