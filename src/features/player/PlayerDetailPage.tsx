import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import AppHeader from "../../components/AppHeader/AppHeader";
import Button from "../../components/Button/Button";
import DateRangeFilter from "../../components/DateRangeFilter/DateRangeFilter";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import StatTile from "../../components/StatTile/StatTile";
import { ErrorView, LoadingView } from "../../components/StateView/StateView";
import { ageFrom, today, yearStartKey } from "../../lib/date";
import { playerInbodiesSorted } from "../../lib/inbody";
import type { PlayerTrainingStats } from "../../lib/training";
import { useTeam } from "../team/useTeams";
import PlayerMatchLogList from "../stats/PlayerMatchLogList";
import PlayerInjuryList from "../stats/PlayerInjuryList";
import { useDeletePlayer, usePlayers } from "./usePlayers";
import { useInbodies } from "./useInbodies";
import { usePlayerStats } from "./usePlayerStats";
import InbodySection from "./InbodySection";
import PlayerFormModal from "./PlayerFormModal";
import TeamRankCard from "./TeamRankCard";
import styles from "./PlayerDetailPage.module.css";

/** 기본 집계 기간 = 올해(1월 1일 ~ 오늘). 통계 탭의 "이번 달"과 달리 한 선수를 길게 본다. */
function thisYearRange() {
  return { start: yearStartKey(new Date()), end: today() };
}

const perGame = (value: number, games: number) => (games > 0 ? value / games : 0);

/**
 * 선수 상세 — fotmob 선수 페이지의 3단 패턴(요약 타일 → 경기별 기록 → 팀 내 순위)에
 * 부상 이력·훈련 참석·인바디를 더한 화면. 통계는 서버 집계(GET /player/:id/stats)
 * 한 번으로 받는다 — 요약·스쿼드·경기별 기록·부상 이력·훈련 참석이 모두 들어 있다.
 */
export default function PlayerDetailPage() {
  const { teamId, playerId } = useParams();
  const tId = Number(teamId);
  const pId = Number(playerId);
  const navigate = useNavigate();

  const team = useTeam(tId);
  const players = usePlayers(tId);
  const inbodies = useInbodies(tId);
  const del = useDeletePlayer(tId);
  const [editOpen, setEditOpen] = useState(false);
  const [range, setRange] = useState(thisYearRange);
  const filtered = !!range.start || !!range.end;

  const stats = usePlayerStats(pId, range);
  const data = stats.data;

  const player = players.data?.find((p) => p.id === pId);
  const stat = data?.summary;

  const latestInbody = useMemo(
    () => playerInbodiesSorted(inbodies.data ?? [], pId)[0],
    [inbodies.data, pId],
  );

  // 팀 내 위치의 참석률 행 — 서버가 스쿼드 전원의 참석 집계를 함께 내려준다.
  // 기간 내 열린 훈련이 없으면 training 이 null 이라 행을 붙이지 않는다.
  const trainingByPlayer = useMemo(() => {
    if (!data || !data.summary.training) return undefined;
    const map = new Map<number, PlayerTrainingStats>();
    for (const p of data.squad) if (p.training) map.set(p.id, p.training);
    return map;
  }, [data]);
  const myTraining = data?.summary.training ?? undefined;

  async function onDelete() {
    if (!player) return;
    if (!confirm(`'${player.name}' 선수를 삭제할까요?`)) return;
    await del.mutateAsync(pId);
    navigate(`/teams/${tId}/squad`, { replace: true });
  }

  const games = stat?.games ?? 0;
  const goal = stat?.goal ?? 0;
  const assist = stat?.assist ?? 0;
  const min = stat?.min ?? 0;

  return (
    <div className={styles.page}>
      <AppHeader
        title={player?.name ?? "선수"}
        subtitle={team.data?.name}
        back={`/teams/${tId}/squad`}
        actions={
          player ? (
            <>
              <button
                className={styles.headerBtn}
                onClick={() => setEditOpen(true)}
                aria-label="선수 수정"
              >
                <Pencil size={18} />
              </button>
              <button
                className={styles.headerBtnDanger}
                onClick={onDelete}
                disabled={del.isPending}
                aria-label="선수 삭제"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : undefined
        }
      />

      <main className={styles.content}>
        {players.isLoading && <LoadingView />}
        {players.isError && (
          <ErrorView
            message="선수를 불러오지 못했습니다."
            onRetry={() => players.refetch()}
          />
        )}
        {!players.isLoading && !players.isError && !player && (
          <ErrorView message="선수를 찾을 수 없습니다." />
        )}

        {player && (
          <div className={styles.layout}>
            {/* 프로필 — fotmob 히어로 헤더 + 팩트 그리드를 한 줄로 압축 */}
            <section className={styles.profile}>
              <PlayerAvatar
                number={player.number}
                position={player.position}
                size={72}
              />
              <div className={styles.profileText}>
                <h2 className={styles.name}>{player.name}</h2>
                <div className={styles.meta}>
                  <span className={styles.number}>#{player.number}</span>
                  <PosChip position={player.position} />
                </div>
                <div className={styles.facts}>
                  {player.birthdate && (
                    <span>
                      {player.birthdate.replace(/-/g, ".")}
                      {ageFrom(player.birthdate) !== null &&
                        ` (만 ${ageFrom(player.birthdate)}세)`}
                    </span>
                  )}
                  {latestInbody && (latestInbody.height > 0 || latestInbody.weight > 0) && (
                    <span>
                      {latestInbody.height > 0 && `${latestInbody.height}cm`}
                      {latestInbody.height > 0 && latestInbody.weight > 0 && " · "}
                      {latestInbody.weight > 0 && `${latestInbody.weight}kg`}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <div className={styles.filter}>
              <DateRangeFilter start={range.start} end={range.end} onChange={setRange} />
              <span className={styles.filterHint}>
                {filtered ? "선택 기간 집계" : "전체 기간 집계"}
              </span>
            </div>

            <div className={styles.main}>
              <div className={styles.tiles}>
                {stats.isLoading ? (
                  <LoadingView label="통계 집계 중…" />
                ) : stats.isError ? (
                  <ErrorView
                    message="선수 통계를 불러오지 못했습니다."
                    onRetry={() => stats.refetch()}
                  />
                ) : (
                  <>
                    {filtered && data?.matchCount === 0 && (
                      <div className={styles.noMatches}>
                        <span>이 기간에 경기가 없습니다.</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                          onClick={() => setRange({ start: "", end: "" })}
                        >
                          전체 기간 보기
                        </Button>
                      </div>
                    )}
                    {/* 요약 타일 8개 — fotmob 시즌 요약 카드 미러 */}
                    <div className={styles.grid}>
                      <StatTile label="경기" value={games} />
                      <StatTile
                        label="골"
                        value={goal}
                        sub={`경기당 ${perGame(goal, games).toFixed(2)}`}
                      />
                      <StatTile
                        label="도움"
                        value={assist}
                        sub={`경기당 ${perGame(assist, games).toFixed(2)}`}
                      />
                      <StatTile
                        label="출전(분)"
                        value={min}
                        sub={`경기당 ${Math.round(perGame(min, games))}′`}
                      />
                      <StatTile label="경고" value={stat?.yellow ?? 0} sub="🟨" />
                      <StatTile label="퇴장" value={stat?.red ?? 0} sub="🟥" />
                      <StatTile label="공격P" value={goal + assist} sub="골+도움" />
                      <StatTile label="결장" value={stat?.absentGames ?? 0} sub="부상" />
                    </div>
                  </>
                )}
              </div>

              {data && (
                <section className={styles.log}>
                  <h3 className={styles.sectionTitle}>경기별 기록</h3>
                  <PlayerMatchLogList
                    logs={data.matches}
                    matchHref={(id) => `/teams/${tId}/matches/${id}`}
                  />
                </section>
              )}

              <div className={styles.inbody}>
                <InbodySection teamId={tId} playerId={pId} />
              </div>
            </div>

            {data && (
              <div className={styles.aside}>
                <div className={styles.rank}>
                  <TeamRankCard
                    playerId={pId}
                    players={data.squad}
                    training={trainingByPlayer}
                  />
                </div>

                <section className={styles.injury}>
                  <h3 className={styles.sectionTitle}>부상 이력</h3>
                  <div className={styles.sideCard}>
                    <PlayerInjuryList injuries={data.injuries} />
                  </div>
                </section>

                <section className={styles.training}>
                  <h3 className={styles.sectionTitle}>훈련 참석</h3>
                  {myTraining ? (
                    <div className={styles.trainingGrid}>
                      <StatTile
                        label="참석"
                        value={`${myTraining.attended}/${myTraining.held}`}
                        sub="회"
                      />
                      <StatTile label="참석률" value={`${myTraining.rate}%`} />
                      <StatTile label="훈련 시간" value={myTraining.totalMin} sub="분" />
                    </div>
                  ) : (
                    <div className={styles.sideCard}>
                      <p className={styles.emptyText}>
                        {filtered ? "이 기간에 훈련이 없습니다" : "훈련 기록이 없습니다"}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {editOpen && player && (
        <PlayerFormModal
          teamId={tId}
          player={player}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
