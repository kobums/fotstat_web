import { NavLink, Outlet, useParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { LoadingView, ErrorView } from "../../components/StateView/StateView";
import { useDrawer } from "../../components/AppShell/drawer";
import { useTeam } from "./useTeams";
import styles from "./TeamDetailLayout.module.css";

const TABS = [
  { to: "", label: "홈", end: true },
  { to: "squad", label: "스쿼드", end: false },
  { to: "matches", label: "경기", end: false },
  { to: "stats", label: "통계", end: false },
];

export default function TeamDetailLayout() {
  const { teamId } = useParams();
  const id = Number(teamId);
  const { data: team, isLoading, isError, refetch } = useTeam(id);
  const drawer = useDrawer();

  return (
    <div className={styles.page}>
      <nav className={styles.tabs}>
        <div className={styles.tabsInner}>
          <button
            className={styles.menu}
            onClick={drawer.open}
            aria-label="메뉴"
          >
            <Menu size={20} />
          </button>
          {TABS.map((t) => (
            <NavLink
              key={t.to || "home"}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.active}` : styles.tab
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className={styles.content}>
        {isLoading && <LoadingView />}
        {isError && (
          <ErrorView message="팀을 불러오지 못했습니다." onRetry={refetch} />
        )}
        {team && <Outlet context={{ team }} />}
      </main>
    </div>
  );
}
