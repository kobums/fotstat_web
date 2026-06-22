import { useState, type FormEvent } from "react";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import TextField from "../../components/TextField/TextField";
import { useAuth } from "../../core/auth/AuthContext";
import { ApiError } from "../../core/api/client";

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { upgrade } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await upgrade(email.trim(), password, name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "전환에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title="정식 계정으로 전환" onClose={onClose}>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <p style={{ color: "var(--text-sec)", fontSize: 14, margin: 0 }}>
          현재 게스트 데이터는 그대로 유지됩니다.
        </p>
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
          error={error ?? undefined}
        />
        <Button type="submit" loading={busy}>
          전환하기
        </Button>
      </form>
    </Modal>
  );
}
