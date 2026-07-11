import { useId } from "react";
import styles from "./LineChart.module.css";

interface Point {
  /** "YYYY-MM-DD" */
  date: string;
  value: number;
}

interface Props {
  /** 검사일 오름차순 정렬·필터는 호출부 책임 — 차트는 그리기만 한다. */
  points: Point[];
  /** 값 라벨 뒤에 붙는 단위 (예: "kg", "%"). */
  unit?: string;
  height?: number;
  /** 접근성 제목 (예: "체중 추이"). */
  title?: string;
}

const VIEW_W = 100;
const VIEW_H = 100;
/** 위아래 여백 비율 — 선이 뷰박스 가장자리에 붙지 않게 한다. */
const PAD = 0.1;

function short(date: string): string {
  // "2026-06-08" -> "6.8"
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  return m ? `${Number(m[1])}.${Number(m[2])}` : date;
}

/** 의존성 없는 미니 라인 차트 — SVG polyline + 점.
 *  라벨은 최소(좌측 max/min 값, 하단 첫/끝 날짜)만 HTML로 그린다. */
export default function LineChart({ points, unit = "", height = 160, title = "측정 추이" }: Props) {
  const titleId = useId();

  if (points.length === 0) {
    return <div className={styles.empty}>측정 데이터가 없습니다</div>;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  // 모든 값이 같으면 중앙에 수평선을 그린다
  const y = (v: number) =>
    span === 0
      ? VIEW_H / 2
      : VIEW_H * (1 - PAD) - ((v - min) / span) * VIEW_H * (1 - PAD * 2);
  const x = (i: number) =>
    points.length === 1 ? VIEW_W / 2 : (i / (points.length - 1)) * VIEW_W;

  const coords = points.map((p, i) => ({ cx: x(i), cy: y(p.value), p }));

  return (
    <div className={styles.wrap}>
      <div className={styles.yLabels}>
        <span>{max}{unit}</span>
        <span>{min}{unit}</span>
      </div>
      <div className={styles.plot} style={{ height }}>
        <div className={styles.canvas}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-labelledby={titleId}
          >
            <title id={titleId}>{title}</title>
            {points.length > 1 && (
              <polyline
                className={styles.line}
                points={coords.map((c) => `${c.cx},${c.cy}`).join(" ")}
              />
            )}
          </svg>
          {/* 점은 HTML 오버레이 — preserveAspectRatio=none 아래서 SVG circle이 타원으로 왜곡되는 것을 피한다 */}
          {coords.map((c, i) => (
            <span
              key={`${c.p.date}-${i}`}
              className={styles.dot}
              style={{ left: `${c.cx}%`, top: `${c.cy}%` }}
              title={`${c.p.date} · ${c.p.value}${unit}`}
            />
          ))}
        </div>
        <div className={styles.xLabels}>
          <span>{short(points[0].date)}</span>
          {points.length > 1 && <span>{short(points[points.length - 1].date)}</span>}
        </div>
      </div>
    </div>
  );
}
