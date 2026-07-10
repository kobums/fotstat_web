import { ApiError } from "../core/api/client";

// Maps an unknown thrown value to a user-facing message: the normalized
// `ApiError` message when the failure came from the API, otherwise `fallback`.
// Replaces the `err instanceof ApiError ? err.message : "…"` idiom repeated
// across every form's catch block.
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Surfaces a mutation failure to the user. The app has no toast system yet, so
// a native alert keeps failure feedback consistent with the confirm()-based
// delete flows. Use as a mutation `onError` handler.
export function notifyError(fallback: string) {
  return (error: unknown) => {
    // A 401 already triggers a global logout via the API client; showing an
    // extra alert on top of the redirect would just be noise.
    if (error instanceof ApiError && error.status === 401) return;
    alert(errorMessage(error, fallback));
  };
}
