import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import type { Match } from "../../core/api/types";
import { dayOf } from "../../lib/date";
import { absentGamesForInjury, activeInjuriesSorted } from "../../lib/injury";
import { usePlayers } from "../player/usePlayers";
import { useInjuries } from "./useInjuries";
import styles from "./InjuriesSection.module.css";

interface Props {
  teamId: number;
  matches: Match[];
}

/** 팀 홈 요약 — 현재 부상 중인 선수만 간략히 보여준다. 항목을 누르면 부상 탭의 해당 부상 수정으로 이동. */
export default function InjuriesSection({ teamId, matches }: Props) {
  const navigate = useNavigate();
  const { data: players } = usePlayers(teamId);
  const { data: injuries } = useInjuries(teamId);

  const playerMap = useMemo(
    () => new Map((players ?? []).map((p) => [p.id, p])),
    [players],
  );

  const active = useMemo(
    () => activeInjuriesSorted(injuries ?? []),
    [injuries],
  );

  // 부상자가 없으면 홈을 차지하지 않는다 — 관리는 부상 탭에서 항상 가능
  if (active.length === 0) return null;

  return (
    <section>
      <div className={styles.head}>
        <h3 className={styles.title}>부상자 명단</h3>
      </div>

      <div className={styles.list}>
        {active.map((injury) => {
          const p = playerMap.get(injury.player);
          return (
            <button
              key={injury.id}
              className={styles.row}
              onClick={() =>
                navigate(`/teams/${teamId}/injuries?injury=${injury.id}`)
              }
            >
              <PlayerAvatar
                number={p?.number ?? 0}
                position={p?.position}
                size={34}
              />
              <div className={styles.main}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{p?.name ?? "선수"}</span>
                  <span className={styles.badge}>부상</span>
                </div>
                {injury.type && (
                  <span className={styles.type}>{injury.type}</span>
                )}
              </div>
              <div className={styles.right}>
                <span className={styles.absent}>
                  결장 {absentGamesForInjury(injury, matches)}경기
                </span>
                {injury.startdate && (
                  <span className={styles.since}>{dayOf(injury.startdate)}~</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
