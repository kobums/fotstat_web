import type { MatchRecord, Quarter } from "../../core/api/types";
import { matchMinutes, playerMatchIds } from "./aggregateTeamStats";
import type { PlayerStat } from "./useTeamStats";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// ── 원본 양식(과제달성지표.xls 430~476행 '경기기록표' 섹션)에서 추출한 서식 ──
const FONT = "Malgun Gothic";
const FILL_TITLE = "FFFFFFCC"; // 제목·이름 칸 연노랑
const FILL_HEADER = "FFCCFFFF"; // 헤더 연하늘
/** A(여백) + B~J 9개 컬럼 폭 — 원본 그대로. */
const COL_WIDTHS = [3.6, 6.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8];
const HEADERS = [
  "이름", "총 경기수", "총 경기시간", "출전 시간", "포지션",
  "득점", "도움", "부상", "비고",
];
const ROW_H = 15.85;
const HEADER_H = 16.25;

interface SideSpec {
  style: "medium" | "double";
}
const medium: SideSpec = { style: "medium" };
const doubleLine: SideSpec = { style: "double" };

/**
 * 원본 430행 양식 그대로의 '경기기록표' xlsx Blob을 만든다.
 * 컬럼은 양식과 동일하고, 값은 앱 집계 데이터로 채운다:
 * 총 경기수=선수가 뛴 경기 수, 총 경기시간=그 경기들의 쿼터 시간 합,
 * 출전 시간=기록된 출전 분, 부상=부상 결장 경기 수. 비고는 빈칸.
 */
export async function buildMatchRecordSheet(
  players: PlayerStat[],
  quarters: Quarter[],
  records: MatchRecord[],
  title: string,
): Promise<Blob> {
  // exceljs(~1MB)는 다운로드 시점에만 로드(별도 청크로 코드 스플릿).
  const ExcelJS = (await import("exceljs")).default;

  // 선수별 총 경기시간: 선수가 기록을 남긴 경기들의 쿼터 duration 합.
  // "경기 참여" 정의는 aggregateTeamStats의 playerMatchIds와 공유해
  // '총 경기수'(p.games) 열과 어긋나지 않는다.
  const minutesByMatch = matchMinutes(quarters);
  const matchesByPlayer = playerMatchIds(quarters, records);
  const totalTimeOf = (playerId: number): number => {
    let sum = 0;
    matchesByPlayer.get(playerId)?.forEach((m) => {
      sum += minutesByMatch.get(m) ?? 0;
    });
    return sum;
  };

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("경기기록표");
  // ws.columns 세터는 일부 열 폭을 무시하는 경우가 있어 열별로 직접 지정한다.
  COL_WIDTHS.forEach((width, i) => {
    ws.getColumn(i + 1).width = width;
  });

  // 제목: B1:J2 병합, 18pt bold, 연노랑, medium 박스.
  // ExcelJS는 병합된 셀들이 스타일 객체를 공유하므로(마지막 쓰기가 전체를 덮음)
  // 네 변 모두 지정한 박스 테두리 하나를 마스터 셀에 건다 — 병합 내부 변은
  // 렌더링되지 않아 바깥 박스만 그려진다.
  ws.mergeCells(1, 2, 2, 10);
  const titleCell = ws.getCell(1, 2);
  titleCell.value = title;
  titleCell.font = { name: FONT, size: 18, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_TITLE } };
  titleCell.border = { top: medium, bottom: medium, left: medium, right: medium };
  ws.getRow(1).height = ROW_H;
  ws.getRow(2).height = ROW_H;

  // 헤더(3행): 이름만 11pt, 나머지 8pt. 연하늘, 세로선 medium.
  HEADERS.forEach((h, i) => {
    const cell = ws.getCell(3, 2 + i);
    cell.value = h;
    cell.font = { name: FONT, size: i === 0 ? 11 : 8, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_HEADER } };
    cell.border = { bottom: medium, left: medium, right: medium };
  });
  ws.getRow(3).height = HEADER_H;

  // 선수 블록: 원본처럼 선수당 2행, 각 컬럼 세로 병합. 블록 사이 double 라인.
  players.forEach((p, idx) => {
    const top = 4 + idx * 2;
    const bottom = top + 1;
    const isLast = idx === players.length - 1;
    // 원본 양식의 값 표기 그대로: 총 경기시간만 "500'" 텍스트(원본이 텍스트 셀),
    // 출전 시간은 숫자. 득점/도움은 원본처럼 0이면 빈칸(경기수/시간은 0도 표기).
    const values: (string | number)[] = [
      p.name,
      p.games,
      `${totalTimeOf(p.id)}'`,
      p.min,
      p.position,
      p.goal || "",
      p.assist || "",
      p.absentGames > 0 ? `결장${p.absentGames}` : "",
      "",
    ];
    values.forEach((v, i) => {
      const col = 2 + i;
      ws.mergeCells(top, col, bottom, col);
      const cell = ws.getCell(top, col);
      cell.value = v === "" ? null : v;
      cell.font =
        i === 0
          ? { name: FONT, size: 9, bold: true }
          : { name: FONT, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (i === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILL_TITLE } };
      }
      // 세로선 medium, 블록 사이 double(원본 양식), 마지막 블록은 medium 마감.
      // 병합 범위는 스타일을 공유하므로 한 번만 지정한다(아래변은 범위 하단에 그려짐).
      cell.border = {
        left: medium,
        right: medium,
        bottom: isLast ? medium : doubleLine,
      };
    });
    ws.getRow(top).height = ROW_H;
    ws.getRow(bottom).height = ROW_H;
  });

  const out = await wb.xlsx.writeBuffer();
  return new Blob([out], { type: XLSX_MIME });
}

/** Blob을 파일로 저장(브라우저 다운로드 트리거). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // click은 다운로드를 비동기로 트리거하므로 다음 틱에 URL을 정리한다.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
