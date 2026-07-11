import { useState } from "react";
import { NavLink, Outlet, useMatches, useParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { LoadingView, ErrorView } from "../../components/StateView/StateView";
import { useDrawer } from "../../components/AppShell/drawer";
import { dayKey, monthStartKey } from "../../lib/date";
import { useTeam } from "./useTeams";
import styles from "./TeamDetailLayout.module.css";

const TABS = [
  { to: "", label: "홈", end: true },
  { to: "squad", label: "스쿼드", end: false },
  { to: "injuries", label: "부상", end: false },
  { to: "matches", label: "경기", end: false },
  { to: "trainings", label: "훈련", end: false },
  { to: "stats", label: "통계", end: false },
  { to: "report", label: "리포트", end: false },
];

export default function TeamDetailLayout() {
  const { teamId } = useParams();
  const id = Number(teamId);
  const { data: team, isLoading, isError, refetch } = useTeam(id);
  const drawer = useDrawer();
  // 통계·리포트 탭이 공유하는 조회 기간 — 기본은 이번 달(1일 → 오늘)
  const [statsRange, setStatsRange] = useState(() => {
    const now = new Date();
    return { start: monthStartKey(now), end: dayKey(now) };
  });
  // 라우트 handle.wide가 켜진 탭(리포트)은 컨텐츠 폭 제한을 해제
  const wide = useMatches().some(
    (m) => (m.handle as { wide?: boolean } | undefined)?.wide,
  );

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

      <main className={wide ? `${styles.content} ${styles.wide}` : styles.content}>
        {isLoading && <LoadingView />}
        {isError && (
          <ErrorView message="팀을 불러오지 못했습니다." onRetry={refetch} />
        )}
        {team && <Outlet context={{ team, statsRange, setStatsRange }} />}
      </main>
    </div>
  );
}
