import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Button from "../../components/Button/Button";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import PosChip from "../../components/PosChip/PosChip";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "../../components/StateView/StateView";
import { POSITION_GROUPS, positionGroup } from "../../lib/position";
import { useTeamContext } from "../team/teamContext";
import { usePlayers } from "./usePlayers";
import PlayerFormModal from "./PlayerFormModal";
import styles from "./SquadPage.module.css";

export default function SquadPage() {
  const { team } = useTeamContext();
  const { data: players, isLoading, isError, refetch } = usePlayers(team.id);
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const grouped = useMemo(() => {
    const list = players ?? [];
    return POSITION_GROUPS.map((g) => ({
      ...g,
      players: list
        .filter((p) => positionGroup(p.position) === g.key)
        .sort((a, b) => a.number - b.number),
    })).filter((g) => g.players.length > 0);
  }, [players]);

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {players ? `선수 ${players.length}명` : " "}
        </span>
        <Button size="sm" fullWidth={false} onClick={() => setFormOpen(true)}>
          선수 추가
        </Button>
      </div>

      {isLoading && <LoadingView />}
      {isError && (
        <ErrorView message="선수를 불러오지 못했습니다." onRetry={refetch} />
      )}
      {players && players.length === 0 && (
        <EmptyView
          title="선수가 없습니다"
          description="선수를 추가해 스쿼드를 구성하세요."
        />
      )}
      {grouped.map((g) => (
        <section key={g.key} className={styles.group}>
          <h3 className={styles.groupTitle}>
            {g.label}
            <span className={styles.groupCount}>{g.players.length}</span>
          </h3>
          <ul className={styles.list}>
            {g.players.map((p) => (
              <li key={p.id} className={styles.row}>
                <button
                  className={styles.rowMain}
                  onClick={() =>
                    navigate(`/teams/${team.id}/players/${p.id}`)
                  }
                >
                  <PlayerAvatar
                    number={p.number}
                    position={p.position}
                    size={42}
                  />
                  <div className={styles.info}>
                    <span className={styles.name}>{p.name}</span>
                    <PosChip position={p.position} />
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {formOpen && (
        <PlayerFormModal
          teamId={team.id}
          player={null}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
