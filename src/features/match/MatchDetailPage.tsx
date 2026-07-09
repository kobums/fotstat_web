import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import AppHeader from "../../components/AppHeader/AppHeader";
import Button from "../../components/Button/Button";
import ResultPill from "../../components/ResultPill/ResultPill";
import { resultOf } from "../../lib/matchResult";
import { sumGoals } from "../../lib/records";
import {
  ErrorView,
  LoadingView,
} from "../../components/StateView/StateView";
import { recordApi } from "../../core/api/endpoints";
import type { MatchRecord } from "../../core/api/types";
import { qk } from "../../lib/queryKeys";
import { dayOf, formatMatchDate, today } from "../../lib/date";
import { injuredPlayerIdsOn } from "../../lib/injury";
import { usePlayers } from "../player/usePlayers";
import InjuryFormModal from "../team/InjuryFormModal";
import { useInjuries } from "../team/useInjuries";
import { useTeam } from "../team/useTeams";
import { useDeleteMatch, useMatch } from "./useMatches";
import { useQuarters } from "./useQuarters";
import MatchFormModal from "./MatchFormModal";
import QuarterSection from "./QuarterSection";
import QuarterFormModal from "./QuarterFormModal";
import styles from "./MatchDetailPage.module.css";

export default function MatchDetailPage() {
  const { teamId, matchId } = useParams();
  const tId = Number(teamId);
  const mId = Number(matchId);

  const navigate = useNavigate();
  const match = useMatch(mId);
  const team = useTeam(tId);
  const players = usePlayers(tId);
  const quarters = useQuarters(mId);
  const injuries = useInjuries(tId);
  const del = useDeleteMatch(tId);

  // 이 경기일에 부상 중인 선수 — 기록 입력에서 제외한다.
  const injuredPlayerIds = useMemo(
    () => injuredPlayerIdsOn(injuries.data ?? [], match.data?.matchdate ?? ""),
    [injuries.data, match.data?.matchdate],
  );
  const [quarterFormOpen, setQuarterFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [injuryFormOpen, setInjuryFormOpen] = useState(false);

  async function onDelete() {
    if (!match.data) return;
    if (
      !confirm(
        `${match.data.awayname}와의 경기를 삭제할까요? 기록도 함께 삭제됩니다.`,
      )
    )
      return;
    await del.mutateAsync(mId);
    navigate(`/teams/${tId}/matches`, { replace: true });
  }

  const quarterList = useMemo(
    () => (quarters.data ? [...quarters.data].sort((a, b) => a.number - b.number) : []),
    [quarters.data],
  );

  // One records query per quarter; shares cache keys with QuarterSection.
  const recordQueries = useQueries({
    queries: quarterList.map((q) => ({
      queryKey: qk.records(q.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        recordApi.list(q.id, signal),
      enabled: q.id > 0,
    })),
  });

  const recordsByQuarter = useMemo(() => {
    const map = new Map<number, MatchRecord[]>();
    quarterList.forEach((q, i) => {
      map.set(q.id, recordQueries[i]?.data ?? []);
    });
    return map;
  }, [quarterList, recordQueries]);

  const homeTotal = useMemo(
    () => sumGoals(Array.from(recordsByQuarter.values()).flat()),
    [recordsByQuarter],
  );
  const awayTotal = useMemo(
    () => quarterList.reduce((s, q) => s + q.awaygoals, 0),
    [quarterList],
  );

  // injuries가 빠지면 로딩 중 잠깐 부상 선수가 선택 가능해 보이고, 실패해도 무음이 된다
  const loading =
    match.isLoading || players.isLoading || quarters.isLoading || injuries.isLoading;
  const error =
    match.isError || players.isError || quarters.isError || injuries.isError;

  return (
    <div className={styles.page}>
      <AppHeader
        title={match.data ? `vs ${match.data.awayname}` : "경기"}
        subtitle={match.data ? formatMatchDate(match.data.matchdate) : undefined}
        back={`/teams/${tId}/matches`}
        actions={
          match.data ? (
            <>
              <button
                className={styles.headerBtn}
                onClick={() => setEditOpen(true)}
                aria-label="경기 수정"
              >
                <Pencil size={18} />
              </button>
              <button
                className={styles.headerBtnDanger}
                onClick={onDelete}
                disabled={del.isPending}
                aria-label="경기 삭제"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : undefined
        }
      />

      <main className={styles.content}>
        {loading && <LoadingView />}
        {error && (
          <ErrorView
            message="경기 정보를 불러오지 못했습니다."
            onRetry={() => {
              match.refetch();
              quarters.refetch();
              players.refetch();
            }}
          />
        )}

        {!loading && !error && match.data && (
          <>
            <section className={styles.scoreboard}>
              <div className={styles.team}>
                <span className={styles.teamName}>우리팀</span>
                <span className={styles.goals}>{homeTotal}</span>
              </div>
              {quarterList.length > 0 && (
                <ResultPill result={resultOf(homeTotal, awayTotal)} size={28} />
              )}
              <div className={styles.team}>
                <span className={styles.teamName}>{match.data.awayname}</span>
                <span className={styles.goals}>{awayTotal}</span>
              </div>
            </section>

            <div className={styles.quarters}>
              {quarterList.map((q) => (
                <QuarterSection
                  key={q.id}
                  matchId={mId}
                  quarter={q}
                  records={recordsByQuarter.get(q.id) ?? []}
                  players={players.data ?? []}
                  injuredPlayerIds={injuredPlayerIds}
                  onRegisterInjury={() => setInjuryFormOpen(true)}
                />
              ))}
            </div>

            <Button variant="secondary" onClick={() => setQuarterFormOpen(true)}>
              쿼터 추가
            </Button>
          </>
        )}
      </main>

      {quarterFormOpen && (
        <QuarterFormModal
          matchId={mId}
          nextNumber={
            quarterList.reduce((max, q) => Math.max(max, q.number), 0) + 1
          }
          // 이전 쿼터 시간 > 팀 기본 시간 > 45분
          defaultDuration={
            quarterList[quarterList.length - 1]?.duration ??
            team.data?.duration ??
            45
          }
          onClose={() => setQuarterFormOpen(false)}
        />
      )}

      {editOpen && match.data && (
        <MatchFormModal
          teamId={tId}
          match={match.data}
          onClose={() => setEditOpen(false)}
        />
      )}

      {injuryFormOpen && match.data && (
        <InjuryFormModal
          teamId={tId}
          players={players.data ?? []}
          injuredPlayerIds={injuredPlayerIds}
          defaultStartdate={
            // 발생일 = 경기일 프리필. 미래(예정) 경기는 오늘로 clamp
            [dayOf(match.data.matchdate), today()].sort()[0]
          }
          onClose={() => setInjuryFormOpen(false)}
        />
      )}
    </div>
  );
}
