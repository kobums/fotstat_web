import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import { DrawerContext } from "./drawer";
import styles from "./AppLayout.module.css";

/** Responsive app shell: fixed sidebar on desktop, slide-in drawer on mobile.
 *  The drawer's nav links call onNavigate to close it, so no route effect. */
export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = useCallback(() => setDrawerOpen(true), []);
  const ctx = useMemo(() => ({ open }), [open]);

  return (
    <DrawerContext.Provider value={ctx}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <SidebarNav />
        </aside>

        {drawerOpen && (
          <div
            className={styles.overlay}
            onClick={() => setDrawerOpen(false)}
            role="presentation"
          >
            <div
              className={styles.drawer}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </DrawerContext.Provider>
  );
}
