import type { ReactNode } from "react";
import styles from "./StateView.module.css";

export function LoadingView({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className={styles.center}>
      <span className={styles.spinner} aria-hidden />
      <span className={styles.muted}>{label}</span>
    </div>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.center}>
      <span className={styles.muted}>{message}</span>
      {onRetry && (
        <button className={styles.retry} onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyView({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.center}>
      <strong className={styles.emptyTitle}>{title}</strong>
      {description && <span className={styles.muted}>{description}</span>}
      {action}
    </div>
  );
}
