// 상위 X% 계산 (iOS PlayerStatDetailView.topPct 미러):
//   X = ceil((나보다 값이 큰 선수 수 + 1) / 전체 인원 × 100), 최소 1
// 동률은 "나보다 큰" 쪽에 세지 않으므로 같은 값이면 같은 퍼센타일.
// 스쿼드가 비어 있으면 100(최하위 취급).
export function topPercent(value: number, all: number[]): number {
  const total = all.length;
  if (total === 0) return 100;
  const better = all.filter((v) => v > value).length;
  return Math.max(1, Math.ceil(((better + 1) / total) * 100));
}
