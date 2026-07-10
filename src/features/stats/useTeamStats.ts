import { useMemo } from "react";
import type { Injury, Match, MatchRecord, Quarter } from "../../core/api/types";
import { parseMatchDate } from "../../lib/date";
import { usePlayers } from "../player/usePlayers";
import { useMatches } from "../match/useMatches";
import { useQuarterRecords } from "../match/useQuarterRecords";
import { useInjuries } from "../team/useInjuries";
import { aggregateTeamStats } from "./aggregateTeamStats";
import type { PlayerStat } from "./aggregateTeamStats";

export type { PlayerStat } from "./aggregateTeamStats";

export interface DateRange {
  /** "YYYY-MM-DD" inclusive start, or "" for open. */
  start?: string;
  /** "YYYY-MM-DD" inclusive end, or "" for open. */
  end?: string;
}

export interface TeamStatsResult {
  isLoading: boolean;
  isError: boolean;
  matchCount: number;
  totalGoal: number;
  totalConceded: number;
  totalAssist: number;
  wins: number;
  draws: number;
  losses: number;
  players: PlayerStat[];
  /** 집계에 쓰인 원본 — 리포트 화면의 경기별 쿼터 결과 등 추가 가공용. */
  matches: Match[];
  quarters: Quarter[];
  records: MatchRecord[];
  injuries: Injury[];
}

// Client-side aggregation: the backend exposes no stats endpoint, so we walk
// matches -> quarters -> records and roll the numbers up here.
export function useTeamStats(
  teamId: number,
  range?: DateRange,
): TeamStatsResult {
  const players = usePlayers(teamId);
  const matches = useMatches(teamId);
  const injuries = useInjuries(teamId);
  const start = range?.start ?? "";
  const end = range?.end ?? "";

  // Only aggregate matches whose date falls within the (inclusive) range.
  const matchList = useMemo(() => {
    let list = matches.data ?? [];
    if (start) {
      const s = new Date(`${start}T00:00:00`);
      list = list.filter((m) => {
        const d = parseMatchDate(m.matchdate);
        return d !== null && d >= s;
      });
    }
    if (end) {
      const e = new Date(`${end}T23:59:59`);
      list = list.filter((m) => {
        const d = parseMatchDate(m.matchdate);
        return d !== null && d <= e;
      });
    }
    return list;
  }, [matches.data, start, end]);

  // Shared fan-out (quarters -> records). `combineLists` keeps `.data`
  // referentially stable across renders, letting the aggregate useMemo below
  // actually memoize.
  const { quarters: allQuarters, records, isLoading: qrLoading, isError: qrError } =
    useQuarterRecords(matchList);

  const isLoading =
    players.isLoading || matches.isLoading || injuries.isLoading || qrLoading;
  const isError =
    players.isError || matches.isError || injuries.isError || qrError;

  const aggregate = useMemo(
    () =>
      aggregateTeamStats(
        allQuarters,
        records,
        players.data ?? [],
        injuries.data ?? [],
        matchList,
      ),
    [allQuarters, records, players.data, injuries.data, matchList],
  );

  return {
    isLoading,
    isError,
    ...aggregate,
    matches: matchList,
    quarters: allQuarters,
    records,
    injuries: injuries.data ?? [],
  };
}
