import { useState } from "react";

// Open/close + create-vs-edit state for a list page's form modal. Replaces the
// repeated `const [formOpen] = useState(false)` + `const [editing] = useState`
// + openCreate/openEdit handlers. `close` leaves `editing` as-is (the modal is
// unmounted while closed, so the stale value is never read).
export function useFormModalState<T>() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  return {
    open,
    editing,
    openCreate() {
      setEditing(null);
      setOpen(true);
    },
    openEdit(entity: T) {
      setEditing(entity);
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
  };
}
