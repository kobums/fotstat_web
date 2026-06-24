# fotstat_web

[![CI](https://github.com/kobums/fotstat_web/actions/workflows/ci.yml/badge.svg)](https://github.com/kobums/fotstat_web/actions/workflows/ci.yml)

유소년부터 프로까지 — 팀 단위 축구 경기 기록·통계 앱 **fotstat**의 웹 프론트엔드.
레퍼런스 디자인은 fotmob. 흑백 기반 다크모드 우선 UI.

## 스택

- **React 19** + **TypeScript** + **Vite**
- **react-router-dom v7** — 라우팅 / 인증 가드
- **@tanstack/react-query v5** — 서버 상태·캐싱
- **lucide-react** — 아이콘
- CSS Modules + CSS 변수 토큰 (`src/styles/tokens.css`)

백엔드는 별도 레포 `fotstat_go`(Go + go-fiber, MariaDB). API 설계·DB 스키마는 모노레포 루트 `PLAN.md` 참고.

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 (Vite, HMR)
npm run dev

# 타입체크 + 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린트
npm run lint
```

요구 사항: Node 20+ (개발 환경 기준 Node 26).

## 테스트

```bash
# 단위·컴포넌트·라우팅 테스트 (Vitest + Testing Library + MSW)
npm test           # watch
npm run test:run   # 1회 실행 (CI)

# E2E (Playwright, API는 네트워크 모킹 → 실 백엔드 불필요)
npx playwright install chromium   # 최초 1회
npm run e2e        # 또는 npm run e2e:ui
```

push·PR마다 GitHub Actions가 `lint·build·unit`과 `e2e`를 자동 실행한다.
테스트 전략·범위는 [`TESTING.md`](./TESTING.md) 참고.

## 환경 변수

API 베이스 URL은 Vite 환경 변수로 주입한다 (`import.meta.env.VITE_API_BASE_URL`).

| 파일              | 용도        | 값 예시                                  |
| ----------------- | ----------- | ---------------------------------------- |
| `.env`            | 로컬 개발   | 로컬 Go 백엔드 (포트 8009)               |
| `.env.production` | 프로덕션    | `https://fotstatapi.gowoobro.com/api`    |

> `VITE_API_BASE_URL`이 비어 있으면 API 클라이언트가 부팅 시점에 에러를 던진다 (`src/core/api/client.ts`).

## 프로젝트 구조

```
src/
├── core/                 # 앱 기반 레이어
│   ├── api/              # fetch 래퍼(client) · 도메인 엔드포인트 · DTO 타입
│   ├── auth/             # AuthContext · RequireAuth 가드 · CatchAllRedirect
│   └── theme/            # 다크/라이트 테마 컨텍스트
├── features/             # 도메인별 화면 + 데이터 훅
│   ├── auth/             # 로그인 / 회원가입
│   ├── landing/          # 비로그인 랜딩
│   ├── team/             # 팀 목록 · 상세 · 개요
│   ├── player/           # 스쿼드 · 선수 상세
│   ├── match/            # 경기 목록 · 상세 · 쿼터/기록 관리
│   ├── stats/            # 팀 통계 · 랭킹 · 선수 비교
│   └── settings/         # 설정 · 계정 전환
├── components/           # 재사용 UI (디자인 시스템)
│   ├── AppShell/         # 사이드바 + 레이아웃
│   ├── Select/           # 커스텀 리스트박스 (portal 드롭다운)
│   ├── Calendar/         # CalendarGrid (연/월 이동)
│   ├── DateTimePicker/   # 캘린더 + 10분 단위 시간 선택
│   ├── DatePicker/       # 날짜 전용 popover
│   └── ...               # Button · Modal · TextField · StatTile 등
├── lib/                  # 순수 유틸 (date · position · crestColor · queryKeys …)
└── styles/               # tokens.css · 전역 스타일
```

### 데이터 흐름

- 모든 API 호출은 `core/api/client.ts`의 fetch 래퍼를 거친다. JWT는 localStorage에 저장되며 `Bearer` 헤더로 자동 첨부, 401 응답 시 토큰을 비우고 전역 로그아웃 이벤트를 발생시킨다.
- 도메인 데이터는 feature별 `useXxx` 훅(react-query)으로 가져온다. 쿼리 키는 `lib/queryKeys.ts`에 중앙화.
- 통계는 별도 집계 API가 없어 `matches → quarters → records`를 클라이언트에서 합산한다 (`features/stats/useTeamStats.ts`).

### 라우팅

- 공개: `/`(랜딩) · `/login` · `/register`
- 보호(`RequireAuth` + `AppLayout`): `/myteam` · `/settings` · `/teams/:teamId`(개요/squad/matches/stats) · 경기·선수 상세
- 알 수 없는 경로는 로그인 여부에 따라 `/myteam` 또는 `/`로 리다이렉트.

## 디자인

- 흑백 기반, 다크모드 우선. 색·여백·반경은 `src/styles/tokens.css`의 CSS 변수로 관리한다.
- 컴포넌트는 `src/components`의 디자인 시스템을 재사용한다. 날짜/시간·드롭다운은 네이티브 컨트롤 대신 테마에 맞춘 커스텀 컴포넌트(`Select`, `DatePicker`, `DateTimePicker`)를 사용한다.
