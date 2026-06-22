import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "../../components/StateView/StateView";
import type { Match } from "../../core/api/types";
import { formatMatchDate, toApiDateSeconds } from "../../lib/date";
import { useTeamContext } from "../team/teamContext";
import { usePastMatchesInfinite, useUpcomingMatches } from "./useMatches";
import MatchFormModal from "./MatchFormModal";
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

  const isLoading = upcoming.isLoading || past.isLoading;
  const isError = upcoming.isError || past.isError;
  const isEmpty =
    !isLoading && !isError && upcomingList.length === 0 && pastList.length === 0;

  // Edit/delete live on the match detail page; rows just open the match.
  const renderRow = (m: Match) => (
    <li key={m.id} className={styles.row}>
      <button
        className={styles.rowMain}
        onClick={() => navigate(`/teams/${team.id}/matches/${m.id}`)}
      >
        <div className={styles.rowText}>
          <span className={styles.away}>vs {m.awayname}</span>
          <span className={styles.date}>{formatMatchDate(m.matchdate)}</span>
        </div>
      </button>
    </li>
  );

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>경기</span>
        <Button size="sm" fullWidth={false} onClick={() => setFormOpen(true)}>
          경기 추가
        </Button>
      </div>

      {isLoading && <LoadingView />}
      {isError && (
        <ErrorView
          message="경기를 불러오지 못했습니다."
          onRetry={() => {
            upcoming.refetch();
            past.refetch();
          }}
        />
      )}
      {isEmpty && (
        <EmptyView
          title="경기가 없습니다"
          description="경기를 추가하고 쿼터별 기록을 남겨보세요."
        />
      )}

      {upcomingList.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>예정된 경기</h3>
          <ul className={styles.list}>{upcomingList.map(renderRow)}</ul>
        </section>
      )}
      {pastList.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>지난 경기</h3>
          <ul className={styles.list}>{pastList.map(renderRow)}</ul>
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
