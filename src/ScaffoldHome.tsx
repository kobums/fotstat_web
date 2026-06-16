import { useTheme } from "./core/theme/ThemeContext";
import styles from "./ScaffoldHome.module.css";

// Temporary landing used only to verify the scaffold (tokens, theme, build).
// Removed once real feature routes land.
export default function ScaffoldHome() {
  const { theme, toggle } = useTheme();
  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.badge}>fotstat web</span>
        <h1 className={styles.title}>Vite + React 19 scaffold ready</h1>
        <p className={styles.sub}>
          API base: <code>{import.meta.env.VITE_API_BASE_URL}</code>
        </p>
        <button className={styles.toggle} onClick={toggle}>
          theme: {theme} — toggle
        </button>
      </div>
    </main>
  );
}
