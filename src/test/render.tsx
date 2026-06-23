import type { ReactElement, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { makeTestQueryClient } from "./renderHook";

/** render() wrapped in a fresh QueryClientProvider (for components that use
 *  react-query hooks). Returns the client alongside RTL's result. */
export function renderWithClient(ui: ReactElement) {
  const client = makeTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...render(ui, { wrapper }) };
}
