import { useOutletContext } from "react-router-dom";
import type { Team } from "../../core/api/types";

/** 통계·리포트 탭이 공유하는 조회 기간 ("YYYY-MM-DD", 빈 문자열 = 전체). */
export interface StatsRange {
  start: string;
  end: string;
}

export interface TeamOutletContext {
  team: Team;
  /** 통계·리포트 탭 공유 기간 — 한 탭에서 바꾸면 다른 탭도 따라간다. */
  statsRange: StatsRange;
  setStatsRange: (range: StatsRange) => void;
}

/** Access the current team provided by TeamDetailLayout's <Outlet>. */
export function useTeamContext(): TeamOutletContext {
  return useOutletContext<TeamOutletContext>();
}
