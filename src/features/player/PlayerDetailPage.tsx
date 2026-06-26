import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import AppHeader from "../../components/AppHeader/AppHeader";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import StatTile from "../../components/StatTile/StatTile";
import { ErrorView, LoadingView } from "../../components/StateView/StateView";
import { ageFrom } from "../../lib/date";
import { useTeamStats } from "../stats/useTeamStats";
import { useDeletePlayer, usePlayers } from "./usePlayers";
import PlayerFormModal from "./PlayerFormModal";
import styles from "./PlayerDetailPage.module.css";

export default function PlayerDetailPage() {
  const { teamId, playerId } = useParams();
  const tId = Number(teamId);
  const pId = Number(playerId);
  const navigate = useNavigate();

  const players = usePlayers(tId);
  const stats = useTeamStats(tId);
  const del = useDeletePlayer(tId);
  const [editOpen, setEditOpen] = useState(false);

  const player = players.data?.find((p) => p.id === pId);
  const stat = stats.players.find((p) => p.id === pId);
  const goalPg = stat && stat.games > 0 ? stat.goal / stat.games : 0;

  async function onDelete() {
    if (!player) return;
    if (!confirm(`'${player.name}' 선수를 삭제할까요?`)) return;
    await del.mutateAsync(pId);
    navigate(`/teams/${tId}/squad`, { replace: true });
  }

  return (
    <div className={styles.page}>
      <AppHeader
        title={player?.name ?? "선수"}
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
          <>
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
                {player.birthdate && (
                  <div className={styles.birth}>
                    {player.birthdate.replace(/-/g, ".")}
                    {ageFrom(player.birthdate) !== null &&
                      ` (만 ${ageFrom(player.birthdate)}세)`}
                  </div>
                )}
              </div>
            </section>

            {stats.isLoading ? (
              <LoadingView label="통계 집계 중…" />
            ) : (
              <div className={styles.grid}>
                <StatTile label="경기" value={stat?.games ?? 0} />
                <StatTile label="골" value={stat?.goal ?? 0} />
                <StatTile label="도움" value={stat?.assist ?? 0} />
                <StatTile label="출전(분)" value={stat?.min ?? 0} />
                <StatTile
                  label="공격P"
                  value={(stat?.goal ?? 0) + (stat?.assist ?? 0)}
                  sub="골+도움"
                />
                <StatTile label="경기당 골" value={goalPg.toFixed(2)} />
              </div>
            )}
          </>
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
