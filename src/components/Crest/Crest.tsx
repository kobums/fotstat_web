import { crestColor, initials } from "../../lib/crestColor";
import styles from "./Crest.module.css";

interface CrestProps {
  name: string;
  size?: number;
}

/** Web equivalent of iOS FSCrest — rounded square team badge with initials. */
export default function Crest({ name, size = 40 }: CrestProps) {
  return (
    <div
      className={styles.crest}
      style={{
        width: size,
        height: size,
        background: crestColor(name),
        fontSize: size * 0.4,
        borderRadius: Math.max(6, size * 0.2),
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
