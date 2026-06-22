import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Moon,
  Smartphone,
  Users,
} from "lucide-react";
import Button from "../../components/Button/Button";
import { useAuth } from "../../core/auth/AuthContext";
import { ApiError } from "../../core/api/client";
import styles from "./LandingPage.module.css";

const FEATURES = [
  {
    Icon: Users,
    title: "팀 · 선수 관리",
    desc: "여러 팀을 만들고 포지션별로 스쿼드를 구성합니다.",
  },
  {
    Icon: ClipboardList,
    title: "경기 · 쿼터 기록",
    desc: "쿼터별로 선수의 출전 시간·골·도움을 빠르게 입력합니다.",
  },
  {
    Icon: BarChart3,
    title: "통계 · 평균 · 비교",
    desc: "전적·득점·도움 순위에 경기당 평균과 기간·선수 비교까지.",
  },
  {
    Icon: CalendarDays,
    title: "일정 한눈에",
    desc: "달력에서 경기 일정과 다음 경기, 최근 결과를 확인합니다.",
  },
  {
    Icon: Smartphone,
    title: "어디서나 반응형",
    desc: "데스크톱과 모바일 모두 최적화된 화면을 제공합니다.",
  },
  {
    Icon: Moon,
    title: "다크 모드",
    desc: "라이트·다크 테마를 자유롭게 전환할 수 있습니다.",
  },
];

export default function LandingPage() {
  const { isAuthenticated, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [guestBusy, setGuestBusy] = useState(false);

  async function startGuest() {
    setGuestBusy(true);
    try {
      await loginGuest();
      navigate("/myteam");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "시작하지 못했습니다.");
    } finally {
      setGuestBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.brand}>fotstat</span>
        {isAuthenticated ? (
          <Button fullWidth={false} onClick={() => navigate("/myteam")}>
            내 팀으로
          </Button>
        ) : (
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={() => navigate("/login")}
          >
            로그인
          </Button>
        )}
      </header>

      <section className={styles.hero}>
        <span className={styles.kicker}>유소년부터 프로까지</span>
        <h1 className={styles.title}>
          팀 단위 축구 경기를
          <br />
          기록하고 분석하세요
        </h1>
        <p className={styles.subtitle}>
          fotstat은 팀·선수·경기·기록·통계를 한곳에서 관리하는 축구 기록
          서비스입니다. 쿼터별 기록부터 선수 순위·평균·비교까지.
        </p>
        <div className={styles.cta}>
          {isAuthenticated ? (
            <Button fullWidth={false} onClick={() => navigate("/myteam")}>
              내 팀으로 가기
            </Button>
          ) : (
            <>
              <Button fullWidth={false} onClick={() => navigate("/login")}>
                시작하기
              </Button>
              <Button
                variant="secondary"
                fullWidth={false}
                loading={guestBusy}
                onClick={startGuest}
              >
                게스트로 둘러보기
              </Button>
            </>
          )}
        </div>
      </section>

      <section className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.feature}>
            <span className={styles.featureIcon}>
              <f.Icon size={22} />
            </span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} fotstat
      </footer>
    </div>
  );
}
