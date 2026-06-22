import { useId, type InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Web equivalent of iOS FotTextField (52px). */
export default function TextField({
  label,
  error,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={styles.wrap}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[styles.input, error ? styles.invalid : "", className ?? ""].join(
          " ",
        )}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
