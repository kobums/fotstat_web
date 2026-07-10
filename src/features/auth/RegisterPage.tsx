import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import TextField from "../../components/TextField/TextField";
import { useAuth } from "../../core/auth/AuthContext";
import { errorMessage } from "../../lib/notifyError";
import AuthScreen from "./AuthScreen";
import styles from "./auth.module.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register(email.trim(), password, name.trim());
      navigate("/myteam", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "회원가입에 실패했습니다."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthScreen
      brandMark="회원가입"
      brandSub="fotstat 계정 만들기"
      footer={
        <>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className={styles.formError}>{error}</div>}
        <Button type="submit" loading={pending}>
          가입하기
        </Button>
      </form>
    </AuthScreen>
  );
}
