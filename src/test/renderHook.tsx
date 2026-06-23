import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";

// A QueryClient tuned for tests: no retries (so a failed query rejects at once)
// and no caching across tests.
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** renderHook wrapped in a fresh QueryClientProvider. */
export function renderHookWithClient<TResult>(hook: () => TResult) {
  const client = makeTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(hook, { wrapper }) };
}
