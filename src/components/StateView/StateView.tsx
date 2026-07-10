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

// The loading -> error -> empty branch every list page repeated. Renders the
// first applicable state (in that precedence) or nothing when data is present
// and non-empty, so the page's content list can render alongside it.
export function StatusView({
  isLoading,
  loadingLabel,
  isError,
  errorMessage,
  onRetry,
  isEmpty = false,
  empty,
}: {
  isLoading: boolean;
  loadingLabel?: string;
  isError: boolean;
  errorMessage: string;
  onRetry?: () => void;
  isEmpty?: boolean;
  empty?: ReactNode;
}) {
  if (isLoading) return <LoadingView label={loadingLabel} />;
  if (isError) return <ErrorView message={errorMessage} onRetry={onRetry} />;
  if (isEmpty) return <>{empty}</>;
  return null;
}
