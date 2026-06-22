import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import AppHeader from "../../components/AppHeader/AppHeader";
import Button from "../../components/Button/Button";
import { useAuth } from "../../core/auth/AuthContext";
import { useTheme } from "../../core/theme/ThemeContext";
import { ApiError } from "../../core/api/client";
import UpgradeModal from "./UpgradeModal";
import styles from "./SettingsPage.module.css";

export default function SettingsPage() {
  const { user, logout, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isGuest = !!user?.email?.startsWith("guest:");

  async function onDelete() {
    if (
      !confirm(
        "정말 계정을 삭제할까요? 모든 팀·선수·경기·기록이 영구 삭제됩니다.",
      )
    )
      return;
    setBusy(true);
    try {
      await deleteAccount();
      navigate("/login", { replace: true });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <AppHeader title="설정" back="/myteam" />
      <main className={styles.content}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>계정</h3>
          <div className={styles.kv}>
            <span className={styles.k}>이름</span>
            <span className={styles.v}>{user?.name ?? "-"}</span>
          </div>
          <div className={styles.kv}>
            <span className={styles.k}>이메일</span>
            <span className={styles.v}>
              {isGuest ? "게스트 계정" : user?.email ?? "-"}
            </span>
          </div>
          {isGuest && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setUpgradeOpen(true)}
            >
              정식 계정으로 전환
            </Button>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>화면</h3>
          <div className={styles.segment}>
            <button
              className={theme === "light" ? styles.segActive : styles.seg}
              onClick={() => setTheme("light")}
            >
              <Sun size={16} /> 라이트
            </button>
            <button
              className={theme === "dark" ? styles.segActive : styles.seg}
              onClick={() => setTheme("dark")}
            >
              <Moon size={16} /> 다크
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <Button variant="secondary" onClick={logout}>
            로그아웃
          </Button>
          <button
            className={styles.danger}
            onClick={onDelete}
            disabled={busy}
          >
            계정 삭제
          </button>
        </section>
      </main>

      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}
    </div>
  );
}
