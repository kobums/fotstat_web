import { LEGAL_URLS } from "../../lib/legal";
import styles from "./auth.module.css";

// 가입·게스트 시작 전에 보여 주는 약관 동의 안내 한 줄.
export default function LegalNotice() {
  return (
    <p className={styles.legalNotice}>
      계속 진행하면{" "}
      <a href={LEGAL_URLS.terms} target="_blank" rel="noopener noreferrer">
        이용약관
      </a>
      과{" "}
      <a href={LEGAL_URLS.privacy} target="_blank" rel="noopener noreferrer">
        개인정보 처리방침
      </a>
      에 동의한 것으로 봅니다.
    </p>
  );
}
