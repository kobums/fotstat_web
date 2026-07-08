import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import { DrawerContext } from "./drawer";
import styles from "./AppLayout.module.css";

const COLLAPSE_KEY = "fotstat.sidebar.collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Responsive app shell: fixed sidebar on desktop, slide-in drawer on mobile.
 *  The drawer's nav links call onNavigate to close it, so no route effect.
 *  데스크톱에선 사이드바를 접어(YouTube식) 아이콘만 남긴 미니 레일로 만들 수 있고,
 *  접힘 상태는 localStorage에 유지된다. 토글 버튼은 항상 사이드바 안에 있어
 *  접고 펼쳐도 언마운트되지 않는다(포커스 유지). */
export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const open = useCallback(() => setDrawerOpen(true), []);
  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore quota/private-mode errors */
      }
      return next;
    });
  }, []);
  const ctx = useMemo(() => ({ open }), [open]);

  return (
    <DrawerContext.Provider value={ctx}>
      <div className={styles.shell}>
        <aside
          id="app-sidebar"
          className={
            collapsed ? `${styles.sidebar} ${styles.collapsed}` : styles.sidebar
          }
        >
          <SidebarNav collapsed={collapsed} onToggle={toggleSidebar} />
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

        <main
          className={
            collapsed ? `${styles.main} ${styles.mainCollapsed}` : styles.main
          }
        >
          <Outlet />
        </main>
      </div>
    </DrawerContext.Provider>
  );
}
