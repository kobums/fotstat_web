import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Crest from "../../components/Crest/Crest";
import DateRangeFilter from "../../components/DateRangeFilter/DateRangeFilter";
import ResultPill, { resultOf } from "../../components/ResultPill/ResultPill";
import StatTile from "../../components/StatTile/StatTile";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "../../components/StateView/StateView";
import { formatMatchDate } from "../../lib/date";
import { useTeamContext } from "../team/teamContext";
import { useTeamStats, type PlayerStat } from "./useTeamStats";
import { squadAverages } from "./aggregateTeamStats";
import { buildMatchReports } from "./buildMatchReports";
import RankingList from "./RankingList";
import PlayerStatDetail from "./PlayerStatDetail";
import MatchRecordDownload from "./MatchRecordDownload";
import styles from "./SeasonReportPage.module.css";

/** 원본 양식("6월 경기기록표")처럼 기간이 한 달 안이면 "M월 경기기록표"로. */
function recordSheetTitle(start?: string, end?: string): string {
  if (start && end && start.slice(0, 7) === end.slice(0, 7)) {
    return `${Number(start.slice(5, 7))}월 경기기록표`;
  }
  if (start || end) {
    const s = (start || "처음").replaceAll("-", ".");
    const e = (end || "오늘").replaceAll("-", ".");
    return `${s}~${e} 경기기록표`;
  }
  return "전체 경기기록표";
}

export default function SeasonReportPage() {
  // 기간은 통계 탭과 공유 (TeamDetailLayout 소유) — 한 탭에서 바꾸면 함께 바뀐다
  const { team, statsRange: range, setStatsRange: setRange } = useTeamContext();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlayerStat | null>(null);
  const filtered = !!range.start || !!range.end;

  const stats = useTeamStats(team.id, range);

  const reports = useMemo(
    () => buildMatchReports(stats.matches, stats.quarters, stats.records),
    [stats.matches, stats.quarters, stats.records],
  );

  const squadAvg = useMemo(() => squadAverages(stats.players), [stats.players]);

  const mc = stats.matchCount;
  const winRate = mc > 0 ? Math.round((stats.wins / mc) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <DateRangeFilter start={range.start} end={range.end} onChange={setRange} />
        <MatchRecordDownload
          teamId={team.id}
          teamName={team.name}
          start={range.start}
          end={range.end}
          title={recordSheetTitle(range.start, range.end)}
          disabled={stats.players.length === 0}
        />
      </div>

      {stats.isLoading ? (
        <LoadingView label="리포트 집계 중…" />
      ) : stats.isError ? (
        <ErrorView message="리포트를 불러오지 못했습니다." />
      ) : mc === 0 ? (
        <EmptyView
          title={filtered ? "해당 기간 경기가 없습니다" : "집계할 경기가 없습니다"}
          description={
            filtered
              ? "다른 기간을 선택해보세요."
              : "쿼터와 기록을 추가하면 리포트가 표시됩니다."
          }
        />
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.tiles}>
              <StatTile label="골" value={stats.totalGoal} sub={`${mc}경기`} />
              <StatTile label="도움" value={stats.totalAssist} sub="어시스트" />
              <StatTile
                label="승률"
                value={`${winRate}%`}
                sub={`W${stats.wins} D${stats.draws} L${stats.losses}`}
              />
            </div>

            <section>
              <h3 className={styles.heading}>경기 결과</h3>
              <div className={styles.matches}>
                {reports.map(({ match, home, away, quarters }) => (
                  <div key={match.id} className={styles.card}>
                    {/* stretched-link: 카드 전체를 덮는 투명 버튼 — table을
                        button 안에 넣지 않기 위한 접근성 패턴 */}
                    <button
                      className={styles.cardLink}
                      onClick={() =>
                        navigate(`/teams/${team.id}/matches/${match.id}`)
                      }
                      aria-label={`${team.name} ${home}:${away} ${match.awayname}, ${formatMatchDate(match.matchdate)}`}
                    />
                    <div className={styles.scoreboard}>
                      <span className={styles.side}>
                        <Crest name={team.name} size={36} />
                        <span className={styles.sideName}>{team.name}</span>
                      </span>
                      <span className={styles.scoreBlock}>
                        <span className={styles.score}>
                          {home}
                          <span className={styles.scoreSep}>:</span>
                          {away}
                        </span>
                        <ResultPill result={resultOf(home, away)} showLabel />
                      </span>
                      <span className={styles.side}>
                        <Crest name={match.awayname} size={36} />
                        <span className={styles.sideName}>{match.awayname}</span>
                      </span>
                    </div>
                    <span className={styles.matchDate}>
                      {formatMatchDate(match.matchdate)}
                    </span>

                    <table className={styles.quarterTable}>
                      <thead>
                        <tr>
                          <th scope="col">쿼터</th>
                          <th scope="col">홈</th>
                          <th scope="col">원정</th>
                          <th scope="col">시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarters.map((q) => (
                          <tr key={q.id}>
                            <td className={styles.qLabel}>Q{q.number}</td>
                            <td>{q.home}</td>
                            <td>{q.away}</td>
                            <td className={styles.qTime}>{q.duration}′</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.rankings} aria-label="순위">
            <RankingList
              title="득점 순위"
              metric="goal"
              players={stats.players}
              sub={(p) => `+${p.assist}A`}
              defaultExpanded
              onSelect={setSelected}
            />
            <RankingList
              title="출전 시간 순위"
              metric="min"
              unit="′"
              players={stats.players}
              sub={(p) => `${p.games}경기 ${p.goal}G ${p.assist}A`}
              defaultExpanded
              onSelect={setSelected}
            />
          </aside>
        </div>
      )}

      {selected && (
        <PlayerStatDetail
          stat={selected}
          squadAvg={squadAvg}
          allPlayers={stats.players}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
