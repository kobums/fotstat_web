import { ApiError } from "../core/api/client";

// Surfaces a mutation failure to the user. The app has no toast system yet, so
// a native alert keeps failure feedback consistent with the confirm()-based
// delete flows. Use as a mutation `onError` handler.
export function notifyError(fallback: string) {
  return (error: unknown) => {
    // A 401 already triggers a global logout via the API client; showing an
    // extra alert on top of the redirect would just be noise.
    if (error instanceof ApiError && error.status === 401) return;
    const message = error instanceof ApiError ? error.message : fallback;
    alert(message);
  };
}
