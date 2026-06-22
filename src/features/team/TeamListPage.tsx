import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader/AppHeader";
import Button from "../../components/Button/Button";
import Crest from "../../components/Crest/Crest";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "../../components/StateView/StateView";
import type { Team } from "../../core/api/types";
import { useDeleteTeam, useTeams } from "./useTeams";
import TeamFormModal from "./TeamFormModal";
import styles from "./TeamListPage.module.css";

export default function TeamListPage() {
  const { data: teams, isLoading, isError, refetch } = useTeams();
  const navigate = useNavigate();
  const del = useDeleteTeam();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(team: Team) {
    setEditing(team);
    setFormOpen(true);
  }
  async function onDelete(team: Team) {
    if (!confirm(`'${team.name}' 팀을 삭제할까요? 관련 데이터도 함께 삭제됩니다.`))
      return;
    await del.mutateAsync(team.id);
  }

  return (
    <div className={styles.page}>
      <AppHeader
        title="내 팀"
        actions={
          teams && teams.length > 0 ? (
            <Button size="sm" fullWidth={false} onClick={openCreate}>
              팀 추가
            </Button>
          ) : undefined
        }
      />

      <main className={styles.content}>
        {isLoading && <LoadingView />}
        {isError && (
          <ErrorView message="팀을 불러오지 못했습니다." onRetry={refetch} />
        )}
        {teams && teams.length === 0 && (
          <EmptyView
            title="아직 팀이 없습니다"
            description="첫 팀을 만들어 선수와 경기를 기록해보세요."
            action={
              <Button fullWidth={false} onClick={openCreate}>
                팀 만들기
              </Button>
            }
          />
        )}
        {teams && teams.length > 0 && (
          <ul className={styles.grid}>
            {teams.map((team) => (
              <li key={team.id} className={styles.card}>
                <button
                  className={styles.cardMain}
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  <Crest name={team.name} size={56} />
                  <span className={styles.cardName}>{team.name}</span>
                </button>
                <div className={styles.cardActions}>
                  <button className={styles.smallBtn} onClick={() => openEdit(team)}>
                    수정
                  </button>
                  <button
                    className={styles.smallBtnDanger}
                    onClick={() => onDelete(team)}
                    disabled={del.isPending}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {formOpen && (
        <TeamFormModal team={editing} onClose={() => setFormOpen(false)} />
      )}
    </div>
  );
}
