import type { ReactNode } from "react";
import styles from "./auth.module.css";

// Shared full-screen auth card scaffold: centered card with a brand header,
// the page's content (form + any extra actions), and a footer link row.
// Login/Register only differ in the header text, the content, and the footer.
export default function AuthScreen({
  brandMark,
  brandSub,
  footer,
  children,
}: {
  brandMark: string;
  brandSub: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>{brandMark}</div>
          <div className={styles.brandSub}>{brandSub}</div>
        </div>

        {children}

        <div className={styles.footer}>{footer}</div>
      </div>
    </main>
  );
}
