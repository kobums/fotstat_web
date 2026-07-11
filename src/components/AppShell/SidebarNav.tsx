import { NavLink, useMatch, useNavigate } from "react-router-dom";
import {
  Bandage,
  BarChart3,
  CalendarDays,
  Dumbbell,
  FileText,
  Home,
  LogOut,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import Crest from "../Crest/Crest";
import { useAuth } from "../../core/auth/AuthContext";
import { useTheme } from "../../core/theme/ThemeContext";
import { useTeams } from "../../features/team/useTeams";
import { initials } from "../../lib/crestColor";
import styles from "./SidebarNav.module.css";

const ICON_SIZE = 18;

// The team name link above already goes to the team overview (home), so the
// sub-nav lists only the team's sections.
const TEAM_TABS = [
  { to: "squad", label: "스쿼드", end: false, Icon: Users },
  { to: "injuries", label: "부상", end: false, Icon: Bandage },
  { to: "matches", label: "경기", end: false, Icon: CalendarDays },
  { to: "trainings", label: "훈련", end: false, Icon: Dumbbell },
  { to: "stats", label: "통계", end: false, Icon: BarChart3 },
  { to: "report", label: "리포트", end: false, Icon: FileText },
];

/** Navigation content shared by the desktop sidebar and the mobile drawer.
 *  collapsed(데스크톱 접힘)면 아이콘만 남긴 미니 레일로, onToggle이 있으면
 *  브랜드 옆(펼침) 또는 상단(접힘)에 접기/펼치기 토글을 노출한다. */
export default function SidebarNav({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { data: teams } = useTeams();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const teamMatch = useMatch("/teams/:teamId/*");
  const activeTeamId = teamMatch?.params.teamId;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;
  const subClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.subLink} ${styles.subActive}` : styles.subLink;

  return (
    <div className={collapsed ? `${styles.nav} ${styles.navCollapsed}` : styles.nav}>
      <div className={styles.brandRow}>
        {!collapsed && (
          <button
            className={styles.brand}
            onClick={() => {
              navigate("/myteam");
              onNavigate?.();
            }}
          >
            fotstat
          </button>
        )}
        {onToggle && (
          <button
            className={styles.collapseBtn}
            onClick={onToggle}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            {collapsed ? (
              <PanelLeft size={20} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}
      </div>

      <nav className={styles.section}>
        <NavLink
          to="/myteam"
          end
          className={linkClass}
          onClick={onNavigate}
          title={collapsed ? "내 팀" : undefined}
        >
          <Home size={ICON_SIZE} className={styles.linkIcon} />
          {!collapsed && "내 팀"}
        </NavLink>
      </nav>

      {teams && teams.length > 0 && (
        <nav className={styles.section}>
          {!collapsed && <span className={styles.sectionLabel}>팀</span>}
          {teams.map((t) => {
            const isActive = activeTeamId === String(t.id);
            return (
              <div key={t.id}>
                <NavLink
                  to={`/teams/${t.id}`}
                  className={linkClass}
                  onClick={onNavigate}
                  title={collapsed ? t.name : undefined}
                >
                  <Crest name={t.name} size={24} />
                  {!collapsed && <span className={styles.teamName}>{t.name}</span>}
                </NavLink>
                {isActive && !collapsed && (
                  <div className={styles.subNav}>
                    {TEAM_TABS.map((tab) => (
                      <NavLink
                        key={tab.label}
                        to={`/teams/${t.id}/${tab.to}`}
                        end={tab.end}
                        className={subClass}
                        onClick={onNavigate}
                      >
                        <tab.Icon size={16} className={styles.linkIcon} />
                        {tab.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}

      <div className={styles.spacer} />

      <nav className={styles.section}>
        <NavLink
          to="/settings"
          className={linkClass}
          onClick={onNavigate}
          title={collapsed ? "설정" : undefined}
        >
          <Settings size={ICON_SIZE} className={styles.linkIcon} />
          {!collapsed && "설정"}
        </NavLink>
        <button
          className={styles.link}
          onClick={toggle}
          title={collapsed ? (theme === "dark" ? "다크 모드" : "라이트 모드") : undefined}
        >
          {theme === "dark" ? (
            <Moon size={ICON_SIZE} className={styles.linkIcon} />
          ) : (
            <Sun size={ICON_SIZE} className={styles.linkIcon} />
          )}
          {!collapsed && (theme === "dark" ? "다크 모드" : "라이트 모드")}
        </button>
        <button
          className={styles.link}
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          title={collapsed ? "로그아웃" : undefined}
        >
          <LogOut size={ICON_SIZE} className={styles.linkIcon} />
          {!collapsed && "로그아웃"}
        </button>
      </nav>

      <div className={styles.account}>
        <span className={styles.avatar}>{initials(user?.name ?? "U")}</span>
        {!collapsed && (
          <div className={styles.accountText}>
            <span className={styles.accountName}>{user?.name ?? "사용자"}</span>
            <span className={styles.accountMail}>
              {user?.email?.startsWith("guest:") ? "게스트" : user?.email}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
