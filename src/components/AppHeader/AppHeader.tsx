import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu } from "lucide-react";
import { useDrawer } from "../AppShell/drawer";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | string;
  actions?: ReactNode;
}

/** Sticky top bar with optional back button and right-aligned actions. */
export default function AppHeader({
  title,
  subtitle,
  back,
  actions,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const drawer = useDrawer();
  const onBack = () => {
    if (typeof back === "string") navigate(back);
    else navigate(-1);
  };
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {!back && (
            <button
              className={styles.menu}
              onClick={drawer.open}
              aria-label="메뉴"
            >
              <Menu size={22} />
            </button>
          )}
          {back && (
            <button className={styles.back} onClick={onBack} aria-label="뒤로">
              <ChevronLeft size={24} />
            </button>
          )}
          <div className={styles.titles}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
