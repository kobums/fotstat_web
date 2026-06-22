import { createContext, useContext } from "react";

interface DrawerValue {
  open: () => void;
}

export const DrawerContext = createContext<DrawerValue | null>(null);

/** Open the mobile nav drawer. No-op when rendered outside the shell. */
export function useDrawer(): DrawerValue {
  return useContext(DrawerContext) ?? { open: () => {} };
}
