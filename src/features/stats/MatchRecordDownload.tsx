import { useState } from "react";
import { Download } from "lucide-react";
import Button from "../../components/Button/Button";
import type { MatchRecord, Quarter } from "../../core/api/types";
import type { PlayerStat } from "./useTeamStats";
import { buildMatchRecordSheet, downloadBlob } from "./matchRecordSheet";

/** 리포트 탭에서 현재 집계를 원본 양식 그대로의 경기기록표 xlsx로 내려받는 버튼. */
export default function MatchRecordDownload({
  players,
  quarters,
  records,
  teamName,
  title,
}: {
  players: PlayerStat[];
  quarters: Quarter[];
  records: MatchRecord[];
  teamName: string;
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  const disabled = players.length === 0;

  const onClick = async () => {
    setBusy(true);
    try {
      // 원본 양식과 같은 로스터 순(등번호) 정렬.
      const roster = players
        .slice()
        .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
      const blob = await buildMatchRecordSheet(roster, quarters, records, title);
      downloadBlob(blob, `${teamName} ${title}.xlsx`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "다운로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      fullWidth={false}
      loading={busy}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? "표시할 선수 기록이 없습니다" : "경기기록표 다운로드"}
    >
      <Download size={16} /> 경기기록표 다운로드
    </Button>
  );
}
