import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar";
import { EmptyView, StatusView } from "../../components/StateView/StateView";
import type { Injury } from "../../core/api/types";
import { dayOf, today } from "../../lib/date";
import {
  absentGamesForInjury,
  activeInjuriesSorted,
  pastInjuriesSorted,
} from "../../lib/injury";
import { notifyError } from "../../lib/notifyError";
import { useMatches } from "../match/useMatches";
import { usePlayers } from "../player/usePlayers";
import { useFormModalState } from "../shared/useFormModalState";
import { useTeamContext } from "./teamContext";
import { useInjuries, useUpdateInjury } from "./useInjuries";
import InjuryFormModal from "./InjuryFormModal";
import styles from "./InjuriesPage.module.css";

/** 부상 관리 페이지 — 등록·수정·복귀 처리와 과거 부상 이력을 한곳에서 다룬다. */
export default function InjuriesPage() {
  const { team } = useTeamContext();
  const { data: players } = usePlayers(team.id);
  const { data: matches } = useMatches(team.id);
  const { data: injuries, isLoading, isError, refetch } = useInjuries(team.id);
  const update = useUpdateInjury(team.id);
  const form = useFormModalState<Injury>();

  const playerList = useMemo(() => players ?? [], [players]);
  const matchList = useMemo(() => matches ?? [], [matches]);
  const playerMap = useMemo(
    () => new Map(playerList.map((p) => [p.id, p])),
    [playerList],
  );

  const active = useMemo(() => activeInjuriesSorted(injuries ?? []), [injuries]);
  const past = useMemo(() => pastInjuriesSorted(injuries ?? []), [injuries]);

  // 홈 부상자 명단에서 ?injury=<id>로 진입하면 해당 부상 수정 모달을 바로 연다.
  // state 대신 URL에서 파생하고, 닫을 때 파라미터를 지워 다시 열리지 않게 한다(TrainingsPage와 동일).
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkId = Number(searchParams.get("injury"));
  const deepLinkInjury = deepLinkId
    ? ((injuries ?? []).find((i) => i.id === deepLinkId) ?? null)
    : null;
  const formOpen = form.open || !!deepLinkInjury;
  const editingInjury = form.open ? form.editing : deepLinkInjury;
  const closeForm = () => {
    form.close();
    if (searchParams.has("injury")) {
      setSearchParams(
        (prev) => {
          prev.delete("injury");
          return prev;
        },
        { replace: true },
      );
    }
  };

  // 복귀 처리 — 복귀일을 오늘로 종료. 날짜를 바꾸려면 항목을 눌러 수정하면 된다.
  function endInjury(injury: Injury) {
    update.mutate(
      {
        id: injury.id,
        player: injury.player,
        type: injury.type ?? "",
        startdate: dayOf(injury.startdate),
        returndate: today(),
        memo: injury.memo ?? "",
      },
      { onError: notifyError("복귀 처리에 실패했습니다.") },
    );
  }

  function playerCell(injury: Injury) {
    const p = playerMap.get(injury.player);
    return (
      <>
        <PlayerAvatar number={p?.number ?? 0} position={p?.position} size={34} />
        <div className={styles.main}>
          <span className={styles.name}>{p?.name ?? "선수"}</span>
          {injury.type && <span className={styles.type}>{injury.type}</span>}
        </div>
      </>
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {injuries ? `부상 중 ${active.length}명` : " "}
        </span>
        <Button size="sm" fullWidth={false} onClick={form.openCreate}>
          부상 등록
        </Button>
      </div>

      <StatusView
        isLoading={isLoading}
        isError={isError}
        errorMessage="부상 기록을 불러오지 못했습니다."
        onRetry={refetch}
        isEmpty={!!injuries && injuries.length === 0}
        empty={
          <EmptyView
            title="부상 기록이 없습니다"
            description="선수가 다치면 등록해 기록 입력에서 자동으로 제외하세요."
          />
        }
      />

      {active.length > 0 && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>부상 중</h3>
          <div className={styles.list}>
            {active.map((injury) => (
              <div key={injury.id} className={styles.row}>
                <button
                  className={styles.rowMain}
                  onClick={() => form.openEdit(injury)}
                >
                  {playerCell(injury)}
                  <div className={styles.right}>
                    <span className={styles.absent}>
                      결장 {absentGamesForInjury(injury, matchList)}경기
                    </span>
                    {injury.startdate && (
                      <span className={styles.period}>
                        {dayOf(injury.startdate)}~
                      </span>
                    )}
                  </div>
                </button>
                <button
                  className={styles.end}
                  onClick={() => endInjury(injury)}
                  disabled={update.isPending && update.variables?.id === injury.id}
                  aria-label={`${playerMap.get(injury.player)?.name ?? "선수"} 복귀 처리`}
                >
                  복귀
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>지난 부상</h3>
          <div className={styles.list}>
            {past.map((injury) => (
              <div key={injury.id} className={styles.row}>
                <button
                  className={styles.rowMain}
                  onClick={() => form.openEdit(injury)}
                >
                  {playerCell(injury)}
                  <div className={styles.right}>
                    <span className={styles.absent}>
                      결장 {absentGamesForInjury(injury, matchList)}경기
                    </span>
                    <span className={styles.period}>
                      {dayOf(injury.startdate)}~{dayOf(injury.returndate)}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {formOpen && (
        <InjuryFormModal
          teamId={team.id}
          players={playerList}
          injuredPlayerIds={new Set(active.map((i) => i.player))}
          injury={editingInjury}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
