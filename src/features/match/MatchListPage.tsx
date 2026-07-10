import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import { EmptyView, StatusView } from "../../components/StateView/StateView";
import { toApiDateSeconds } from "../../lib/date";
import { useTeamContext } from "../team/teamContext";
import { usePastMatchesInfinite, useUpcomingMatches } from "./useMatches";
import { useMatchResultsFor } from "./useMatchResults";
import MatchFormModal from "./MatchFormModal";
import MatchRowList from "./MatchRowList";
import styles from "./MatchListPage.module.css";

export default function MatchListPage() {
  const { team } = useTeamContext();
  const nowApi = useMemo(() => toApiDateSeconds(new Date()), []);
  const upcoming = useUpcomingMatches(team.id, nowApi);
  const past = usePastMatchesInfinite(team.id, nowApi);
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const upcomingList = upcoming.data ?? [];
  const pastList = useMemo(
    () => past.data?.pages.flatMap((p) => p.matches) ?? [],
    [past.data],
  );
  // 결과(점수)는 화면에 실제 렌더링되는 지난 경기만 대상으로 집계
  const { results } = useMatchResultsFor(pastList);

  const isLoading = upcoming.isLoading || past.isLoading;
  const isError = upcoming.isError || past.isError;
  const isEmpty =
    !isLoading && !isError && upcomingList.length === 0 && pastList.length === 0;

  // Edit/delete live on the match detail page; rows just open the match.
  const openMatch = (id: number) => navigate(`/teams/${team.id}/matches/${id}`);

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>경기</span>
        <Button size="sm" fullWidth={false} onClick={() => setFormOpen(true)}>
          경기 추가
        </Button>
      </div>

      <StatusView
        isLoading={isLoading}
        isError={isError}
        errorMessage="경기를 불러오지 못했습니다."
        onRetry={() => {
          upcoming.refetch();
          past.refetch();
        }}
        isEmpty={isEmpty}
        empty={
          <EmptyView
            title="경기가 없습니다"
            description="경기를 추가하고 쿼터별 기록을 남겨보세요."
          />
        }
      />

      {upcomingList.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>예정된 경기</h3>
          <MatchRowList matches={upcomingList} onSelect={openMatch} />
        </section>
      )}
      {pastList.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>지난 경기</h3>
          <MatchRowList matches={pastList} results={results} onSelect={openMatch} />
          {past.hasNextPage && (
            <button
              className={styles.more}
              onClick={() => past.fetchNextPage()}
              disabled={past.isFetchingNextPage}
            >
              {past.isFetchingNextPage ? "불러오는 중…" : "더 보기"}
            </button>
          )}
        </section>
      )}

      {formOpen && (
        <MatchFormModal
          teamId={team.id}
          match={null}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
