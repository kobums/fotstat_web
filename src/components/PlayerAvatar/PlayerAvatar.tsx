import { positionColorVar } from "../../lib/position";
import styles from "./PlayerAvatar.module.css";

interface Props {
  number: number;
  position?: string;
  size?: number;
}

/** Web equivalent of iOS FSPlayerAvatar — circular jersey number badge. */
export default function PlayerAvatar({ number, position, size = 40 }: Props) {
  const color = position ? positionColorVar(position) : "var(--text-ter)";
  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        borderColor: color,
        color,
      }}
      aria-hidden
    >
      {number}
    </div>
  );
}
