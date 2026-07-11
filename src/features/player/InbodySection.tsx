import { useMemo, useState } from "react";
import Button from "../../components/Button/Button";
import LineChart from "../../components/LineChart/LineChart";
import StatTile from "../../components/StatTile/StatTile";
import type { Inbody } from "../../core/api/types";
import {
  chartSeries,
  playerInbodiesSorted,
  INBODY_METRICS,
  type InbodyMetric,
} from "../../lib/inbody";
import { useInbodies } from "./useInbodies";
import InbodyFormModal from "./InbodyFormModal";
import styles from "./InbodySection.module.css";

interface Props {
  teamId: number;
  playerId: number;
}

/** 값 표시 — 0(미측정)은 "-". */
function fmt(v: number, unit = ""): string {
  return v > 0 ? `${v}${unit}` : "-";
}

/** 선수 상세의 인바디 섹션 — 최신 측정 요약 + 추이 차트 + 이력 표. */
export default function InbodySection({ teamId, playerId }: Props) {
  const { data } = useInbodies(teamId);
  const [metric, setMetric] = useState<InbodyMetric>("weight");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Inbody | null>(null);

  const entries = useMemo(
    () => playerInbodiesSorted(data ?? [], playerId),
    [data, playerId],
  );
  const latest = entries[0];
  const series = useMemo(() => chartSeries(entries, metric), [entries, metric]);
  const metricDef = INBODY_METRICS.find((m) => m.key === metric)!;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>인바디</h3>
        <Button
          size="sm"
          fullWidth={false}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          측정 추가
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty}>
          측정 기록이 없습니다. 측정을 추가하거나 스쿼드 탭의 인바디 입력을 사용하세요.
        </p>
      ) : (
        <>
          <div className={styles.latestGrid}>
            <StatTile label="신장" value={fmt(latest.height, "cm")} sub={latest.testdate} />
            <StatTile label="체중" value={fmt(latest.weight, "kg")} />
            <StatTile label="골격근량" value={fmt(latest.muscle, "kg")} />
            <StatTile label="체지방률" value={fmt(latest.fat, "%")} />
            <StatTile
              label="다리 근육"
              value={latest.rightleg > 0 || latest.leftleg > 0
                ? `${fmt(latest.rightleg)}/${fmt(latest.leftleg)}`
                : "-"}
              sub="오른/왼(kg)"
            />
            <StatTile label="인바디 점수" value={fmt(latest.score)} />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.metricTabs} role="tablist" aria-label="추이 지표">
              {INBODY_METRICS.map((m) => (
                <button
                  key={m.key}
                  role="tab"
                  aria-selected={metric === m.key}
                  className={metric === m.key ? `${styles.metricTab} ${styles.metricActive}` : styles.metricTab}
                  onClick={() => setMetric(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <LineChart
              points={series}
              unit={metricDef.unit}
              height={150}
              title={`${metricDef.label} 추이`}
            />
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>검사일</th>
                  <th>신장</th>
                  <th>체중</th>
                  <th>골격근</th>
                  <th>체지방률</th>
                  <th>오른다리</th>
                  <th>왼다리</th>
                  <th>점수</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className={styles.row}
                    onClick={() => {
                      setEditing(e);
                      setFormOpen(true);
                    }}
                  >
                    <td>{e.testdate}</td>
                    <td>{fmt(e.height)}</td>
                    <td>{fmt(e.weight)}</td>
                    <td>{fmt(e.muscle)}</td>
                    <td>{fmt(e.fat)}</td>
                    <td>{fmt(e.rightleg)}</td>
                    <td>{fmt(e.leftleg)}</td>
                    <td>{fmt(e.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {formOpen && (
        <InbodyFormModal
          teamId={teamId}
          playerId={playerId}
          inbody={editing}
          onClose={() => setFormOpen(false)}
        />
      )}
    </section>
  );
}
