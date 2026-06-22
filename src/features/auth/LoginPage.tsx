import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import TextField from "../../components/TextField/TextField";
import { useAuth } from "../../core/auth/AuthContext";
import { ApiError } from "../../core/api/client";
import styles from "./auth.module.css";

export default function LoginPage() {
  const { loginEmail, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"email" | "guest" | null>(null);

  async function run(action: () => Promise<void>, kind: "email" | "guest") {
    setError(null);
    setPending(kind);
    try {
      await action();
      navigate("/myteam", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setPending(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(() => loginEmail(email.trim(), password), "email");
  }

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>fotstat</div>
          <div className={styles.brandSub}>팀 경기 기록·통계</div>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <TextField
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className={styles.formError}>{error}</div>}
          <Button type="submit" loading={pending === "email"}>
            로그인
          </Button>
        </form>

        <div className={styles.divider}>또는</div>

        <Button
          variant="secondary"
          loading={pending === "guest"}
          onClick={() => run(loginGuest, "guest")}
        >
          게스트로 시작하기
        </Button>

        <Button variant="ghost" disabled fullWidth>
           Apple로 로그인 (준비 중)
        </Button>
        <div className={styles.appleNote}>
          Apple 로그인은 백엔드 Service ID 설정 후 제공됩니다.
        </div>

        <div className={styles.footer}>
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </div>
      </div>
    </main>
  );
}
