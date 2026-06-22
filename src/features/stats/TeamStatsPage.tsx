import { useMemo, useState } from "react";
import DateRangeFilter from "../../components/DateRangeFilter/DateRangeFilter";
import StatTile from "../../components/StatTile/StatTile";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "../../components/StateView/StateView";
import { dayKey, monthStartKey } from "../../lib/date";
import { useTeamContext } from "../team/teamContext";
import { useTeamStats, type PlayerStat } from "./useTeamStats";
import RankingList from "./RankingList";
import PlayerStatDetail from "./PlayerStatDetail";
import PlayerCompare from "./PlayerCompare";
import CompareTile from "./CompareTile";
import styles from "./TeamStatsPage.module.css";

const avg = (total: number, games: number) => (games > 0 ? total / games : 0);
const fmt1 = (n: number) => n.toFixed(1);
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export default function TeamStatsPage() {
  const { team } = useTeamContext();
  // Default to this month (1st → today), like the app. "초기화" clears to all-time.
  const [range, setRange] = useState(() => {
    const now = new Date();
    return { start: monthStartKey(now), end: dayKey(now) };
  });
  const [selected, setSelected] = useState<PlayerStat | null>(null);
  const filtered = !!range.start || !!range.end;

  const stats = useTeamStats(team.id, range);

  // Previous period of equal length, immediately before the current range.
  const prevRange = useMemo(() => {
    if (!range.start || !range.end) return null;
    const s = new Date(`${range.start}T00:00:00`);
    const e = new Date(`${range.end}T00:00:00`);
    const days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
    const pe = new Date(s);
    pe.setDate(pe.getDate() - 1);
    const ps = new Date(pe);
    ps.setDate(ps.getDate() - (days - 1));
    return { start: dayKey(ps), end: dayKey(pe) };
  }, [range.start, range.end]);

  const prevStats = useTeamStats(team.id, prevRange ?? { start: "", end: "" });
  const showCompare =
    !!prevRange && !prevStats.isLoading && prevStats.matchCount > 0;

  // Squad average (mean of each player's per-game contribution).
  const squadAvg = useMemo(() => {
    const withGames = stats.players.filter((p) => p.games > 0);
    if (withGames.length === 0) return { goalPerGame: 0, assistPerGame: 0 };
    const g =
      withGames.reduce((s, p) => s + p.goal / p.games, 0) / withGames.length;
    const a =
      withGames.reduce((s, p) => s + p.assist / p.games, 0) / withGames.length;
    return { goalPerGame: g, assistPerGame: a };
  }, [stats.players]);

  const mc = stats.matchCount;
  const goalDiff = stats.totalGoal - stats.totalConceded;

  return (
    <div className={styles.wrap}>
      <DateRangeFilter start={range.start} end={range.end} onChange={setRange} />

      {stats.isLoading ? (
        <LoadingView label="통계 집계 중…" />
      ) : stats.isError ? (
        <ErrorView message="통계를 불러오지 못했습니다." />
      ) : stats.matchCount === 0 ? (
        <EmptyView
          title={filtered ? "해당 기간 경기가 없습니다" : "집계할 경기가 없습니다"}
          description={
            filtered ? "다른 기간을 선택해보세요." : "쿼터와 기록을 추가하면 통계가 표시됩니다."
          }
        />
      ) : (
        <>
          <div className={styles.tiles}>
            <StatTile label="경기" value={mc} />
            <StatTile
              label="전적"
              value={`${stats.wins}-${stats.draws}-${stats.losses}`}
              sub="승-무-패"
            />
            <StatTile label="득점" value={stats.totalGoal} />
            <StatTile label="실점" value={stats.totalConceded} />
            <StatTile label="도움" value={stats.totalAssist} />
            <StatTile label="득실차" value={signed(goalDiff)} />
          </div>

          <section>
            <h3 className={styles.heading}>경기당 평균</h3>
            <div className={styles.tiles}>
              <StatTile label="득점" value={fmt1(avg(stats.totalGoal, mc))} sub="경기당" />
              <StatTile label="실점" value={fmt1(avg(stats.totalConceded, mc))} sub="경기당" />
              <StatTile label="도움" value={fmt1(avg(stats.totalAssist, mc))} sub="경기당" />
              <StatTile label="득실차" value={fmt1(avg(goalDiff, mc))} sub="경기당" />
            </div>
          </section>

          {showCompare && (
            <section>
              <h3 className={styles.heading}>이전 기간 대비</h3>
              <div className={styles.tiles}>
                <CompareTile
                  label="득점"
                  value={stats.totalGoal}
                  delta={stats.totalGoal - prevStats.totalGoal}
                />
                <CompareTile
                  label="실점"
                  value={stats.totalConceded}
                  delta={stats.totalConceded - prevStats.totalConceded}
                  goodWhenUp={false}
                />
                <CompareTile
                  label="도움"
                  value={stats.totalAssist}
                  delta={stats.totalAssist - prevStats.totalAssist}
                />
              </div>
            </section>
          )}

          <PlayerCompare players={stats.players} />

          <div className={styles.rankings}>
            <RankingList
              title="득점 순위"
              metric="goal"
              players={stats.players}
              onSelect={setSelected}
            />
            <RankingList
              title="도움 순위"
              metric="assist"
              players={stats.players}
              onSelect={setSelected}
            />
            <RankingList
              title="출전 시간"
              metric="min"
              unit="′"
              players={stats.players}
              onSelect={setSelected}
            />
          </div>
        </>
      )}

      {selected && (
        <PlayerStatDetail
          stat={selected}
          squadAvg={squadAvg}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
