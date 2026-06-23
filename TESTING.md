# 테스트 전략 — fotstat_web

fotstat 웹 프론트엔드의 테스트 가이드. "투자 대비 버그를 잡는 효율이 높은 순서로 쌓는다"가 원칙이다.

## 도구 선택

| 레이어        | 도구                       | 이유                                                       |
| ------------- | -------------------------- | ---------------------------------------------------------- |
| 타입/컴파일   | `tsc -b` (build에 포함)    | 이미 강력한 1차 방어선                                      |
| 린트          | ESLint                     | 미사용 변수·훅 규칙                                         |
| 테스트 러너   | **Vitest**                 | Vite 네이티브, 설정 최소, ESM 친화 (Jest는 비추)           |
| 컴포넌트/훅   | **@testing-library/react** | React 표준, 사용자 관점 테스트                             |
| API 모킹      | **MSW**                    | `client.ts`를 건드리지 않고 네트워크 레이어에서 모킹       |
| E2E           | **Playwright**             | 크로스브라우저, 트레이스 디버깅, 안정적                     |

## 명령어

```bash
npm test           # Vitest watch 모드
npm run test:run   # 1회 실행 (CI용)
npm run build      # tsc -b + vite build (타입체크 포함)
npm run lint       # ESLint
```

## 4단계 로드맵

### Phase 0 — 즉시 검증 (설치 0) ✅

코드 변경 때마다 회귀 방지의 바닥. CI에서 강제한다.

```bash
npm run build && npm run lint
```

### Phase 1 — 순수 로직 단위 테스트 (최고 ROI) ✅ 진행 중

부수효과 없는 순수 함수부터. 빠르고 안정적이며 버그 파급이 큰 곳.

- `lib/date.ts` — API ↔ input 날짜 변환, 라운드트립
- `lib/position.ts` — 포지션 → 색 그룹 매핑
- `lib/crestColor.ts` — 결정적 해시 색·이니셜
- `lib/combineQueries.ts` — 병렬 쿼리 병합
- **`features/stats/aggregateTeamStats.ts`** — 클라이언트 집계 로직 (백엔드 집계 API 부재로 직접 합산. 버그 위험 최상위 → 최우선 테스트 대상)

여기까지가 "가성비 80%" 구간.

### Phase 2 — 컴포넌트/훅 테스트 ✅ 진행 중

React Testing Library + MSW로 API를 모킹. 공용 인프라는 `src/test/`에 둔다
(`server.ts` MSW 서버, `setup.ts` 라이프사이클·jsdom 폴리필, `renderHook.tsx`
QueryClient 래퍼). jsdom 환경, `restoreMocks: true`.

- ✅ `core/api/client.ts` — 성공 파싱, `ApiError` 정규화, 401 → 토큰 제거 + 로그아웃 이벤트, 에러 envelope, 네트워크 실패, Authorization 헤더 (MSW)
- ✅ `lib/notifyError.ts` — 401 무시 / 메시지 / 폴백 분기
- ✅ react-query 훅 — `useTeams`(`useAuth` mock), `useMatches`/`useQuarters`/`useRecords`: 쿼리 성공·파라미터·비활성 게이팅, 뮤테이션(POST body 병합·invalidation), 삭제(`removeQueries` 캐시 제거), `useUpcomingMatches`(파라미터), `usePastMatchesInfinite`(`hasNextPage` 경계)
- ✅ 폼 모달 — `TeamFormModal`(검증·trim·제출), `PlayerFormModal`(이름 필수·기본 포지션 제출), `RecordFormModal`(Stepper 증가·풀타임·빈 선수 비활성), `MatchFormModal`(상대팀 검증·생성 시 API 날짜 포맷·수정 PUT), `QuarterFormModal`(0/빈 시간 거부·기본 25분 생성)
- ✅ 디자인 시스템 컴포넌트 — `Select`(클릭/키보드 선택·`onChange`·`aria-selected`), `DatePicker`(달력 열기·날짜 선택·라벨 포맷·min/max 비활성), `DateTimePicker`(날짜 선택 시 시간 유지·시/분 변경·off-step 분 스냅)
- ⬜ 남은 후보: 페이지 단위 통합 테스트(라우팅 포함), 나머지 디자인 시스템 컴포넌트(`Stepper`·`TextField`·`Modal` 등 단순 컴포넌트)

> 알려진 갭: `PlayerFormModal`의 등번호 비정수/음수 검증은 controlled `<input type="number">`의
> 중간값 정규화(jsdom) 때문에 UI로 결정적 재현이 어려워 보류. 검증 로직을 순수 함수로
> 추출하면 단위 테스트로 덮을 수 있음(후속).

### Phase 3 — E2E 핵심 플로우 (예정, 백엔드 필요)

Playwright로 실제 사용자 시나리오를 "스모크"로 소수만 유지.

- 로그인 → 팀 생성 → 경기 추가 → 쿼터/기록 입력 → 통계 화면 확인

E2E는 느리고 깨지기 쉬우므로 핵심 happy path만 유지한다.

## 컨벤션

- 테스트 파일은 대상 옆에 `*.test.ts` / `*.test.tsx`로 둔다.
- 순수 로직은 `environment: node`로 충분. DOM이 필요한 테스트만 `jsdom`.
- 날짜 포맷(`formatMatchDate` 등 `Intl` 기반)은 머신 타임존 의존이라 정확한 문자열 단언을 피하고 라운드트립·불변식 위주로 검증한다.
