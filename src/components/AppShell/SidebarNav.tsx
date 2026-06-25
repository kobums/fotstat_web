import { NavLink, useMatch, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Home,
  LogOut,
  Moon,
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
  { to: "matches", label: "경기", end: false, Icon: CalendarDays },
  { to: "stats", label: "통계", end: false, Icon: BarChart3 },
];

/** Navigation content shared by the desktop sidebar and the mobile drawer. */
export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
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
    <div className={styles.nav}>
      <button
        className={styles.brand}
        onClick={() => {
          navigate("/myteam");
          onNavigate?.();
        }}
      >
        fotstat
      </button>

      <nav className={styles.section}>
        <NavLink to="/myteam" end className={linkClass} onClick={onNavigate}>
          <Home size={ICON_SIZE} className={styles.linkIcon} /> 내 팀
        </NavLink>
      </nav>

      {teams && teams.length > 0 && (
        <nav className={styles.section}>
          <span className={styles.sectionLabel}>팀</span>
          {teams.map((t) => {
            const isActive = activeTeamId === String(t.id);
            return (
              <div key={t.id}>
                <NavLink
                  to={`/teams/${t.id}`}
                  className={linkClass}
                  onClick={onNavigate}
                >
                  <Crest name={t.name} size={24} />
                  <span className={styles.teamName}>{t.name}</span>
                </NavLink>
                {isActive && (
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
        <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
          <Settings size={ICON_SIZE} className={styles.linkIcon} /> 설정
        </NavLink>
        <button className={styles.link} onClick={toggle}>
          {theme === "dark" ? (
            <Moon size={ICON_SIZE} className={styles.linkIcon} />
          ) : (
            <Sun size={ICON_SIZE} className={styles.linkIcon} />
          )}
          {theme === "dark" ? "다크 모드" : "라이트 모드"}
        </button>
        <button
          className={styles.link}
          onClick={() => {
            logout();
            onNavigate?.();
          }}
        >
          <LogOut size={ICON_SIZE} className={styles.linkIcon} /> 로그아웃
        </button>
      </nav>

      <div className={styles.account}>
        <span className={styles.avatar}>{initials(user?.name ?? "U")}</span>
        <div className={styles.accountText}>
          <span className={styles.accountName}>{user?.name ?? "사용자"}</span>
          <span className={styles.accountMail}>
            {user?.email?.startsWith("guest:") ? "게스트" : user?.email}
          </span>
        </div>
      </div>
    </div>
  );
}
