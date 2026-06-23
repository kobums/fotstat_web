import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

// jsdom under Node 26 doesn't expose a working `localStorage`, so we install a
// small in-memory Storage. The app reads the bare global (`localStorage.*`), so
// defining it on globalThis is enough.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

// jsdom doesn't implement scrollIntoView; components that call it (e.g. the
// Select listbox keeping the active option in view) would otherwise throw.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// MSW lifecycle: fail loudly on any request without a matching handler so a
// forgotten mock surfaces as a test error rather than a hang.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  // Modal locks body scroll; reset it so a test can't leak overflow state.
  document.body.style.overflow = "";
});

afterAll(() => server.close());
