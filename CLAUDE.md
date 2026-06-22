# CLAUDE.md — fotstat_web

fotstat(축구 기록·통계 앱)의 웹 프론트엔드. 모노레포 전체 맥락·DB·API·디자인 토큰은 루트 `../PLAN.md`와 `../.claude/CLAUDE.md` 참고. 레퍼런스 디자인은 fotmob, 흑백 기반 다크모드 우선.

## 스택

React 19 + TypeScript + Vite / react-router-dom v7 / @tanstack/react-query v5 / lucide-react / CSS Modules + CSS 변수 토큰.

## 명령어

- `npm run dev` — 개발 서버(HMR)
- `npm run build` — `tsc -b && vite build` (타입체크 포함)
- `npm run lint` — ESLint
- `npm run preview` — 빌드 미리보기

**코드 변경 후에는 `npm run build`(또는 최소 `tsc -b`)와 `npm run lint`로 검증한다.** tsconfig는 `noUnusedLocals`/`noUnusedParameters`가 켜져 있어 미사용 import·변수는 빌드 에러다.

## 구조

- `src/core/` — 기반 레이어. `api/`(fetch 래퍼 `client.ts` · 도메인 `endpoints.ts` · DTO `types.ts`), `auth/`(AuthContext · RequireAuth), `theme/`
- `src/features/<도메인>/` — 화면 컴포넌트 + `useXxx` 데이터 훅. 도메인: auth · landing · team · player · match · stats · settings
- `src/components/` — 재사용 UI(디자인 시스템). `Xxx/Xxx.tsx` + `Xxx.module.css` 쌍
- `src/lib/` — 순수 유틸(date · position · crestColor · queryKeys · combineQueries · notifyError)
- `src/styles/tokens.css` — 색·여백·반경 CSS 변수

## 컨벤션

- **API 호출은 반드시 `core/api/client.ts` 래퍼를 거친다.** 직접 fetch 금지. 에러는 `ApiError`로 정규화되고, 401은 토큰 제거 + 전역 로그아웃 이벤트.
- **서버 상태는 react-query 훅으로.** 쿼리 키는 `lib/queryKeys.ts`에 중앙화(`qk.*`). 새 쿼리 키도 여기에 추가.
- **뮤테이션 실패는 `lib/notifyError.ts`의 `onError`로 사용자에게 노출**(특히 삭제/수정).
- **스타일은 CSS Modules + `tokens.css` 변수**. 인라인 스타일·하드코딩 색상 금지. 다크모드는 변수로 자동 처리.
- **네이티브 폼 컨트롤 대신 디자인 시스템 컴포넌트 사용**: 드롭다운은 `components/Select`, 날짜는 `components/DatePicker`, 날짜+시간은 `components/DateTimePicker`(내부적으로 `Calendar/CalendarGrid` 공유). native `<select>`/`<input type="date">` 추가 금지.
- 위치/포지션 색은 `--role-*` 토큰(`--pos`는 semantic positive와 혼동 방지를 위해 사용하지 않음).
- 통계엔 백엔드 집계 API가 없어 `matches→quarters→records`를 클라이언트에서 합산(`features/stats/useTeamStats.ts`). 경기 수가 많아지면 성능 주의.

## 환경 변수

`VITE_API_BASE_URL` (`.env` 로컬 / `.env.production` 운영). 비어 있으면 API 클라이언트가 부팅 시 throw.

## 서브에이전트 규칙 (루트 공통)

- 코드 수정 후 반드시 code-reviewer 에이전트로 리뷰
- 테스트/버그 분석은 debugger 에이전트 먼저
