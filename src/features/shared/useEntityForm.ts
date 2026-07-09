import { useState } from "react";
import { errorMessage } from "../../lib/notifyError";

interface Mutation<TVars> {
  mutateAsync: (vars: TVars) => Promise<unknown>;
  isPending: boolean;
}

// Owns the create-or-update submit that every entity form modal repeated:
// branch on whether we're editing, call the matching mutation, close on
// success, and surface failures via `errorMessage`. Each form keeps its own
// field state and validation, then calls `submit(input)` with the built input.
export function useEntityForm<TInput extends object, TEntity extends { id: number }>(opts: {
  entity: TEntity | null | undefined;
  create: Mutation<TInput>;
  update: Mutation<TInput & { id: number }>;
  onClose: () => void;
  /** Fallback message when the thrown error isn't an ApiError. */
  failMessage?: string;
}) {
  const { entity, create, update, onClose, failMessage = "저장에 실패했습니다." } = opts;
  const [error, setError] = useState<string | null>(null);
  const editing = !!entity;
  const pending = create.isPending || update.isPending;

  async function submit(input: TInput) {
    setError(null);
    try {
      if (entity) await update.mutateAsync({ ...input, id: entity.id });
      else await create.mutateAsync(input);
      onClose();
    } catch (err) {
      setError(errorMessage(err, failMessage));
    }
  }

  return { editing, pending, error, setError, submit };
}
