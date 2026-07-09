import { useState } from "react";
import { Download } from "lucide-react";
import Button from "../../components/Button/Button";
import { reportApi } from "../../core/api/endpoints";
import { downloadBlob } from "../../lib/download";

/**
 * 리포트 탭에서 경기기록표 xlsx를 내려받는 버튼.
 * 집계·엑셀 서식은 백엔드가 생성하며(웹·iOS 공용), 여기서는 Blob을 받아 저장만 한다.
 */
export default function MatchRecordDownload({
  teamId,
  teamName,
  start,
  end,
  title,
  disabled = false,
}: {
  teamId: number;
  teamName: string;
  start?: string;
  end?: string;
  title: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      const blob = await reportApi.matchRecord(teamId, start, end);
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
