// Reusable react-query building blocks for the domain data hooks.
// Every `useXxx` list/read query and every create/update/delete mutation
// shared the same skeleton (`useQuery({ queryKey, queryFn, enabled })` and
// `useQueryClient()` + `onSuccess` invalidation + optional `notifyError`);
// these two helpers hold that skeleton so the domain hooks only declare what
// actually differs (keys, api call, messages).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { notifyError } from "./notifyError";

/**
 * List/read query keyed by a numeric id, enabled only when the id is valid
 * (> 0). Collapses the identical `useQuery({ queryKey, queryFn, enabled })`
 * shape shared by every domain list/read hook.
 */
export function useEntityQuery<T>(
  queryKey: QueryKey,
  fetch: (id: number, signal?: AbortSignal) => Promise<T>,
  id: number,
) {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetch(id, signal),
    enabled: id > 0,
  });
}

interface MutationConfig<TVars> {
  /** Query keys to invalidate on success. */
  invalidate: (vars: TVars) => QueryKey[];
  /** Query keys to drop from cache on success (e.g. now-orphaned child data). */
  remove?: (vars: TVars) => QueryKey[];
  /** When set, failures surface to the user via `notifyError`. */
  errorMessage?: string;
}

/**
 * Mutation that invalidates (and optionally removes) query keys on success and
 * optionally surfaces failures with `notifyError`. Collapses the repeated
 * `const qc = useQueryClient()` + `onSuccess`/`onError` plumbing across every
 * create/update/delete hook.
 */
export function useInvalidatingMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  config: MutationConfig<TVars>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, vars) => {
      for (const key of config.invalidate(vars)) {
        qc.invalidateQueries({ queryKey: key });
      }
      if (config.remove) {
        for (const key of config.remove(vars)) {
          qc.removeQueries({ queryKey: key });
        }
      }
    },
    ...(config.errorMessage
      ? { onError: notifyError(config.errorMessage) }
      : {}),
  });
}
