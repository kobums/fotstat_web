import { useQuery } from "@tanstack/react-query";
import { playerApi } from "../../core/api/endpoints";
import { qk } from "../../lib/queryKeys";

export interface PlayerStatsRange {
  /** "YYYY-MM-DD" inclusive, or "" for open. */
  start: string;
  end: string;
}

/**
 * 선수 상세 통계 — 서버 집계(GET /player/:id/stats).
 * 경기·기록·부상·훈련은 다른 화면의 뮤테이션이 이 키를 무효화하지 않으므로
 * staleTime 0 으로 두어 상세 화면에 들어올 때마다 새로 받는다.
 */
export function usePlayerStats(playerId: number, range: PlayerStatsRange) {
  return useQuery({
    queryKey: qk.playerStats(playerId, range.start, range.end),
    queryFn: ({ signal }) => playerApi.stats(playerId, range.start, range.end, signal),
    enabled: playerId > 0,
    staleTime: 0,
  });
}
